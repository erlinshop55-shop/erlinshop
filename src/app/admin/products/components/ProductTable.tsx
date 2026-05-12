import { ChevronLeft, ChevronRight, Pencil, Trash2, ImageIcon, ExternalLink, Activity, Package, Box } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { formatIDR } from "@/lib/currency";
import { ProductWithCategory } from "../actions";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ProductTableProps {
  products: ProductWithCategory[];
  metadata: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  onEdit: (product: ProductWithCategory) => void;
  onDelete: (id: string) => void;
  onTogglePublish?: (id: string, isPublished: boolean) => void;
  isLoading: boolean;
}

function PublishToggle({ isPublished, onToggle, disabled }: { isPublished: boolean; onToggle: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      disabled={disabled}
      className={cn(
        "relative inline-flex h-5 w-10 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 shadow-inner",
        isPublished ? "bg-amber-500" : "bg-zinc-700 dark:bg-zinc-800"
      )}
    >
      <span
        className={cn(
          "pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform duration-300",
          isPublished ? "translate-x-5" : "translate-x-1"
        )}
      />
    </button>
  );
}

export function ProductTable({ products, metadata, onEdit, onDelete, onTogglePublish, isLoading }: Readonly<ProductTableProps>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  const startRange = (metadata.page - 1) * metadata.limit + 1;
  const endRange = Math.min(metadata.page * metadata.limit, metadata.total);
  if (isLoading && products.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-900 overflow-hidden shadow-xl dark:shadow-2xl p-8">
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-6 animate-pulse border-b border-zinc-100 dark:border-zinc-900 pb-4">
              <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-900 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-zinc-100 dark:bg-zinc-900 rounded-lg w-1/4" />
                <div className="h-3 bg-zinc-100 dark:bg-zinc-900 rounded-lg w-1/6" />
              </div>
              <div className="w-32 h-10 bg-zinc-100 dark:bg-zinc-900 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* DESKTOP TABLE VIEW */}
      <div className="hidden md:block bg-white dark:bg-zinc-900/50 backdrop-blur-xl rounded-3xl border border-zinc-200 dark:border-amber-500/10 overflow-hidden shadow-xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all hover:border-amber-500/20">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-800 scrollbar-track-transparent">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400 text-[10px] uppercase tracking-[0.3em] border-b border-zinc-100 dark:border-zinc-900">
                <th className="px-6 py-6 font-black">
                  <div className="flex items-center gap-2">
                    <Activity size={12} className="text-amber-500" />
                    Produk / ID Seri
                  </div>
                </th>
                <th className="px-6 py-6 font-black text-center">Sektor</th>
                <th className="px-6 py-6 font-black text-center">Visibilitas</th>
                <th className="px-6 py-6 font-black text-right">Indeks Harga (IDR)</th>
                <th className="px-6 py-6 font-black text-center">Status Stok</th>
                <th className="px-6 py-6 font-black text-right">Eksekusi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900/50">
              {products.map((product) => {
                const hasDiscount = product.original_price && product.original_price > product.price;
                const isOutOfStock = product.stock <= 0;
                
                return (
                  <tr key={product.id} className="hover:bg-amber-500/2 transition-all group border-l-2 border-l-transparent hover:border-l-amber-500">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl overflow-hidden border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-black shrink-0 group-hover:border-amber-500/40 transition-all shadow-md dark:shadow-lg">
                          {product.images?.at(0) ? (
                            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-900">
                              <ImageIcon className="text-zinc-400 dark:text-zinc-700" size={20} />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-black text-sm text-zinc-900 dark:text-zinc-100 truncate max-w-[240px] uppercase tracking-tight group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">{product.name}</div>
                          <div className="text-[10px] text-zinc-500 dark:text-zinc-600 font-mono mt-1.5 tracking-tighter opacity-80 flex items-center gap-1.5">
                            <span className="bg-zinc-100 dark:bg-zinc-900 px-1.5 py-0.5 rounded text-zinc-400 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-800 uppercase">UID</span>
                            {product.id.split('-')[0].toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className="inline-block px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 group-hover:border-amber-500/30 group-hover:text-amber-600 dark:group-hover:text-amber-200 transition-all">
                        {product.category?.name || "TIDAK TERKLASIFIKASI"}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="flex justify-center">
                        <PublishToggle 
                          isPublished={!!product.isPublished} 
                          onToggle={() => onTogglePublish?.(product.id, !product.isPublished)}
                          disabled={isLoading}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="font-mono font-black text-sm text-emerald-400 tracking-tighter shadow-emerald-400/10 drop-shadow-sm group-hover:scale-110 transition-transform origin-right">
                        {formatIDR(product.price)}
                      </div>
                      {hasDiscount && (
                        <div className="text-[10px] text-rose-500/60 line-through mt-1 font-mono tracking-tighter">
                          {formatIDR(product.original_price!)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className={cn(
                          "inline-flex items-center px-3 py-1.5 rounded-lg text-[10px] font-black font-mono border transition-all",
                          isOutOfStock 
                            ? "bg-rose-500/5 text-rose-500 border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.05)]" 
                            : "bg-emerald-400/5 text-emerald-400 border-emerald-400/20 shadow-[0_0_15px_rgba(52,211,153,0.05)]"
                        )}>
                          {isOutOfStock ? "STOK: HABIS" : `STOK: ${product.stock} UNIT`}
                        </div>
                        
                        {product.variants && product.variants.length > 0 && (
                          <div className="flex items-center gap-1 text-[8px] font-black uppercase tracking-tighter text-amber-500/70">
                            <Box size={10} />
                            <span>{product.variants.length} VARIAN</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                        <a
                          href={`/products/${product.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2.5 text-zinc-500 hover:text-amber-400 hover:bg-amber-400/10 rounded-xl transition-all border border-transparent hover:border-amber-400/20"
                          title="View Asset"
                        >
                          <ExternalLink size={16} />
                        </a>
                        <button 
                          onClick={() => onEdit(product)}
                          className="p-2.5 text-zinc-500 hover:text-amber-400 hover:bg-amber-400/10 rounded-xl transition-all border border-transparent hover:border-amber-400/20"
                          title="Modify Order"
                        >
                          <Pencil size={16} />
                        </button>
                        <button 
                          onClick={() => onDelete(product.id)}
                          className="p-2.5 text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all border border-transparent hover:border-rose-500/20"
                          title="Liquidate Asset"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {products.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={5} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-900 rounded-2xl flex items-center justify-center border border-zinc-200 dark:border-zinc-800 shadow-inner">
                        <Package className="text-zinc-400 dark:text-zinc-700" size={32} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-zinc-900 dark:text-zinc-50 text-[10px] font-black tracking-[0.4em] uppercase">Tidak ada produk aktif terdeteksi</p>
                        <p className="text-zinc-500 dark:text-zinc-600 text-[9px] font-mono uppercase">Sistem siap untuk pendaftaran produk baru</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:hidden">
        {products.map((product) => {
          const isOutOfStock = product.stock <= 0;
          return (
            <div key={product.id} className="bg-white dark:bg-zinc-900 backdrop-blur-md border border-zinc-200 dark:border-zinc-800/80 p-5 rounded-3xl shadow-lg dark:shadow-[0_10px_30px_rgba(0,0,0,0.3)] space-y-4 hover:border-amber-500/20 transition-all">

              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-xl overflow-hidden border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-black shrink-0 shadow-sm">
                  {product.images?.at(0) ? (
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-900">
                      <ImageIcon className="text-zinc-400 dark:text-zinc-700" size={24} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-black text-sm text-zinc-900 dark:text-zinc-100 uppercase truncate">{product.name}</div>
                  <div className="text-[9px] text-zinc-500 font-mono mt-1 uppercase tracking-widest">{product.category?.name || "UNCLASSIFIED"}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="text-xs font-black text-emerald-400 font-mono">{formatIDR(product.price)}</div>
                    {product.original_price && product.original_price > product.price && (
                      <div className="text-[9px] text-rose-500/60 line-through font-mono">{formatIDR(product.original_price)}</div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="text-[8px] font-black uppercase text-zinc-500 tracking-widest">Publish</div>
                  <PublishToggle 
                    isPublished={!!product.isPublished} 
                    onToggle={() => onTogglePublish?.(product.id, !product.isPublished)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-900">
                <div className={cn(
                  "px-3 py-1 rounded-lg text-[9px] font-black font-mono border",
                  isOutOfStock ? "text-rose-500 border-rose-500/20" : "text-emerald-400 border-emerald-400/20"
                )}>
                  {isOutOfStock ? "STOK HABIS" : `${product.stock} TERSEDIA`}
                </div>
                <div className="flex gap-2">
                  <a
                    href={`/products/${product.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 rounded-xl hover:text-amber-600 dark:hover:text-amber-400 transition-all border border-zinc-200 dark:border-zinc-800 min-h-[44px] min-w-[44px] flex items-center justify-center shadow-sm"
                  >
                    <ExternalLink size={18} />
                  </a>
                  <button 
                    onClick={() => onEdit(product)}
                    className="p-3 bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 rounded-xl hover:text-amber-600 dark:hover:text-amber-400 transition-all border border-zinc-200 dark:border-zinc-800 min-h-[44px] min-w-[44px] flex items-center justify-center shadow-sm"
                  >
                    <Pencil size={18} />
                  </button>
                  <button 
                    onClick={() => onDelete(product.id)}
                    className="p-3 bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-500 transition-all border border-zinc-200 dark:border-zinc-800 min-h-[44px] min-w-[44px] flex items-center justify-center shadow-sm"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        
        {products.length === 0 && !isLoading && (
          <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 p-12 rounded-2xl text-center space-y-4 shadow-sm">
             <Package className="text-zinc-400 dark:text-zinc-700 mx-auto" size={40} />
             <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Tidak ada produk aktif ditemukan</p>
          </div>
        )}
      </div>

      {/* PAGINATION CONTROLS */}
      {metadata.totalPages > 1 && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 px-2">
          <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
            Menampilkan <span className="text-amber-500">{startRange}</span> sampai <span className="text-amber-500">{endRange}</span> dari <span className="text-zinc-600 dark:text-zinc-300">{metadata.total}</span> produk
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(metadata.page - 1)}
              disabled={metadata.page <= 1}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 text-zinc-500 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-500 hover:border-amber-500/50 disabled:opacity-30 disabled:hover:text-zinc-500 dark:disabled:hover:text-zinc-400 disabled:hover:border-zinc-200 dark:disabled:hover:border-zinc-900 transition-all text-[10px] font-black uppercase tracking-widest shadow-sm"
            >
              <ChevronLeft size={14} />
              SEBELUMNYA
            </button>

            <div className="flex items-center gap-1 px-3">
              {Array.from({ length: metadata.totalPages }).map((_, i) => {
                const pageNum = i + 1;
                // Only show a limited number of page buttons if there are too many
                if (
                  metadata.totalPages > 5 &&
                  pageNum !== 1 &&
                  pageNum !== metadata.totalPages &&
                  Math.abs(pageNum - metadata.page) > 1
                ) {
                  if (pageNum === 2 || pageNum === metadata.totalPages - 1) {
                    return <span key={pageNum} className="text-zinc-700">...</span>;
                  }
                  return null;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={cn(
                      "w-8 h-8 rounded-lg text-[10px] font-black transition-all flex items-center justify-center border",
                      metadata.page === pageNum
                        ? "bg-amber-500 text-zinc-950 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                        : "bg-white dark:bg-zinc-950 text-zinc-500 border-zinc-200 dark:border-zinc-900 hover:border-zinc-400 dark:hover:border-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-300 shadow-sm"
                    )}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => handlePageChange(metadata.page + 1)}
              disabled={metadata.page >= metadata.totalPages}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 text-zinc-500 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-500 hover:border-amber-500/50 disabled:opacity-30 disabled:hover:text-zinc-500 dark:disabled:hover:text-zinc-400 disabled:hover:border-zinc-200 dark:disabled:hover:border-zinc-900 transition-all text-[10px] font-black uppercase tracking-widest shadow-sm"
            >
              SELANJUTNYA
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

