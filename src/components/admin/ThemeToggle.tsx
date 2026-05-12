"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 animate-pulse" />
    );
  }

  return (
    <button
      onClick={() => {
        const nextTheme = theme === "dark" ? "light" : "dark";
        console.log(`[ThemeSystem] Switching to: ${nextTheme.toUpperCase()}`);
        setTheme(nextTheme);
      }}
      className="p-2.5 rounded-xl transition-all duration-300 flex items-center justify-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-amber-500/50 group shadow-sm dark:shadow-none"

      aria-label="Toggle Theme"
    >
      {theme === "dark" ? (
        <Sun size={18} className="text-zinc-500 group-hover:text-amber-400 transition-colors" />
      ) : (
        <Moon size={18} className="text-zinc-500 group-hover:text-amber-500 transition-colors" />
      )}
    </button>
  );
}
