import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Construction } from 'lucide-react';

interface ComingSoonProps {
  title: string;
}

export default function ComingSoon({ title }: Readonly<ComingSoonProps>) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 pt-24 md:pt-32">
      <div className="max-w-md w-full bg-white rounded-3xl p-12 border border-slate-100 shadow-xl shadow-slate-200/50 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-neon/10 rounded-2xl flex items-center justify-center mx-auto mb-8 rotate-3">
          <Construction className="w-10 h-10 text-neon" />
        </div>
        
        <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900 mb-4">
          {title} <span className="text-neon block">Coming Soon</span>
        </h1>
        
        <p className="text-slate-500 font-medium mb-10 leading-relaxed">
          We're currently working hard to bring you this feature. Stay tuned for updates!
        </p>

        <Link 
          href="/" 
          className="inline-flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-neon hover:text-black transition-all group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
