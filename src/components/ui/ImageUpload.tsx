"use client";

import { CldUploadWidget } from "next-cloudinary";
import { CloudinaryResult } from "@/types";
import { useState, useEffect } from "react";
import { Trash2, ImagePlus } from "lucide-react";

interface ImageUploadProps {
  onUpload: (url: string) => void;
  onRemove?: (url: string) => void;
  defaultImages?: string[];
}

export function ImageUpload({ onUpload, onRemove, defaultImages = [] }: Readonly<ImageUploadProps>) {
  const [images, setImages] = useState<string[]>(defaultImages);

  // Sync with defaultImages when they change (e.g. when opening modal for different products)
  useEffect(() => {
    setImages(defaultImages);
  }, [defaultImages]);

  const handleUploadSuccess = (result: CloudinaryResult) => {
    const info = result?.info;
    if (typeof info === "object" && info?.secure_url) {
      let url = info.secure_url;
      
      // If custom coordinates exist (user cropped), force the URL to use them
      if (info.coordinates?.custom) {
        // Insert c_crop,g_custom after /upload/
        url = url.replace("/upload/", "/upload/c_crop,g_custom/");
      } else {
        // Failsafe: if no coordinates but we want to force 3:4 aspect in Cloudinary
        url = url.replace("/upload/", "/upload/c_fill,ar_3:4,g_auto/");
      }

      setImages(prev => [...prev, url]);
      onUpload(url);
    }
  };

  const handleRemove = (url: string) => {
    const newImages = images.filter(img => img !== url);
    setImages(newImages);
    if (onRemove) {
      onRemove(url);
    }
  };

  return (
    <div className="space-y-4">
      <CldUploadWidget 
        uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "erlins-unsigned"} 
        onSuccess={handleUploadSuccess}
        onError={(error) => {
          console.error("Cloudinary Upload Error Details:", {
            error,
            preset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
            cloud: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
          });
        }}
        options={{
          multiple: true,
          maxFiles: 5,
          clientAllowedFormats: ["jpg", "png", "jpeg", "webp"],
          maxFileSize: 5000000, // 5MB
          sources: ["local", "url", "camera"],
          showAdvancedOptions: false,
          cropping: true,
          showSkipCropButton: false,
          croppingAspectRatio: 0.75, // 3:4 ratio
          croppingShowDimensions: true,
          showCompletedButton: true, // Wait for user to click "Done"
          singleUploadAutoClose: false, // Don't close immediately
          folder: "erlins-shop/products", 
        }}
      >
        {({ open }) => {
          return (
            <button
              type="button"
              onClick={() => open()}
              className="w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-zinc-200 rounded-xl py-8 hover:border-amber-500 hover:bg-amber-50 transition-all group bg-white"
            >
              <div className="p-3 bg-zinc-50 rounded-full group-hover:bg-amber-100 transition-colors">
                <ImagePlus className="text-zinc-400 group-hover:text-amber-600" size={24} />
              </div>
              <div className="text-sm font-black text-zinc-600 group-hover:text-zinc-950 uppercase tracking-widest">
                Unggah Aset Visual
              </div>
              <div className="text-[10px] text-zinc-400 uppercase font-bold">
                Max 5 Gambar (Rasio 3:4 Wajib)
              </div>
            </button>
          );
        }}
      </CldUploadWidget>

      {/* Preview Section */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {images.map((img, idx) => (
            <div key={`${img}-${idx}`} className="relative aspect-square rounded-xl overflow-hidden border border-zinc-200 group bg-white shadow-sm hover:border-amber-500 transition-all">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt={`Uploaded ${idx}`} className="object-cover w-full h-full" />
              <button 
                type="button"
                onClick={() => handleRemove(img)}
                className="absolute top-1.5 right-1.5 p-1.5 bg-rose-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600 shadow-xl"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
