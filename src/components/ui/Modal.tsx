"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly title: string;
  readonly children: React.ReactNode;
  readonly size?: "medium" | "large";
}

export function Modal({ isOpen, onClose, title, children, size = "medium" }: ModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      globalThis.addEventListener("keydown", handleEsc);
    }
    return () => {
      document.body.style.overflow = "unset";
      globalThis.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md transition-opacity">
      <div className={cn(
        "bg-zinc-950 rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,0.9)] w-full overflow-hidden border border-amber-500/10 animate-in fade-in zoom-in duration-300",
        size === "medium" ? "max-w-md" : "max-w-5xl"
      )}>
        <div className="flex items-center justify-between p-8 border-b border-zinc-900/50 bg-black/40">
          <h3 className="text-xl font-black bg-linear-to-br from-[#B28D27] via-[#D4AF37] to-[#F9D976] bg-clip-text text-transparent tracking-tighter uppercase">{title}</h3>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-zinc-900 text-zinc-500 hover:text-amber-500 transition-all border border-transparent hover:border-amber-500/20"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
}
