'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageGalleryProps {
  readonly images: string[];
}

export default function ImageGallery({ images }: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="aspect-3/4 rounded-3xl bg-zinc-50 flex items-center justify-center border border-zinc-100">
        <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs">Foto tidak tersedia</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Main Image Viewport */}
      <div className="relative aspect-3/4 rounded-4xl overflow-hidden bg-zinc-50 border border-zinc-100 group shadow-xl shadow-zinc-200/50">
        <Image
          src={images[activeIndex]}
          alt="Product Showcase"
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        
        {/* Navigation Overlays */}
        {images.length > 1 && (
          <div className="absolute inset-0 flex items-center justify-between px-6 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setActiveIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
              }}
              className="pointer-events-auto p-4 rounded-full bg-white/80 backdrop-blur-xl border border-zinc-200 text-zinc-950 hover:bg-zinc-950 hover:text-white transition-all transform hover:scale-110 active:scale-95"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setActiveIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
              }}
              className="pointer-events-auto p-4 rounded-full bg-white/80 backdrop-blur-xl border border-zinc-200 text-zinc-950 hover:bg-zinc-950 hover:text-white transition-all transform hover:scale-110 active:scale-95"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        )}

        {/* Counter Badge */}
        {images.length > 1 && (
          <div className="absolute bottom-6 right-6 px-4 py-2 bg-white/80 backdrop-blur-md rounded-full border border-zinc-200 text-[10px] font-black text-zinc-950 uppercase tracking-widest">
            {activeIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Interactive Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-1">
          {images.map((img, idx) => (
            <button
              key={img}
              onClick={() => setActiveIndex(idx)}
              className={`relative w-24 aspect-3/4 rounded-2xl overflow-hidden shrink-0 transition-all duration-300 ${
                activeIndex === idx 
                  ? 'ring-2 ring-zinc-950 ring-offset-4 ring-offset-white scale-105 z-10 shadow-lg shadow-zinc-200' 
                  : 'opacity-40 hover:opacity-80'
              }`}
            >
              <Image
                src={img}
                alt={`Product angle ${idx + 1}`}
                fill
                className="object-cover"
                sizes="96px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
