"use client";

import React from 'react';
import { logoutGuest } from '@/app/actions/orders';
import { LogOut } from 'lucide-react';
import { toast } from 'sonner';

export default function LogoutButton() {
  const handleLogout = async () => {
    const res = await logoutGuest();
    if (res.success) {
      toast.success("Berhasil logout dari sesi tamu");
      window.location.reload();
    } else {
      toast.error("Gagal logout");
    }
  };

  return (
    <button 
      onClick={handleLogout}
      className="w-full flex items-center gap-4 p-4 hover:bg-rose-50 text-rose-600 rounded-2xl transition-colors group"
    >
      <LogOut className="w-5 h-5" />
      <span className="text-sm font-black uppercase tracking-widest">Logout Session</span>
    </button>
  );
}
