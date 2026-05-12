import fs from 'node:fs/promises';
import path from 'node:path';
import { FileText, Clock, ShieldCheck } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminDocsPage() {
  let content = 'No internal documentation available in production environment.';
  let lastUpdated = 'N/A';

  try {
    const memoryPath = path.join(process.cwd(), 'memory.md');
    
    // Check if file exists first to avoid ENOENT logs in production
    const exists = await fs.access(memoryPath).then(() => true).catch(() => false);
    
    if (exists) {
      content = await fs.readFile(memoryPath, 'utf-8');
      const stats = await fs.stat(memoryPath);
      lastUpdated = stats.mtime.toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } else {
      console.log('AdminDocs: memory.md not found, using default message.');
    }
  } catch (error) {
    console.error('Error loading internal documentation:', error);
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-neon/10 rounded-lg">
              <FileText className="w-5 h-5 text-neon" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-neon">Internal Systems</span>
          </div>
          <h1 className="text-4xl font-black bg-linear-to-br from-[#B28D27] via-[#D4AF37] to-[#F9D976] bg-clip-text text-transparent tracking-tighter uppercase leading-none">
            Project Memory
          </h1>
          <p className="bg-linear-to-r from-[#B28D27] to-[#F9D976] bg-clip-text text-transparent mt-2 text-[10px] font-black uppercase tracking-[0.3em]">
            Technical source of truth & architectural documentation
          </p>
        </div>
        
        <div className="flex items-center gap-6 px-6 py-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm dark:shadow-none">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-zinc-500" />
            <div className="text-[9px] uppercase tracking-widest">
              <p className="text-zinc-500 font-bold">Last Sync</p>
              <p className="text-zinc-900 dark:text-white font-black">{lastUpdated}</p>
            </div>
          </div>
          <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-800" />
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <div className="text-[9px] uppercase tracking-widest">
              <p className="text-zinc-500 font-bold">Status</p>
              <p className="text-emerald-600 dark:text-emerald-500 font-black">Verified</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-[32px] overflow-hidden shadow-xl dark:shadow-2xl dark:shadow-black/50">
        <div className="flex items-center justify-between px-8 py-4 bg-zinc-50 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/20 border border-rose-500/40" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-500/40" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/40" />
          </div>
          <span className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-400 dark:text-zinc-600">memory.md — readonly</span>
        </div>
        
        <div className="p-10 md:p-16">
          <pre className="text-sm font-medium text-zinc-600 dark:text-zinc-400 leading-relaxed overflow-x-auto whitespace-pre-wrap selection:bg-amber-400 selection:text-black">
            {content}
          </pre>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm dark:shadow-none">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2 text-center">Tech Stack</h4>
          <p className="text-xs font-bold text-zinc-900 dark:text-white text-center">Next.js 15 • Drizzle • Neon</p>
        </div>
        <div className="p-6 bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm dark:shadow-none">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2 text-center">Security</h4>
          <p className="text-xs font-bold text-zinc-900 dark:text-white text-center">Clerk Auth • Server Actions</p>
        </div>
        <div className="p-6 bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm dark:shadow-none">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2 text-center">Deployment</h4>
          <p className="text-xs font-bold text-zinc-900 dark:text-white text-center">Vercel • GitHub Sync</p>
        </div>
      </div>
    </div>
  );
}
