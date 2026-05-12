
'use server';
import { db } from "@/db";
import { products } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function getProductWithVariants(id: string) {
  try {
    const product = await db.query.products.findFirst({
      where: and(eq(products.id, id), eq(products.isPublished, true)),
      with: {
        variants: true,
        category: true,
      }
    });

    if (!product) return { success: false, error: "Produk tidak ditemukan" };

    return { success: true, data: product };
  } catch (error) {
    console.error("Error fetching product variants:", error);
    return { success: false, error: "Gagal memuat data produk" };
  }
}
