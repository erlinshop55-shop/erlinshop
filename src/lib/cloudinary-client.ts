'use client';

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'erlins-unsigned';

/**
 * Upload single image langsung dari browser ke Cloudinary.
 * Tidak perlu server — unsigned upload preset.
 * Returns: secure_url yang akan disimpan ke Neon (products.images[])
 */
export async function uploadToCloudinary(file: File): Promise<string> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error('Cloudinary env variables tidak lengkap. Cek .env.local');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', 'erlins-shop/products');

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData },
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(
      `Cloudinary upload gagal: ${err.error?.message ?? response.statusText}`,
    );
  }

  const data = await response.json();
  return data.secure_url as string;
}

/**
 * Upload multiple images (max 5).
 * Returns: array of secure_urls
 */
export async function uploadMultipleImages(
  files: FileList | File[],
): Promise<string[]> {
  const fileArray = Array.from(files).slice(0, 5);
  return Promise.all(fileArray.map(uploadToCloudinary));
}
