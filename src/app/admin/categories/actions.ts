"use server";

import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { eq, count } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { deleteCloudinaryImage } from "@/lib/cloudinary";
import { ApiResponse } from "@/types";
import { auth } from "@clerk/nextjs/server";

export type CategoryInsert = typeof categories.$inferInsert;
export type CategorySelect = typeof categories.$inferSelect;

/**
 * Mengambil semua kategori diurutkan berdasarkan field 'order'
 */
export async function getCategories(): Promise<ApiResponse<CategorySelect[]>> {
  try {
    // Admin context check
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const data = await db.select().from(categories).orderBy(categories.order);
    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal mengambil data kategori";
    console.error("Error fetching categories:", error);
    return { success: false, error: message };
  }
}

/**
 * Menambah kategori baru
 */
export async function addCategory(data: CategoryInsert): Promise<ApiResponse<CategorySelect>> {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const result = await db.insert(categories).values(data).returning();
    
    // Revalidation: Wajib sinkron katalog publik
    revalidatePath("/");
    revalidatePath("/admin/categories");
    
    return { success: true, data: result[0] };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal menambah kategori";
    console.error("Error adding category:", error);
    return { success: false, error: message };
  }
}

/**
 * Memperbarui kategori yang ada
 */
export async function updateCategory(id: string, data: Partial<CategoryInsert>): Promise<ApiResponse<CategorySelect>> {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const result = await db.update(categories)
      .set(data)
      .where(eq(categories.id, id))
      .returning();
      
    // Revalidation: Wajib sinkron katalog publik
    revalidatePath("/");
    revalidatePath("/admin/categories");
    
    return { success: true, data: result[0] };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal memperbarui kategori";
    console.error("Error updating category:", error);
    return { success: false, error: message };
  }
}

/**
 * Menghapus kategori dengan pengecekan relasi produk (Safety Guard)
 */
export async function deleteCategory(id: string): Promise<ApiResponse> {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    // 1. Safety Guard: Cek apakah ada produk yang menggunakan kategori ini
    const productCountResult = await db.select({ value: count() })
      .from(products)
      .where(eq(products.categoryId, id));
    
    const productCount = productCountResult[0].value;
    
    if (productCount > 0) {
      return { 
        success: false, 
        error: `Gagal menghapus: Terdapat ${productCount} produk yang masih menggunakan kategori ini.` 
      };
    }

    // 2. Ambil data kategori untuk cleanup image
    const category = await db.query.categories.findFirst({
      where: eq(categories.id, id)
    });

    // 3. Hapus image dari Cloudinary jika ada
    if (category?.image) {
      await deleteCloudinaryImage(category.image);
    }
    
    // 4. Hapus dari database
    await db.delete(categories).where(eq(categories.id, id));
    
    // 5. Revalidation: Wajib sinkron katalog publik
    revalidatePath("/");
    revalidatePath("/admin/categories");
    
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal menghapus kategori";
    console.error("Error deleting category:", error);
    return { success: false, error: message };
  }
}

