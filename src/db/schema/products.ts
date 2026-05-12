// src/db/schema/products.ts
import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { categories } from './categories';
import { productVariants } from './variants';

export const genderEnum = pgEnum('gender_target', ['Men', 'Women', 'Kids', 'Unisex']);

export const products = pgTable('products', {
  id: text('id').primaryKey().$defaultFn(() => `PRD-${createId().slice(0, 10).toUpperCase()}`),
  categoryId: text('category_id').references(() => categories.id).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  price: integer('price').notNull(),
  original_price: integer('original_price'),
  stock: integer('stock').notNull().default(0),
  specs: jsonb('specs'),
  images: text('images').array().notNull().default(sql`'{}'::text[]`),
  isNew: boolean('is_new').default(false).notNull(),
  isFeatured: boolean('is_featured').default(false).notNull(),
  brand: text('brand').default('Unbranded').notNull(),
  genderTarget: genderEnum('gender_target').default('Unisex').notNull(),
  isPublished: boolean('is_published').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  variants: many(productVariants),
}));

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
