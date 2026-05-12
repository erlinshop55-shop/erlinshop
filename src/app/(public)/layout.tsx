import React, { cache } from 'react';
import type { Metadata } from 'next';
import Header from '@/components/public/Header';
import Footer from '@/components/public/Footer';
import BottomNav from '@/components/public/BottomNav';
import { getSettings } from '@/lib/actions/settings';

// Cache settings fetch for deduplication between metadata and layout
export const getCachedSettings = cache(async () => {
  return await getSettings();
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getCachedSettings();
  const storeName = settings.storeName || 'Erlinshop';
  const description = settings.heroSubtitle || settings.footerDescription || 'Temukan produk eksklusif dan kebutuhan harian Anda di Erlinshop.';
  
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://erlinshop.com'),
    title: {
      template: `%s | ${storeName}`,
      default: `${storeName} - Premium Store Essentials`,
    },
    description: description,
    keywords: [storeName, 'Fashion', 'E-commerce', 'Indonesia', 'Premium', 'Lifestyle', 'Koleksi Terbaik'],
    openGraph: {
      title: `${storeName} - Premium Store Essentials`,
      description: description,
      url: './',
      siteName: storeName,
      images: [
        {
          url: settings.heroImageUrl || '/og-image.jpg',
          width: 1200,
          height: 630,
        },
      ],
      locale: 'id_ID',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: storeName,
      description: description,
      images: [settings.heroImageUrl || '/og-image.jpg'],
    },
    robots: {
      index: true,
      follow: true,
    },
    icons: {
      icon: settings.logoUrl || '/favicon.ico',
      shortcut: settings.logoUrl || '/favicon.ico',
      apple: settings.logoUrl || '/apple-icon.png',
    }
  };
}

export default async function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getCachedSettings();

  return (
    <div className="flex flex-col min-h-screen bg-white text-zinc-950 selection:bg-amber-100 selection:text-amber-900">
      <Header settings={settings} />
      <main className="grow pb-24 lg:pb-0">
        {children}
      </main>
      <BottomNav />
      <Footer settings={settings} />
    </div>
  );
}

