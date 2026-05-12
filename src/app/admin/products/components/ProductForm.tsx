import React, { type SyntheticEvent, useState } from "react";
import { Plus, Loader2, Sparkles, Box } from "lucide-react";
import { BatchImageUpload } from "@/components/ui/BatchImageUpload";
import { CategorySelect } from "../../categories/actions";
import { formatInputIDR } from "@/lib/currency";
import { VariantManager } from "./VariantManager";
import { VariantInput } from "../actions";

interface ProductFormProps {
  readonly formData: {
    name: string;
    categoryId: string;
    description: string;
    price: string;
    original_price: string;
    stock: number;
    images: string[];
    specs: Record<string, string>;
    isNew: boolean;
    isFeatured: boolean;
    brand: string;
    genderTarget: 'Men' | 'Women' | 'Kids' | 'Unisex';
    isPublished: boolean;
    variants: VariantInput[];
  };
  readonly setFormData: React.Dispatch<React.SetStateAction<import("../hooks/useProductForm").ProductFormData>>;
  readonly categories: CategorySelect[];
  readonly isLoading: boolean;
  readonly editingProduct: boolean;
  readonly handleCategoryChange: (val: string) => void;
  readonly handleSubmit: (e: SyntheticEvent<HTMLFormElement>) => void;
  readonly onCancel: () => void;
  readonly addVariant: () => void;
  readonly bulkAddVariants: (input: string) => void;
  readonly removeVariant: (index: number) => void;
  readonly updateVariant: (index: number, data: Partial<VariantInput>) => void;
  readonly generateAIDescription: () => Promise<void>;
  readonly isAiLoading: boolean;
  readonly selectAiSuggestion: (text: string) => void;
  readonly aiSuggestions: string[];
}

export function ProductForm({
  formData,
  setFormData,
  categories,
  isLoading,
  editingProduct,
  handleCategoryChange,
  handleSubmit,
  generateAIDescription,
  isAiLoading,
  onCancel,
  addVariant,
  bulkAddVariants,
  removeVariant,
  updateVariant,
  selectAiSuggestion,
  aiSuggestions,
}: Readonly<ProductFormProps>) {
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const hasVariants = formData.variants.length > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-2xl shadow-sm border border-amber-200">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Brand & Gender Target */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-zinc-50 rounded-2xl border border-amber-100">
            <div className="space-y-2">
              <label htmlFor="product-brand" className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                Nama Merek
              </label>
              <input
                id="product-brand"
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData((prev) => ({ ...prev, brand: e.target.value }))}
                className="w-full h-12 px-4 bg-white border-2 border-zinc-200 focus:border-amber-500 rounded-xl text-sm font-bold transition-all outline-none text-zinc-950 placeholder:text-zinc-400"
                placeholder="Contoh: Zalora Basic, Adidas"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="product-gender" className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                Target Gender
              </label>
              <select
                id="product-gender"
                value={formData.genderTarget}
                onChange={(e) => setFormData((prev) => ({ ...prev, genderTarget: e.target.value as any }))}
                className="w-full h-12 px-4 bg-white border-2 border-zinc-200 focus:border-amber-500 rounded-xl text-sm font-bold transition-all outline-none appearance-none text-zinc-950"
              >
                <option value="Unisex">Unisex (Semua)</option>
                <option value="Men">Pria</option>
                <option value="Women">Wanita</option>
                <option value="Kids">Anak-anak</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="product-name" className="text-xs font-black uppercase tracking-widest text-zinc-950">Nama Produk</label>
            <input 
              id="product-name"
              type="text" 
              required
              placeholder="Contoh: Kemeja Flanel Premium"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/5 outline-none transition-all text-zinc-950 placeholder:text-zinc-400 font-bold"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="product-category" className="text-xs font-black uppercase tracking-widest text-zinc-950">Kategori</label>
            <div className="relative">
              <select 
                id="product-category"
                required
                value={formData.categoryId}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-white focus:border-amber-500 outline-none text-zinc-950 appearance-none cursor-pointer font-bold pr-10"
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id} className="bg-white text-zinc-950">{c.name}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                <Plus size={14} className="rotate-45" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="product-price" className="text-xs font-black uppercase tracking-widest text-zinc-950">Harga Dasar (IDR)</label>
              <div className="relative">
                <input 
                  id="product-price"
                  type="text" 
                  required
                  value={formData.price}
                  onChange={(e) => setFormData((prev) => ({ ...prev, price: formatInputIDR(e.target.value) }))}
                  className="w-full pl-4 pr-12 py-3 rounded-xl border border-zinc-200 bg-white focus:border-emerald-600 outline-none text-emerald-700 font-mono font-bold"
                  placeholder="0"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-zinc-400 bg-zinc-50 px-1.5 py-0.5 rounded">IDR</span>
              </div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">
                Harga acuan untuk katalog. Harga akhir akan menggunakan harga dari tiap varian.
              </p>
            </div>
            <div className="space-y-2">
              <label htmlFor="product-original-price" className="text-xs font-black uppercase tracking-widest text-zinc-950">Harga Asli (Coret)</label>
              <div className="relative">
                <input 
                  id="product-original-price"
                  type="text" 
                  value={formData.original_price}
                  onChange={(e) => setFormData((prev) => ({ ...prev, original_price: formatInputIDR(e.target.value) }))}
                  className="w-full pl-4 pr-12 py-3 rounded-xl border border-zinc-200 bg-white focus:border-rose-500 outline-none text-rose-500 font-mono font-bold"
                  placeholder="0"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-zinc-400">IDR</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="product-stock" className="text-xs font-black uppercase tracking-widest text-zinc-950 flex items-center gap-2">
              Total Inventaris
              {hasVariants && (
                <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[8px] border border-amber-200">TURUNAN</span>
              )}
            </label>
            <div className="relative">
              <input 
                id="product-stock"
                type="number" 
                required
                disabled={hasVariants}
                value={formData.stock}
                onChange={(e) => setFormData((prev) => ({ ...prev, stock: Number.parseInt(e.target.value, 10) || 0 }))}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-white focus:border-amber-500 outline-none text-zinc-950 font-mono font-bold disabled:bg-zinc-50 disabled:text-zinc-500"
              />
              {hasVariants && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-600 animate-pulse-slow">
                  <Box size={14} />
                </div>
              )}
            </div>
          </div>

          {/* Visibility Toggles Section */}
          <div className="p-4 bg-zinc-50 rounded-2xl border border-amber-100 space-y-4 shadow-inner">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-950">Status & Visibilitas</span>
              <span className="text-[9px] text-zinc-500 uppercase">Atur penanda produk dan visibilitas di etalase</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex-1 flex items-center gap-2 cursor-pointer group bg-white border border-zinc-200 px-3 py-3 rounded-xl hover:border-amber-500 transition-colors shadow-sm">
                <input 
                  type="checkbox"
                  checked={formData.isNew}
                  onChange={(e) => setFormData((prev) => ({ ...prev, isNew: e.target.checked }))}
                  className="w-4 h-4 rounded border-zinc-300 bg-white text-amber-500 focus:ring-amber-500/20 cursor-pointer"
                />
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600 group-hover:text-zinc-950 transition-colors">Baru</span>
              </label>
              <label className="flex-1 flex items-center gap-2 cursor-pointer group bg-white border border-zinc-200 px-3 py-3 rounded-xl hover:border-amber-500 transition-colors shadow-sm">
                <input 
                  type="checkbox"
                  checked={formData.isFeatured}
                  onChange={(e) => setFormData((prev) => ({ ...prev, isFeatured: e.target.checked }))}
                  className="w-4 h-4 rounded border-zinc-300 bg-white text-amber-500 focus:ring-amber-500/20 cursor-pointer"
                />
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600 group-hover:text-zinc-950 transition-colors">Hot</span>
              </label>
              <label className="flex-1 flex items-center gap-2 cursor-pointer group bg-white border border-zinc-200 px-3 py-3 rounded-xl hover:border-emerald-500 transition-colors shadow-sm">
                <input 
                  type="checkbox"
                  checked={formData.isPublished}
                  onChange={(e) => setFormData((prev) => ({ ...prev, isPublished: e.target.checked }))}
                  className="w-4 h-4 rounded border-zinc-300 bg-white text-emerald-500 focus:ring-emerald-500/20 cursor-pointer"
                />
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600 group-hover:text-zinc-950 transition-colors">Aktif</span>
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="product-description" className="text-xs font-black uppercase tracking-widest text-zinc-950">Deskripsi</label>
                <button
                  type="button"
                  onClick={generateAIDescription}
                  disabled={isAiLoading || !formData.name}
                  className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-amber-600 hover:text-amber-700 disabled:opacity-50 transition-colors bg-amber-50 px-2 py-1 rounded-lg border border-amber-200 shadow-sm active:scale-95"
                >
                  {isAiLoading ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Sparkles size={12} />
                  )}
                  {isAiLoading ? "Sedang Berpikir..." : "Saran AI (3 Opsi)"}
                </button>
              </div>
              <textarea 
                id="product-description"
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-white focus:border-amber-500 outline-none resize-none text-zinc-950 placeholder:text-zinc-400 leading-relaxed font-bold shadow-inner"
                placeholder="Ceritakan lebih banyak tentang produk..."
              />
            </div>

            {/* AI Suggestions Panels */}
            {aiSuggestions.length > 0 && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-4 duration-500">
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 flex items-center gap-2">
                  <Sparkles size={12} />
                  Pilih salah satu saran AI di bawah ini:
                </p>
                <div className="grid grid-cols-1 gap-3">
                  {aiSuggestions.map((text, idx) => (
                    <button
                      key={`${idx}-${text.substring(0, 10)}`}
                      type="button"
                      onClick={() => selectAiSuggestion(text)}
                      className="text-left p-4 rounded-xl border border-amber-100 bg-amber-50/30 hover:bg-amber-50 hover:border-amber-300 transition-all group relative overflow-hidden"
                    >
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Plus size={14} className="text-amber-500" />
                      </div>
                      <span className="text-[10px] font-black text-amber-500 uppercase mb-1 block">Opsi {idx + 1}</span>
                      <p className="text-xs text-zinc-700 leading-relaxed italic line-clamp-3">
                        "{text}"
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-black uppercase tracking-widest text-zinc-950 block">Media Katalog</span>
            <div className="bg-zinc-50 rounded-3xl border border-amber-100 p-6 shadow-inner">
              <BatchImageUpload 
                existingImages={formData.images}
                onAllUploadsComplete={(urls) => setFormData((prev) => ({ ...prev, images: [...prev.images, ...urls] }))}
                onRemoveExisting={(idx) => setFormData((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }))}
                onStatusChange={(status) => setIsUploadingImages(status === 'uploading')}
                maxFiles={10}
              />
            </div>
          </div>

          <div className="space-y-6">
            <VariantManager 
              variants={formData.variants}
              categoryId={formData.categoryId}
              categories={categories}
              updateVariant={updateVariant}
              removeVariant={removeVariant}
              addVariant={addVariant}
              bulkAddVariants={bulkAddVariants}
            />
            
            <div className="space-y-2">
              <span className="text-xs font-black uppercase tracking-widest text-zinc-950 block">Spesifikasi Produk</span>
              <div className="bg-zinc-50 p-6 rounded-2xl border border-amber-100 space-y-4 shadow-inner">
                {Object.keys(formData.specs).length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Object.entries(formData.specs).map(([key, value]) => (
                      <div key={key} className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block">
                          {key}
                        </label>
                        <input 
                          type="text" 
                          placeholder={`Enter ${key}...`}
                          value={value}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            specs: { ...prev.specs, [key]: e.target.value }
                          }))}
                          className="w-full px-4 py-2.5 text-sm rounded-xl border border-zinc-200 bg-white outline-none text-zinc-950 placeholder:text-zinc-400 focus:border-amber-500 transition-all font-bold"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">
                      Tidak ada atribut dinamis untuk kategori ini
                    </p>
                    <p className="text-[9px] text-zinc-500 mt-1 uppercase">
                      Pilih kategori dengan cetak biru untuk membuka spek
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-8 mt-4 border-t border-zinc-100 flex gap-4">
        <button 
          type="button" 
          onClick={onCancel}
          className="flex-1 px-6 py-4 rounded-xl border border-zinc-200 text-zinc-500 font-black hover:bg-zinc-50 hover:text-zinc-950 transition-all uppercase tracking-widest text-xs shadow-sm"
        >
          Batal
        </button>
        <button 
          type="submit" 
          disabled={isLoading || isUploadingImages}
          className="flex-1 px-6 py-4 rounded-xl bg-amber-500 text-zinc-950 font-black hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl shadow-amber-500/20 uppercase tracking-widest text-xs border border-amber-600/20"
        >
          {isLoading || isUploadingImages ? (
            <Loader2 size={18} className="animate-spin" />
          ) : null}
          {isUploadingImages 
            ? "Menunggu Unggahan..." 
            : editingProduct ? "Simpan Perubahan" : "Daftarkan Produk"
          }
        </button>
      </div>
    </form>
  );
}

