'use client';

import React, { useEffect, useState } from 'react';
import { X, Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '@/stores/cart';
import { formatWhatsAppMessage } from '@/lib/wa-formatter';
import { getCart, updateCartItem, removeFromCart } from '@/app/actions/cart';
import { createOrder } from '@/app/actions/orders';
import Image from 'next/image';
import { getSettings } from '@/lib/actions/settings';
import { toast } from 'sonner';

export default function CartDrawer() {
  const { isOpen, closeCart, updateQuantity: syncQuantity, removeItem: syncRemove, clearCart } = useCart();
  const [items, setItems] = useState<any[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastOrderId, setLastOrderId] = useState('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [settings, setSettings] = useState({ storeName: 'Erlinshop', whatsappNumber: '6281234567890' });

  useEffect(() => {
    async function fetchSettings() {
      const data = await getSettings();
      setSettings(data);
    }
    fetchSettings();
  }, []);

  useEffect(() => {
    if (isOpen) {
      const fetchCartData = async () => {
        const res = await getCart();
        if (res.success && res.data) {
          const mappedItems = res.data.map((item: any) => ({
            id: item.id,
            productId: item.variant.product.id, // Store original product ID for syncing
            variantId: item.variant.id,
            name: item.variant.product.name,
            variantName: item.variant.name,
            price: item.variant.price || item.variant.product.price,
            image: item.variant.product.images?.[0] || '',
            quantity: item.quantity,
          }));
          setItems(mappedItems);
        }
      };
      fetchCartData();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    const res = await updateCartItem(itemId, newQuantity);
    if (res.success) {
      const item = items.find(i => i.id === itemId);
      setItems(prev => prev.map(i => i.id === itemId ? { ...i, quantity: newQuantity } : i));
      
      // Sync with Zustand for Header badges
      if (item) {
        // Find product ID from item - in Drawer we need to map correctly
        // Note: The drawer items are mapped in fetchCartData
        syncQuantity(item.productId || item.id, newQuantity, item.variantId);
      }
    } else {
      toast.error(res.error || "Gagal memperbarui jumlah");
    }
  };

  const handleRemove = async (itemId: string) => {
    const res = await removeFromCart(itemId);
    if (res.success) {
      const itemToRemove = items.find(i => i.id === itemId);
      setItems(prev => prev.filter(i => i.id !== itemId));
      
      // Sync with Zustand
      if (itemToRemove) {
        syncRemove(itemToRemove.productId || itemToRemove.id, itemToRemove.variantId);
      }
      toast.success("Item dihapus dari keranjang");
    } else {
      toast.error(res.error || "Gagal menghapus item");
    }
  };

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const handleCheckout = async () => {
    if (!customerName.trim() || !customerPhone.trim()) {
      toast.warning('Tolong masukkan Nama dan Nomor WhatsApp Anda');
      return;
    }

    setIsCheckingOut(true);
    try {
      const res = await createOrder(customerName, customerPhone);
      
      if (!res.success) {
        toast.error(res.error || "Gagal memproses pesanan ke sistem");
        setIsCheckingOut(false);
        return;
      }

      setLastOrderId(res.data?.orderId || '');
      
      // Clear global cart state (Badge) immediately
      useCart.setState({ items: [] });
      clearCart(); 
      
      // Sync across tabs
      if (globalThis.window !== undefined) {
        globalThis.window.dispatchEvent(new Event('storage'));
        globalThis.localStorage.removeItem('erlinshop-cart');
      }
      
      // Transition to success screen
      setShowCheckoutForm(false);
      setShowSuccess(true); 
      
      toast.success("Pesanan berhasil diterima!");
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan sistem saat checkout");
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleManualWA = () => {
    const waItems = items.map(item => ({
      name: item.name,
      variantName: item.variantName,
      quantity: item.quantity,
      price: item.price
    }));

    const message = formatWhatsAppMessage({
      items: waItems as any,
      customerName,
      customerPhone,
      totalPrice: getTotalPrice(),
      storeName: settings.storeName,
      orderId: lastOrderId
    });

    const whatsappUrl = `https://wa.me/${settings.whatsappNumber.replaceAll(/\D/g, '')}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleCloseAll = () => {
    setShowSuccess(false);
    setItems([]); // Clear local items now
    setCustomerName('');
    setCustomerPhone('');
    setLastOrderId('');
    closeCart();
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      {/* Backdrop */}
      <button 
        type="button"
        className="absolute inset-0 w-full h-full bg-zinc-950/40 backdrop-blur-sm transition-opacity duration-500 animate-in fade-in border-none cursor-default"
        onClick={closeCart}
        onKeyDown={(e) => e.key === 'Escape' && closeCart()}
        aria-label="Close cart"
      />

      {/* Drawer Content */}
      <div className="relative w-full max-w-md bg-white shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-500">
        {showSuccess ? (
          <div className="flex-1 flex flex-col h-full bg-white animate-in fade-in zoom-in-95 duration-500">
             <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center space-y-10 bg-white">
                <div className="w-24 h-24 bg-white border-4 border-emerald-500 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-100 mt-8 animate-bounce">
                  <ShoppingBag className="text-emerald-500 w-10 h-10" />
                </div>
                
                <div className="space-y-4 text-center w-full">
                  <div className="space-y-1">
                    <h2 className="text-3xl font-black uppercase tracking-tighter text-zinc-950">Terima Kasih!</h2>
                    <p className="text-zinc-400 text-[10px] font-black uppercase tracking-[0.3em]">Pesanan Anda Telah Kami Catat</p>
                  </div>
                  
                  <div className="bg-zinc-50 border-2 border-dashed border-zinc-200 p-6 rounded-3xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-amber-500" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">ID PESANAN</p>
                    <span className="font-mono text-3xl font-black text-zinc-950 block tabular-nums">{lastOrderId}</span>
                    <div className="mt-2 text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                      Status: <span className="text-amber-600">Proses Verifikasi</span>
                    </div>
                  </div>
                </div>

                {/* Order Summary in Success Screen */}
                <div className="w-full bg-white rounded-3xl border border-zinc-100 p-6 space-y-5 shadow-sm">
                  <div className="flex justify-between items-center border-b border-zinc-50 pb-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-950">Ringkasan Pesanan</p>
                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">{items.length} Produk</p>
                  </div>
                  
                  <div className="max-h-60 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                    {items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-start text-xs group">
                        <div className="flex flex-col gap-1">
                          <span className="font-bold text-zinc-900 leading-tight">{item.name}</span>
                          <span className="text-[9px] text-zinc-400 font-black uppercase tracking-wider bg-zinc-50 px-2 py-0.5 rounded-full w-fit">
                            {item.variantName} • Qty {item.quantity}
                          </span>
                        </div>
                        <span className="font-black text-zinc-950 whitespace-nowrap ml-4">
                          IDR {(item.price * item.quantity).toLocaleString('id-ID')}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-5 border-t border-zinc-100 flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">Total Pembayaran</span>
                      <span className="text-xl font-black text-amber-600">IDR {getTotalPrice().toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50/50 p-6 rounded-2xl border border-amber-100/50 w-full">
                  <p className="text-[11px] font-bold text-amber-900 leading-relaxed text-center">
                    Simpan ID Pesanan Anda. Admin akan memverifikasi stok dan menghubungi Anda via WhatsApp untuk koordinasi pembayaran.
                  </p>
                </div>

                <div className="w-full space-y-3 pt-4 pb-10">
                  <button 
                    onClick={handleManualWA}
                    className="w-full py-5 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-emerald-600 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4 shadow-xl shadow-emerald-100"
                  >
                    Konfirmasi via WhatsApp <ArrowRight className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={handleCloseAll}
                    className="w-full py-5 bg-white text-zinc-950 border-2 border-zinc-950 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-zinc-50 transition-all"
                  >
                    Tutup Keranjang
                  </button>
                </div>
             </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white border border-zinc-100 rounded-2xl flex items-center justify-center shadow-sm">
                  <ShoppingBag className="text-zinc-950 w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black uppercase tracking-tighter text-zinc-950">Keranjang</h2>
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">{getTotalItems()} Item</p>
                </div>
              </div>
              <button 
                onClick={closeCart}
                className="p-2.5 hover:bg-zinc-50 rounded-full transition-colors text-zinc-400 hover:text-zinc-950"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                  <div className="w-24 h-24 rounded-full bg-white shadow-inner flex items-center justify-center text-zinc-200">
                    <ShoppingBag className="w-12 h-12" />
                  </div>
                  <div>
                    <p className="text-zinc-950 font-black uppercase tracking-tight text-xl">Keranjang Kosong</p>
                    <p className="text-xs text-zinc-400 uppercase tracking-widest mt-2">Mulai belanja untuk mengisi keranjang</p>
                  </div>
                  <button 
                    onClick={closeCart}
                    className="px-10 py-4 bg-zinc-950 text-white text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-amber-600 transition-all shadow-xl shadow-zinc-200"
                  >
                    Lihat Katalog
                  </button>
                </div>
              ) : (
                items.map((item) => (
                  <div key={`${item.id}-${item.variantName}`} className="group flex gap-4 p-5 rounded-3xl bg-white border border-zinc-100 shadow-sm hover:shadow-md transition-all">
                    {/* Product Image */}
                    <div className="relative w-24 h-24 rounded-3xl overflow-hidden bg-zinc-50 shrink-0 border border-zinc-100">
                      {item.image ? (
                        <Image 
                          src={item.image} 
                          alt={item.name} 
                          fill 
                          sizes="96px"
                          className="object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-200">
                          <ShoppingBag className="w-10 h-10" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-[1_1_0%] flex flex-col justify-between py-1">
                      <div className="flex-2 min-w-0">
                        <h3 className="text-base font-black tracking-tight line-clamp-1 mb-1">
                          {item.name}
                        </h3>
                        {item.variantName && (
                          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-1">
                            Varian: {item.variantName}
                          </p>
                        )}
                        <p className="text-xs text-amber-600 font-black mt-1.5">IDR {item.price.toLocaleString('id-ID')}</p>
                      </div>
                      
                      <div className="flex items-center justify-between mt-4">
                        {/* Quantity Controls */}
                        <div className="flex items-center bg-zinc-50 rounded-full border border-zinc-100 p-1">
                          <button 
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            className="p-1.5 hover:text-amber-600 transition-colors text-zinc-400"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-10 text-center text-[10px] font-black text-zinc-950">{item.quantity}</span>
                          <button 
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            className="p-1.5 hover:text-amber-600 transition-colors text-zinc-400"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        
                        <button 
                          onClick={() => handleRemove(item.id)}
                          className="p-2.5 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer / Checkout */}
            {items.length > 0 && (
              <div className="p-8 bg-white border-t border-zinc-100 space-y-8">
                <div className="space-y-3">
                  <div className="flex justify-between text-zinc-400 text-[10px] font-black uppercase tracking-[0.2em]">
                    <span>Subtotal</span>
                    <span>IDR {getTotalPrice().toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-zinc-950 text-xl font-black uppercase tracking-tighter">
                    <span>Total Bayar</span>
                    <span className="text-amber-600">IDR {getTotalPrice().toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {showCheckoutForm ? (
                  <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
                    <div className="space-y-4">
                      <div className="group">
                        <label htmlFor="name" className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 block mb-2 group-focus-within:text-zinc-950 transition-colors">Nama Lengkap</label>
                        <input 
                          type="text" 
                          id="name"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="Masukkan nama Anda"
                          className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-5 text-sm focus:outline-none focus:border-zinc-950 focus:bg-white transition-all text-zinc-950 placeholder:text-zinc-300"
                        />
                      </div>
                      <div className="group">
                        <label htmlFor="phone" className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 block mb-2 group-focus-within:text-zinc-950 transition-colors">Nomor WhatsApp</label>
                        <input 
                          type="tel" 
                          id="phone"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="Contoh: 081234567890"
                          className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-5 text-sm focus:outline-none focus:border-zinc-950 focus:bg-white transition-all text-zinc-950 placeholder:text-zinc-300"
                        />
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <button 
                        onClick={() => setShowCheckoutForm(false)}
                        className="flex-1 py-5 bg-zinc-100 text-zinc-500 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-zinc-200 transition-all"
                      >
                        Kembali
                      </button>
                      <button 
                        onClick={handleCheckout}
                        disabled={isCheckingOut}
                        className="flex-2 py-5 bg-zinc-950 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-amber-600 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-zinc-200"
                      >
                        {isCheckingOut ? (
                          <>Memproses...</>
                        ) : (
                          <>Buat Pesanan <ArrowRight className="w-4 h-4" /></>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => setShowCheckoutForm(true)}
                    className="w-full py-6 bg-zinc-950 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-amber-600 hover:scale-[1.02] transition-all flex items-center justify-center gap-4 shadow-2xl shadow-zinc-200"
                  >
                    Lanjutkan ke Pesanan <ShoppingBag className="w-5 h-5" />
                  </button>
                )}
                
                <p className="text-[10px] text-center text-zinc-300 font-black uppercase tracking-[0.2em]">
                  Pembayaran Aman via WhatsApp
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
