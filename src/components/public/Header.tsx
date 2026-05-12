'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, Menu, X } from 'lucide-react';
import { useCart } from '@/stores/cart';
import CartDrawer from './CartDrawer';

export default function Header({ settings }: Readonly<{ settings: any }>) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const items = useCart(state => state.items);
  const { toggleCart } = useCart();
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);

  const storeName = settings?.storeName || 'Erlinshop';
  // Optional: logical split for aesthetic (first word black, rest amber)
  const nameParts = storeName.split(' ');
  const firstWord = nameParts[0];
  const restOfName = nameParts.slice(1).join(' ');


  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(globalThis.window.scrollY > 10);
    };
    globalThis.window.addEventListener('scroll', handleScroll);
    return () => globalThis.window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled 
            ? 'bg-white/90 backdrop-blur-md border-b border-zinc-100 py-3 shadow-sm' 
            : 'bg-transparent py-6'
        }`}
      >
        <div className="container mx-auto px-4 flex items-center justify-between">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            {settings?.logoUrl ? (
              <div className="relative h-10 w-10 overflow-hidden rounded-xl shadow-lg shadow-zinc-200 border border-zinc-100 shrink-0">
                <Image
                  src={settings.logoUrl}
                  alt={storeName}
                  fill
                  className="object-cover"
                  priority={true}
                />
              </div>
            ) : (
              <div className="w-10 h-10 bg-zinc-950 rounded-xl flex items-center justify-center group-hover:bg-amber-600 transition-all shadow-xl shadow-zinc-200 shrink-0">
                <ShoppingBag className="text-white w-5 h-5" />
              </div>
            )}
            
            <div className="flex flex-col">
              <span className={`text-lg md:text-xl font-black tracking-tighter uppercase leading-none transition-colors duration-500 ${
                isScrolled ? 'text-zinc-950' : 'text-white'
              }`}>
                {storeName.toLowerCase().includes('erlinshop') ? (
                  <>Erlin<span className="text-amber-600">shop</span></>
                ) : (
                  <>
                    {firstWord}
                    {restOfName && <span className="text-amber-600"> {restOfName}</span>}
                  </>
                )}
              </span>
              <span className={`text-[8px] font-bold tracking-[0.3em] uppercase leading-none mt-1 transition-colors duration-500 ${
                isScrolled ? 'text-zinc-400' : 'text-white/60'
              }`}>Premium Store</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-10">
            <Link 
              href="/" 
              className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-500 ${
                isScrolled ? 'text-zinc-500 hover:text-zinc-950' : 'text-white hover:text-white/80'
              }`}
            >
              Beranda
            </Link>
            <Link 
              href="/products" 
              className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-500 border-b-2 pb-1 ${
                isScrolled ? 'text-zinc-950 border-zinc-950' : 'text-white border-white'
              }`}
            >
              Katalog
            </Link>
            <Link 
              href="/categories" 
              className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-500 ${
                isScrolled ? 'text-zinc-500 hover:text-zinc-950' : 'text-white hover:text-white/80'
              }`}
            >
              Kategori
            </Link>
            <Link 
              href="/about" 
              className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-500 ${
                isScrolled ? 'text-zinc-500 hover:text-zinc-950' : 'text-white hover:text-white/80'
              }`}
            >
              Tentang
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleCart}
              className={`p-2.5 hover:bg-zinc-50/10 rounded-full transition-colors duration-500 relative ${
                isScrolled ? 'text-zinc-950' : 'text-white'
              }`} 
              aria-label="Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-amber-600 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-in zoom-in">
                  {itemCount}
                </span>
              )}
            </button>
            <button 
              className={`md:hidden p-2.5 hover:bg-zinc-50/10 rounded-full transition-colors duration-500 ${
                isScrolled ? 'text-zinc-950' : 'text-white'
              }`}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle Menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-zinc-100 p-6 animate-in slide-in-from-top duration-300 shadow-2xl">
            <nav className="flex flex-col gap-6">
              <Link href="/" className="text-xs font-black uppercase tracking-widest p-2 hover:bg-zinc-50 rounded-lg transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Beranda</Link>
              <Link href="/products" className="text-xs font-black uppercase tracking-widest p-2 bg-zinc-50 rounded-lg transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Katalog</Link>
              <Link href="/categories" className="text-xs font-black uppercase tracking-widest p-2 hover:bg-zinc-50 rounded-lg transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Kategori</Link>
              <Link href="/about" className="text-xs font-black uppercase tracking-widest p-2 hover:bg-zinc-50 rounded-lg transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Tentang</Link>
            </nav>
          </div>
        )}
      </header>
      
      <CartDrawer />
    </>
  );
}
