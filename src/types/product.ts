// src/types/product.ts
import { products, productVariants, categories } from '@/db/schema';

export type Product = typeof products.$inferSelect;
export type ProductVariant = typeof productVariants.$inferSelect;
export type Category = typeof categories.$inferSelect;

export interface ProductWithVariants extends Product {
  category: Category | null;
  variants: ProductVariant[];
}
