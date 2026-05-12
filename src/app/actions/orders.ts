"use server";

import { db } from "@/db";
import { orders, orderItems, cartSessions, cartItems, productVariants, customers } from "@/db/schema";
import { eq, desc, sql, and } from "drizzle-orm";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { ApiResponse } from "@/types";
import { auth } from "@clerk/nextjs/server";

const CART_COOKIE_NAME = "erlins_cart_session";
const GUEST_COOKIE_NAME = "guest_session";

/**
 * Konversi isi keranjang ke Order permanen (Checkout Intent)
 */
export async function createOrder(customerName: string, customerPhone: string): Promise<ApiResponse<{ orderId: string }>> {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(CART_COOKIE_NAME)?.value;

    if (!sessionId) {
      return { success: false, error: "Sesi keranjang tidak ditemukan" };
    }

    // Get session with items
    const session = await db.query.cartSessions.findFirst({
      where: eq(cartSessions.sessionId, sessionId),
      with: {
        items: {
          with: {
            variant: {
              with: {
                product: true
              }
            }
          }
        }
      }
    });

    if (!session || session.items.length === 0) {
      return { success: false, error: "Keranjang masih kosong" };
    }

    // Hitung total harga
    const totalPrice = session.items.reduce((total, item) => {
      const price = item.variant.price || item.variant.product.price;
      return total + (price * item.quantity);
    }, 0);

    // Database Transaction
    const orderId = await db.transaction(async (tx) => {
      // 1. CRM Upsert: Manage Customer Record
      const [customer] = await tx.insert(customers).values({
        name: customerName,
        phoneNumber: customerPhone,
      }).onConflictDoUpdate({
        target: customers.phoneNumber,
        set: { 
          name: customerName,
          updatedAt: new Date()
        }
      }).returning();

      // 2. Create Order linked to customer
      const [newOrder] = await tx.insert(orders).values({
        customerName,
        customerPhone,
        customerId: customer.id,
        totalPrice,
        sessionId: session.id,
        status: 'PENDING'
      }).returning();

      // 3. Create Order Items (Snapshots)
      const orderItemsData = session.items.map(item => ({
        orderId: newOrder.id,
        variantId: item.variantId,
        productName: item.variant.product.name,
        variantName: item.variant.name,
        productImage: item.variant.product.images[0],
        price: item.variant.price || item.variant.product.price,
        quantity: item.quantity
      }));

      await tx.insert(orderItems).values(orderItemsData);

      // 4. Clear Cart Items
      await tx.delete(cartItems).where(eq(cartItems.cartSessionId, session.id));

      return { orderId: newOrder.id, customerId: customer.id };
    });

    // 5. Cleanup: Delete Cart Session Cookie and Database Session
    cookieStore.delete(CART_COOKIE_NAME);
    
    // Set Guest Session Cookie (Frictionless Authentication)
    cookieStore.set(GUEST_COOKIE_NAME, orderId.customerId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30, // 30 hari
      path: "/",
    });
    
    // 6. Global Revalidation
    revalidatePath("/", "layout");
    revalidatePath("/cart");

    return { success: true, data: { orderId: orderId.orderId } };
  } catch (error) {
    console.error("Error creating order:", error);
    return { success: false, error: "Terjadi kesalahan saat memproses pesanan" };
  }
}

/**
 * Mengambil daftar order untuk Admin
 */
export async function getAdminOrders() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  try {
    const data = await db.query.orders.findMany({
      orderBy: [desc(orders.createdAt)],
    });

    return { success: true, data };
  } catch (error) {
    console.error("Error fetching admin orders:", error);
    return { success: false, error: "Gagal mengambil data pesanan" };
  }
}

/**
 * Mengambil detail order tertentu
 */
export async function getOrderDetail(orderId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  try {
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
    });

    const items = await db.query.orderItems.findMany({
      where: eq(orderItems.orderId, orderId)
    });

    return { success: true, data: { ...order, items } };
  } catch (error) {
    console.error("Error fetching order detail:", error);
    return { success: false, error: "Gagal mengambil detail pesanan" };
  }
}

/**
 * Helper: Mengurangi stok varian (Logic MENUJU COMPLETED)
 */
async function decrementStock(tx: any, items: any[]) {
  for (const item of items) {
    if (!item.variantId) continue;

    const variant = await tx.query.productVariants.findFirst({
      where: eq(productVariants.id, item.variantId)
    });

    if (!variant || variant.stock < item.quantity) {
      throw new Error(`Stok tidak mencukupi untuk ${item.productName} (Sisa: ${variant?.stock || 0})`);
    }

    await tx.update(productVariants)
      .set({ 
        stock: sql`${productVariants.stock} - ${item.quantity}`,
        updatedAt: new Date()
      })
      .where(eq(productVariants.id, item.variantId));
  }
}

/**
 * Helper: Mengembalikan stok varian (Logic REVERSE DARI COMPLETED)
 */
async function incrementStock(tx: any, items: any[]) {
  for (const item of items) {
    if (!item.variantId) continue;

    await tx.update(productVariants)
      .set({ 
        stock: sql`${productVariants.stock} + ${item.quantity}`,
        updatedAt: new Date()
      })
      .where(eq(productVariants.id, item.variantId));
  }
}

/**
 * Update status order dengan logika Finite State Machine (FSM)
 * Aturan Transisi & Stok:
 * 1. PENDING -> PROCESSING (Approve): No Stock Change.
 * 2. PROCESSING -> COMPLETED (Complete): Decrement Stock (-).
 * 3. COMPLETED -> CANCELLED (Cancel): Increment Stock (+).
 * 4. PENDING/PROCESSING -> CANCELLED (Cancel): No Stock Change.
 */
export async function updateOrderStatus(orderId: string, newStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED') {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  try {
    return await db.transaction(async (tx) => {
      // 1. Fetch current state directly from DB (State Guard)
      const order = await tx.query.orders.findFirst({
        where: eq(orders.id, orderId),
      });

      if (!order) return { success: false, error: "Pesanan tidak ditemukan" };
      
      const oldStatus = order.status;
      if (oldStatus === newStatus) return { success: true };

      // 2. Validate Transition Logic
      // Prevent illegal jumps if necessary (e.g., PENDING directly to COMPLETED)
      if (oldStatus === 'PENDING' && newStatus === 'COMPLETED') {
        return { success: false, error: "Pesanan harus melewati tahap PROCESSING sebelum COMPLETED" };
      }

      const items = await tx.query.orderItems.findMany({
        where: eq(orderItems.orderId, orderId)
      });

      // 3. Execution of Stock Adjustments based on FSM rules
      try {
        // Rule: Only decrement when moving TO Completed from Processing
        if (oldStatus === 'PROCESSING' && newStatus === 'COMPLETED') {
          await decrementStock(tx, items);
        } 
        // Rule: Only increment when moving FROM Completed to Cancelled
        else if (oldStatus === 'COMPLETED' && newStatus === 'CANCELLED') {
          await incrementStock(tx, items);
        }
        // Note: Transitions like PENDING -> PROCESSING or PENDING -> CANCELLED don't touch stock
      } catch (err: any) {
        return { success: false, error: err.message };
      }

      // 4. Persist Status Change
      await tx.update(orders)
        .set({ status: newStatus, updatedAt: new Date() })
        .where(eq(orders.id, orderId));

      // 5. Descriptive Feedback
      let message = `Status pesanan diubah ke ${newStatus}`;
      if (newStatus === 'PROCESSING') message = "Pesanan disetujui, masuk antrean produksi";
      if (newStatus === 'COMPLETED') message = "Pesanan selesai, stok berhasil dipotong";
      if (newStatus === 'CANCELLED' && oldStatus === 'COMPLETED') message = "Pesanan dibatalkan, stok dikembalikan";
      if (newStatus === 'CANCELLED' && oldStatus !== 'COMPLETED') message = "Pesanan berhasil dibatalkan";
        
      return { success: true, message };
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    return { success: false, error: "Gagal memperbarui status pesanan" };
  }
}

/**
 * Public: Get Customer Orders for Dashboard (/profile)
 */
export async function getCustomerOrders() {
  try {
    const cookieStore = await cookies();
    const customerId = cookieStore.get(GUEST_COOKIE_NAME)?.value;

    if (!customerId) return { success: false, error: "Sesi tidak ditemukan" };

    const customer = await db.query.customers.findFirst({
      where: eq(customers.id, customerId),
      with: {
        orders: {
          orderBy: [desc(orders.createdAt)],
          with: {
            items: true
          }
        }
      }
    });

    if (!customer) return { success: false, error: "Data pelanggan tidak ditemukan" };

    return { success: true, data: customer };
  } catch (error) {
    console.error("Error fetching customer orders:", error);
    return { success: false, error: "Gagal memuat histori pesanan" };
  }
}

/**
 * Public: Track Specific Order via Phone + ID
 */
export async function trackOrder(phone: string, orderId: string) {
  try {
    const order = await db.query.orders.findFirst({
      where: and(
        eq(orders.id, orderId),
        eq(orders.customerPhone, phone)
      ),
      with: {
        items: true
      }
    });

    if (!order) return { success: false, error: "Pesanan tidak ditemukan atau data tidak cocok" };

    return { success: true, data: order };
  } catch (error) {
    console.error("Error tracking order:", error);
    return { success: false, error: "Gagal melacak pesanan" };
  }
}

/**
 * Public: Logout / Clear Guest Session
 */
export async function logoutGuest() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(GUEST_COOKIE_NAME);
    return { success: true };
  } catch (error) {
    return { success: false, error: "Gagal logout" };
  }
}
