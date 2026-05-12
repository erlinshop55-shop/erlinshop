import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/db';
import { categories } from '@/db/schema';
import { isNull, asc } from 'drizzle-orm';
import { ChevronRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Categories | Erlinshop',
  description: 'Explore our curated collections by category.',
};

export default async function CategoriesPage() {
  // Ambil kategori utama (parentId is null)
  const mainCategories = await db.query.categories.findMany({
    where: isNull(categories.parentId),
    orderBy: [asc(categories.order)],
    with: {
      children: true,
    }
  });

  return (
    <div className="min-h-screen bg-slate-50/50 pt-24 md:pt-32 pb-20">
      {/* Hero Header */}
      <div className="bg-white border-b border-slate-100 py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900 mb-2">
            Explore <span className="text-neon">Categories</span>
          </h1>
          <p className="text-slate-500 font-medium">Browse our curated collections for your lifestyle.</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {mainCategories.map((category) => (
            <div 
              key={category.id} 
              className="group bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500"
            >
              {/* Category Image */}
              <div className="relative aspect-video overflow-hidden bg-slate-100">
                {category.image ? (
                  <img 
                    src={category.image} 
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <span className="font-bold text-4xl uppercase tracking-widest">{category.name.charAt(0)}</span>
                  </div>
                )}
                {/* Overlay */}
                <div className="absolute inset-0 bg-linear-to-t from-slate-900/60 to-transparent opacity-60"></div>
                <div className="absolute bottom-6 left-6">
                  <h2 className="text-2xl font-black text-white uppercase tracking-tight">{category.name}</h2>
                </div>
              </div>

              {/* Sub-categories or Actions */}
              <div className="p-6">
                {category.children && category.children.length > 0 ? (
                  <div className="space-y-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Sub Categories</span>
                    <div className="flex flex-wrap gap-2">
                      {category.children.map((child) => (
                        <Link 
                          key={child.id}
                          href={`/products?category=${child.id}`}
                          className="px-3 py-1.5 bg-slate-50 hover:bg-neon hover:text-black border border-slate-100 rounded-lg text-xs font-bold text-slate-600 transition-all"
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 mb-4">Explore the best of {category.name} collection.</p>
                )}

                <div className="mt-8 pt-6 border-t border-slate-50 flex justify-between items-center">
                  <Link 
                    href={`/products?category=${category.id}`}
                    className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-900 hover:text-neon transition-colors"
                  >
                    View Collection
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                  <span className="text-[10px] font-mono text-slate-300 font-bold">{category.children?.length || 0} ITEMS</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {mainCategories.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
            <p className="text-slate-400 font-medium italic">No categories found yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
