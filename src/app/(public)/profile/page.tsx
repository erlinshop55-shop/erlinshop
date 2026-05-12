// src/app/(public)/profile/page.tsx
import React from 'react';
import { Metadata } from 'next';
import { getCustomerOrders } from '@/app/actions/orders';
import TrackingForm from '@/components/public/profile/TrackingForm';
import LogoutButton from '@/components/public/profile/LogoutButton';
import { ShoppingBag, CreditCard, User } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'My Profile | Erlinshop',
  description: 'Manage your orders and profile information.',
};

export default async function ProfilePage() {
  const result = await getCustomerOrders();

  // State: Guest Session Not Found (Show Tracking Form)
  if (!result.success || !result.data) {
    return (
      <div className="min-h-screen bg-slate-50/50 pt-32 pb-20 px-4">
        <div className="container mx-auto">
          <TrackingForm />
        </div>
      </div>
    );
  }

  const customer = result.data;

  return (
    <div className="min-h-screen bg-slate-50/50 pt-32 pb-20">
      <div className="container mx-auto px-4">
        {/* Header Dashboard */}
        <div className="bg-white rounded-4xl p-8 md:p-12 mb-12 border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-neon/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
          
          <div className="relative flex flex-col md:flex-row items-center gap-8">
            <div className="w-24 h-24 bg-slate-900 rounded-3xl flex items-center justify-center text-neon text-3xl font-black">
              {customer.name.charAt(0).toUpperCase()}
            </div>
            <div className="text-center md:text-left">
              <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900">Hello, {customer.name}</h1>
              <p className="text-slate-500 font-medium mt-1">{customer.phoneNumber}</p>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-6">
                <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Total Pesanan</span>
                  <span className="text-lg font-black">{customer.orders.length}</span>
                </div>
                <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Customer ID</span>
                  <span className="text-xs font-mono font-bold text-slate-400">{customer.id}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Order History */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-black rounded-lg">
                <ShoppingBag className="w-4 h-4 text-neon" />
              </div>
              <h2 className="text-xl font-black uppercase tracking-tight">Order History</h2>
            </div>

            {customer.orders.length > 0 ? (
              <div className="space-y-6">
                {customer.orders.map((order) => {
                  const getStatusStyles = (status: string) => {
                    switch (status) {
                      case 'COMPLETED': return 'bg-green-100 text-green-700';
                      case 'CANCELLED': return 'bg-rose-100 text-rose-700';
                      case 'PROCESSING': return 'bg-blue-100 text-blue-700';
                      default: return 'bg-amber-100 text-amber-700';
                    }
                  };

                  return (
                    <div key={order.id} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                      <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                        <div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-black text-slate-900">{order.id}</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${getStatusStyles(order.status)}`}>
                              {order.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 font-medium mt-1">
                            {new Date(order.createdAt).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black text-slate-900">Rp {order.totalPrice.toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide">
                        {order.items.map((item: any) => (
                          <div key={item.id} className="flex items-center gap-4 min-w-[200px] bg-slate-50 rounded-2xl p-3 border border-slate-100">
                            <div className="w-12 h-12 bg-white rounded-lg overflow-hidden shrink-0 border border-slate-100">
                              {item.productImage ? (
                                <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                  <ShoppingBag className="w-5 h-5" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] font-bold text-slate-900 truncate uppercase tracking-tight">{item.productName}</p>
                              <p className="text-[9px] text-slate-500 font-medium">{item.variantName} • Qty {item.quantity}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-3xl py-20 text-center border border-dashed border-slate-200">
                <p className="text-slate-400 font-medium italic">You haven't placed any orders yet.</p>
                <Link href="/products" className="mt-4 inline-block text-xs font-black uppercase tracking-widest text-neon hover:underline">Start Shopping</Link>
              </div>
            )}
          </div>

          {/* Quick Menu */}
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight mb-8">Quick Menu</h2>
              <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm space-y-2">
                <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-colors group">
                  <div className="flex items-center gap-4">
                    <User className="w-5 h-5 text-slate-400 group-hover:text-slate-900" />
                    <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900">Edit Profile</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </button>
                <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-colors group">
                  <div className="flex items-center gap-4">
                    <CreditCard className="w-5 h-5 text-slate-400 group-hover:text-slate-900" />
                    <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900">Payment Methods</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </button>
                <div className="pt-4 mt-2 border-t border-slate-50">
                   <LogoutButton />
                </div>
              </div>
            </div>

            {/* Help Card */}
            <div className="bg-slate-900 rounded-3xl p-6 text-white relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-neon/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
               <h3 className="text-lg font-black uppercase tracking-tight mb-2">Need Help?</h3>
               <p className="text-slate-400 text-xs mb-6">Our support team is available 24/7 to assist with your orders.</p>
               <Link href="/faq" className="block w-full py-3 bg-neon text-black text-center rounded-xl text-[10px] font-black uppercase tracking-widest">Contact Support</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChevronRight({ className }: Readonly<{ className?: string }>) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
    </svg>
  );
}
