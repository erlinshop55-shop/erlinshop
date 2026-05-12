"use server";

import { db } from "@/db";
import { products, categories, productVariants } from "@/db/schema";
import { eq, desc, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { deleteCloudinaryImage } from "@/lib/cloudinary";
import { ApiResponse, PaginatedResponse } from "@/types";
import { auth } from "@clerk/nextjs/server";

export type ProductInsert = typeof products.$inferInsert;
export type ProductSelect = typeof products.$inferSelect;

export type ProductWithCategory = ProductSelect & {
  category: typeof categories.$inferSelect | null;
  variants?: (typeof productVariants.$inferSelect)[];
};

export type VariantInput = {
  id?: string;
  name: string;
  attributes: Record<string, any>;
  stock: number;
  price?: number | null;
  sku?: string | null;
};

export type UpsertProductInput = ProductInsert & {
  variants: VariantInput[];
};

/**
 * Mengambil produk dengan paginasi
 */
export async function getProducts(
  page = 1,
  limit = 10
): Promise<ApiResponse<PaginatedResponse<ProductWithCategory>>> {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const offset = (page - 1) * limit;

    // 1. Fetch data
    const data = await db.query.products.findMany({
      with: {
        category: true,
        variants: true,
      },
      orderBy: [desc(products.createdAt)],
      limit: limit,
      offset: offset,
    });

    // 2. Fetch total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(products);

    const totalPages = Math.ceil(count / limit);

    return {
      success: true,
      data: {
        data,
        metadata: {
          total: Number(count),
          page,
          limit,
          totalPages,
        },
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal mengambil data produk";
    console.error("Error fetching products:", error);
    return { success: false, error: message };
  }
}

/**
 * Upsert Produk beserta Varian dalam satu transaksi
 */
export async function upsertProduct(data: UpsertProductInput): Promise<ApiResponse<ProductSelect>> {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    return await db.transaction(async (tx) => {
      // 1. Hitung total stok dari varian (Guard: Total stock is derived)
      const totalStock = data.variants.reduce((sum, v) => sum + v.stock, 0);
      
      let productId = data.id;
      let resultProduct;

      // 2. Upsert Product
      if (productId) {
        // Update
        const [updated] = await tx.update(products)
          .set({ 
            ...data, 
            stock: totalStock, // Force derived stock
            isPublished: data.isPublished,
            updatedAt: new Date() 
          })
          .where(eq(products.id, productId))
          .returning();
        resultProduct = updated;
      } else {
        // Insert
        const [inserted] = await tx.insert(products)
          .values({
            ...data,
            stock: totalStock, // Initial derived stock
            isPublished: data.isPublished ?? true
          })
          .returning();
        resultProduct = inserted;
        productId = inserted.id;
      }

      if (!resultProduct) throw new Error("Gagal menyimpan produk");

      // 3. Sync Variants
      // Ambil variant ID yang ada di DB saat ini untuk produk ini
      const currentVariants = await tx.select({ id: productVariants.id })
        .from(productVariants)
        .where(eq(productVariants.productId, productId));
      
      const currentIds = currentVariants.map(v => v.id);
      const incomingIdsSet = new Set(data.variants.map(v => v.id).filter(id => id !== undefined));
      
      // Delete variants yang tidak ada di list incoming
      const toDelete = currentIds.filter(id => !incomingIdsSet.has(id));
      if (toDelete.length > 0) {
        await tx.delete(productVariants).where(inArray(productVariants.id, toDelete));
      }

      // Upsert incoming variants
      for (const v of data.variants) {
        // Auto-generate SKU if missing
        let finalSku = v.sku;
        if (!finalSku) {
          const productPrefix = data.name.substring(0, 3).toUpperCase().replaceAll(/\s/g, "X");
          const variantName = v.name.toUpperCase().replaceAll(/\s/g, "");
          const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
          finalSku = `${productPrefix}-${variantName}-${randomSuffix}`;
        }

        if (v.id) {
          // Update
          await tx.update(productVariants)
            .set({
              name: v.name,
              attributes: v.attributes,
              stock: v.stock,
              price: v.price,
              sku: finalSku,
              updatedAt: new Date()
            })
            .where(eq(productVariants.id, v.id));
        } else {
          // Insert
          await tx.insert(productVariants)
            .values({
              productId: productId,
              name: v.name,
              attributes: v.attributes,
              stock: v.stock,
              price: v.price,
              sku: finalSku
            });
        }
      }

      // 4. Revalidation
      revalidatePath("/");
      revalidatePath("/admin/products");

      return { success: true, data: resultProduct };
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal menyimpan produk dan varian";
    console.error("Error in upsertProduct:", error);
    return { success: false, error: message };
  }
}

/**
 * Menghapus produk beserta image di Cloudinary
 * Cascade delete akan menghapus varian secara otomatis (diatur di schema)
 */
export async function deleteProduct(id: string): Promise<ApiResponse> {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const product = await db.query.products.findFirst({
      where: eq(products.id, id)
    });

    if (!product) {
      return { success: false, error: "Produk tidak ditemukan" };
    }

    if (product.images && product.images.length > 0) {
      await Promise.all(product.images.map(img => deleteCloudinaryImage(img)));
    }

    await db.delete(products).where(eq(products.id, id));
    
    revalidatePath("/");
    revalidatePath("/admin/products");
    
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal menghapus produk";
    console.error("Error deleting product:", error);
    return { success: false, error: message };
  }
}

/**
 * Toggle status isPublished produk secara inline
 */
export async function toggleProductPublished(id: string, isPublished: boolean): Promise<ApiResponse> {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    await db.update(products)
      .set({ 
        isPublished,
        updatedAt: new Date() 
      })
      .where(eq(products.id, id));
    
    revalidatePath("/");
    revalidatePath("/admin/products");
    
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal mengubah status visibilitas";
    console.error("Error toggling product visibility:", error);
    return { success: false, error: message };
  }
}

import { generateProductDescription, type AiDescriptionResponse } from "@/lib/gemini";

/**
 * Menghasilkan deskripsi produk menggunakan Gemini AI
 */
export async function generateDescription(productName: string, categoryName: string): Promise<ApiResponse<AiDescriptionResponse>> {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const result = await generateProductDescription(productName, categoryName);
    return { success: true, data: result };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal menghasilkan deskripsi AI";
    console.error("Error in generateDescription:", error);
    return { success: false, error: message };
  }
}
