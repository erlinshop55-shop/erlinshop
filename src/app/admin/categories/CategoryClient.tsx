"use client";

import { useState, type SyntheticEvent } from "react";
import { Plus, Pencil, Trash2, Loader2, ImageIcon } from "lucide-react";
import { CategorySelect, addCategory, updateCategory, deleteCategory } from "./actions";
import { Modal } from "@/components/ui/Modal";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import { toast } from "sonner";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CategoryClientProps {
  readonly initialData: CategorySelect[];
}

export default function CategoryClient({ initialData }: CategoryClientProps) {
  const [categories, setCategories] = useState<CategorySelect[]>(initialData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategorySelect | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    image: "",
    order: 0,
    parentId: ""
  });

  const openModal = (category: CategorySelect | null = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        slug: category.slug,
        image: category.image || "",
        order: category.order || 0,
        parentId: category.parentId || ""
      });
    } else {
      setEditingCategory(null);
      setFormData({ name: "", slug: "", image: "", order: categories.length + 1, parentId: "" });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const finalData = {
        ...formData,
        parentId: formData.parentId || null
      };

      if (editingCategory) {
        const res = await updateCategory(editingCategory.id, finalData);
        if (res.success && res.data) {
          setCategories(prev => prev.map(c => c.id === editingCategory.id ? res.data! : c));
          toast.success("Sektor berhasil diperbarui");
          closeModal();
        } else {
          toast.error(res.error || "Gagal memperbarui kategori");
        }
      } else {
        const res = await addCategory(finalData as any);
        if (res.success && res.data) {
          setCategories(prev => [...prev, res.data!].sort((a, b) => (a.order || 0) - (b.order || 0)));
          toast.success("Sektor baru terdaftar");
          closeModal();
        } else {
          toast.error(res.error || "Gagal menambahkan kategori");
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan tak terduga");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!globalThis.confirm("Anda yakin ingin menghapus kategori ini?")) return;
    
    setIsLoading(true);
    try {
      const res = await deleteCategory(id);
      if (res.success) {
        setCategories(prev => prev.filter(c => c.id !== id));
        toast.success("Sektor berhasil dihapus");
      } else {
        toast.error(res.error || "Gagal menghapus kategori");
      }
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan tak terduga");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-xl rounded-3xl shadow-xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-zinc-200 dark:border-amber-500/10 overflow-hidden">
      <div className="p-6 border-b border-zinc-100 dark:border-zinc-900/50 flex flex-wrap gap-4 justify-between items-center bg-zinc-50 dark:bg-black/40">
        <h2 className="text-xl font-black tracking-tighter uppercase bg-linear-to-r from-amber-600 to-amber-500 dark:from-amber-200 dark:to-amber-500 bg-clip-text text-transparent">Kategori / ID Sektor</h2>
        <button 
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-amber-500 text-zinc-950 px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-amber-600 transition-all active:scale-95 shadow-lg shadow-amber-500/20 border border-amber-400/50"
        >
          <Plus size={16} />
          Daftarkan Sektor Baru
        </button>
      </div>

      <div className="space-y-4">
        {/* DESKTOP VIEW */}
        <div className="hidden md:block overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800 scrollbar-track-transparent">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-zinc-100/50 dark:bg-black/20 text-zinc-500 text-[10px] uppercase tracking-[0.3em] border-b border-zinc-200 dark:border-zinc-900/50">
                <th className="px-6 py-6 font-black text-zinc-400 dark:text-zinc-500">
                  <div className="flex items-center gap-2">
                    <ImageIcon size={12} className="text-amber-500" />
                    Aset Visual
                  </div>
                </th>
                <th className="px-6 py-6 font-black text-zinc-400 dark:text-zinc-500">Nama Sektor</th>
                <th className="px-6 py-6 font-black text-zinc-400 dark:text-zinc-500">Slug Rute</th>
                <th className="px-6 py-6 font-black text-zinc-400 dark:text-zinc-500 text-center">Indeks Prioritas</th>
                <th className="px-6 py-6 font-black text-zinc-400 dark:text-zinc-500 text-right">Eksekusi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900/30">
              {categories.map((category) => (
                <tr key={category.id} className="hover:bg-amber-500/5 transition-all group border-l-2 border-l-transparent hover:border-l-amber-500">
                  <td className="px-6 py-5">
                    <div className="w-12 h-12 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-black flex items-center justify-center group-hover:border-amber-500/40 transition-all">
                      {category.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={category.image} alt={category.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      ) : (
                        <ImageIcon className="text-zinc-300 dark:text-zinc-700" size={24} />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5 font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">{category.name}</td>
                  <td className="px-6 py-5 text-zinc-400 dark:text-zinc-500 font-mono text-[10px] uppercase tracking-wider opacity-60">{category.slug}</td>
                  <td className="px-6 py-5 text-center">
                    <span className="bg-zinc-100 dark:bg-zinc-900 text-amber-600 dark:text-amber-500 px-2 py-1 rounded text-[10px] font-mono font-black border border-zinc-200 dark:border-amber-500/20 shadow-sm dark:shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                      {category.order}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end gap-1 md:opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                      <button 
                        onClick={() => openModal(category)}
                        className="p-2.5 text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-500/10 rounded-xl transition-all border border-transparent hover:border-amber-500/20"
                        title="Ubah Sektor"
                      >
                        <Pencil size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(category.id)}
                        className="p-2.5 text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all border border-transparent hover:border-rose-500/20"
                        title="Hapus Sektor"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-400">
                    Tidak ada kategori ditemukan. Klik "Daftarkan Sektor Baru" untuk membuat baru.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* MOBILE VIEW */}
        <div className="grid grid-cols-1 gap-4 md:hidden px-4 pb-4">
          {categories.map((category) => (
            <div key={category.id} className="bg-white dark:bg-zinc-900 backdrop-blur-md border border-zinc-200 dark:border-zinc-800/80 p-4 rounded-3xl flex items-center gap-4 shadow-lg">

              <div className="w-14 h-14 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-black shrink-0 flex items-center justify-center">
                {category.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="text-zinc-400 dark:text-zinc-300" size={20} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-black text-zinc-900 dark:text-zinc-100 uppercase text-xs truncate tracking-tight">{category.name}</div>
                <div className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono mt-1 opacity-60 tracking-wider uppercase">{category.slug}</div>
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={() => openModal(category)}
                  className="p-3 bg-zinc-100 dark:bg-zinc-900 text-zinc-500 rounded-xl hover:text-amber-600 dark:hover:text-amber-400 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center border border-zinc-200 dark:border-zinc-800"
                >
                  <Pencil size={16} />
                </button>
                <button 
                  onClick={() => handleDelete(category.id)}
                  className="p-3 bg-zinc-100 dark:bg-zinc-900 text-zinc-500 rounded-xl hover:text-rose-500 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center border border-zinc-200 dark:border-zinc-800"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          
          {categories.length === 0 && (
            <div className="bg-zinc-50 dark:bg-zinc-900/20 border-2 border-dashed border-zinc-200 dark:border-zinc-800 p-12 rounded-2xl text-center text-zinc-400 text-xs uppercase font-black tracking-widest">
              Tidak ada kategori terdeteksi
            </div>
          )}
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        title={editingCategory ? "Ubah Kategori" : "Tambah Kategori Baru"}
      >
        <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl">
          <div className="space-y-2">
            <label htmlFor="category-name" className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 dark:text-amber-500/60 block">
              Nama Sektor / Kategori
            </label>
            <input 
              id="category-name"
              type="text" 
              required
              placeholder="Contoh: Kaos"
              value={formData.name}
              onChange={(e) => {
                const name = e.target.value;
                const slug = name
                  .toLowerCase()
                  .replaceAll(" ", "-")
                  .replaceAll(/[^\w-]+/g, "")
                  .replaceAll(/-+/g, "-");
                setFormData(prev => ({ ...prev, name, slug }));
              }}
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-black focus:border-amber-500 outline-none transition-all text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-300 dark:placeholder:text-zinc-800 font-bold"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="category-slug" className="text-xs font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-600">Slug</label>
            <input 
              id="category-slug"
              type="text" 
              required
              readOnly
              value={formData.slug}
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950 text-zinc-400 dark:text-zinc-600 outline-none cursor-not-allowed font-mono text-xs tracking-wider font-bold"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="category-order" className="text-xs font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-600">Urutan Tampilan</label>
            <input 
              id="category-order"
              type="number" 
              required
              value={formData.order}
              onChange={(e) => setFormData(prev => ({ ...prev, order: Number.parseInt(e.target.value, 10) }))}
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-black focus:border-amber-500 outline-none transition-all text-zinc-900 dark:text-zinc-100 font-mono font-bold shadow-inner"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="category-parent" className="text-xs font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-600">Sektor Induk (Opsional)</label>
            <select
              id="category-parent"
              value={formData.parentId}
              onChange={(e) => setFormData(prev => ({ ...prev, parentId: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-black focus:border-amber-500 outline-none transition-all text-zinc-900 dark:text-zinc-100 font-bold appearance-none cursor-pointer"
            >
              <option value="" className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">-- Tanpa Induk (Sektor Akar) --</option>
              {categories
                .filter(c => c.id !== editingCategory?.id) // Prevent self-reference
                .map(c => (
                  <option key={c.id} value={c.id} className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">{c.name}</option>
                ))}
            </select>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-600 block">Gambar Kategori</span>
            <div className="mt-1 bg-zinc-50 dark:bg-black/40 rounded-2xl border border-zinc-100 dark:border-amber-500/5 p-4 shadow-inner">
              <ImageUpload 
                onUpload={(url) => setFormData(prev => ({ ...prev, image: url }))} 
                onRemove={() => setFormData(prev => ({ ...prev, image: "" }))}
                defaultImages={formData.image ? [formData.image] : []}
              />
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="button" 
              onClick={closeModal}
              className="flex-1 px-4 py-3 rounded-xl border border-zinc-200 text-zinc-400 font-black hover:bg-zinc-50 transition-all uppercase tracking-widest text-[10px]"
            >
              Batal
            </button>
            <button 
              type="submit" 
              disabled={isLoading}
              className="flex-1 px-4 py-3 rounded-xl bg-amber-500 text-zinc-950 font-black text-[10px] uppercase tracking-widest hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl shadow-amber-500/10 border border-amber-600/20"
            >
              {isLoading && <Loader2 size={18} className="animate-spin" />}
              {editingCategory ? "Simpan Perubahan" : "Daftarkan Sektor"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

