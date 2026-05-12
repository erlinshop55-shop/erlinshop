import React from 'react';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';
import { db } from '@/db';
import { products, categories } from '@/db/schema';
import { desc, asc, sql, eq } from 'drizzle-orm';
import CatalogClient from '@/components/public/CatalogClient';
import { getCachedSettings } from '../layout';

const ITEMS_PER_PAGE = 12;

export const metadata: Metadata = {
  title: 'Catalog',
  description: 'Browse our full collection of premium products.',
};

async function getInitialData(page: number) {
  const limit = page * ITEMS_PER_PAGE;
  const allProducts = await db.query.products.findMany({
    where: eq(products.isPublished, true),
    with: {
      category: true,
    },
    orderBy: [desc(products.createdAt)],
    limit: limit,
  });

  const allCategories = await db.query.categories.findMany({
    orderBy: [asc(categories.order)],
  });

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(products)
    .where(eq(products.isPublished, true));

  return { 
    allProducts, 
    allCategories,
    metadata: {
      total: Number(count),
      page,
      limit: ITEMS_PER_PAGE,
      totalPages: Math.ceil(Number(count) / ITEMS_PER_PAGE)
    }
  };
}

export default async function ProductsPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ page?: string }>;
}>) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const { allProducts, allCategories, metadata } = await getInitialData(page);
  const settings = await getCachedSettings();

  return (
    <CatalogClient 
      initialProducts={allProducts as any} 
      initialCategories={allCategories} 
      metadata={metadata}
      settings={settings}
    />
  );
}
