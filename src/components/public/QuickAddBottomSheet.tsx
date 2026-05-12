
'use client';
import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, Loader2, Check } from 'lucide-react';
import Image from 'next/image';
import { getProductWithVariants } from '@/app/actions/public-products';
import { addToCart } from '@/app/actions/cart';
import { useCart } from '@/stores/cart';
import { cn } from '@/lib/utils';

import { toast } from 'sonner';

interface QuickAddBottomSheetProps {
  productId: string | null;
  onClose: () => void;
}

export default function QuickAddBottomSheet({ productId, onClose }: Readonly<QuickAddBottomSheetProps>) {
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [adding, setAdding] = useState(false);
  const { addItem, openCart } = useCart();

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    globalThis.window.addEventListener('keydown', handleEsc);
    return () => globalThis.window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  useEffect(() => {
    if (productId) {
      const fetchData = async () => {
        setLoading(true);
        const res = await getProductWithVariants(productId);
        if (res.success && res.data) {
          const data = res.data;
          setProduct(data);
          // Auto select if only one variant
          if (data.variants && data.variants.length === 1) {
            setSelectedVariant(data.variants[0]);
          }
        }
        setLoading(false);
      };
      fetchData();
    } else {
      setProduct(null);
      setSelectedVariant(null);
    }
  }, [productId]);

  const handleAddToCart = async () => {
    if (!product || !selectedVariant) return;
    
    setAdding(true);
    try {
      const res = await addToCart(selectedVariant.id, 1);
      if (res.success) {
        toast.success(`"${product.name}" ditambahkan ke keranjang`);
        onClose();
        openCart();
      } else {
        toast.error(res.error || "Gagal menambahkan ke keranjang");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setAdding(false);
    }
  };

  if (!productId) return null;

  const quickAddButtonContent = adding ? (
    <Loader2 className="w-5 h-5 animate-spin" />
  ) : (
    <ShoppingBag className="w-5 h-5" />
  );

  const quickAddButtonText = adding ? 'PROCESSING...' : 'ADD TO SHOPPING BAG';

  return (
    <div className="fixed inset-0 z-100 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Content */}
      <div className="relative w-full max-w-lg bg-white rounded-t-4xl sm:rounded-4xl p-8 shadow-2xl animate-in slide-in-from-bottom duration-500 overflow-hidden">
        {/* Drag Handle (Mobile) */}
        <div className="sm:hidden absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-zinc-200 rounded-full" />
        
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 hover:bg-zinc-100 rounded-full transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
            <p className="text-xs font-black uppercase tracking-widest text-zinc-400">Fetching Variants...</p>
          </div>
        ) : product ? (
          <div className="space-y-8">
            <div className="flex gap-6">
              <div className="w-24 h-32 rounded-2xl overflow-hidden bg-zinc-100 shrink-0">
                <Image 
                  src={product.images?.[0]} 
                  alt={product.name}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col justify-center">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1">
                  {product.brand || 'UNBRANDED'}
                </span>
                <h3 className="text-xl font-black tracking-tight mb-2 line-clamp-1">{product.name}</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-rose-600">
                    IDR {(selectedVariant?.price ?? product.price).toLocaleString('id-ID')}
                  </span>
                  {product.original_price && (
                    <span className="text-sm text-zinc-400 line-through">
                      IDR {product.original_price.toLocaleString('id-ID')}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-widest text-zinc-900">
                  Select Option
                </h4>
                {selectedVariant && (
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1">
                    <Check className="w-3 h-3" /> Stok Tersedia: {selectedVariant.stock}
                  </span>
                )}
              </div>
              
              <div className="flex flex-wrap gap-3">
                {product.variants?.map((v: any) => (
                  <button
                    key={v.id}
                    disabled={v.stock <= 0}
                    onClick={() => setSelectedVariant(v)}
                    className={cn(
                      "px-6 py-4 rounded-2xl text-sm font-black uppercase tracking-widest border-2 transition-all relative overflow-hidden",
                      v.stock <= 0 
                        ? "opacity-40 cursor-not-allowed border-zinc-100" 
                        : selectedVariant?.id === v.id
                        ? "border-amber-500 bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20 scale-[1.05]"
                        : "border-zinc-100 hover:border-amber-500/50"
                    )}
                  >
                    {v.name}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={!selectedVariant || adding}
              className="w-full py-6 bg-black text-white rounded-3xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              {quickAddButtonContent}
              {quickAddButtonText}
            </button>

            <p className="text-[10px] text-center text-zinc-400 uppercase tracking-widest">
              Garansi Kualitas 100% • Pengiriman Instan Tersedia
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
