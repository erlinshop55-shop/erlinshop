"use client";

import { Menu, Store } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

interface AdminHeaderProps {
  readonly onMenuClick: () => void;
}

export function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-black border-b border-zinc-200 dark:border-zinc-900 px-4 flex items-center justify-between z-40 shadow-lg dark:shadow-xl dark:shadow-black/50">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-amber-500 rounded flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
          <Store className="text-zinc-950 w-4 h-4" />
        </div>
        <div className="flex flex-col">
          <h2 className="text-xs font-black tracking-tighter text-zinc-900 dark:text-white uppercase">ERLINSHOP</h2>
          <span className="text-[8px] font-black text-amber-600 dark:text-amber-500/80 tracking-[0.2em] uppercase">Terminal</span>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <button 
          onClick={onMenuClick}
          className="p-2.5 text-zinc-400 hover:text-amber-400 hover:bg-amber-400/5 rounded-xl transition-all active:scale-95 border border-transparent hover:border-amber-400/10"
          aria-label="Open Sidebar"
        >
          <Menu size={22} />
        </button>
      </div>
    </header>
  );
}

