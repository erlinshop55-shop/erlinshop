// 📁 File Target: d:\Erlinshop\src\app\admin\settings\SettingsClient.tsx
// 🎯 Purpose: Komponen antarmuka admin untuk konfigurasi CMS Toko dan Manajemen Rekening Bank CRUD (Zalora DNA).
// 🔗 Depends on: react, lucide-react, @/lib/actions/settings, @/app/actions/payment, @/components/ui/BatchImageUpload
// 💥 Used by (Blast Radius): Halaman pengaturan admin (/admin/settings)

'use client';

import React, { useState, useEffect, type SyntheticEvent } from 'react';
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
  Link as LinkIcon,
  Landmark,
  Plus,
  Edit2,
  Trash2,
  Eye
} from 'lucide-react';
import { updateSettings } from '@/lib/actions/settings';
import { getManualBankAccounts, addBankAccount, updateBankAccount, deleteBankAccount } from '@/app/actions/payment';
import { BatchImageUpload } from '@/components/ui/BatchImageUpload';
import { type Setting } from '@/db/schema';
import { toast } from 'sonner';

interface SettingsClientProps {
  readonly initialSettings: Setting;
}

export default function SettingsClient({ initialSettings }: Readonly<SettingsClientProps>) {
  const [activeTab, setActiveTab] = useState<'cms' | 'banks'>('cms');
  
  // Tab 1: CMS Settings State
  const [formData, setFormData] = useState<Setting>(initialSettings);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  // Tab 2: Bank Accounts CRUD State
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [isBanksLoading, setIsBanksLoading] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [editingBank, setEditingBank] = useState<any | null>(null); // null means adding new bank
  const [bankForm, setBankForm] = useState({
    bankName: '',
    accountNumber: '',
    accountHolder: '',
    isActive: true
  });

  // Fetch Bank Accounts when banks tab is active
  useEffect(() => {
    if (activeTab === 'banks') {
      fetchBanks();
    }
  }, [activeTab]);

  const fetchBanks = async () => {
    setIsBanksLoading(true);
    const res = await getManualBankAccounts();
    if (res.success && res.data) {
      setBankAccounts(res.data);
    } else {
      toast.error(res.error || "Gagal memuat daftar rekening bank");
    }
    setIsBanksLoading(false);
  };

  const handleSubmitSettings = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus(null);
    setFieldErrors({});

    try {
      const result = await updateSettings(formData);
      if (result.success) {
        setStatus({ type: 'success', message: 'Pengaturan berhasil diperbarui!' });
        toast.success("Pengaturan berhasil disimpan");
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
      if (status?.type === 'success') {
        setTimeout(() => setStatus(null), 5000);
      }
    }
  };

  const updateField = (field: keyof Setting, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

  // CRUD Actions for Banks
  const handleOpenAddBank = () => {
    setEditingBank(null);
    setBankForm({
      bankName: '',
      accountNumber: '',
      accountHolder: '',
      isActive: true
    });
    setShowBankModal(true);
  };

  const handleOpenEditBank = (bank: any) => {
    setEditingBank(bank);
    setBankForm({
      bankName: bank.bankName,
      accountNumber: bank.accountNumber,
      accountHolder: bank.accountHolder,
      isActive: bank.isActive
    });
    setShowBankModal(true);
  };

  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankForm.bankName.trim() || !bankForm.accountNumber.trim() || !bankForm.accountHolder.trim()) {
      toast.warning("Mohon isi semua data rekening!");
      return;
    }

    setIsBanksLoading(true);
    let res;
    if (editingBank) {
      res = await updateBankAccount(
        editingBank.id,
        bankForm.bankName,
        bankForm.accountNumber,
        bankForm.accountHolder,
        bankForm.isActive
      );
    } else {
      res = await addBankAccount(
        bankForm.bankName,
        bankForm.accountNumber,
        bankForm.accountHolder
      );
    }

    if (res.success) {
      toast.success(editingBank ? "Rekening berhasil diperbarui" : "Rekening berhasil ditambahkan");
      setShowBankModal(false);
      fetchBanks();
    } else {
      toast.error(res.error || "Gagal menyimpan rekening bank");
    }
    setIsBanksLoading(false);
  };

  const handleDeleteBank = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus rekening bank ini secara permanen?")) return;
    
    setIsBanksLoading(true);
    const res = await deleteBankAccount(id);
    if (res.success) {
      toast.success("Rekening berhasil dihapus");
      fetchBanks();
    } else {
      toast.error(res.error || "Gagal menghapus rekening");
    }
    setIsBanksLoading(false);
  };

  const handleToggleBankStatus = async (bank: any) => {
    setIsBanksLoading(true);
    const res = await updateBankAccount(
      bank.id,
      bank.bankName,
      bank.accountNumber,
      bank.accountHolder,
      !bank.isActive
    );
    if (res.success) {
      toast.success(`Rekening ${!bank.isActive ? 'diaktifkan' : 'dinonaktifkan'}`);
      fetchBanks();
    } else {
      toast.error(res.error || "Gagal mengubah status rekening");
    }
    setIsBanksLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto pb-20 px-4 sm:px-0 space-y-6">
      {/* Tab Navigation Menu */}
      <div className="flex gap-2 p-1.5 bg-zinc-100 dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('cms')}
          className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeTab === 'cms'
              ? 'bg-white dark:bg-zinc-900 text-zinc-950 dark:text-white shadow-sm border border-zinc-200/50 dark:border-zinc-800'
              : 'text-zinc-500 hover:text-zinc-950 dark:hover:text-white'
          }`}
        >
          <Globe className="w-4 h-4" />
          Storefront CMS
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('banks')}
          className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeTab === 'banks'
              ? 'bg-white dark:bg-zinc-900 text-zinc-950 dark:text-white shadow-sm border border-zinc-200/50 dark:border-zinc-800'
              : 'text-zinc-500 hover:text-zinc-950 dark:hover:text-white'
          }`}
        >
          <Landmark className="w-4 h-4" />
          Rekening Bank
        </button>
      </div>

      {/* TAB 1: STOREFRONT CMS */}
      {activeTab === 'cms' && (
        <form onSubmit={handleSubmitSettings} className="space-y-8">
          {/* Header with Save Button */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sticky top-0 z-20 bg-zinc-50/80 dark:bg-black/80 backdrop-blur-md py-4 border-b border-zinc-200 dark:border-zinc-800 mb-8">
            <div>
              <h1 className="text-2xl font-black tracking-tighter text-zinc-900 dark:text-white uppercase">Konfigurasi Toko</h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-widest mt-1 font-mono">CMS BRAND IDENTITY CONTROL</p>
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
      )}

      {/* TAB 2: REKENING BANK CRUD */}
      {activeTab === 'banks' && (
        <div className="space-y-6">
          {/* Header with Add Button */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-4 border-b border-zinc-200 dark:border-zinc-800">
            <div>
              <h1 className="text-2xl font-black tracking-tighter text-zinc-900 dark:text-white uppercase">Rekening Bank Manual</h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-widest mt-1 font-mono">ADMIN BANK CRUD PANEL</p>
            </div>
            <button
              type="button"
              onClick={handleOpenAddBank}
              className="w-full sm:w-auto px-6 py-4 bg-emerald-500 text-white text-xs font-black uppercase tracking-[0.15em] rounded-2xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 border border-emerald-600/15"
            >
              <Plus className="w-4 h-4" />
              Tambah Rekening
            </button>
          </div>

          {/* Loader */}
          {isBanksLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
            </div>
          )}

          {/* Banks Table / Grid List */}
          {!isBanksLoading && bankAccounts.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-zinc-950 rounded-3xl border border-zinc-250 dark:border-zinc-800/80 p-8 shadow-sm">
              <Landmark className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
              <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-white mb-1">Belum Ada Rekening Bank</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-550 font-bold uppercase tracking-widest">Tambahkan rekening pertama Anda untuk menerima pembayaran manual dari pembeli</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {bankAccounts.map((bank) => (
                <div 
                  key={bank.id} 
                  className={`p-6 rounded-3xl bg-white dark:bg-zinc-950 border transition-all flex flex-col justify-between space-y-6 shadow-sm ${
                    bank.isActive 
                      ? 'border-zinc-200 dark:border-zinc-800' 
                      : 'border-dashed border-zinc-200 dark:border-zinc-800 opacity-60'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-zinc-100 dark:bg-zinc-900 rounded-2xl text-zinc-500">
                        <Landmark size={20} />
                      </div>
                      <div>
                        <h4 className="font-mono text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">BANK</h4>
                        <p className="text-lg font-black text-zinc-900 dark:text-white leading-none mt-1">{bank.bankName}</p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase border tracking-wider ${
                      bank.isActive 
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                        : 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-500 border-zinc-500/20'
                    }`}>
                      {bank.isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>

                  <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-800/40 space-y-1">
                    <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Nomor Rekening</span>
                    <p className="font-mono text-xl font-black text-zinc-950 dark:text-white tracking-tight">{bank.accountNumber}</p>
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block font-bold mt-1 uppercase tracking-wider">A/N: {bank.accountHolder}</span>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-zinc-100 dark:border-zinc-900">
                    <button
                      type="button"
                      onClick={() => handleToggleBankStatus(bank)}
                      className={`text-[10px] font-black uppercase tracking-wider transition-all px-3.5 py-2 rounded-xl border ${
                        bank.isActive 
                          ? 'text-zinc-500 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900' 
                          : 'text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/5'
                      }`}
                    >
                      {bank.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEditBank(bank)}
                        className="p-3 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 rounded-xl transition-all"
                        title="Edit Rekening"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteBank(bank.id)}
                        className="p-3 text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 border border-transparent hover:border-rose-100 dark:hover:border-rose-500/20 rounded-xl transition-all"
                        title="Hapus Rekening"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Modal CRUD Bank Form */}
          {showBankModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-in fade-in duration-300">
              <form onSubmit={handleSaveBank} className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-350">
                <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 flex justify-between items-center">
                  <h3 className="text-lg font-black uppercase tracking-tighter text-zinc-900 dark:text-white flex items-center gap-2">
                    <Landmark className="w-5 h-5 text-amber-500" />
                    {editingBank ? 'Edit Rekening Bank' : 'Tambah Rekening Bank'}
                  </h3>
                </div>

                <div className="p-6 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 block ml-1">Nama Bank</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. BCA, MANDIRI, BNI"
                      value={bankForm.bankName}
                      onChange={(e) => setBankForm(prev => ({ ...prev, bankName: e.target.value.toUpperCase() }))}
                      className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-amber-500 transition-all text-zinc-900 dark:text-white font-bold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 block ml-1">Nomor Rekening</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 1234567890"
                      value={bankForm.accountNumber}
                      onChange={(e) => setBankForm(prev => ({ ...prev, accountNumber: e.target.value.replace(/[^0-9-]/g, '') }))}
                      className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-amber-500 transition-all text-zinc-900 dark:text-white font-bold font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 block ml-1">Nama Pemilik Rekening (Atas Nama)</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. ERLIN MANDASARI"
                      value={bankForm.accountHolder}
                      onChange={(e) => setBankForm(prev => ({ ...prev, accountHolder: e.target.value.toUpperCase() }))}
                      className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-amber-500 transition-all text-zinc-900 dark:text-white font-bold"
                    />
                  </div>
                </div>

                <div className="p-6 bg-zinc-50 dark:bg-zinc-950/50 border-t border-zinc-100 dark:border-zinc-850 flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowBankModal(false)}
                    className="px-5 py-3 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all text-zinc-500"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-amber-500 text-zinc-950 hover:bg-amber-600 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-md"
                  >
                    Simpan Rekening
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
