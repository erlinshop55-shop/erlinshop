'use client';

import React from 'react';

type ButtonVariant = 'primary' | 'danger' | 'success';

interface ActionButtonProps {
  readonly onClick: () => void;
  readonly label: string;
  readonly variant?: ButtonVariant;
  readonly disabled?: boolean;
  readonly isLoading?: boolean;
}

export const ActionButton = ({ onClick, label, variant = 'primary', disabled, isLoading }: ActionButtonProps) => {
  // Mapping Gradient berdasarkan Varian (Tailwind v4 Native)
  const gradients = {
    primary: 'from-[#af40ff] via-[#5b42f3] to-[#00ddeb] shadow-[0_15px_30px_-5px_rgba(151,65,252,0.2)]',
    success: 'from-[#10b981] via-[#059669] to-[#34d399] shadow-[0_15px_30px_-5px_rgba(16,185,129,0.2)]',
    danger: 'from-[#f43f5e] via-[#e11d48] to-[#fb7185] shadow-[0_15px_30px_-5px_rgba(244,63,94,0.2)]'
  };

  return (
    <button 
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`group relative inline-flex items-center justify-center p-[2px] rounded-xl bg-linear-to-r transition-all duration-300 active:scale-95 focus:outline-none disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed ${gradients[variant]}`}
    >
      <span className="flex items-center justify-center bg-zinc-950 px-5 py-3 rounded-[10px] w-full h-full text-white text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 group-hover:bg-transparent group-hover:text-zinc-950 dark:group-hover:text-zinc-100 group-hover:font-black min-w-[120px]">
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading...
          </span>
        ) : label}
      </span>
    </button>
  );
};
