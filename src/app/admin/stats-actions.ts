'use server';

import { db } from '@/db';
import { products, categories, orders } from '@/db/schema';
import { sql, and, eq, ne, or } from 'drizzle-orm';
import { verifyOwnerSession } from '@/lib/actions/auth-guard';
import { unstable_noStore as noStore } from 'next/cache';

export async function getDashboardStats() {
  try {
    // 1. Bypass Next.js cache untuk data Real-Time
    noStore();

    // 2. Keamanan: Verifikasi sesi Admin
    await verifyOwnerSession();

    // 3. Hitung jumlah produk & kategori
    const [productCount] = await db.select({ count: sql<number>`count(*)` }).from(products);
    const [categoryCount] = await db.select({ count: sql<number>`count(*)` }).from(categories);

    // 4. Hitung Total Penjualan: orders yang PAID dan TIDAK CANCELLED (Aman dari null)
    const [salesSum] = await db
      .select({ sum: sql<number>`sum(${orders.totalPrice})` })
      .from(orders)
      .where(
        and(
          eq(orders.paymentStatus, 'PAID'),
          ne(orders.status, 'CANCELLED')
        )
      );
    const totalSales = Number(salesSum?.sum ?? 0);

    // 5. Hitung Pesanan Aktif: orders yang berstatus PENDING atau PROCESSING
    const [activeOrdersCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(
        or(
          eq(orders.status, 'PENDING'),
          eq(orders.status, 'PROCESSING')
        )
      );
    const activeOrders = Number(activeOrdersCount?.count ?? 0);
    
    return {
      success: true,
      data: {
        totalProducts: Number(productCount.count),
        totalCategories: Number(categoryCount.count),
        totalSales,
        activeOrders,
      }
    };
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error);
    return { success: false, error: 'Failed to fetch dashboard stats' };
  }
}
