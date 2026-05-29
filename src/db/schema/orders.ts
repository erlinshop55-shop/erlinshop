// 📁 File Target: d:\Erlinshop\src\db\schema\orders.ts
// 🎯 Purpose: Mengembangkan skema tabel orders untuk mendukung status pembayaran terdekopel, token Midtrans, dan transfer manual.
// 🔗 Depends on: drizzle-orm/pg-core, @paralleldrive/cuid2, ./cart, ./customers, ./bank-accounts
// 💥 Used by (Blast Radius): Seluruh sistem pesanan (checkout, admin panel, status tracking, webhooks)

import { pgTable, text, timestamp, integer, pgEnum, uuid } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import { cartSessions } from './cart';
import { customers } from './customers';
import { relations } from 'drizzle-orm';
import { manualBankAccounts } from './bank-accounts';

export const orderStatusEnum = pgEnum('order_status', ['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED']);
export const paymentMethodEnum = pgEnum('payment_method', ['MIDTRANS', 'MANUAL_TRANSFER', 'UNSET']);
export const paymentStatusEnum = pgEnum('payment_status', ['UNPAID', 'PENDING_VERIFICATION', 'PAID', 'EXPIRED', 'FAILED']);

export const orders = pgTable('orders', {
  id: text('id').primaryKey().$defaultFn(() => `ORD-${createId().slice(0, 10).toUpperCase()}`),
  status: orderStatusEnum('status').default('PENDING').notNull(),
  customerName: text('customer_name').notNull(),
  customerPhone: text('customer_phone'),
  customerId: text('customer_id').references(() => customers.id),
  totalPrice: integer('total_price').notNull(), // dalam Rupiah
  sessionId: uuid('session_id').references(() => cartSessions.id),
  
  // Kolom Pembayaran Terdekopel & Gateway/Manual
  paymentMethod: paymentMethodEnum('payment_method').default('UNSET').notNull(),
  paymentStatus: paymentStatusEnum('payment_status').default('UNPAID').notNull(),
  snapToken: text('snap_token'),
  snapRedirectUrl: text('snap_redirect_url'),
  paymentProofUrl: text('payment_proof_url'),
  paymentBankAccountId: text('payment_bank_account_id').references(() => manualBankAccounts.id),
  paidAt: timestamp('paid_at'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const orderItems = pgTable('order_items', {
  id: text('id').primaryKey().$defaultFn(() => `ORI-${createId().slice(0, 10).toUpperCase()}`),
  orderId: text('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  variantId: text('variant_id'), // Link to variant for stock decrement, nullable in case variant is deleted
  productName: text('product_name').notNull(), // Snapshot
  variantName: text('variant_name').notNull(), // Snapshot
  productImage: text('product_image'), // Snapshot
  price: integer('price').notNull(), // Snapshot
  quantity: integer('quantity').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const ordersRelations = relations(orders, ({ many, one }) => ({
  items: many(orderItems),
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  paymentBankAccount: one(manualBankAccounts, {
    fields: [orders.paymentBankAccountId],
    references: [manualBankAccounts.id],
  }),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
}));

export type OrderSelect = typeof orders.$inferSelect;
export type OrderInsert = typeof orders.$inferInsert;
export type OrderItemSelect = typeof orderItems.$inferSelect;
export type OrderItemInsert = typeof orderItems.$inferInsert;

