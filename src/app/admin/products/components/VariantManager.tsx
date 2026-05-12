import { Plus, Trash2, Package, Tag, Hash, Zap, Check } from "lucide-react";
import React, { useState } from "react";
import { VariantInput } from "../actions";
import { CategorySelect } from "../../categories/actions";
import { formatInputIDR } from "@/lib/currency";

interface VariantManagerProps {
  readonly variants: VariantInput[];
  readonly categoryId: string;
  readonly categories: CategorySelect[];
  readonly updateVariant: (index: number, data: Partial<VariantInput>) => void;
  readonly removeVariant: (index: number) => void;
  readonly addVariant: () => void;
  readonly bulkAddVariants: (input: string) => void;
}

export function VariantManager({
  variants,
  categoryId,
  categories,
  updateVariant,
  removeVariant,
  addVariant,
  bulkAddVariants,
}: Readonly<VariantManagerProps>) {
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkInput, setBulkInput] = useState("");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center border border-amber-200">
            <Package size={16} className="text-amber-600" />
          </div>
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-950">Inventory Matrix</h3>
            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-tighter">Terminal V1.0 - Active Node</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsBulkMode(!isBulkMode)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-[10px] font-black uppercase tracking-widest border ${
              isBulkMode 
                ? "bg-zinc-950 text-white border-zinc-950 shadow-lg" 
                : "bg-white text-zinc-600 border-zinc-200 hover:border-amber-500 hover:text-amber-600"
            }`}
          >
            <Zap size={14} className={isBulkMode ? "text-amber-400 fill-amber-400" : ""} />
            BULK GENERATOR
          </button>
          <button
            type="button"
            onClick={addVariant}
            className="flex items-center gap-2 px-3 py-1.5 bg-amber-500 text-zinc-950 rounded-lg hover:bg-amber-600 transition-all text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/20 active:scale-95 border border-amber-600"
          >
            <Plus size={14} />
            Tambah Varian
          </button>
        </div>
      </div>

      {isBulkMode && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-amber-900 uppercase tracking-widest flex items-center gap-2">
                <Zap size={12} /> Mode Generator Cepat
              </span>
              <p className="text-[9px] font-bold text-amber-700 uppercase italic">Tips: Gunakan "40-47" atau "S, M, L, XL"</p>
            </div>
            <div className="flex gap-2">
              <input 
                type="text"
                autoFocus
                placeholder="Masukkan ukuran/label (pisahkan dengan koma atau gunakan rentang '-')"
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    bulkAddVariants(bulkInput);
                    setBulkInput("");
                    setIsBulkMode(false);
                  }
                }}
                className="flex-1 px-4 py-3 bg-white border-2 border-amber-200 rounded-xl text-xs font-bold text-zinc-950 focus:border-amber-500 outline-none placeholder:text-zinc-400 shadow-inner"
              />
              <button
                type="button"
                onClick={() => {
                  bulkAddVariants(bulkInput);
                  setBulkInput("");
                  setIsBulkMode(false);
                }}
                className="px-6 bg-zinc-950 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all flex items-center gap-2 shadow-xl shadow-zinc-950/20"
              >
                <Check size={14} /> GENERATE
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {variants.length === 0 ? (
          <div className="border-2 border-dashed border-zinc-200 rounded-2xl p-8 text-center bg-zinc-50">
            <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Package className="text-zinc-400" size={24} />
            </div>
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Tidak ada varian aktif</p>
            <p className="text-[9px] font-bold text-zinc-400 uppercase mt-1">Tambahkan varian untuk stok berlipat</p>
          </div>
        ) : (
          variants.map((variant, index) => (
            <div 
              key={variant.id || `v-${index}`} 
              className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm hover:border-amber-500 transition-all group/v relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                {/* Variant Display Name */}
                <div className="md:col-span-4 space-y-1.5">
                  <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1">
                    <Tag size={10} className="text-amber-600" /> Label Ukuran
                  </label>
                  <input
                    type="text"
                    value={variant.name}
                    onChange={(e) => updateVariant(index, { name: e.target.value })}
                    placeholder="Contoh: 42, XL, atau M"
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-white text-xs font-bold text-zinc-950 focus:border-amber-500 outline-none transition-all shadow-inner"
                  />
                </div>

                {/* SKU Override */}
                <div className="md:col-span-3 space-y-1.5">
                  <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1">
                    <Hash size={10} className="text-zinc-400" /> SKU
                  </label>
                  <input
                    type="text"
                    value={variant.sku || ""}
                    onChange={(e) => updateVariant(index, { sku: e.target.value })}
                    placeholder="AUTO-GEN"
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-zinc-50 text-[10px] font-mono font-bold text-zinc-500 focus:border-amber-500 outline-none transition-all uppercase"
                  />
                </div>

                {/* Stock & Pricing */}
                <div className="md:col-span-4 grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <label htmlFor={`stock-${index}`} className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-1.5">
                      STOK (QTY)
                    </label>
                    <input
                      id={`stock-${index}`}
                      type="number"
                      value={variant.stock}
                      onChange={(e) => updateVariant(index, { stock: Number.parseInt(e.target.value, 10) || 0 })}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-white text-xs font-mono font-black text-zinc-950 focus:border-amber-500 outline-none transition-all shadow-inner"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor={`price-${index}`} className="text-[9px] font-black text-emerald-600 uppercase tracking-widest block mb-1.5">
                      HARGA SPESIFIK
                    </label>
                    <input
                      id={`price-${index}`}
                      type="text"
                      value={variant.price ? formatInputIDR(variant.price.toString()) : ""}
                      onChange={(e) => {
                        const val = e.target.value.replaceAll(".", "");
                        updateVariant(index, { price: val ? Number.parseInt(val, 10) : null });
                      }}
                      placeholder="BASE"
                      className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-white text-xs font-mono font-black text-emerald-700 focus:border-emerald-600 outline-none transition-all placeholder:text-zinc-300 shadow-inner"
                    />
                  </div>
                </div>

                {/* Remove Button */}
                <div className="md:col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeVariant(index)}
                    className="p-2 text-zinc-300 hover:text-rose-600 transition-colors group-hover/v:text-zinc-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
