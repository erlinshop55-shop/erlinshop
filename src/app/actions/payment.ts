// 📁 File Target: d:\Erlinshop\src\app\actions\payment.ts
// 🎯 Purpose: Implementasi Server Actions untuk memproses pembayaran (Token Midtrans & Transfer Manual).
// 🔗 Depends on: @/db, @/db/schema, drizzle-orm, next/cache, next/headers
// 💥 Used by (Blast Radius): Halaman detail pesanan, halaman pembayaran, checkout flow

"use server";

import { db } from "@/db";
import { orders, manualBankAccounts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { ApiResponse } from "@/types";
import { verifyOwnerSession } from "@/lib/actions/auth-guard";

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY ?? "";
const MIDTRANS_IS_PRODUCTION = process.env.MIDTRANS_IS_PRODUCTION === "true";

// Menentukan base URL Midtrans API
const MIDTRANS_SNAP_API = MIDTRANS_IS_PRODUCTION
  ? "https://app.midtrans.com/snap/v1/transactions"
  : "https://app.sandbox.midtrans.com/snap/v1/transactions";

/**
 * Mendapatkan atau generate Snap Token Midtrans untuk pesanan tertentu
 */
export async function getMidtransSnapToken(orderId: string): Promise<ApiResponse<{ snapToken: string; snapRedirectUrl: string }>> {
  try {
    if (!MIDTRANS_SERVER_KEY) {
      return { success: false, error: "Konfigurasi server key Midtrans belum diatur" };
    }

    // 1. Ambil detail pesanan beserta item snapshot-nya
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      with: {
        items: true,
      },
    });

    if (!order) {
      return { success: false, error: "Pesanan tidak ditemukan" };
    }

    // 2. Jika token sudah ada dan pesanan masih pending, kembalikan token yang ada
    if (order.snapToken && order.paymentMethod === "MIDTRANS" && order.paymentStatus === "UNPAID") {
      return {
        success: true,
        data: {
          snapToken: order.snapToken,
          snapRedirectUrl: order.snapRedirectUrl ?? "",
        },
      };
    }

    // 3. Payload transaksi untuk dikirim ke Midtrans Snap API
    const authHeader = Buffer.from(`${MIDTRANS_SERVER_KEY}:`).toString("base64");
    const payload = {
      transaction_details: {
        order_id: order.id,
        gross_amount: order.totalPrice,
      },
      item_details: order.items.map((item) => ({
        id: item.variantId ?? "unknown",
        price: item.price,
        quantity: item.quantity,
        name: `${item.productName} - ${item.variantName}`.slice(0, 50), // Batas panjang nama Midtrans
      })),
      customer_details: {
        first_name: order.customerName,
        phone: order.customerPhone ?? "",
      },
    };

    const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3000";
    const notificationUrl = `${APP_URL}/api/webhooks/midtrans`;

    // 4. API Request ke Midtrans Snap API
    const response = await fetch(MIDTRANS_SNAP_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Basic ${authHeader}`,
        "X-Override-Notification": notificationUrl,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Midtrans API Error:", errorText);
      return { success: false, error: "Gagal membuat sesi pembayaran dengan Midtrans" };
    }

    const data = await response.json();
    const token = data.token;
    const redirectUrl = data.redirect_url;

    // 5. Simpan token ke database
    await db.update(orders)
      .set({
        paymentMethod: "MIDTRANS",
        paymentStatus: "UNPAID",
        snapToken: token,
        snapRedirectUrl: redirectUrl,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    revalidatePath("/profile");
    revalidatePath(`/products`);

    return {
      success: true,
      data: {
        snapToken: token,
        snapRedirectUrl: redirectUrl,
      },
    };
  } catch (error) {
    console.error("Error generating snap token:", error);
    return { success: false, error: "Terjadi kesalahan sistem saat menghubungi payment gateway" };
  }
}

/**
 * Mendapatkan daftar semua rekening bank manual yang aktif untuk ditampilkan ke pembeli
 */
export async function getManualBankAccounts(): Promise<ApiResponse<typeof manualBankAccounts.$inferSelect[]>> {
  try {
    const data = await db.query.manualBankAccounts.findMany({
      where: eq(manualBankAccounts.isActive, true),
    });
    return { success: true, data };
  } catch (error) {
    console.error("Error fetching bank accounts:", error);
    return { success: false, error: "Gagal mengambil daftar rekening bank" };
  }
}

/**
 * Melakukan konfirmasi pembayaran dengan metode Transfer Bank Manual
 * Menyimpan tautan bukti transfer dan mengubah status menjadi PENDING_VERIFICATION
 */
export async function setManualPayment(
  orderId: string,
  bankAccountId: string,
  paymentProofUrl: string
): Promise<ApiResponse<void>> {
  try {
    // 1. Pastikan pesanan terdaftar dan status bayarnya masih belum lunas
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
    });

    if (!order) {
      return { success: false, error: "Pesanan tidak ditemukan" };
    }

    if (order.paymentStatus === "PAID") {
      return { success: false, error: "Pesanan sudah lunas dibayar" };
    }

    // 2. Simpan informasi konfirmasi transfer manual di baris order terkait
    await db.update(orders)
      .set({
        paymentMethod: "MANUAL_TRANSFER",
        paymentStatus: "PENDING_VERIFICATION",
        paymentBankAccountId: bankAccountId,
        paymentProofUrl: paymentProofUrl,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    revalidatePath("/profile");
    
    return { success: true };
  } catch (error) {
    console.error("Error setting manual payment:", error);
    return { success: false, error: "Gagal menyimpan konfirmasi pembayaran manual Anda" };
  }
}

/**
 * Admin: Menambahkan rekening bank baru
 */
export async function addBankAccount(
  bankName: string,
  accountNumber: string,
  accountHolder: string
): Promise<ApiResponse<void>> {
  try {
    await verifyOwnerSession();

    await db.insert(manualBankAccounts).values({
      bankName,
      accountNumber,
      accountHolder,
      isActive: true,
    });

    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error: any) {
    console.error("Error adding bank account:", error);
    return { success: false, error: error.message || "Gagal menambahkan rekening bank" };
  }
}

/**
 * Admin: Memperbarui data rekening bank
 */
export async function updateBankAccount(
  id: string,
  bankName: string,
  accountNumber: string,
  accountHolder: string,
  isActive: boolean
): Promise<ApiResponse<void>> {
  try {
    await verifyOwnerSession();

    await db.update(manualBankAccounts)
      .set({
        bankName,
        accountNumber,
        accountHolder,
        isActive,
        updatedAt: new Date(),
      })
      .where(eq(manualBankAccounts.id, id));

    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating bank account:", error);
    return { success: false, error: error.message || "Gagal memperbarui rekening bank" };
  }
}

/**
 * Admin: Menghapus / Menolak rekening bank secara permanen
 */
export async function deleteBankAccount(id: string): Promise<ApiResponse<void>> {
  try {
    await verifyOwnerSession();

    await db.delete(manualBankAccounts).where(eq(manualBankAccounts.id, id));

    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting bank account:", error);
    return { success: false, error: error.message || "Gagal menghapus rekening bank" };
  }
}

/**
 * Admin: Verifikasi Bukti Transfer Manual dan secara Atomik memajukan FSM status pesanan
 */
export async function verifyManualPayment(orderId: string): Promise<ApiResponse<void>> {
  try {
    await verifyOwnerSession();

    await db.transaction(async (tx) => {
      // 1. Ambil data pesanan
      const order = await tx.query.orders.findFirst({
        where: eq(orders.id, orderId),
      });

      if (!order) {
        throw new Error("Pesanan tidak ditemukan");
      }

      if (order.paymentStatus === "PAID") {
        throw new Error("Pesanan sudah berstatus LUNAS");
      }

      // 2. Perbarui status pembayaran menjadi PAID secara atomik
      await tx.update(orders)
        .set({
          paymentStatus: "PAID",
          paidAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId));

      // 3. Pindahkan status logistik pesanan dari PENDING -> PROCESSING
      if (order.status === "PENDING") {
        await tx.update(orders)
          .set({
            status: "PROCESSING",
            updatedAt: new Date(),
          })
          .where(eq(orders.id, orderId));
      }
    });

    revalidatePath("/admin/orders");
    revalidatePath("/profile");

    return { success: true };
  } catch (error: any) {
    console.error("Error verifying manual payment:", error);
    return { success: false, error: error.message || "Gagal memverifikasi bukti transfer" };
  }
}
