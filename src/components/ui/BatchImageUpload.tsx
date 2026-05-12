"use client";

import React, { useState, useEffect, useRef } from "react";
import { ImagePlus, Trash2, Loader2, AlertCircle, Play, Scissors } from "lucide-react";
import { toast } from "sonner";
import { PendingImage, PendingImageStatus } from "@/types/image-upload";
import { getCloudinarySignature } from "@/app/actions/cloudinary";
import { ImageCropperModal } from "./ImageCropperModal";

interface BatchImageUploadProps {
  onAllUploadsComplete: (urls: string[]) => void;
  onRemoveExisting?: (index: number) => void;
  onStatusChange?: (status: "idle" | "uploading") => void;
  existingImages?: string[];
  maxFiles?: number;
  aspectRatio?: string; // e.g. "3:4" or "21:9"
  folder?: string;
}

export function BatchImageUpload({ 
  onAllUploadsComplete, 
  onRemoveExisting,
  onStatusChange,
  existingImages = [],
  maxFiles = 10,
  aspectRatio = "3:4",
  folder = "erlins-shop/products"
}: Readonly<BatchImageUploadProps>) {
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [isUploadingAll, setIsUploadingAll] = useState(false);
  const [croppingImageId, setCroppingImageId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const blobUrlsRef = useRef<Set<string>>(new Set());

  // Parse numeric aspect ratio for the cropper component
  const numericRatio = React.useMemo(() => {
    if (aspectRatio === "free") return undefined;
    const [w, h] = aspectRatio.split(":").map(Number);
    const ratio = w / h;
    return Number.isNaN(ratio) ? undefined : ratio;
  }, [aspectRatio]);

  // Notify parent of status changes
  useEffect(() => {
    onStatusChange?.(isUploadingAll ? "uploading" : "idle");
  }, [isUploadingAll, onStatusChange]);

  // Cleanup all Blob URLs on unmount
  useEffect(() => {
    return () => {
      blobUrlsRef.current.forEach((url) => {
        URL.revokeObjectURL(url);
      });
      blobUrlsRef.current.clear();
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    // Total count including existing images and current pending
    const currentTotal = existingImages.length + pendingImages.length;
    if (currentTotal + selectedFiles.length > maxFiles) {
      toast.error(`Maksimal ${maxFiles} gambar diperbolehkan`);
      return;
    }

    const newPendingImages: PendingImage[] = selectedFiles.map((file) => {
      const url = URL.createObjectURL(file);
      blobUrlsRef.current.add(url);
      return {
        id: Math.random().toString(36).substring(7),
        file,
        preview: url,
        status: "idle",
      };
    });

    setPendingImages((prev) => [...prev, ...newPendingImages]);
    
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePendingImage = (id: string) => {
    setPendingImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target?.preview.startsWith("blob:")) {
        URL.revokeObjectURL(target.preview);
        blobUrlsRef.current.delete(target.preview);
      }
      return prev.filter((img) => img.id !== id);
    });
  };

  const handleCropComplete = (id: string, croppedFile: File, previewUrl: string) => {
    setPendingImages((prev) => {
      const exists = prev.some(img => img.id === id);
      if (!exists) return prev;

      return prev.map((img) => {
        if (img.id === id) {
          // Safety check: don't apply crop if already uploading or success
          if (img.status === "uploading" || img.status === "success") {
            return img;
          }

          // Cleanup old preview if it was a blob
          if (img.preview.startsWith("blob:")) {
            URL.revokeObjectURL(img.preview);
            blobUrlsRef.current.delete(img.preview);
          }
          blobUrlsRef.current.add(previewUrl);
          return { ...img, file: croppedFile, preview: previewUrl };
        }
        return img;
      });
    });
    setCroppingImageId(null);
    toast.success("Gambar berhasil dipotong");
  };

  const uploadSingleImage = async (img: PendingImage): Promise<string> => {
    updateImageStatus(img.id, "uploading");

    try {
      const signData = await getCloudinarySignature(folder);
      
      const formData = new FormData();
      formData.append("file", img.file);
      formData.append("signature", signData.signature);
      formData.append("timestamp", signData.timestamp.toString());
      formData.append("api_key", signData.apiKey ?? "");
      formData.append("folder", folder);

      const uploadUrl = `https://api.cloudinary.com/v1_1/${signData.cloudName}/image/upload`;
      const response = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Cloudinary error response:", errorData);
        throw new Error(errorData.error?.message || "Gagal mengunggah ke Cloudinary");
      }

      const result = await response.json();
      
      let finalUrl = result.secure_url;
      // Dynamic Cloudinary transformation based on aspect ratio
      if (aspectRatio && aspectRatio !== 'free') {
        finalUrl = finalUrl.replace("/upload/", `/upload/c_fill,ar_${aspectRatio.replace(':', ':')},g_auto/`);
      } else {
        finalUrl = finalUrl.replace("/upload/", `/upload/c_fill,g_auto/`);
      }

      updateImageStatus(img.id, "success", finalUrl);
      return finalUrl;
    } catch (error) {
      console.error("Upload error:", error);
      updateImageStatus(img.id, "error", undefined, "Gagal unggah");
      throw error;
    }
  };

  const updateImageStatus = (id: string, status: PendingImageStatus, url?: string, error?: string) => {
    setPendingImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, status, url, error } : img))
    );
  };

  const startBatchUpload = async () => {
    // Re-verify images to upload from current state
    const currentPending = [...pendingImages];
    const toUpload = currentPending.filter((img) => img.status === "idle" || img.status === "error");
    
    if (toUpload.length === 0) {
      toast.info("Tidak ada gambar baru untuk diunggah");
      return;
    }

    if (croppingImageId) {
      toast.error("Selesaikan pemotongan gambar terlebih dahulu");
      return;
    }

    setIsUploadingAll(true);
    const uploadedUrls: string[] = [];

    for (const img of toUpload) {
      try {
        // Double check if the image still exists and is still idle/error before starting
        const url = await uploadSingleImage(img);
        uploadedUrls.push(url);
      } catch (e) {
        console.error(`Failed to upload ${img.id}`, e);
      }
    }

    setIsUploadingAll(false);
    
    if (uploadedUrls.length > 0) {
      toast.success(`${uploadedUrls.length} gambar baru berhasil ditambahkan!`);
      onAllUploadsComplete(uploadedUrls);
      setPendingImages(prev => prev.filter(img => img.status !== 'success'));
    }
  };

  const currentCroppingImage = pendingImages.find(img => img.id === croppingImageId);

  return (
    <div className="space-y-6">
      {/* Cropper Modal */}
      {currentCroppingImage && (
        <ImageCropperModal
          imageSrc={currentCroppingImage.preview}
          onCropComplete={(file, url) => handleCropComplete(currentCroppingImage.id, file, url)}
          onClose={() => setCroppingImageId(null)}
          aspectRatio={numericRatio}
        />
      )}

      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-xs font-black uppercase tracking-widest text-zinc-950 dark:text-white">Galeri Media</h3>
          <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-tight">
            {existingImages.length} Existing • {pendingImages.length} Pending • Rasio {aspectRatio}
          </p>
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploadingAll || (existingImages.length + pendingImages.length) >= maxFiles}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 disabled:opacity-50 transition-all active:scale-95 shadow-lg"
        >
          <ImagePlus size={14} />
          Tambah Foto
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Unified Grid Gallery with Global Locking Overlay */}
      <div className="relative">
        {isUploadingAll && (
          <div className="absolute inset-0 z-50 bg-white/40 dark:bg-black/40 backdrop-blur-[1px] rounded-3xl flex items-center justify-center cursor-not-allowed animate-in fade-in duration-300">
            <div className="bg-white/90 dark:bg-zinc-900/90 p-4 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
              <Loader2 size={18} className="text-amber-500 animate-spin" />
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-950 dark:text-white">Batch Upload Aktif...</span>
            </div>
          </div>
        )}
        
        <div className={`grid grid-cols-2 sm:grid-cols-3 gap-3 ${isUploadingAll ? 'pointer-events-none' : ''}`}>
        {/* Existing Images */}
        {existingImages.map((url, idx) => (
          <div 
            key={`existing-${url}-${idx}`} 
            style={{ aspectRatio: numericRatio }}
            className="relative rounded-2xl overflow-hidden border border-emerald-100 dark:border-emerald-900 group bg-white dark:bg-zinc-900 shadow-sm hover:border-emerald-500 transition-all"
          >
            <img src={url} alt={`Aset ${idx}`} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            {/* Live Indicator Badge */}
            <div className="absolute top-2 left-2 px-2 py-1 bg-emerald-500 text-white text-[7px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1.5 shadow-lg shadow-emerald-500/20">
              <div className="w-1 h-1 bg-white rounded-full animate-pulse" />
              LIVE
            </div>

            <button
              type="button"
              onClick={() => {
                if (globalThis.confirm("Hapus gambar ini? Tindakan ini permanen setelah data disimpan.")) {
                  onRemoveExisting?.(idx);
                }
              }}
              disabled={isUploadingAll}
              className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-600 shadow-xl disabled:opacity-0 active:scale-90"
            >
              <Trash2 size={14} />
            </button>
            
            <div className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-zinc-950/80 text-white text-[8px] font-black uppercase tracking-widest rounded backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
              Cloud Asset
            </div>
          </div>
        ))}

        {/* Pending Images */}
        {pendingImages.map((img) => {
          const getStatusStyles = () => {
            if (img.status === 'error') return 'border-rose-200 dark:border-rose-900';
            if (img.status === 'uploading') return 'border-amber-400 animate-pulse';
            return 'border-dashed border-zinc-300 dark:border-zinc-700 hover:border-amber-500';
          };

          return (
            <div 
              key={img.id} 
              style={{ aspectRatio: numericRatio }}
              className={`relative rounded-2xl overflow-hidden border-2 group transition-all ${getStatusStyles()}`}
            >
            <img src={img.preview} alt="Pending" className="w-full h-full object-cover opacity-60" />
            
            {/* Status Overlays */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 p-2 text-center">
              {img.status === 'idle' && (
                <div className="space-y-1">
                  {croppingImageId === img.id ? (
                    <div className="bg-amber-500 text-zinc-950 text-[8px] font-black uppercase px-2 py-1 rounded animate-pulse">Sedang Dipotong</div>
                  ) : (
                    <div className="bg-zinc-950 text-white text-[8px] font-black uppercase px-2 py-1 rounded">Draft</div>
                  )}
                </div>
              )}
              {img.status === 'uploading' && (
                <div className="space-y-1">
                  <Loader2 size={20} className="text-amber-400 animate-spin mx-auto" />
                  <span className="text-[8px] font-black text-amber-400 uppercase">Proses...</span>
                </div>
              )}
              {img.status === 'error' && (
                <div className="space-y-1 animate-in zoom-in duration-200">
                  <AlertCircle size={20} className="text-rose-400 mx-auto" />
                  <span className="text-[8px] font-black text-rose-400 uppercase">Gagal Unggah</span>
                  {!isUploadingAll && (
                    <button
                      type="button"
                      onClick={() => uploadSingleImage(img)}
                      className="mt-2 px-2 py-1 bg-rose-500 text-white text-[7px] font-black uppercase tracking-widest rounded-lg hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20 active:scale-95"
                    >
                      Retry
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Action buttons for idle/error */}
            {(img.status === 'idle' || img.status === 'error') && (
              <div className="absolute top-2 right-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => removePendingImage(img.id)}
                  disabled={isUploadingAll || croppingImageId !== null}
                  className="p-1.5 bg-zinc-950 text-white rounded-lg hover:bg-rose-600 transition-all shadow-xl active:scale-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setCroppingImageId(img.id)}
                  disabled={isUploadingAll || croppingImageId !== null}
                  className="p-1.5 bg-amber-500 text-zinc-950 rounded-lg hover:bg-amber-600 transition-all shadow-xl active:scale-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Scissors size={14} />
                </button>
              </div>
            )}
            </div>
          );
        })}

        {/* Placeholder if empty */}
        {existingImages.length === 0 && pendingImages.length === 0 && (
          <div 
            style={{ aspectRatio: numericRatio }}
            className="col-span-full py-12 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl flex flex-col items-center justify-center text-zinc-400 bg-zinc-50/50 dark:bg-zinc-900/50 mt-3"
          >
            <ImagePlus size={32} className="mb-2 opacity-10" />
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Belum ada aset visual</p>
          </div>
        )}
      </div>
    </div>

      {/* Progress & Batch Actions */}
      {pendingImages.length > 0 && (
        <div className={`p-5 bg-amber-50 dark:bg-amber-950/20 rounded-3xl border border-amber-200 dark:border-amber-900/30 space-y-4 shadow-sm animate-in zoom-in-95 duration-300 ${isUploadingAll ? 'opacity-70 pointer-events-none' : ''}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-xl">
                <Play size={14} className="text-amber-600" fill="currentColor" />
              </div>
              <div>
                <p className="text-[10px] font-black text-zinc-950 dark:text-white uppercase tracking-widest">Antrean Batch</p>
                <p className="text-[9px] text-amber-700 dark:text-amber-500 font-bold uppercase">
                  {pendingImages.filter(i => i.status === 'success').length} / {pendingImages.length} Selesai
                </p>
              </div>
            </div>
            
            {!isUploadingAll && (
              <button
                type="button"
                onClick={startBatchUpload}
                disabled={pendingImages.every(img => img.status === 'success') || croppingImageId !== null}
                className="px-5 py-2.5 bg-amber-500 text-zinc-950 font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20 active:scale-95 border border-amber-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {croppingImageId ? "Selesaikan Crop..." : "Unggah Sekarang"}
              </button>
            )}
          </div>

          {/* Progress Bar */}
          <div className="h-1.5 w-full bg-amber-200/50 dark:bg-amber-900/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-amber-500 transition-all duration-500"
              style={{ 
                width: `${(pendingImages.filter(i => i.status === 'success').length / pendingImages.length) * 100}%` 
              }}
            />
          </div>

          <p className="text-[8px] text-amber-700 dark:text-amber-500 font-bold uppercase tracking-tight leading-relaxed italic opacity-80">
            * Gambar akan diproses secara sekuensial. Jangan tutup tab atau refresh halaman selama proses berlangsung.
          </p>
        </div>
      )}
    </div>
  );
}
