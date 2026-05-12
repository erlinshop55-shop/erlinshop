// src/db/schema/settings.ts
import { pgTable, text, timestamp, jsonb } from 'drizzle-orm/pg-core';


export const settings = pgTable('settings', {
  id: text('id').primaryKey().$defaultFn(() => 'config'),
  storeName: text('store_name').notNull(),
  logoUrl: text('logo_url'),
  whatsappNumber: text('whatsapp_number').notNull(),
  
  // Hero Section
  heroTitle: text('hero_title'),
  heroSubtitle: text('hero_subtitle'),
  heroImageUrl: text('hero_image_url'),
  heroImages: jsonb('hero_images').$type<{ url: string; title: string; subtitle: string }[]>().default([]),

  // Footer & Contact
  footerDescription: text('footer_description'),
  contactAddress: text('contact_address'),
  contactPhone: text('contact_phone'),
  contactEmail: text('contact_email'),

  // Social Links
  instagramUrl: text('instagram_url'),
  facebookUrl: text('facebook_url'),
  twitterUrl: text('twitter_url'),

  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});


export type Setting = typeof settings.$inferSelect;
export type NewSetting = typeof settings.$inferInsert;

// Canonical keys yang digunakan aplikasi:
// 'store_name'       → nama toko (default: "Erlins Shop")
// 'whatsapp_number'  → nomor WA untuk terima order
