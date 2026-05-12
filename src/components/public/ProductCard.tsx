
'use client';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, Star } from 'lucide-react';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    brand: string | null;
    price: number;
    original_price: number | null;
    images: string[] | null;
    isNew: boolean | null;
    isFeatured: boolean | null;
    genderTarget: string | null;
  };
  onQuickAdd: (productId: string) => void;
}

export function ProductCard({ product, onQuickAdd }: Readonly<ProductCardProps>) {
  const hasDiscount = !!(product.original_price && product.original_price > product.price);
  const discountPercentage = hasDiscount && product.original_price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0;

  return (
    <div className="group flex flex-col bg-white rounded-4xl overflow-hidden transition-all duration-500 hover:shadow-xl hover:shadow-zinc-200/50 border border-zinc-100">
      {/* Image Container */}
      <div className="relative aspect-3/4 rounded-4xl overflow-hidden bg-zinc-50 border border-zinc-100 group">
        <Link href={`/products/${product.id}`} className="block h-full w-full">
          {product.images && product.images.length > 0 ? (
            <Image 
              src={product.images[0]} 
              alt={product.name}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              className="object-cover transition-transform duration-1000 group-hover:scale-110"
            />
          ) : (
            <div className="aspect-3/4 rounded-4xl bg-zinc-50 flex items-center justify-center border border-zinc-100">
              <ShoppingBag className="w-12 h-12 text-zinc-200" />
            </div>
          )}
        </Link>

        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
          {product.isNew && (
            <div className="px-3 py-1 bg-zinc-950 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg">
              BARU
            </div>
          )}
          {product.isFeatured && (
            <div className="px-3 py-1 bg-amber-500 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg flex items-center gap-1.5">
              <Star className="w-2.5 h-2.5 fill-white" /> UNGGULAN
            </div>
          )}
        </div>

        {/* Discount Badge */}
        {hasDiscount && (
          <div className="absolute top-4 right-4 px-3 py-1 bg-red-600 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg z-10">
            -{discountPercentage}%
          </div>
        )}

        {/* Quick View Button */}
        <div className="absolute bottom-4 inset-x-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-20">
          <Link 
            href={`/products/${product.id}`}
            className="w-full py-3 bg-white text-zinc-950 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl flex items-center justify-center shadow-2xl border border-zinc-200 hover:bg-zinc-950 hover:text-white transition-colors"
          >
            LIHAT DETAIL
          </Link>
        </div>
      </div>

      {/* Product Content */}
      <div className="p-5 flex flex-col grow">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">
            {product.brand || 'ERLINSHOP'}
          </span>
          <div className="h-px grow bg-zinc-100"></div>
          {product.genderTarget && (
            <span className="text-[9px] font-bold text-zinc-300 uppercase tracking-widest">
              {product.genderTarget}
            </span>
          )}
        </div>

        <Link href={`/products/${product.id}`} className="block mb-3">
          <h3 className="text-sm font-bold text-zinc-800 line-clamp-1 group-hover:text-zinc-950 transition-colors">
            {product.name}
          </h3>
        </Link>

        <div className="mt-auto">
          <div className="flex items-center gap-3">
            <span className="text-lg font-black tracking-tighter text-zinc-950">
              IDR {product.price.toLocaleString('id-ID')}
            </span>
            {hasDiscount && (
              <span className="text-[10px] text-zinc-400 line-through decoration-zinc-200">
                {product.original_price?.toLocaleString('id-ID')}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
