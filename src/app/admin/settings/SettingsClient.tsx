'use client';

import React, { useState, type SyntheticEvent } from 'react';
import { 
  Save, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Globe, 
  Layout, 
  Mail, 
  Phone, 
  MapPin, 
  Image as ImageIcon,
  MessageSquare,
  Share2,
  Link as LinkIcon
} from 'lucide-react';
import { updateSettings } from '@/lib/actions/settings';
import { BatchImageUpload } from '@/components/ui/BatchImageUpload';
import { type Setting } from '@/db/schema';

interface SettingsClientProps {
  readonly initialSettings: Setting;
}

export default function SettingsClient({ initialSettings }: Readonly<SettingsClientProps>) {
  const [formData, setFormData] = useState<Setting>(initialSettings);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus(null);
    setFieldErrors({});

    try {
      const result = await updateSettings(formData);
      if (result.success) {
        setStatus({ type: 'success', message: 'Pengaturan berhasil diperbarui!' });
      } else {
        setStatus({ type: 'error', message: result.error || 'Gagal memperbarui pengaturan' });
        if (result.details) {
          setFieldErrors(result.details as Record<string, string[]>);
        }
      }
    } catch (error) {
      console.error('Settings update error:', error);
      setStatus({ type: 'error', message: 'Terjadi kesalahan sistem yang tidak terduga' });
    } finally {
      setIsLoading(false);
      // Clear status after 5 seconds if it's success
      if (status?.type === 'success') {
        setTimeout(() => setStatus(null), 5000);
      }
    }
  };

  const updateField = (field: keyof Setting, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear specific field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const renderError = (field: string) => {
    if (!fieldErrors[field]) return null;
    return (
      <p className="text-[10px] text-rose-500 font-bold uppercase tracking-wider mt-1 ml-1 animate-in fade-in slide-in-from-top-1 flex items-center gap-1">
        <AlertCircle size={10} />
        {fieldErrors[field][0]}
      </p>
    );
  };

  return (
    <div className="max-w-4xl mx-auto pb-20 px-4 sm:px-0">
      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Header with Save Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sticky top-0 z-20 bg-zinc-50/80 dark:bg-black/80 backdrop-blur-md py-4 border-b border-zinc-200 dark:border-zinc-800 mb-8">
          <div>
            <h1 className="text-2xl font-black tracking-tighter text-zinc-900 dark:text-white uppercase">Konfigurasi Toko</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-widest mt-1">Manage your storefront content and settings</p>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto px-8 py-4 bg-amber-500 text-zinc-950 text-xs font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-amber-600 transition-all flex items-center justify-center gap-3 shadow-xl shadow-amber-500/20 border border-amber-600/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5" />
                Simpan Perubahan
              </>
            )}
          </button>
        </div>

        {status && (
          <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${
            status.type === 'success' 
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
              : 'bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400'
          }`}>
            {status.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <p className="text-sm font-bold">{status.message}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Section 1: General Info */}
          <div className="space-y-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-3xl shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-zinc-500">
                <Globe size={18} />
              </div>
              <h2 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-white">General Settings</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-2 mb-6">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 ml-1">Logo Toko (Custom)</label>
                <BatchImageUpload
                  maxFiles={1}
                  aspectRatio="free"
                  folder="erlins-shop/branding"
                  onAllUploadsComplete={(urls: string[]) => {
                    setFormData(prev => ({ ...prev, logoUrl: urls[0] }));
                  }}
                  onRemoveExisting={() => {
                    setFormData(prev => ({ ...prev, logoUrl: '' }));
                  }}
                  existingImages={formData.logoUrl ? [formData.logoUrl] : []}
                />
                <p className="text-[9px] text-zinc-400 dark:text-zinc-600 font-medium uppercase tracking-widest mt-2 ml-1">
                  * Unggah logo format PNG/SVG transparan untuk hasil terbaik. Rasio bebas.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 ml-1">Nama Toko</label>
                <input
                  type="text"
                  required
                  value={formData.storeName}
                  onChange={(e) => updateField('storeName', e.target.value)}
                  className={`w-full bg-zinc-50 dark:bg-black border rounded-2xl px-6 py-4 text-sm focus:outline-none transition-all text-zinc-900 dark:text-white font-bold ${
                    fieldErrors.storeName ? 'border-rose-500/50 focus:border-rose-500' : 'border-zinc-200 dark:border-zinc-800 focus:border-amber-500'
                  }`}
                  placeholder="e.g. Erlinshop"
                />
                {renderError('storeName')}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 ml-1">Nomor WhatsApp</label>
                <input
                  type="text"
                  required
                  value={formData.whatsappNumber}
                  onChange={(e) => updateField('whatsappNumber', e.target.value.replace(/[^0-9]/g, ''))}
                  className={`w-full bg-zinc-50 dark:bg-black border rounded-2xl px-6 py-4 text-sm focus:outline-none transition-all text-zinc-900 dark:text-white font-bold ${
                    fieldErrors.whatsappNumber ? 'border-rose-500/50 focus:border-rose-500' : 'border-zinc-200 dark:border-zinc-800 focus:border-amber-500'
                  }`}
                  placeholder="e.g. 6281234567890"
                />
                {renderError('whatsappNumber')}
                <p className="text-[9px] text-zinc-400 dark:text-zinc-600 font-medium uppercase tracking-widest mt-1 ml-1">Gunakan kode negara tanpa "+" (cth: 6281...)</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 ml-1">Deskripsi Footer</label>
                <textarea
                  rows={4}
                  value={formData.footerDescription ?? ''}
                  onChange={(e) => updateField('footerDescription', e.target.value)}
                  className={`w-full bg-zinc-50 dark:bg-black border rounded-2xl px-6 py-4 text-sm focus:outline-none transition-all text-zinc-900 dark:text-white font-bold resize-none ${
                    fieldErrors.footerDescription ? 'border-rose-500/50 focus:border-rose-500' : 'border-zinc-200 dark:border-zinc-800 focus:border-amber-500'
                  }`}
                  placeholder="Deskripsi singkat toko untuk bagian footer..."
                />
                {renderError('footerDescription')}
              </div>
            </div>
          </div>

          {/* Section 2: Hero Branding */}
          <div className="space-y-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-3xl shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-zinc-500">
                <Layout size={18} />
              </div>
              <h2 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-white">Hero Branding</h2>
            </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 ml-1">Hero Slider Banner (21:9)</label>
                <BatchImageUpload
                  maxFiles={3}
                  aspectRatio="21:9"
                  folder="erlins-shop/hero"
                  onAllUploadsComplete={(urls: string[]) => {
                    const newSlides = urls.map(url => ({ 
                      url, 
                      title: formData.heroTitle ?? '', 
                      subtitle: formData.heroSubtitle ?? '' 
                    }));
                    setFormData(prev => ({ 
                      ...prev, 
                      heroImages: [...(prev.heroImages || []), ...newSlides].slice(0, 3) 
                    }));
                  }}
                  onRemoveExisting={(index: number) => {
                    setFormData(prev => ({ 
                      ...prev, 
                      heroImages: (prev.heroImages || []).filter((_, i) => i !== index) 
                    }));
                  }}
                  existingImages={(formData.heroImages || []).map(img => typeof img === 'string' ? img : img.url)}
                />
                <p className="text-[9px] text-zinc-400 dark:text-zinc-600 font-medium uppercase tracking-widest mt-2 ml-1">
                  * Maksimal 3 gambar. Rasio sinematik 21:9 sangat disarankan.
                </p>

                {/* Slide Metadata Manager */}
                {(formData.heroImages || []).length > 0 && (
                  <div className="mt-8 space-y-6 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                      Slide Metadata Manager
                    </h3>
                    
                    <div className="space-y-6">
                      {(formData.heroImages || []).map((slide, index) => {
                        const slideData = typeof slide === 'string' ? { url: slide, title: '', subtitle: '' } : slide;
                        return (
                          <div key={`${slideData.url}-${index}`} className="p-5 bg-zinc-50 dark:bg-black/40 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-4">
                            <div className="flex items-center gap-3">
                              <div className="w-16 h-10 rounded-lg overflow-hidden flex-none border border-zinc-200 dark:border-zinc-800">
                                <img src={slideData.url} alt={`Slide ${index + 1}`} className="w-full h-full object-cover" />
                              </div>
                              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Slide #{index + 1}</span>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-4">
                              <div className="space-y-1.5">
                                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-500 ml-1">Slide Title</label>
                                <input
                                  type="text"
                                  value={slideData.title}
                                  onChange={(e) => {
                                    const newImages = [...(formData.heroImages || [])];
                                    const current = newImages[index];
                                    if (typeof current === 'string') {
                                      newImages[index] = { url: current, title: e.target.value, subtitle: '' };
                                    } else {
                                      newImages[index] = { ...current, title: e.target.value };
                                    }
                                    setFormData(prev => ({ ...prev, heroImages: newImages }));
                                  }}
                                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-amber-500 transition-all text-zinc-900 dark:text-white font-bold"
                                  placeholder="Judul khusus untuk slide ini..."
                                />
                              </div>
                              
                              <div className="space-y-1.5">
                                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-500 ml-1">Slide Subtitle</label>
                                <textarea
                                  rows={2}
                                  value={slideData.subtitle}
                                  onChange={(e) => {
                                    const newImages = [...(formData.heroImages || [])];
                                    const current = newImages[index];
                                    if (typeof current === 'string') {
                                      newImages[index] = { url: current, title: '', subtitle: e.target.value };
                                    } else {
                                      newImages[index] = { ...current, subtitle: e.target.value };
                                    }
                                    setFormData(prev => ({ ...prev, heroImages: newImages }));
                                  }}
                                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-amber-500 transition-all text-zinc-900 dark:text-white font-bold resize-none"
                                  placeholder="Sub-judul khusus untuk slide ini..."
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
          </div>


          {/* Section 3: Contact Info */}
          <div className="space-y-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-3xl shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-zinc-500">
                <MapPin size={18} />
              </div>
              <h2 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-white">Contact & Location</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 ml-1">Alamat Kantor/Toko</label>
                <input
                  type="text"
                  value={formData.contactAddress ?? ''}
                  onChange={(e) => updateField('contactAddress', e.target.value)}
                  className={`w-full bg-zinc-50 dark:bg-black border rounded-2xl px-6 py-4 text-sm focus:outline-none transition-all text-zinc-900 dark:text-white font-bold ${
                    fieldErrors.contactAddress ? 'border-rose-500/50 focus:border-rose-500' : 'border-zinc-200 dark:border-zinc-800 focus:border-amber-500'
                  }`}
                  placeholder="Jl. Contoh No. 123..."
                />
                {renderError('contactAddress')}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 ml-1">Email Publik</label>
                <div className="relative">
                  <Mail className={`absolute left-6 top-1/2 -translate-y-1/2 ${fieldErrors.contactEmail ? 'text-rose-400' : 'text-zinc-400'}`} size={16} />
                  <input
                    type="email"
                    value={formData.contactEmail ?? ''}
                    onChange={(e) => updateField('contactEmail', e.target.value)}
                    className={`w-full bg-zinc-50 dark:bg-black border rounded-2xl pl-14 pr-6 py-4 text-sm focus:outline-none transition-all text-zinc-900 dark:text-white font-bold ${
                      fieldErrors.contactEmail ? 'border-rose-500/50 focus:border-rose-500' : 'border-zinc-200 dark:border-zinc-800 focus:border-amber-500'
                    }`}
                    placeholder="hello@erlinshop.com"
                  />
                </div>
                {renderError('contactEmail')}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 ml-1">Nomor Telepon</label>
                <div className="relative">
                  <Phone className={`absolute left-6 top-1/2 -translate-y-1/2 ${fieldErrors.contactPhone ? 'text-rose-400' : 'text-zinc-400'}`} size={16} />
                  <input
                    type="text"
                    value={formData.contactPhone ?? ''}
                    onChange={(e) => updateField('contactPhone', e.target.value)}
                    className={`w-full bg-zinc-50 dark:bg-black border rounded-2xl pl-14 pr-6 py-4 text-sm focus:outline-none transition-all text-zinc-900 dark:text-white font-bold ${
                      fieldErrors.contactPhone ? 'border-rose-500/50 focus:border-rose-500' : 'border-zinc-200 dark:border-zinc-800 focus:border-amber-500'
                    }`}
                    placeholder="+62 123..."
                  />
                </div>
                {renderError('contactPhone')}
              </div>
            </div>
          </div>

          {/* Section 4: Social Presence */}
          <div className="space-y-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-3xl shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-zinc-500">
                <Share2 size={18} />
              </div>
              <h2 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-white">Social Presence</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 ml-1">Instagram URL</label>
                <div className="relative">
                  <ImageIcon className={`absolute left-6 top-1/2 -translate-y-1/2 ${fieldErrors.instagramUrl ? 'text-rose-400' : 'text-zinc-400'}`} size={16} />
                  <input
                    type="text"
                    value={formData.instagramUrl ?? ''}
                    onChange={(e) => updateField('instagramUrl', e.target.value)}
                    className={`w-full bg-zinc-50 dark:bg-black border rounded-2xl pl-14 pr-6 py-4 text-sm focus:outline-none transition-all text-zinc-900 dark:text-white font-bold ${
                      fieldErrors.instagramUrl ? 'border-rose-500/50 focus:border-rose-500' : 'border-zinc-200 dark:border-zinc-800 focus:border-amber-500'
                    }`}
                    placeholder="https://instagram.com/..."
                  />
                </div>
                {renderError('instagramUrl')}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 ml-1">Facebook URL</label>
                <div className="relative">
                  <MessageSquare className={`absolute left-6 top-1/2 -translate-y-1/2 ${fieldErrors.facebookUrl ? 'text-rose-400' : 'text-zinc-400'}`} size={16} />
                  <input
                    type="text"
                    value={formData.facebookUrl ?? ''}
                    onChange={(e) => updateField('facebookUrl', e.target.value)}
                    className={`w-full bg-zinc-50 dark:bg-black border rounded-2xl pl-14 pr-6 py-4 text-sm focus:outline-none transition-all text-zinc-900 dark:text-white font-bold ${
                      fieldErrors.facebookUrl ? 'border-rose-500/50 focus:border-rose-500' : 'border-zinc-200 dark:border-zinc-800 focus:border-amber-500'
                    }`}
                    placeholder="https://facebook.com/..."
                  />
                </div>
                {renderError('facebookUrl')}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 ml-1">Twitter URL</label>
                <div className="relative">
                  <LinkIcon className={`absolute left-6 top-1/2 -translate-y-1/2 ${fieldErrors.twitterUrl ? 'text-rose-400' : 'text-zinc-400'}`} size={16} />
                  <input
                    type="text"
                    value={formData.twitterUrl ?? ''}
                    onChange={(e) => updateField('twitterUrl', e.target.value)}
                    className={`w-full bg-zinc-50 dark:bg-black border rounded-2xl pl-14 pr-6 py-4 text-sm focus:outline-none transition-all text-zinc-900 dark:text-white font-bold ${
                      fieldErrors.twitterUrl ? 'border-rose-500/50 focus:border-rose-500' : 'border-zinc-200 dark:border-zinc-800 focus:border-amber-500'
                    }`}
                    placeholder="https://twitter.com/..."
                  />
                </div>
                {renderError('twitterUrl')}
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
