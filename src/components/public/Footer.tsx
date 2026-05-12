import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer({ settings }: Readonly<{ settings: any }>) {
  const storeName = settings?.storeName || 'Erlinshop';
  const nameParts = storeName.split(' ');
  const firstWord = nameParts[0];
  const restOfName = nameParts.slice(1).join(' ');

  return (
    <footer className="relative bg-white/70 backdrop-blur-xl border-t border-gray-200 pt-20 pb-10 overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-neon/5 blur-[120px] -translate-y-1/2"></div>
      <div className="container relative z-10 mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-3 group">
              {settings?.logoUrl ? (
                <div className="relative h-10 w-10 overflow-hidden rounded-xl shadow-lg shadow-zinc-200 border border-zinc-100 shrink-0">
                  <Image
                    src={settings.logoUrl}
                    alt={storeName}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 bg-zinc-950 rounded-xl flex items-center justify-center rotate-3 shadow-lg shadow-zinc-200 shrink-0">
                  <ShoppingBag className="text-white w-6 h-6" />
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-tighter text-zinc-950 uppercase leading-none">
                  {storeName.toLowerCase().includes('erlinshop') ? (
                    <>Erlin<span className="text-amber-600">shop</span></>
                  ) : (
                    <>
                      {firstWord}
                      {restOfName && <span className="text-amber-600"> {restOfName}</span>}
                    </>
                  )}
                </span>
                <span className="text-[8px] font-bold tracking-[0.3em] text-zinc-400 uppercase leading-none mt-1">Premium Store</span>
              </div>
            </Link>
            <p className="text-muted-foreground leading-relaxed text-sm">
              {settings?.footerDescription || 'Premium quality essentials for your lifestyle. We curate the best products from around the world to bring you excellence and style.'}
            </p>
            <div className="flex items-center gap-4">
              {settings?.instagramUrl && (
                <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-amber-600 hover:text-white transition-all group" aria-label="Instagram">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
              )}
              {settings?.facebookUrl && (
                <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-amber-600 hover:text-white transition-all" aria-label="Facebook">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.324v-21.35c0-.732-.593-1.325-1.325-1.325z"/></svg>
                </a>
              )}
              {settings?.twitterUrl && (
                <a href={settings.twitterUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-amber-600 hover:text-white transition-all" aria-label="X (Twitter)">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932 6.064-6.932zm-1.292 19.494h2.039L6.486 3.24H4.298l13.311 17.407z"/></svg>
                </a>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-black uppercase tracking-widest mb-6">Navigasi</h4>
            <ul className="space-y-4">
              <li><Link href="/" className="text-muted-foreground hover:text-amber-600 transition-colors text-sm font-medium">Beranda</Link></li>
              <li><Link href="/products" className="text-muted-foreground hover:text-amber-600 transition-colors text-sm font-medium">Katalog</Link></li>
              <li><Link href="/categories" className="text-muted-foreground hover:text-amber-600 transition-colors text-sm font-medium">Kategori</Link></li>
              <li><Link href="/about" className="text-muted-foreground hover:text-amber-600 transition-colors text-sm font-medium">Tentang Kami</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-sm font-black uppercase tracking-widest mb-6">Layanan</h4>
            <ul className="space-y-4">
              <li><Link href="/shipping" className="text-muted-foreground hover:text-amber-600 transition-colors text-sm font-medium">Pengiriman</Link></li>
              <li><Link href="/returns" className="text-muted-foreground hover:text-amber-600 transition-colors text-sm font-medium">Pengembalian</Link></li>
              <li><Link href="/faq" className="text-muted-foreground hover:text-amber-600 transition-colors text-sm font-medium">FAQ</Link></li>
              <li><Link href="/privacy" className="text-muted-foreground hover:text-amber-600 transition-colors text-sm font-medium">Privasi</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-black uppercase tracking-widest mb-6">Kontak Kami</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-amber-600 shrink-0" />
                <span className="text-muted-foreground text-sm">{settings?.contactAddress || 'Jl. Raya No. 123, Jakarta, Indonesia'}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-amber-600 shrink-0" />
                <span className="text-muted-foreground text-sm">{settings?.contactPhone || '+62 123 4567 890'}</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-amber-600 shrink-0" />
                <span className="text-muted-foreground text-sm">{settings?.contactEmail || 'hello@erlinshop.com'}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground font-medium">
            © {new Date().getFullYear()} {storeName}. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/2560px-Visa_Inc._logo.svg.png" alt="Visa" className="h-3 opacity-30 grayscale hover:grayscale-0 transition-all" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1280px-Mastercard-logo.svg.png" alt="Mastercard" className="h-5 opacity-30 grayscale hover:grayscale-0 transition-all" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/PayPal.svg/1200px-PayPal.svg.png" alt="PayPal" className="h-3 opacity-30 grayscale hover:grayscale-0 transition-all" />
          </div>
        </div>
      </div>
    </footer>
  );
}

