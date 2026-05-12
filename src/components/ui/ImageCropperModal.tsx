"use client";

import React, { useState, useRef } from "react";
import ReactCrop, { type Crop, centerCrop, makeAspectCrop, PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { X, Check, RotateCcw } from "lucide-react";
import { getCroppedImg } from "@/lib/crop-image";

interface ImageCropperModalProps {
  imageSrc: string;
  onCropComplete: (croppedFile: File, previewUrl: string) => void;
  onClose: () => void;
  aspectRatio?: number;
}

export function ImageCropperModal({ 
  imageSrc, 
  onCropComplete, 
  onClose,
  aspectRatio
}: Readonly<ImageCropperModalProps>) {
  const [crop, setCrop] = useState<Crop>();

  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [hasInteracted, setHasInteracted] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    
    let initialCrop: Crop;

    if (aspectRatio) {
      initialCrop = centerCrop(
        makeAspectCrop(
          {
            unit: "%",
            width: 90,
          },
          aspectRatio,
          width,
          height
        ),
        width,
        height
      );
    } else {
      initialCrop = centerCrop(
        {
          unit: "%",
          width: 90,
          height: 90,
        },
        width,
        height
      );
    }

    setCrop(initialCrop);
  };

  const handleClose = () => {
    if (hasInteracted) {
      const confirmClose = globalThis.confirm("Perubahan belum diterapkan. Yakin ingin membatalkan?");
      if (!confirmClose) return;
    }
    onClose();
  };

  const handleConfirm = async () => {
    if (!completedCrop || !imgRef.current) return;

    try {
      const croppedFile = await getCroppedImg(imgRef.current, completedCrop);
      const previewUrl = URL.createObjectURL(croppedFile);
      onCropComplete(croppedFile, previewUrl);
      onClose();
    } catch (e) {
      console.error("Error cropping image:", e);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-xl">
              <RotateCcw size={16} className="text-amber-500" />
            </div>
            <div>
              <h3 className="text-xs font-black text-white uppercase tracking-widest">Crop Image</h3>
              <p className="text-[9px] text-zinc-500 uppercase font-bold">
                {aspectRatio ? (
                  <>{aspectRatio > 1 ? 'Landscape Mode' : 'Portrait Mode'} ({Math.round(aspectRatio * 100) / 100}:1)</>
                ) : (
                  <>Bebas (Free Aspect Ratio)</>
                )}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={handleClose}
            className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Cropper Body */}
        <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-zinc-950/50">
          <ReactCrop
            crop={crop}
            onChange={(c) => {
              setCrop(c);
              if (!hasInteracted) setHasInteracted(true);
            }}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspectRatio}
            className="max-h-full"
          >
            <img 
              ref={imgRef}
              src={imageSrc} 
              alt="Crop" 
              onLoad={onImageLoad}
              className="max-w-full h-auto block"
            />
          </ReactCrop>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="px-6 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex items-center gap-2 px-8 py-3 bg-amber-500 text-zinc-950 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all active:scale-95 shadow-lg shadow-amber-500/20"
          >
            <Check size={16} />
            Terapkan Crop
          </button>
        </div>
      </div>
    </div>
  );
}
