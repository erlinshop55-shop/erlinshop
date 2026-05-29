// 📁 File Target: d:\Erlinshop\src\app\(public)\cart\CartClient.tsx
// 🎯 Purpose: Komponen utama halaman keranjang belanja (Shopping Bag) dan checkout dengan dukungan Midtrans & Transfer Manual (Zalora DNA).
// 🔗 Depends on: react, lucide-react, next/script, @/app/actions/payment, @/app/actions/orders, @/stores/cart, next/image, sonner
// 💥 Used by (Blast Radius): Halaman keranjang belanja (/cart), checkout flow

'use client';

import React, { useState, useEffect } from 'react';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, ArrowLeft, CreditCard, Landmark, Check, Copy } from 'lucide-react';
import { updateCartItem, removeFromCart } from '@/app/actions/cart';
import { createOrder } from '@/app/actions/orders';
import { getMidtransSnapToken, getManualBankAccounts, setManualPayment } from '@/app/actions/payment';
import { formatWhatsAppMessage } from '@/lib/wa-formatter';
import { useCart } from '@/stores/cart';
import Link from 'next/link';
import Image from 'next/image';
import Script from 'next/script';
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
  
  // Checkout & Payment State
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'MIDTRANS' | 'MANUAL_TRANSFER' | null>(null);
  
  // Manual Transfer UI Flow
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [selectedBankId, setSelectedBankId] = useState<string>('');
  const [paymentProof, setPaymentProof] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  // Post-Checkout Screen State
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastOrderId, setLastOrderId] = useState('');
  const [postPaymentStatus, setPostPaymentStatus] = useState<'UNPAID' | 'PENDING_VERIFICATION' | 'PAID'>('UNPAID');

  // Load Active Bank Accounts when Manual Transfer is selected
  useEffect(() => {
    if (paymentMethod === 'MANUAL_TRANSFER') {
      const fetchBanks = async () => {
        const res = await getManualBankAccounts();
        if (res.success && res.data) {
          setBankAccounts(res.data);
          if (res.data.length > 0) {
            setSelectedBankId(res.data[0].id);
          }
        }
      };
      fetchBanks();
    }
  }, [paymentMethod]);

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
      if (itemToRemove) {
        syncRemove(itemToRemove.variant.product.id, itemToRemove.variant.id);
      }
      toast.success("Item dihapus dari keranjang");
    }
    setLoading(null);
  };

  // Triggering Cloudinary Widget dynamically for Proof upload
  const handleUploadProof = () => {
    if (globalThis.window === undefined) return;
    setIsUploading(true);
    
    // @ts-ignore
    const myWidget = window.cloudinary?.createUploadWidget(
      {
        cloudName: settings.cloudinaryCloudName || 'dxrxb1l0s', 
        uploadPreset: settings.cloudinaryUploadPreset || 'erlins-unsigned',
        folder: 'erlins-shop/payment-proofs',
        sources: ['local', 'camera'],
        multiple: false
      },
      (error: any, result: any) => {
        if (!error && result && result.event === "success") {
          setPaymentProof(result.info.secure_url);
          toast.success("Bukti transfer berhasil diunggah!");
        }
        setIsUploading(false);
      }
    );
    myWidget?.open();
  };

  // Main Checkout Coordinator
  const handleCheckoutProcess = async () => {
    if (!customerName.trim() || !customerPhone.trim()) {
      toast.warning('Tolong masukkan Nama dan Nomor WhatsApp Anda');
      return;
    }
    if (!paymentMethod) {
      toast.warning('Pilih salah satu Metode Pembayaran');
      return;
    }

    setIsCheckingOut(true);
    try {
      // Langkah 1: Buat Order Logistik (Checkout Intent)
      const res = await createOrder(customerName, customerPhone);
      if (!res.success || !res.data) {
        toast.error(res.error || "Gagal mencatat pesanan di database");
        setIsCheckingOut(false);
        return;
      }

      const orderId = res.data.orderId;
      setLastOrderId(orderId);

      // Langkah 2: Pemrosesan Metode Pembayaran Terdekopel
      if (paymentMethod === 'MIDTRANS') {
        // AMBIL TOKEN SNAP DARI SERVER ACTION
        const snapRes = await getMidtransSnapToken(orderId);
        if (!snapRes.success || !snapRes.data) {
          toast.error(snapRes.error || "Gagal membuat sesi pembayaran Midtrans");
          setIsCheckingOut(false);
          return;
        }

        const { snapToken } = snapRes.data;

        // PICU POPUP MIDTRANS SNAP SDK
        // @ts-ignore
        window.snap.pay(snapToken, {
          onSuccess: () => {
            setPostPaymentStatus('PAID');
            setShowSuccess(true);
            toast.success("Pembayaran berhasil diproses!");
            clearGlobalCart();
          },
          onPending: () => {
            setPostPaymentStatus('UNPAID'); // Masih pending transfer bank otomatis
            setShowSuccess(true);
            toast.info("Pembayaran menunggu penyelesaian transaksi.");
            clearGlobalCart();
          },
          onError: () => {
            toast.error("Pembayaran dibatalkan atau terjadi kesalahan.");
          },
          onClose: () => {
            setPostPaymentStatus('UNPAID');
            setShowSuccess(true);
            toast.warning("Pop-up pembayaran ditutup. Silakan bayar nanti di halaman Profil.");
            clearGlobalCart();
          }
        });
      } else if (paymentMethod === 'MANUAL_TRANSFER') {
        if (!selectedBankId) {
          toast.error("Mohon pilih rekening bank tujuan transfer.");
          setIsCheckingOut(false);
          return;
        }
        if (!paymentProof) {
          toast.error("Mohon unggah bukti transfer pembayaran Anda.");
          setIsCheckingOut(false);
          return;
        }

        // SIMPAN DATA PEMBAYARAN MANUAL KE DATABASE
        const manualRes = await setManualPayment(orderId, selectedBankId, paymentProof);
        if (!manualRes.success) {
          toast.error(manualRes.error || "Gagal menyimpan konfirmasi pembayaran manual");
          setIsCheckingOut(false);
          return;
        }

        setPostPaymentStatus('PENDING_VERIFICATION');
        setShowSuccess(true);
        toast.success("Bukti transfer tersimpan! Menunggu verifikasi admin.");
        clearGlobalCart();
      }
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kegagalan pemrosesan transaksi");
    } finally {
      setIsCheckingOut(false);
    }
  };

  const clearGlobalCart = () => {
    useCart.setState({ items: [] });
    if (globalThis.window !== undefined) {
      useCart.persist.clearStorage();
      globalThis.localStorage.removeItem('erlinshop-cart');
      globalThis.window.dispatchEvent(new Event('storage'));
    }
  };

  const copyToClipboard = (text: string) => {
    globalThis.navigator?.clipboard.writeText(text);
    setCopiedText(true);
    toast.success("Nomor rekening berhasil disalin!");
    setTimeout(() => setCopiedText(false), 2000);
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

  // SUCCESS SCREEN
  if (showSuccess) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-zinc-950 p-12 rounded-[3rem] shadow-2xl border border-zinc-800 flex flex-col items-center text-center space-y-10">
          <div className="w-24 h-24 bg-zinc-900 border-4 border-lime-400 rounded-full flex items-center justify-center shadow-2xl shadow-lime-400/20 animate-bounce">
            <ShoppingBag className="text-lime-400 w-10 h-10" />
          </div>
          
          <div className="space-y-4 w-full">
            <div className="space-y-1">
              <h2 className="text-4xl font-black uppercase tracking-tighter text-white">TERIMA KASIH!</h2>
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em]">Transaksi Anda Telah Tercatat</p>
            </div>
            
            <div className="bg-zinc-900 border-2 border-dashed border-zinc-800 p-8 rounded-4xl relative overflow-hidden group">
               <div className="absolute top-0 left-0 w-full h-1 bg-lime-400" />
               <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">NOMOR PESANAN ANDA</p>
               <span className="font-mono text-4xl font-black text-white block tabular-nums tracking-tighter">{lastOrderId}</span>
               <div className="mt-4 px-4 py-2 bg-zinc-950 rounded-full inline-block border border-zinc-800">
                 <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                   Status Bayar:{' '}
                   {postPaymentStatus === 'PAID' && <span className="text-lime-400">LUNAS (OTOMATIS)</span>}
                   {postPaymentStatus === 'PENDING_VERIFICATION' && <span className="text-amber-400">MENUNGGU VERIFIKASI ADMIN</span>}
                   {postPaymentStatus === 'UNPAID' && <span className="text-rose-400">BELUM LUNAS / TERTUNDA</span>}
                 </p>
               </div>
            </div>
          </div>

          <div className="bg-zinc-900 p-8 rounded-4xl border border-zinc-800 w-full text-left space-y-6">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Ringkasan Pesanan</p>
              <span className="px-3 py-1 bg-lime-400/10 text-lime-400 text-[9px] font-black uppercase rounded-full tracking-widest border border-lime-400/20">Secure Checkout</span>
            </div>
            
            <div className="space-y-4 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-xs">
                  <div className="flex flex-col">
                    <span className="font-bold text-zinc-200">{item.variant.product.name}</span>
                    <span className="text-[9px] text-zinc-500 uppercase font-black">{item.variant.name} • Qty {item.quantity}</span>
                  </div>
                  <span className="font-black text-white">IDR {((item.variant.price || item.variant.product.price) * item.quantity).toLocaleString('id-ID')}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-zinc-800 flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Total Nominal</span>
              <span className="text-2xl font-black text-lime-400">IDR {calculateTotal().toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div className="w-full flex flex-col gap-3 pt-4">
            <Link 
              href="/profile"
              onClick={() => setItems([])}
              className="py-6 bg-white text-zinc-950 text-[10px] font-black uppercase tracking-[0.2em] rounded-3xl hover:bg-zinc-100 transition-all flex items-center justify-center gap-3 shadow-xl"
            >
              Lacak Pesanan Saya <ArrowRight className="w-4 h-4 text-zinc-950" />
            </Link>
            <button 
              onClick={handleManualWA}
              className="py-4 text-zinc-500 text-[9px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:text-white transition-colors"
            >
              Konfirmasi pesanan manual via WhatsApp
            </button>
          </div>
        </div>
      </div>
    );
  }

  // CART & CHECKOUT INPUT VIEW
  return (
    <div className="space-y-12 relative bg-zinc-950 min-h-screen p-4 md:p-8 rounded-[3rem] shadow-2xl border border-zinc-900 text-white">
      {/* Midtrans Snap Script (Sandbox / Prod) */}
      <Script
        src={settings.midtransIsProduction === "true" || process.env.MIDTRANS_IS_PRODUCTION === "true" ? "https://app.midtrans.com/snap/snap.js" : "https://app.sandbox.midtrans.com/snap/snap.js"}
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
        strategy="lazyOnload"
      />
      <Script
        src="https://widget.cloudinary.com/v2.0/global/all.js"
        strategy="lazyOnload"
      />

      {/* Processing Loader Overlay */}
      {isCheckingOut && (
        <div className="fixed inset-0 z-50 bg-zinc-950/90 backdrop-blur-sm flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 border-4 border-zinc-800 border-t-lime-400 rounded-full animate-spin" />
          <div className="text-center">
            <p className="text-sm font-black uppercase tracking-widest text-white">SEDANG MEMPROSES CHECKOUT...</p>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Jangan menutup halaman ini</p>
          </div>
        </div>
      )}

      <header className="mb-12">
        <h1 className="text-5xl font-black tracking-tighter uppercase mb-2 text-white">Shopping Bag</h1>
        <div className="flex items-center gap-4">
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em]">
            {items.length} Items ready for checkout
          </p>
          <div className="h-px grow bg-zinc-900" />
        </div>
      </header>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-8 bg-zinc-900 rounded-[3rem] border border-zinc-800">
          <div className="w-24 h-24 rounded-full bg-zinc-950 flex items-center justify-center text-zinc-700">
            <ShoppingBag className="w-12 h-12" />
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-black tracking-tight mb-2 uppercase text-white">Keranjang Kosong</h2>
            <p className="text-zinc-500 text-[10px] uppercase tracking-[0.3em] font-black">Mari tambahkan beberapa item pilihan</p>
          </div>
          <Link 
            href="/products" 
            className="px-12 py-5 bg-white text-zinc-950 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:scale-105 transition-all flex items-center gap-3"
          >
            <ArrowLeft className="w-4 h-4 text-zinc-950" /> Mulai Belanja
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Items List */}
          <div className="lg:col-span-2 space-y-6">
            {items.map((item) => (
              <div key={item.id} className="group relative bg-zinc-900 p-6 rounded-4xl border border-zinc-800/80 flex gap-8 transition-all hover:border-zinc-700">
                <div className="w-32 h-40 bg-zinc-950 rounded-3xl overflow-hidden shrink-0">
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
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-lime-400 mb-1 block">
                          {item.variant.product.brand || 'UNBRANDED'}
                        </span>
                        <h3 className="text-lg font-black tracking-tight text-white">{item.variant.product.name}</h3>
                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1">
                          Varian: {item.variant.name}
                        </p>
                      </div>
                      <button 
                        onClick={() => handleRemove(item.id)}
                        className="p-3 text-zinc-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-full transition-all"
                        disabled={loading === item.id}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="text-xl font-black text-white">
                      IDR {(item.variant.price || item.variant.product.price).toLocaleString('id-ID')}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center bg-zinc-950 rounded-2xl p-1.5 border border-zinc-850">
                      <button 
                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                        className="p-2 hover:text-lime-400 transition-colors disabled:opacity-20 text-zinc-600"
                        disabled={item.quantity <= 1 || loading === item.id}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-12 text-center text-sm font-black text-white">{item.quantity}</span>
                      <button 
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                        className="p-2 hover:text-lime-400 transition-colors disabled:opacity-20 text-zinc-600"
                        disabled={loading === item.id}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="text-sm font-black text-zinc-500 uppercase tracking-widest">
                      Subtotal: <span className="text-white">IDR {((item.variant.price || item.variant.product.price) * item.quantity).toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Checkout & Payment Coordinator */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-8">
              <div className="bg-zinc-900 p-8 rounded-4xl border border-zinc-800 space-y-8">
                <h3 className="text-xl font-black tracking-tight uppercase text-white border-b border-zinc-800 pb-4">Ringkasan Pembayaran</h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between text-zinc-500 text-sm font-bold uppercase tracking-widest">
                    <span>Total Item</span>
                    <span className="text-white font-black">{items.reduce((s, i) => s + i.quantity, 0)}</span>
                  </div>
                  <div className="flex justify-between text-zinc-500 text-sm font-bold uppercase tracking-widest">
                    <span>Ongkos Kirim</span>
                    <span className="text-lime-400 font-black">GRATIS</span>
                  </div>
                  <div className="h-px bg-zinc-800 my-4" />
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm font-black uppercase tracking-widest text-zinc-500">Grand Total</span>
                    <span className="text-3xl font-black text-lime-400">IDR {calculateTotal().toLocaleString('id-ID')}</span>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Customer Information */}
                  <div className="space-y-4">
                    <div className="group">
                      <label htmlFor="customer-name" className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 block mb-2 px-1 group-focus-within:text-white transition-colors">Nama Lengkap Penerima</label>
                      <input 
                        id="customer-name"
                        type="text" 
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Contoh: Budi Santoso"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-5 text-sm focus:outline-none focus:ring-2 focus:ring-lime-400/20 focus:border-lime-400 transition-all text-white placeholder:text-zinc-700"
                      />
                    </div>

                    <div className="group">
                      <label htmlFor="customer-phone" className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 block mb-2 px-1 group-focus-within:text-white transition-colors">Nomor WhatsApp Penerima</label>
                      <input 
                        id="customer-phone"
                        type="tel" 
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="Contoh: 081234567890"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-5 text-sm focus:outline-none focus:ring-2 focus:ring-lime-400/20 focus:border-lime-400 transition-all text-white placeholder:text-zinc-700"
                      />
                    </div>
                  </div>

                  {/* Payment Method Selector */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 block px-1">Pilih Metode Pembayaran</span>
                    <div className="grid grid-cols-2 gap-3">
                      {/* Midtrans Card */}
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('MIDTRANS')}
                        className={`p-5 rounded-3xl border flex flex-col items-center gap-3 transition-all ${
                          paymentMethod === 'MIDTRANS'
                            ? 'border-lime-400 bg-lime-400/5 text-white'
                            : 'border-zinc-800 bg-zinc-950 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
                        }`}
                      >
                        <CreditCard className="w-6 h-6" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Otomatis / Qris</span>
                      </button>
                      
                      {/* Manual Transfer Card */}
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('MANUAL_TRANSFER')}
                        className={`p-5 rounded-3xl border flex flex-col items-center gap-3 transition-all ${
                          paymentMethod === 'MANUAL_TRANSFER'
                            ? 'border-lime-400 bg-lime-400/5 text-white'
                            : 'border-zinc-800 bg-zinc-950 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
                        }`}
                      >
                        <Landmark className="w-6 h-6" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Manual Transfer</span>
                      </button>
                    </div>
                  </div>

                  {/* Dynamic Manual Payment Sub-Flow */}
                  {paymentMethod === 'MANUAL_TRANSFER' && (
                    <div className="p-6 bg-zinc-950 rounded-3xl border border-zinc-800 space-y-6 animate-in fade-in slide-in-from-top-3 duration-300">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 block">Pilih Rekening Bank Tujuan</label>
                        <div className="space-y-2">
                          {bankAccounts.map((acc) => (
                            <label 
                              key={acc.id} 
                              className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                                selectedBankId === acc.id 
                                  ? 'border-lime-400 bg-lime-400/5 text-white' 
                                  : 'border-zinc-850 text-zinc-400 bg-zinc-900/50 hover:border-zinc-700'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <input 
                                  type="radio" 
                                  name="bankAccount" 
                                  value={acc.id} 
                                  checked={selectedBankId === acc.id}
                                  onChange={() => setSelectedBankId(acc.id)}
                                  className="accent-lime-400"
                                />
                                <div className="text-xs">
                                  <p className="font-black text-white">{acc.bankName}</p>
                                  <p className="text-[10px] text-zinc-500">{acc.accountHolder}</p>
                                </div>
                              </div>
                              <button 
                                type="button" 
                                onClick={(e) => {
                                  e.preventDefault();
                                  copyToClipboard(acc.accountNumber);
                                }}
                                className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-white transition-colors"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Cloudinary Upload Proof Trigger */}
                      <div className="space-y-3">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 block">Unggah Bukti Transfer</span>
                        {paymentProof ? (
                          <div className="relative rounded-2xl border border-zinc-800 overflow-hidden h-40 group">
                            <Image 
                              src={paymentProof} 
                              alt="Bukti Transfer" 
                              fill 
                              className="object-cover" 
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button 
                                type="button" 
                                onClick={handleUploadProof}
                                className="px-4 py-2 bg-white text-zinc-950 text-[10px] font-black uppercase tracking-wider rounded-xl hover:bg-zinc-200 transition-colors"
                              >
                                Ubah Foto
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={handleUploadProof}
                            disabled={isUploading}
                            className="w-full py-8 border-2 border-dashed border-zinc-800 hover:border-lime-400 rounded-2xl flex flex-col items-center justify-center gap-2 text-zinc-500 hover:text-white transition-all bg-zinc-900/30"
                          >
                            <span className="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center shrink-0 border border-zinc-800">
                              <Check className="w-5 h-5 text-zinc-500" />
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-widest">
                              {isUploading ? 'Menunggu unggahan...' : 'Klik untuk Unggah Bukti'}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Primary Call to Action */}
                  <button 
                    onClick={handleCheckoutProcess}
                    disabled={isCheckingOut}
                    className="w-full py-6 bg-white text-zinc-950 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCheckingOut ? 'MEMPROSES TRANSAKSI...' : (
                      <>BUAT PESANAN SEKARANG <ArrowRight className="w-5 h-4 text-zinc-950" /></>
                    )}
                  </button>
                </div>
              </div>
              
              <Link 
                href="/products" 
                className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 hover:text-white transition-colors"
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
