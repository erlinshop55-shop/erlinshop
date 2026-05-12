"use server";

import { db } from "@/db";
import { cartSessions, cartItems } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { cookies } from "next/headers";
import { ApiResponse } from "@/types";

const CART_COOKIE_NAME = "erlins_cart_session";

/**
 * Mendapatkan atau membuat session ID untuk keranjang belanja
 */
async function getOrCreateCartSessionId(): Promise<string> {
  const cookieStore = await cookies();
  let sessionId = cookieStore.get(CART_COOKIE_NAME)?.value;

  if (!sessionId) {
    sessionId = crypto.randomUUID();
    cookieStore.set(CART_COOKIE_NAME, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });
  }

  // Ensure session exists in DB
  const existing = await db.query.cartSessions.findFirst({
    where: eq(cartSessions.sessionId, sessionId),
  });

  if (!existing) {
    await db.insert(cartSessions).values({ sessionId });
  }

  return sessionId;
}

/**
 * Menambahkan item ke keranjang
 */
export async function addToCart(variantId: string, quantity: number = 1): Promise<ApiResponse> {
  try {
    const sessionId = await getOrCreateCartSessionId();
    
    // Get session internal ID
    const session = await db.query.cartSessions.findFirst({
      where: eq(cartSessions.sessionId, sessionId),
    });

    if (!session) throw new Error("Gagal membuat sesi keranjang");

    // Check if item already exists
    const existingItem = await db.query.cartItems.findFirst({
      where: and(
        eq(cartItems.cartSessionId, session.id),
        eq(cartItems.variantId, variantId)
      ),
    });

    if (existingItem) {
      await db.update(cartItems)
        .set({ 
          quantity: existingItem.quantity + quantity,
          updatedAt: new Date()
        })
        .where(eq(cartItems.id, existingItem.id));
    } else {
      await db.insert(cartItems).values({
        cartSessionId: session.id,
        variantId,
        quantity,
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Error adding to cart:", error);
    return { success: false, error: "Gagal menambahkan ke keranjang" };
  }
}

/**
 * Mengambil isi keranjang
 */
export async function getCart() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(CART_COOKIE_NAME)?.value;

    if (!sessionId) return { success: true, data: [] };

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

    if (!session) return { success: true, data: [] };

    return { success: true, data: session.items };
  } catch (error) {
    console.error("Error fetching cart:", error);
    return { success: false, error: "Gagal mengambil data keranjang" };
  }
}

/**
 * Update quantity item
 */
export async function updateCartItem(itemId: string, quantity: number): Promise<ApiResponse> {
  try {
    if (quantity <= 0) {
      await db.delete(cartItems).where(eq(cartItems.id, itemId));
    } else {
      await db.update(cartItems)
        .set({ 
          quantity,
          updatedAt: new Date()
        })
        .where(eq(cartItems.id, itemId));
    }
    return { success: true };
  } catch (error) {
    console.error("Error updating cart item:", error);
    return { success: false, error: "Gagal memperbarui jumlah" };
  }
}

/**
 * Hapus item dari keranjang
 */
export async function removeFromCart(itemId: string): Promise<ApiResponse> {
  try {
    await db.delete(cartItems).where(eq(cartItems.id, itemId));
    return { success: true };
  } catch (error) {
    console.error("Error removing from cart:", error);
    return { success: false, error: "Gagal menghapus item" };
  }
}
