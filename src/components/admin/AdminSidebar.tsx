"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Package, 
  Layers, 
  Settings, 
  BookOpen, 
  ExternalLink,
  Store,
  X,
  ShoppingBag
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ThemeToggle } from "./ThemeToggle";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminSidebar({ isOpen, onClose }: Readonly<AdminSidebarProps>) {
  const pathname = usePathname();

  const navItems = [
    { name: "Beranda", href: "/admin", icon: LayoutDashboard },
    { name: "Pesanan", href: "/admin/orders", icon: ShoppingBag },
    { name: "Produk", href: "/admin/products", icon: Package },
    { name: "Kategori", href: "/admin/categories", icon: Layers },
    { name: "Pengaturan", href: "/admin/settings", icon: Settings },
    { name: "Dokumen", href: "/admin/docs", icon: BookOpen },
  ];

  return (
    <>
      {/* Backdrop Overlay */}
      {isOpen && (
        <button 
          className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 lg:hidden transition-all duration-500 animate-in fade-in"
          onClick={onClose}
          aria-label="Close Sidebar Overlay"
        >
          {/* Subtle Glow Effect */}
          <div className="absolute inset-0 bg-linear-to-tr from-amber-500/10 via-transparent to-transparent pointer-events-none" />
        </button>
      )}

      {/* Sidebar Aside */}
      <aside className={cn(
        "fixed inset-y-0 left-0 lg:sticky lg:top-0 h-screen w-64 bg-zinc-50 dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-900 flex flex-col transition-all duration-500 ease-in-out z-60 transform shadow-2xl lg:shadow-none",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Header */}
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(245,158,11,0.4)]">
              <Store className="text-zinc-950 w-6 h-6" />
            </div>
            <div className="overflow-hidden">
              <h2 className="text-xl font-black tracking-tighter text-zinc-900 dark:text-white leading-none uppercase">ERLINSHOP</h2>
              <div className="text-[9px] font-black uppercase tracking-[0.3em] text-amber-600 dark:text-amber-500/80 mt-1.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.6)]" />V3 TERMINAL
              </div>
            </div>
            <button 
              onClick={onClose}
              className="lg:hidden ml-auto p-2 text-zinc-600 hover:text-amber-400"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto scrollbar-none py-4">
          <div className="mb-4 px-3 text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 dark:text-zinc-700">Data Pasar</div>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href}
                href={item.href} 
                onClick={onClose}
                className={cn(
                  "flex items-center gap-4 px-4 py-3 rounded-xl transition-all group border",
                  isActive 
                    ? "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-amber-600 dark:text-amber-400 shadow-lg dark:shadow-[0_0_20px_rgba(0,0,0,0.4)]" 
                    : "text-zinc-500 dark:text-zinc-500 border-transparent hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900/50"
                )}
              >
                <item.icon size={20} className={cn("transition-transform duration-300", isActive ? "scale-110" : "group-hover:scale-110")} />
                <span className="text-xs font-bold uppercase tracking-widest">{item.name}</span>
                {isActive && (
                  <div className="ml-auto flex gap-1">
                    <div className="w-1 h-4 bg-amber-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.6)]" />
                  </div>
                )}
              </Link>
            );
          })}
          
          <div className="pt-8 pb-4 px-3 text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 dark:text-zinc-700">Gerbang</div>
          <Link 
            href="/" 
            target="_blank"
            className="flex items-center gap-4 px-4 py-3 rounded-xl text-zinc-500 border border-transparent hover:text-amber-400 hover:bg-amber-400/5 hover:border-amber-400/10 transition-all group"
          >
            <ExternalLink size={20} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            <span className="text-xs font-bold uppercase tracking-widest">Lihat Toko</span>
          </Link>
        </nav>

        {/* Footer / Profile */}
        <div className="p-6 border-t border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-950 space-y-4">
          <div className="flex items-center justify-between px-1">
             <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-600">Preferensi</p>
             <ThemeToggle />
          </div>
          <div className="p-3 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center gap-3 group hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
            <div className="p-0.5 rounded-full border border-amber-500/20 group-hover:border-amber-500/40 transition-colors">
              <UserButton appearance={{ 
                elements: { 
                  userButtonAvatarBox: "w-8 h-8 rounded-full shadow-md dark:shadow-[0_0_10px_rgba(0,0,0,0.5)]",
                  userButtonTrigger: "focus:shadow-none focus:outline-none"
                } 
              }} />
            </div>
            <div className="overflow-hidden">
              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-600">Operator</p>
              <p className="text-xs font-black truncate text-zinc-700 dark:text-zinc-300 tracking-tight uppercase">Admin Terminal</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
