// 📁 File Target: d:\Erlinshop\src\db\schema\bank-accounts.ts
// 🎯 Purpose: Mendefinisikan skema tabel untuk rekening bank manual yang dikelola admin.
// 🔗 Depends on: drizzle-orm/pg-core, @paralleldrive/cuid2
// 💥 Used by (Blast Radius): src/db/schema/orders.ts, src/db/schema/index.ts

import { pgTable, text, boolean, timestamp } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import { relations } from 'drizzle-orm';
import { orders } from './orders';

export const manualBankAccounts = pgTable('manual_bank_accounts', {
  id: text('id').primaryKey().$defaultFn(() => `BNK-${createId().slice(0, 10).toUpperCase()}`),
  bankName: text('bank_name').notNull(),
  accountNumber: text('account_number').notNull(),
  accountHolder: text('account_holder').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const manualBankAccountsRelations = relations(manualBankAccounts, ({ many }) => ({
  orders: many(orders),
}));

export type BankAccountSelect = typeof manualBankAccounts.$inferSelect;
export type BankAccountInsert = typeof manualBankAccounts.$inferInsert;
