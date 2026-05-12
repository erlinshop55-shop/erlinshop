'use client';
import React, { useState } from 'react';
import { useCatalog, SortOption } from '@/hooks/useCatalog';
import { Zap, Search, X, Loader2 } from 'lucide-react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { ProductCard } from './ProductCard';
import QuickAddBottomSheet from './QuickAddBottomSheet';
import { Hero } from '@/components/sections/Hero';
import { cn } from '@/lib/utils';

interface ProductWithCategory {
  id: string;
  name: string;
  price: number;
  original_price: number | null;
  images: string[] | null;
  categoryId: string | null;
  isNew: boolean | null;
  isFeatured: boolean | null;
  genderTarget: string | null;
  brand: string | null;
  createdAt: Date;
  category?: { id: string; name: string } | null;
}

interface CatalogClientProps {
  readonly initialProducts: readonly ProductWithCategory[];
  readonly initialCategories: readonly { id: string; name: string }[];
  readonly metadata: {
    readonly total: number;
    readonly page: number;
    readonly limit: number;
    readonly totalPages: number;
  };
  readonly settings: {
    readonly storeName: string;
    readonly heroTitle: string | null;
    readonly heroSubtitle: string | null;
    readonly heroImageUrl: string | null;
    readonly heroImages: { url: string; title: string; subtitle: string }[] | null;
    readonly [key: string]: any;
  };
}

export default function CatalogClient({ 
  initialProducts, 
  initialCategories, 
  metadata,
  settings 
}: CatalogClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  // Initialize filters from URL search params
  const initialCategory = searchParams.get('category');
  const initialGender = searchParams.get('gender');

  const {
    products,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedGender,
    setSelectedGender,
    sortBy,
    setSortBy,
  } = useCatalog<ProductWithCategory>({ 
    initialProducts, 
    initialCategories,
    initialCategory,
    initialGender 
  });
  
  const [quickAddId, setQuickAddId] = useState<string | null>(null);

  const handleLoadMore = () => {
    if (isLoadingMore || metadata.page >= metadata.totalPages) return;
    
    setIsLoadingMore(true);
    const params = new URLSearchParams(searchParams);
    params.set('page', (metadata.page + 1).toString());
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    
    // Reset loading state after a short delay (simulation or until re-render)
    setTimeout(() => setIsLoadingMore(false), 800);
  };

  return (
    <div className="bg-white">
      {/* Hero Section - Full Bleed */}
      <Hero 
        slides={settings.heroImages ?? []}
        title={settings.heroTitle}
        subtitle={settings.heroSubtitle}
      />

      <div className="container mx-auto px-4 py-12 md:py-16">
        {/* Search & Filters Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="flex flex-col gap-4">

          {/* Gender Tabs */}
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {['Semua', 'Pria', 'Wanita', 'Anak'].map((gender) => {
              const isMen = gender === 'Pria';
              const isWomen = gender === 'Wanita';
              const isKids = gender === 'Anak';
              const genderValue = isMen ? 'Men' : (isWomen ? 'Women' : (isKids ? 'Kids' : null));
              const isActive = (gender === 'Semua' && selectedGender === null) || selectedGender === genderValue;
              
              return (
                <button
                  key={gender}
                  onClick={() => setSelectedGender(genderValue)}
                  className={cn(
                    "whitespace-nowrap px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border-2",
                    isActive
                      ? "bg-zinc-950 text-white border-zinc-950 shadow-lg"
                      : "bg-zinc-50 text-zinc-400 border-transparent hover:border-zinc-200"
                  )}
                >
                  {gender}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-96 group">
          <div className="relative flex items-center bg-white border border-zinc-200 rounded-2xl px-4 py-3 shadow-sm group-focus-within:border-zinc-400 transition-all">
            <Search className="w-5 h-5 text-zinc-400 group-focus-within:text-zinc-950 transition-colors" />
            <input 
              type="text" 
              placeholder="Cari produk..." 
              className="bg-transparent border-none outline-none w-full px-3 text-sm text-zinc-950"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="p-1 hover:bg-zinc-100 rounded-full">
                <X className="w-4 h-4 text-zinc-400" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        {/* Sidebar Filters - Desktop */}
        <aside className="hidden lg:block space-y-10">
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-amber-500 rounded-full"></span> Kategori
            </h3>
            <ul className="space-y-2">
              <li>
                <button 
                  onClick={() => setSelectedCategory(null)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-between ${
                    selectedCategory === null 
                      ? 'bg-zinc-950 text-white shadow-lg' 
                      : 'text-zinc-500 hover:bg-zinc-50'
                  }`}
                >
                  Semua Produk
                  {selectedCategory === null && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                </button>
              </li>
              {initialCategories.map((cat) => (
                <li key={cat.id}>
                  <button 
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-between ${
                      selectedCategory === cat.id 
                        ? 'bg-zinc-950 text-white shadow-lg' 
                        : 'text-zinc-500 hover:bg-zinc-50'
                    }`}
                  >
                    {cat.name}
                    {selectedCategory === cat.id && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-amber-500 rounded-full"></span> Urutkan
            </h3>
            <div className="space-y-2">
              {[
                { id: 'newest', label: 'Terbaru' },
                { id: 'price-asc', label: 'Harga: Rendah ke Tinggi' },
                { id: 'price-desc', label: 'Harga: Tinggi ke Rendah' },
                { id: 'featured', label: 'Unggulan' },
              ].map((option) => (
                <button 
                  key={option.id}
                  onClick={() => setSortBy(option.id as SortOption)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${
                    sortBy === option.id 
                      ? 'border-zinc-950 bg-zinc-50 text-zinc-950' 
                      : 'border-zinc-200 text-zinc-400 hover:border-zinc-400'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Promo Card */}
          <div className="group relative overflow-hidden p-8 bg-zinc-950 rounded-3xl border border-zinc-900 shadow-2xl">
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-40 h-40 bg-amber-500/10 blur-[80px] group-hover:bg-amber-500/20 transition-all"></div>
            <Zap className="w-10 h-10 text-amber-500 mb-6 relative z-10" />
            <h4 className="text-xl font-black text-white mb-3 relative z-10">MEMBER<br/>PRIVILEGE</h4>
            <p className="text-xs text-zinc-400 mb-6 relative z-10 leading-relaxed">Dapatkan cashback 10% dan akses eksklusif untuk koleksi terbaru kami.</p>
            <button className="relative z-10 w-full py-3 bg-amber-500 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-amber-500/20">
              Join Erlin Club
            </button>
          </div>
        </aside>

        {/* Product Grid Area */}
        <div className="lg:col-span-3">
          {/* Mobile Filter & Sort (Sticky on mobile?) */}
          <div className="lg:hidden flex items-center gap-4 mb-8 overflow-x-auto pb-2 scrollbar-hide">
            <button 
              onClick={() => setSelectedCategory(null)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
                selectedCategory === null ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-100'
              }`}
            >
              All
            </button>
            {initialCategories.map((cat) => (
              <button 
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
                  selectedCategory === cat.id ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-100'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {products.length === 0 ? (
            <div className="text-center py-32 flex flex-col items-center">
              <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mb-6">
                <Search className="w-8 h-8 text-muted-foreground opacity-20" />
              </div>
              <p className="text-muted-foreground font-medium text-lg">No products found</p>
              <p className="text-muted-foreground text-sm">Try adjusting your filters or search terms.</p>
              <button 
                onClick={() => { setSearchQuery(''); setSelectedCategory(null); }}
                className="mt-6 text-neon font-bold text-sm hover:underline"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-10 md:gap-x-8 md:gap-y-12">
              {products.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onQuickAdd={(id) => setQuickAddId(id)}
                />
              ))}
            </div>
          )}

          {/* LOAD MORE BUTTON */}
          {metadata.totalPages > metadata.page && (
            <div className="mt-20 flex flex-col items-center gap-6">
              <div className="flex items-center gap-4 w-full max-w-md">
                <div className="h-px grow bg-zinc-100"></div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 whitespace-nowrap">
                  Menampilkan {initialProducts.length} dari {metadata.total} produk
                </span>
                <div className="h-px grow bg-zinc-100"></div>
              </div>
              
              <button 
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="group relative px-12 py-5 bg-zinc-950 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 overflow-hidden shadow-2xl"
              >
                <div className="relative flex items-center gap-3">
                  {isLoadingMore ? (
                    <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                  ) : (
                    <Zap className="w-4 h-4 text-amber-500" />
                  )}
                  {isLoadingMore ? 'MEMUAT DATA...' : 'TAMPILKAN LEBIH BANYAK'}
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Add Sheet */}
      <QuickAddBottomSheet 
        productId={quickAddId} 
        onClose={() => setQuickAddId(null)} 
      />
      </div>
    </div>
  );
}
