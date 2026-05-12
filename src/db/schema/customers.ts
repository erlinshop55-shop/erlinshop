// src/db/schema/customers.ts
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { orders } from './orders';

export const customers = pgTable('customers', {
  id: text('id').primaryKey().$defaultFn(() => `CUS-${createId().slice(0, 10).toUpperCase()}`),
  name: text('name').notNull(),
  phoneNumber: text('phone_number').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const customersRelations = relations(customers, ({ many }) => ({
  orders: many(orders),
}));

export type CustomerSelect = typeof customers.$inferSelect;
export type CustomerInsert = typeof customers.$inferInsert;
