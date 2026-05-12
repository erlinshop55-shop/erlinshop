'use client';

import React, { useState } from 'react';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, ArrowLeft } from 'lucide-react';
import { updateCartItem, removeFromCart } from '@/app/actions/cart';
import { createOrder } from '@/app/actions/orders';
import { formatWhatsAppMessage } from '@/lib/wa-formatter';
import { useCart } from '@/stores/cart';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';

interface CartClientProps {
  initialItems: any[];
  settings: any;
}

export default function CartClient({ initialItems, settings }: Readonly<CartClientProps>) {
  const globalCartItems = useCart(state => state.items);
  const { updateQuantity: syncQuantity, removeItem: syncRemove } = useCart();
  const [items, setItems] = useState(initialItems);
  const [loading, setLoading] = useState<string | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastOrderId, setLastOrderId] = useState('');

  // Sync with global cart store to avoid "hanging counts"
  React.useEffect(() => {
    if (!showSuccess) {
      if (globalCartItems.length === 0 && items.length > 0) {
        setItems([]);
      }
    }
  }, [globalCartItems, showSuccess, items.length]);

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.variant.price || item.variant.product.price) * item.quantity, 0);
  };

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setLoading(itemId);
    const res = await updateCartItem(itemId, newQuantity);
    if (res.success) {
      const item = items.find(i => i.id === itemId);
      setItems(prev => prev.map(i => i.id === itemId ? { ...i, quantity: newQuantity } : i));
      
      // Sync with Zustand for Header badges
      if (item) {
        syncQuantity(item.variant.product.id, newQuantity, item.variant.id);
      }
    }
    setLoading(null);
  };

  const handleRemove = async (itemId: string) => {
    setLoading(itemId);
    const res = await removeFromCart(itemId);
    if (res.success) {
      const itemToRemove = items.find(i => i.id === itemId);
      setItems(prev => prev.filter(i => i.id !== itemId));
      
      // Sync with Zustand
      if (itemToRemove) {
        syncRemove(itemToRemove.variant.product.id, itemToRemove.variant.id);
      }
      toast.success("Item dihapus dari keranjang");
    }
    setLoading(null);
  };

  const handleCheckout = async () => {
    if (!customerName.trim() || !customerPhone.trim()) {
      toast.warning('Tolong masukkan Nama dan Nomor WhatsApp Anda');
      return;
    }

    setIsCheckingOut(true);
    try {
      // 1. Create Order in DB (Checkout Intent)
      const res = await createOrder(customerName, customerPhone);
      
      if (!res.success) {
        toast.error(res.error || "Gagal memproses pesanan ke sistem");
        setIsCheckingOut(false);
        return;
      }

      const orderId = res.data?.orderId || '';
      setLastOrderId(orderId);
      
      // 2. Aggressive Clear Global Cart (Badge Sync)
      // Clear in-memory state first
      useCart.setState({ items: [] });
      
      // Force clear persistence layer to prevent re-hydration on other tabs/reloads
    if (globalThis.window !== undefined) {
      useCart.persist.clearStorage();
      globalThis.localStorage.removeItem('erlinshop-cart');
      globalThis.window.dispatchEvent(new Event('storage'));
    }


      
      // 3. Show Success Screen (Keep local items for summary)
      setShowSuccess(true);
      toast.success("Pesanan berhasil dicatat oleh sistem!");
      
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan sistem saat checkout");
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleManualWA = () => {
    const waItems = items.map(item => ({
      name: item.variant.product.name,
      variantName: item.variant.name,
      quantity: item.quantity,
      price: item.variant.price || item.variant.product.price
    }));

    const message = formatWhatsAppMessage({
      items: waItems as any,
      customerName,
      customerPhone,
      totalPrice: calculateTotal(),
      storeName: settings.storeName,
      orderId: lastOrderId
    });

    const whatsappUrl = `https://wa.me/${settings.whatsappNumber.replaceAll(/\D/g, '')}?text=${message}`;
    globalThis.window?.open(whatsappUrl, '_blank');
  };

  if (showSuccess) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-white p-12 rounded-[3rem] shadow-2xl border border-zinc-100 flex flex-col items-center text-center space-y-10">
          <div className="w-24 h-24 bg-white border-4 border-emerald-500 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-100 animate-bounce">
            <ShoppingBag className="text-emerald-500 w-10 h-10" />
          </div>
          
          <div className="space-y-4 w-full">
            <div className="space-y-1">
              <h2 className="text-4xl font-black uppercase tracking-tighter text-zinc-950">Terima Kasih!</h2>
              <p className="text-zinc-400 text-[10px] font-black uppercase tracking-[0.3em]">Pesanan Anda Telah Kami Catat</p>
            </div>
            
            <div className="bg-white border-2 border-dashed border-zinc-200 p-8 rounded-4xl relative overflow-hidden group hover:border-amber-500 transition-colors">
               <div className="absolute top-0 left-0 w-full h-1 bg-amber-500" />
               <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">ID PESANAN ANDA</p>
               <span className="font-mono text-4xl font-black text-zinc-950 block tabular-nums tracking-tighter">{lastOrderId}</span>
               <div className="mt-4 px-4 py-2 bg-zinc-50 rounded-full inline-block">
                 <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Status: <span className="text-amber-600">Menunggu Konfirmasi Admin</span></p>
               </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-4xl border border-zinc-100 w-full text-left space-y-6 shadow-sm">
            <div className="flex justify-between items-center border-b border-zinc-50 pb-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-950">Ringkasan Pesanan</p>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase rounded-full tracking-widest">Sistem Telah Mencatat</span>
            </div>
            
            <div className="space-y-4 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-xs">
                  <div className="flex flex-col">
                    <span className="font-bold text-zinc-900">{item.variant.product.name}</span>
                    <span className="text-[9px] text-zinc-400 uppercase font-black">{item.variant.name} • Qty {item.quantity}</span>
                  </div>
                  <span className="font-black">IDR {((item.variant.price || item.variant.product.price) * item.quantity).toLocaleString('id-ID')}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-zinc-100 flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Total Pembayaran</span>
              <span className="text-2xl font-black text-rose-600">IDR {calculateTotal().toLocaleString('id-ID')}</span>
            </div>
            
            <div className="flex flex-col gap-3 p-6 bg-amber-50/50 rounded-3xl border border-amber-100/50">
              <p className="text-[10px] font-black text-amber-900 uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" /> Mohon Tunggu Konfirmasi
              </p>
              <p className="text-[11px] text-amber-800 font-bold leading-relaxed">
                Admin kami akan memverifikasi pesanan Anda. Kami akan segera menghubungi Anda via WhatsApp untuk koordinasi pembayaran dan pengiriman.
              </p>
            </div>
          </div>

          <div className="w-full flex flex-col gap-3 pt-4">
            <Link 
              href="/products"
              onClick={() => setItems([])}
              className="py-6 bg-zinc-950 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-3xl hover:bg-zinc-800 transition-all flex items-center justify-center gap-3 shadow-xl shadow-zinc-200"
            >
              Kembali ke Toko <ArrowRight className="w-4 h-4 text-amber-500" />
            </Link>
            <button 
              onClick={handleManualWA}
              className="py-4 text-emerald-600 text-[9px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:text-emerald-700 transition-colors"
            >
              Klik di sini jika ingin konfirmasi via WhatsApp manual
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 relative bg-white min-h-screen p-4 md:p-8 rounded-[3rem] shadow-sm">
      {/* Processing Overlay */}
      {isCheckingOut && (
        <div className="fixed inset-0 z-100 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center space-y-4 animate-in fade-in duration-300">
          <div className="w-16 h-16 border-4 border-zinc-100 border-t-amber-500 rounded-full animate-spin" />
          <div className="text-center">
            <p className="text-sm font-black uppercase tracking-widest text-zinc-950">Sedang Memproses...</p>
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">Mohon tunggu sebentar</p>
          </div>
        </div>
      )}

      <header className="mb-12">
        <h1 className="text-5xl font-black tracking-tighter uppercase mb-2 text-zinc-950">Shopping Bag</h1>
        <div className="flex items-center gap-4">
          <p className="text-zinc-400 text-[10px] font-black uppercase tracking-[0.3em]">
            {items.length} Items ready for checkout
          </p>
          <div className="h-px grow bg-zinc-100" />
        </div>
      </header>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-8 bg-white rounded-[3rem] shadow-2xl border border-zinc-100 animate-in fade-in duration-700">
          <div className="w-24 h-24 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-300">
            <ShoppingBag className="w-12 h-12" />
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-black tracking-tight mb-2 uppercase text-zinc-950">Keranjang Kosong</h2>
            <p className="text-zinc-500 text-[10px] uppercase tracking-[0.3em] font-black">Waktunya mengisi keranjang Anda</p>
          </div>
          <Link 
            href="/products" 
            className="px-12 py-5 bg-zinc-950 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:scale-105 active:scale-95 transition-all flex items-center gap-3 shadow-xl shadow-zinc-200"
          >
            <ArrowLeft className="w-4 h-4" /> Mulai Belanja
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Items List */}
          <div className="lg:col-span-2 space-y-6">
            {items.map((item) => (
              <div key={item.id} className="group relative bg-white p-6 rounded-4xl shadow-sm border border-zinc-100 flex gap-8 transition-all hover:shadow-xl hover:border-zinc-200">
                <div className="w-32 h-40 bg-zinc-100 rounded-3xl overflow-hidden shrink-0">
                  <Image 
                    src={item.variant.product.images?.[0] || ''} 
                    alt={item.variant.product.name}
                    width={128}
                    height={160}
                    sizes="(max-width: 768px) 100vw, 128px"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                </div>
                
                <div className="flex-1 flex flex-col justify-between py-2">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1 block">
                          {item.variant.product.brand || 'UNBRANDED'}
                        </span>
                        <h3 className="text-lg font-black tracking-tight text-zinc-950">{item.variant.product.name}</h3>
                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1">
                          Option: {item.variant.name}
                        </p>
                      </div>
                      <button 
                        onClick={() => handleRemove(item.id)}
                        className="p-3 text-zinc-300 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-all"
                        disabled={loading === item.id}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="text-xl font-black text-zinc-950">
                      IDR {(item.variant.price || item.variant.product.price).toLocaleString('id-ID')}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center bg-zinc-50 rounded-2xl p-1.5 border border-zinc-100">
                      <button 
                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                        className="p-2 hover:text-amber-600 transition-colors disabled:opacity-20 text-zinc-400"
                        disabled={item.quantity <= 1 || loading === item.id}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-12 text-center text-sm font-black text-zinc-950">{item.quantity}</span>
                      <button 
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                        className="p-2 hover:text-amber-600 transition-colors disabled:opacity-20 text-zinc-400"
                        disabled={loading === item.id}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="text-sm font-black text-zinc-400 uppercase tracking-widest">
                      Subtotal: <span className="text-zinc-950">IDR {((item.variant.price || item.variant.product.price) * item.quantity).toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary / Checkout */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-8">
              <div className="bg-white p-8 rounded-4xl shadow-sm border border-zinc-100 space-y-8">
                <h3 className="text-xl font-black tracking-tight uppercase text-zinc-950">Order Summary</h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between text-zinc-500 text-sm font-bold uppercase tracking-widest">
                    <span>Total Item</span>
                    <span className="text-zinc-950">{items.reduce((s, i) => s + i.quantity, 0)}</span>
                  </div>
                  <div className="flex justify-between text-zinc-500 text-sm font-bold uppercase tracking-widest">
                    <span>Shipping</span>
                    <span className="text-emerald-600 font-black">GRATIS</span>
                  </div>
                  <div className="h-px bg-zinc-100 my-4" />
                  <div className="flex justify-between items-baseline">
                    <span className="text-lg font-black uppercase tracking-tighter text-zinc-950">Grand Total</span>
                    <span className="text-3xl font-black text-rose-600">IDR {calculateTotal().toLocaleString('id-ID')}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="group">
                    <label htmlFor="customer-name" className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 block mb-2 px-1 group-focus-within:text-zinc-950 transition-colors">Nama Lengkap</label>
                    <input 
                      id="customer-name"
                      type="text" 
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Contoh: Budi Santoso"
                      className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-zinc-950 placeholder:text-zinc-300"
                    />
                  </div>

                  <div className="group">
                    <label htmlFor="customer-phone" className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 block mb-2 px-1 group-focus-within:text-zinc-950 transition-colors">Nomor WhatsApp</label>
                    <input 
                      id="customer-phone"
                      type="tel" 
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Contoh: 081234567890"
                      className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-zinc-950 placeholder:text-zinc-300"
                    />
                  </div>
                  
                  <button 
                    onClick={handleCheckout}
                    disabled={isCheckingOut}
                    className="w-full py-6 bg-zinc-950 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-zinc-200"
                  >
                    {isCheckingOut ? 'Memproses...' : (
                      <>Buat Pesanan Sekarang <ArrowRight className="w-5 h-4 text-amber-500" /></>
                    )}
                  </button>
                </div>
                
                <div className="flex items-center gap-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shrink-0">
                    <ShoppingBag className="text-white w-5 h-5" />
                  </div>
                  <p className="text-[10px] text-emerald-800 font-bold leading-relaxed uppercase tracking-widest">
                    Pesanan Anda akan dikirim langsung ke admin untuk konfirmasi stok & pembayaran.
                  </p>
                </div>
              </div>
              
              <Link 
                href="/products" 
                className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 hover:text-zinc-950 transition-colors"
              >
                <ArrowLeft className="w-3 h-3" /> Lanjutkan Belanja
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
