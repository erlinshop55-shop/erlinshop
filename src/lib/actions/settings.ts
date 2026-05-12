'use server';

import { db } from '@/db';
import { settings, type Setting } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const SettingsSchema = z.object({
  storeName: z.string().min(1, 'Nama toko wajib diisi').max(50, 'Nama toko terlalu panjang'),
  logoUrl: z.string().optional().nullable(),
  whatsappNumber: z.string()
    .min(10, 'Nomor WhatsApp minimal 10 digit')
    .regex(/^[0-9]+$/, 'Nomor WhatsApp hanya boleh berisi angka (contoh: 62812...)'),
  heroTitle: z.string().max(100, 'Judul terlalu panjang').optional().nullable(),
  heroSubtitle: z.string().max(500, 'Subtitle terlalu panjang').optional().nullable(),
  heroImageUrl: z.string().optional().nullable(),
  heroImages: z.array(z.object({
    url: z.string(),
    title: z.string().max(100).optional().default(''),
    subtitle: z.string().max(500).optional().default(''),
  })).optional().default([]),
  footerDescription: z.string().max(1000, 'Deskripsi footer terlalu panjang').optional().nullable(),
  contactAddress: z.string().max(255, 'Alamat terlalu panjang').optional().nullable(),
  contactPhone: z.string().max(50, 'Nomor telepon terlalu panjang').optional().nullable(),
  contactEmail: z.string().email('Format email tidak valid').or(z.literal('')).optional().nullable(),
  instagramUrl: z.string().url('URL Instagram tidak valid').or(z.literal('')).optional().nullable(),
  facebookUrl: z.string().url('URL Facebook tidak valid').or(z.literal('')).optional().nullable(),
  twitterUrl: z.string().url('URL Twitter tidak valid').or(z.literal('')).optional().nullable(),
});

export async function getSettings() {
  try {
    const result = await db.select().from(settings).where(eq(settings.id, 'config')).limit(1);
    
    const defaults: Setting = {
      id: 'config',
      updatedAt: new Date(),
      storeName: 'Erlinshop',
      logoUrl: '',
      whatsappNumber: '6281234567890',
      heroTitle: 'JELAJAHI KOLEKSI',
      heroSubtitle: 'Temukan kurasi produk premium terbaik untuk gaya hidup Anda yang eksklusif.',
      heroImageUrl: '',
      heroImages: [],
      footerDescription: 'Premium quality essentials for your lifestyle. We curate the best products from around the world to bring you excellence and style.',
      contactAddress: 'Jl. Raya No. 123, Jakarta, Indonesia',
      contactPhone: '+62 123 4567 890',
      contactEmail: 'hello@erlinshop.com',
      instagramUrl: '',
      facebookUrl: '',
      twitterUrl: '',
    };

    if (result.length === 0) {
      return defaults;
    }
    
    // Merge with defaults to ensure no nulls for critical UI fields
    const rawImages = result[0].heroImages ?? [];
    
    // Migration Logic: Convert string[] to { url, title, subtitle }[]
    const migratedImages = Array.isArray(rawImages) 
      ? rawImages.map((img: any) => {
          if (typeof img === 'string') {
            return { url: img, title: result[0].heroTitle ?? '', subtitle: result[0].heroSubtitle ?? '' };
          }
          return img;
        })
      : [];

    return {
      ...defaults,
      ...result[0],
      heroImages: migratedImages
    } as Setting;
  } catch (error) {
    console.error('Failed to fetch settings:', error);
    return {
      id: 'config',
      updatedAt: new Date(),
      storeName: 'Erlinshop',
      logoUrl: '',
      whatsappNumber: '6281234567890',
      heroTitle: 'JELAJAHI KOLEKSI',
      heroSubtitle: 'Temukan kurasi produk premium terbaik untuk gaya hidup Anda yang eksklusif.',
      heroImageUrl: '',
      heroImages: [],
      footerDescription: 'Premium quality essentials for your lifestyle. We curate the best products from around the world to bring you excellence and style.',
      contactAddress: 'Jl. Raya No. 123, Jakarta, Indonesia',
      contactPhone: '+62 123 4567 890',
      contactEmail: 'hello@erlinshop.com',
      instagramUrl: '',
      facebookUrl: '',
      twitterUrl: '',
    } as Setting;
  }
}

export async function updateSettings(data: Partial<Setting>) {
  try {
    // Validate data using Zod
    const validatedData = SettingsSchema.safeParse(data);

    if (!validatedData.success) {
      const errors = validatedData.error.flatten().fieldErrors;
      return { 
        success: false, 
        error: 'Data tidak valid', 
        details: errors 
      };
    }

    const valid = validatedData.data;

    await db.insert(settings)
      .values({
        id: 'config',
        storeName: valid.storeName,
        logoUrl: valid.logoUrl,
        whatsappNumber: valid.whatsappNumber,
        heroTitle: valid.heroTitle,
        heroSubtitle: valid.heroSubtitle,
        heroImageUrl: valid.heroImageUrl,
        heroImages: valid.heroImages,
        footerDescription: valid.footerDescription,
        contactAddress: valid.contactAddress,
        contactPhone: valid.contactPhone,
        contactEmail: valid.contactEmail,
        instagramUrl: valid.instagramUrl,
        facebookUrl: valid.facebookUrl,
        twitterUrl: valid.twitterUrl,
      })
      .onConflictDoUpdate({
        target: settings.id,
        set: {
          ...valid,
          updatedAt: new Date(),
        },
      });
    
    revalidatePath('/admin/settings');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Failed to update settings:', error);
    return { success: false, error: 'Terjadi kesalahan saat menyimpan pengaturan' };
  }
}
