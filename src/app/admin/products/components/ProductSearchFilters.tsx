import { Search, Filter, Plus } from "lucide-react";
import { CategorySelect } from "../../categories/actions";

interface ProductSearchFiltersProps {
  readonly searchQuery: string;
  readonly setSearchQuery: (query: string) => void;
  readonly selectedCategory: string;
  readonly setSelectedCategory: (category: string) => void;
  readonly categories: CategorySelect[];
  readonly onAddClick: () => void;
}

export function ProductSearchFilters({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  categories,
  onAddClick,
}: ProductSearchFiltersProps) {
  return (
    <div className="bg-white dark:bg-zinc-900/40 backdrop-blur-xl p-3 rounded-2xl border border-zinc-200 dark:border-amber-500/10 flex flex-wrap gap-3 items-center shadow-lg dark:shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
      <div className="relative grow min-w-[280px]">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-600" size={14} />
        <input 
          type="text" 
          placeholder="CARI KELAS ASET ATAU ID SERI..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/5 outline-none transition-all text-zinc-900 dark:text-white text-[10px] font-black placeholder:text-zinc-400 dark:placeholder:text-zinc-800 uppercase tracking-widest"
        />
      </div>
      <div className="flex items-center gap-2 grow sm:grow-0">
        <div className="relative w-full sm:w-48">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-600" size={14} />
          <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-amber-500 outline-none text-zinc-600 dark:text-zinc-400 text-[10px] font-black transition-all cursor-pointer appearance-none hover:bg-zinc-100 dark:hover:bg-zinc-800 uppercase tracking-widest"
          >
            <option value="all">SEMUA SEKTOR</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>
            ))}
          </select>
        </div>
      </div>
      <button 
        onClick={onAddClick}
        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-amber-500 text-zinc-950 px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-amber-600 transition-all active:scale-95 shadow-[0_0_30px_rgba(245,158,11,0.15)] border border-amber-400/50"
      >
        <Plus size={16} />
        TAMBAH PRODUK
      </button>
    </div>
  );
}
