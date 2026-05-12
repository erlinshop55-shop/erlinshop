'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeroSlide {
  url: string;
  title: string;
  subtitle: string;
}

interface HeroProps {
  readonly slides: HeroSlide[];
  readonly title: string | null;
  readonly subtitle: string | null;
}

export function Hero({ slides, title: defaultTitle, subtitle: defaultSubtitle }: HeroProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoSlideInterval = useRef<NodeJS.Timeout | null>(null);

  const displaySlides = slides.length > 0 
    ? slides 
    : [{ 
        url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop',
        title: defaultTitle || 'JELAJAHI KOLEKSI',
        subtitle: defaultSubtitle || 'Temukan kurasi produk premium terbaik untuk gaya hidup Anda.'
      }];

  const scrollTo = useCallback((index: number) => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const width = container.offsetWidth;
    container.scrollTo({
      left: width * index,
      behavior: 'smooth'
    });
    setActiveIndex(index);
  }, []);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const index = Math.round(container.scrollLeft / container.offsetWidth);
    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  }, [activeIndex]);

  const startAutoSlide = useCallback(() => {
    if (autoSlideInterval.current) clearInterval(autoSlideInterval.current);
    
    autoSlideInterval.current = setInterval(() => {
      if (!isPaused && displaySlides.length > 1) {
        const nextIndex = (activeIndex + 1) % displaySlides.length;
        scrollTo(nextIndex);
      }
    }, 5000);
  }, [activeIndex, isPaused, displaySlides.length, scrollTo]);

  useEffect(() => {
    startAutoSlide();
    return () => {
      if (autoSlideInterval.current) clearInterval(autoSlideInterval.current);
    };
  }, [startAutoSlide]);

  return (
    <div 
      className="relative w-full h-[80vh] md:h-screen overflow-hidden group bg-zinc-950"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* Slider Container */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex w-full h-full overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {displaySlides.map((slide, index) => (
          <div 
            key={`${slide.url}-${index}`}
            className="relative flex-none w-full h-full snap-start overflow-hidden"
          >
            <img 
              src={slide.url} 
              alt={slide.title || defaultTitle || `Banner ${index + 1}`} 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
            />
            
            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-linear-to-t from-zinc-950/90 via-zinc-950/20 to-transparent"></div>
            <div className="absolute inset-x-0 top-0 h-32 bg-linear-to-b from-zinc-950/50 to-transparent"></div>
            
            {/* Content Container */}
            <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-16 pb-16 md:pb-24 space-y-4 md:space-y-6">
              <div className={cn(
                "flex items-center gap-2 text-[10px] md:text-xs font-black uppercase tracking-[0.4em] text-white/60 transition-all duration-1000",
                activeIndex === index ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
              )}>
                Katalog <ChevronRight className="w-3 h-3" /> Semua Produk
              </div>
              
              <h1 className={cn(
                "text-3xl md:text-5xl lg:text-7xl font-black tracking-tighter text-white uppercase max-w-3xl leading-[0.85] transition-all duration-1000 delay-100",
                activeIndex === index ? "translate-y-0 opacity-100 scale-100" : "translate-y-8 opacity-0 scale-95"
              )}>
                {slide.title || defaultTitle}
              </h1>
              
              <p className={cn(
                "text-white/70 max-w-lg text-xs md:text-base leading-relaxed font-medium transition-all duration-1000 delay-200",
                activeIndex === index ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
              )}>
                {slide.subtitle || defaultSubtitle}
              </p>

              <div className={cn(
                "pt-4 transition-all duration-1000 delay-300",
                activeIndex === index ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
              )}>
                <button className="px-8 py-4 bg-white text-zinc-950 text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-amber-500 hover:text-zinc-950 transition-all active:scale-95 pointer-events-auto">
                  Belanja Sekarang
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Dots Navigation */}
      {displaySlides.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 z-10">
          {displaySlides.map((_, index) => (
            <button
              key={`dot-${index}`}
              type="button"
              onClick={() => scrollTo(index)}
              className={cn(
                "h-1.5 transition-all duration-500 rounded-full",
                activeIndex === index 
                  ? "w-12 bg-amber-500" 
                  : "w-3 bg-white/30 hover:bg-white/60 pointer-events-auto"
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Slide Indicators - Corner */}
      {displaySlides.length > 1 && (
        <div className="absolute top-8 right-12 bg-white/10 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/20 hidden md:block">
          <p className="text-[10px] font-black text-white tracking-[0.2em] uppercase">
            {activeIndex + 1} <span className="text-white/40 mx-1">/</span> {displaySlides.length}
          </p>
        </div>
      )}
    </div>
  );
}


