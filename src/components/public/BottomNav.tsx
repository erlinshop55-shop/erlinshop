
'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Grid, ShoppingBag, User } from 'lucide-react';
import { useCart } from '@/stores/cart';

export default function BottomNav() {
  const pathname = usePathname();
  const items = useCart(state => state.items);
  const itemCount = items.reduce((total, i) => total + i.quantity, 0);

  const navItems = [
    { name: 'Home', icon: Home, href: '/' },
    { name: 'Kategori', icon: Grid, href: '/categories' },
    { name: 'Keranjang', icon: ShoppingBag, href: '/cart', badge: itemCount },
    { name: 'Akun', icon: User, href: '/profile' },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-t border-gray-200 px-6 py-3">
      <div className="flex items-center justify-between max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={`flex flex-col items-center gap-1 transition-all ${
                isActive ? 'text-amber-600 scale-110' : 'text-muted-foreground'
              }`}
            >
              <div className="relative">
                <item.icon className={`w-6 h-6 ${isActive ? 'stroke-[3px]' : 'stroke-[2px]'}`} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-2 -right-2 w-4 h-4 bg-rose-600 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-widest ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
