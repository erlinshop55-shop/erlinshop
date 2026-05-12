// src/db/schema/categories.ts
import { pgTable, text, integer, timestamp, jsonb, AnyPgColumn } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

export interface CategorySpec {
  attributes: string[];
}

export const categories = pgTable('categories', {
  id: text('id').primaryKey().$defaultFn(() => `CAT-${createId().slice(0, 10).toUpperCase()}`),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  image: text('image'),
  order: integer('order').notNull().default(0),
  parentId: text('parent_id').references((): AnyPgColumn => categories.id),
  specifications: jsonb('specifications').$type<CategorySpec>().default({ attributes: [] }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

import { products } from './products';

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  products: many(products),
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: 'category_hierarchy',
  }),
  children: many(categories, {
    relationName: 'category_hierarchy',
  }),
}));

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;


