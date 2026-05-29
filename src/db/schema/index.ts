// 📁 File Target: d:\Erlinshop\src\db\schema\index.ts
// 🎯 Purpose: Menggabungkan dan mengekspor seluruh skema database proyek Erlinshop secara terpusat.
// 🔗 Depends on: ./categories, ./products, ./settings, ./variants, ./cart, ./orders, ./customers, ./bank-accounts
// 💥 Used by (Blast Radius): Seluruh lapisan database (Drizzle, Server Actions, API)

// Urutan export PENTING: categories harus diekspor sebelum products (FK dependency)
export * from './categories';
export * from './products';
export * from './settings';
export * from './variants';
export * from './cart';
export * from './orders';
export * from './customers';
export * from './bank-accounts';

