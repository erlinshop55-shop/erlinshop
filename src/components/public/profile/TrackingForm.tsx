'use client';

import React, { useState } from 'react';
import { trackOrder } from '@/app/actions/orders';
import { Search, Phone, Hash, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function TrackingForm() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function handleTrack(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const formData = new FormData(e.currentTarget);
    const phone = formData.get('phone') as string;
    const orderId = formData.get('orderId') as string;

    const res = await trackOrder(phone, orderId);
    setLoading(false);

    if (res.success) {
      setResult(res.data);
      toast.success('Pesanan ditemukan!');
    } else {
      toast.error(res.error || 'Pesanan tidak ditemukan');
    }
  }

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-700';
      case 'CANCELLED': return 'bg-rose-100 text-rose-700';
      case 'PROCESSING': return 'bg-blue-100 text-blue-700';
      default: return 'bg-amber-100 text-amber-700';
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-4xl p-8 md:p-12 border border-slate-100 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-neon/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        
        <div className="relative">
          <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900 mb-2">Lacak Pesanan</h2>
          <p className="text-slate-500 font-medium mb-8">Masukkan detail pesanan Anda untuk melihat status terbaru.</p>

          <form onSubmit={handleTrack} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="phone-input" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nomor WhatsApp</label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-neon transition-colors" />
                  <input
                    id="phone-input"
                    name="phone"
                    required
                    placeholder="0812..."
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:border-neon focus:ring-0 transition-all outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="order-id-input" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ID Pesanan</label>
                <div className="relative group">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-neon transition-colors" />
                  <input
                    id="order-id-input"
                    name="orderId"
                    required
                    placeholder="ORD-..."
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:border-neon focus:ring-0 transition-all outline-none"
                  />
                </div>
              </div>
            </div>

            <button
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-black text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-neon" />
              ) : (
                <Search className="w-4 h-4 text-neon" />
              )}
              {loading ? 'Mencari...' : 'Lacak Sekarang'}
            </button>
          </form>
        </div>
      </div>

      {/* Tracking Result Card */}
      {result && (
        <div className="mt-8 bg-white rounded-3xl p-6 border border-slate-100 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-start mb-6">
            <div>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusStyles(result.status)}`}>
                {result.status}
              </span>
              <h3 className="text-lg font-black mt-2">{result.id}</h3>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Bayar</p>
              <p className="text-lg font-black text-rose-600">Rp {result.totalPrice.toLocaleString()}</p>
            </div>
          </div>

          <div className="space-y-3">
            {result.items?.map((item: any) => (
              <div key={item.id} className="flex justify-between items-center text-sm">
                <span className="text-slate-600 font-medium">{item.productName} ({item.variantName})</span>
                <span className="font-bold">x{item.quantity}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-dashed border-slate-100">
            <p className="text-[10px] text-center text-slate-400 font-medium italic">
              Pesanan dibuat pada {new Date(result.createdAt).toLocaleDateString('id-ID', { dateStyle: 'long' })}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
