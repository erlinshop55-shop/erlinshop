'use server';

import { db } from '@/db';
import { products, categories } from '@/db/schema';
import { sql } from 'drizzle-orm';

import { auth } from '@clerk/nextjs/server';

export async function getDashboardStats() {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const [productCount] = await db.select({ count: sql<number>`count(*)` }).from(products);
    const [categoryCount] = await db.select({ count: sql<number>`count(*)` }).from(categories);
    
    return {
      success: true,
      data: {
        totalProducts: Number(productCount.count),
        totalCategories: Number(categoryCount.count),
      }
    };
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error);
    return { success: false, error: 'Failed to fetch dashboard stats' };
  }
}
