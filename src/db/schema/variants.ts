// src/db/schema/variants.ts
import { pgTable, text, integer, timestamp, jsonb, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { products } from './products';

export const productVariants = pgTable('product_variants', {
  id: text('id').primaryKey().$defaultFn(() => `VAR-${createId().slice(0, 10).toUpperCase()}`),
  productId: text('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(), // Display Name: "Merah - XL"
  attributes: jsonb('attributes').notNull().default({}), // {"Warna": "Merah", "Ukuran": "XL"}
  sku: text('sku').unique(),
  stock: integer('stock').notNull().default(0),
  price: integer('price'), // Nullable: falls back to product.price
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const productVariantsRelations = relations(productVariants, ({ one }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
}));

export type ProductVariant = typeof productVariants.$inferSelect;
export type NewProductVariant = typeof productVariants.$inferInsert;
