import { getDashboardStats } from "./stats-actions";
import { Package, Layers, TrendingUp, ShoppingBag } from "lucide-react";

export default async function AdminDashboard() {
  const statsRes = await getDashboardStats();
  const stats = statsRes.success ? statsRes.data : { totalProducts: 0, totalCategories: 0 };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="pb-6 border-b border-zinc-200 dark:border-zinc-800">
        <h1 className="text-4xl font-black bg-linear-to-br from-[#B28D27] via-[#D4AF37] to-[#F9D976] bg-clip-text text-transparent tracking-tighter uppercase leading-none">
          Admin Dashboard
        </h1>
        <p className="bg-linear-to-r from-[#B28D27] to-[#F9D976] bg-clip-text text-transparent font-black uppercase tracking-[0.3em] text-[10px] mt-2">
          Real-time performance metrics & luxury inventory analytics.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Products */}
        <div className="bg-white dark:bg-zinc-900 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800/80 p-6 rounded-3xl group hover:border-amber-500/50 transition-all duration-300 shadow-xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <div className="flex items-start justify-between">
            <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl group-hover:bg-amber-500 transition-colors">
              <Package className="w-6 h-6 text-zinc-500 dark:text-zinc-400 group-hover:text-black dark:group-hover:text-black" />
            </div>
            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-400/10 px-2 py-1 rounded-full">+12%</span>
          </div>
          <div className="mt-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Total Produk</p>
            <h3 className="text-4xl font-black tracking-tighter mt-1 font-mono text-zinc-900 dark:text-white">{stats?.totalProducts || 0}</h3>
          </div>
        </div>

        {/* Total Categories */}
        <div className="bg-white dark:bg-zinc-900 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800/80 p-6 rounded-3xl group hover:border-amber-500/50 transition-all duration-300 shadow-xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <div className="flex items-start justify-between">
            <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl group-hover:bg-amber-500 transition-colors">
              <Layers className="w-6 h-6 text-zinc-500 dark:text-zinc-400 group-hover:text-black dark:group-hover:text-black" />
            </div>
            <span className="text-[10px] font-black text-zinc-500 dark:text-zinc-600 bg-zinc-100 dark:bg-zinc-900 px-2 py-1 rounded-full uppercase tracking-widest">Statis</span>
          </div>
          <div className="mt-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Kategori</p>
            <h3 className="text-4xl font-black tracking-tighter mt-1 font-mono text-zinc-900 dark:text-white">{stats?.totalCategories || 0}</h3>
          </div>
        </div>

        {/* Placeholder for Sales (Future) */}
        <div className="bg-zinc-100/50 dark:bg-zinc-900/20 border border-zinc-200 dark:border-zinc-900 p-6 rounded-3xl opacity-30 grayscale cursor-not-allowed">
          <div className="flex items-start justify-between">
            <div className="p-3 bg-zinc-200 dark:bg-zinc-900 rounded-2xl">
              <TrendingUp className="w-6 h-6 text-zinc-400 dark:text-zinc-600" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-600">Total Penjualan</p>
            <h3 className="text-4xl font-black tracking-tighter mt-1 font-mono text-zinc-400 dark:text-zinc-700">Rp 0</h3>
          </div>
        </div>

        {/* Placeholder for Orders (Future) */}
        <div className="bg-zinc-100/50 dark:bg-zinc-900/20 border border-zinc-200 dark:border-zinc-900 p-6 rounded-3xl opacity-30 grayscale cursor-not-allowed">
          <div className="flex items-start justify-between">
            <div className="p-3 bg-zinc-200 dark:bg-zinc-900 rounded-2xl">
              <ShoppingBag className="w-6 h-6 text-zinc-400 dark:text-zinc-600" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-600">Pesanan Aktif</p>
            <h3 className="text-4xl font-black tracking-tighter mt-1 font-mono text-zinc-400 dark:text-zinc-700">0</h3>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800/80 p-8 rounded-[40px] relative overflow-hidden group shadow-xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 dark:bg-amber-500/5 blur-[100px] -mr-32 -mt-32 transition-all group-hover:bg-amber-500/10" />
        <div className="relative z-10">
          <h2 className="text-xl font-black uppercase tracking-tighter text-zinc-900 dark:text-white">Selamat Datang Kembali, Admin</h2>
          <p className="text-zinc-500 dark:text-zinc-500 text-sm mt-2 max-w-md font-medium uppercase tracking-widest text-[10px]">
            Kelola stok Anda, pantau deskripsi AI, dan lacak pesanan WhatsApp melalui pusat kendali ini.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <button className="px-8 py-4 bg-amber-500 text-zinc-950 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20 border border-amber-600/20 active:scale-95">
              Cek Produk
            </button>
            <button className="px-8 py-4 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 text-[10px] font-black uppercase tracking-widest rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-all active:scale-95">
              Perbarui Pengaturan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
