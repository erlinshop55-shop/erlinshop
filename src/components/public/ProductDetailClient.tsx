'use client';

import React, { useState, useMemo } from 'react';
import ImageGallery from './ImageGallery';
import { Star, ShoppingBag, ShieldCheck, Truck, ArrowLeft, Heart, Zap, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '@/stores/cart';
import { ProductWithVariants } from '@/types/product';
import { toast } from 'sonner';
import { addToCart } from '@/app/actions/cart';

interface ProductDetailClientProps {
  readonly product: ProductWithVariants;
}

export default function ProductDetailClient({ product }: ProductDetailClientProps) {
  const { addItem, openCart } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

  const selectedVariant = useMemo(() => 
    product.variants.find(v => v.id === selectedVariantId),
    [product.variants, selectedVariantId]
  );

  const displayPrice = selectedVariant?.price ?? product.price;
  const displayStock = selectedVariant?.stock ?? product.stock;
  const displayOriginalPrice = product.original_price;

  const discount = displayOriginalPrice 
    ? Math.round(((displayOriginalPrice - displayPrice) / displayOriginalPrice) * 100) 
    : 0;

  const handleAddToCart = async () => {
    // 1. Validation: Must select variant if product has them
    if (product.variants.length > 0 && !selectedVariantId) {
      toast.error('Silakan pilih varian/ukuran terlebih dahulu.', {
        description: 'Pilih salah satu opsi yang tersedia untuk melanjutkan.',
        position: 'top-center',
        className: 'font-bold uppercase tracking-tighter text-xs'
      });
      return;
    }

    // 2. Execution
    setIsAdding(true);
    
    try {
      // 3. Persist to Database (Server Action)
      const res = await addToCart(selectedVariantId as string, 1);
      
      if (!res.success) {
        throw new Error(res.error || "Gagal menyimpan ke database");
      }

      // 4. Update local Zustand Store (for immediate UI feedback)
      addItem({
        id: product.id,
        name: product.name,
        price: displayPrice,
        image: product.images?.[0] ?? '',
        variantId: selectedVariantId ?? undefined,
        variantName: selectedVariant?.name ?? undefined,
        specs: {
          ...(product.specs as Record<string, any>),
          ...(selectedVariant?.attributes as Record<string, any>),
        },
      });

      const productName = product.name;
      const variantName = selectedVariant ? ` - ${selectedVariant.name}` : '';
      
      toast.success('Berhasil masuk keranjang!', {
        description: `"${productName}${variantName}" siap untuk checkout.`,
        position: 'top-center'
      });
      
      openCart();
    } catch (error: any) {
      toast.error(error.message || 'Gagal menambahkan ke keranjang');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="container mx-auto px-4 max-w-7xl">
      {/* Breadcrumbs / Back Button */}
      <div className="flex items-center justify-between mb-8">
        <Link 
          href="/products" 
          className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-950 transition-colors group"
        >
          <div className="p-2 rounded-full bg-white border border-zinc-200 group-hover:border-zinc-400">
            <ArrowLeft className="w-4 h-4" />
          </div>
          Kembali ke Katalog
        </Link>
        <button className="p-3 rounded-full bg-white border border-zinc-200 text-zinc-400 hover:text-red-500 hover:border-red-500/30 transition-all">
          <Heart className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
        {/* Left: Image Gallery */}
        <div className="lg:col-span-7">
          <ImageGallery images={product.images ?? []} />
        </div>

        {/* Right: Product Info & Actions */}
        <div className="lg:col-span-5 space-y-10">
          <div className="space-y-6">
            {/* Badges */}
            <div className="flex flex-wrap gap-3">
              {product.category && (
                <span className="px-4 py-1.5 bg-zinc-100 border border-zinc-200 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                  {product.category.name}
                </span>
              )}
              {product.isNew && (
                <span className="px-4 py-1.5 bg-amber-500 text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-amber-500/20">
                  New Arrival
                </span>
              )}
              {product.isFeatured && (
                <span className="px-4 py-1.5 bg-white border border-amber-500/30 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> Top Pick
                </span>
              )}
            </div>

            <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-tight text-zinc-950">
              {product.name}
            </h1>

            <div className="flex items-center gap-4">
              <div className="text-3xl font-black text-zinc-950">
                IDR {displayPrice.toLocaleString('id-ID')}
              </div>
              {!!displayOriginalPrice && (
                <div className="flex items-center gap-3">
                  <span className="text-lg text-zinc-400 line-through decoration-zinc-300">
                    IDR {displayOriginalPrice.toLocaleString('id-ID')}
                  </span>
                  <span className="bg-red-50 text-red-600 px-2 py-1 rounded text-[10px] font-black uppercase tracking-tighter">
                    Hemat {discount}%
                  </span>
                </div>
              )}
            </div>
            
            <p className="text-zinc-500 text-lg leading-relaxed">
              {product.description || 'Deskripsi produk premium ini belum tersedia.'}
            </p>
          </div>

          {/* Variant Selection */}
          {(Array.isArray(product.variants) && product.variants.length > 0) ? (
            <div className="space-y-4 pt-6 border-t border-zinc-100">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Pilih Varian / Ukuran</h3>
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${
                  displayStock > 0 ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'
                }`}>
                  Stok: {displayStock}
                </span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {product.variants.map((variant) => {
                  const isSelected = selectedVariantId === variant.id;
                  const isOutOfStock = variant.stock === 0;
                  
                  let buttonStyles = "bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400 hover:text-zinc-900";
                  if (isSelected) {
                    buttonStyles = "bg-zinc-950 text-white border-zinc-950 ring-4 ring-zinc-950/10 z-10 scale-105 shadow-xl";
                  } else if (isOutOfStock) {
                    buttonStyles = "bg-zinc-50 text-zinc-300 border-zinc-100 opacity-50 cursor-not-allowed overflow-hidden";
                  }

                  return (
                    <button
                      key={variant.id}
                      onClick={() => !isOutOfStock && setSelectedVariantId(variant.id)}
                      disabled={isOutOfStock}
                      className={`relative py-4 rounded-xl border-2 transition-all text-[11px] font-black uppercase tracking-widest flex flex-col items-center justify-center gap-1 ${buttonStyles}`}
                    >
                      {variant.name}
                      {isOutOfStock && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-full h-px bg-zinc-300/50 -rotate-45" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* Specs Grid - Only rendered if there are non-empty values */}
          {(() => {
            const specs = product.specs as Record<string, any>;
            const filteredSpecs = Object.entries(specs || {}).filter(
              ([_, value]) => value !== null && value !== undefined && String(value).trim() !== ""
            );

            if (filteredSpecs.length === 0) return null;

            return (
              <div className="space-y-4 pt-6 border-t border-zinc-100">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Spesifikasi Teknis</h3>
                <div className="grid grid-cols-2 gap-4">
                  {filteredSpecs.map(([key, value]) => (
                    <div key={key} className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 shadow-sm">
                      <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 block mb-1">{key}</span>
                      <span className="text-sm font-bold text-zinc-900">
                        {String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Action Buttons */}
          <div className="space-y-4 pt-8">
            <button 
              onClick={handleAddToCart}
              disabled={displayStock === 0 || isAdding}
              className={`w-full py-5 font-black uppercase tracking-[0.2em] text-xs rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 ${
                displayStock > 0 
                  ? 'bg-zinc-950 text-white shadow-zinc-950/20 hover:scale-[1.02] active:scale-[0.98]' 
                  : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
              }`}
            >
              {isAdding ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ShoppingBag className="w-5 h-5" /> 
              )}
              {isAdding ? 'Menambahkan...' : displayStock > 0 ? 'Tambah ke Keranjang Belanja' : 'Stok Habis'}
            </button>
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-3 gap-4 pt-10">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-12 h-12 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center text-amber-600">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">100% Original</span>
            </div>
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-12 h-12 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center text-amber-600">
                <Truck className="w-6 h-6" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Pengiriman Cepat</span>
            </div>
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-12 h-12 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center text-amber-600">
                <Zap className="w-6 h-6" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Kualitas Terbaik</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
