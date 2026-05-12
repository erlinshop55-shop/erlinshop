import React from 'react';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';
import { db } from '@/db';
import { products } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import ProductDetailClient from '@/components/public/ProductDetailClient';
import { ProductWithVariants } from '@/types/product';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await db.query.products.findFirst({
    where: eq(products.id, id),
  });

  if (!product) {
    return {
      title: 'Product Not Found',
    };
  }

  return {
    title: `${product.name} | Erlinshop`,
    description: product.description || `Buy ${product.name} at Erlinshop.`,
    openGraph: {
      images: product.images?.[0] ? [{ url: product.images[0] }] : [],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  
  const product = await db.query.products.findFirst({
    where: eq(products.id, id),
    with: {
      category: true,
      variants: true,
    },
  });

  if (!product) {
    notFound();
  }

  return (
    <div className="min-h-screen pt-24 md:pt-32 pb-12">
      <ProductDetailClient product={product as ProductWithVariants} />
    </div>
  );
}
