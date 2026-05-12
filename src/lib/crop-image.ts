

export async function getCroppedImg(
  image: HTMLImageElement,
  pixelCrop: { x: number; y: number; width: number; height: number }
): Promise<File> {
  // Defensive checks
  if (!pixelCrop.width || !pixelCrop.height) {
    throw new Error('Area potong tidak valid (lebar atau tinggi nol)');
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Gagal mendapatkan konteks canvas 2D');
  }

  // Calculate scaling factors between natural and rendered dimensions
  // Use clientWidth/Height as they are more reliable for rendered size
  const renderedWidth = image.width || image.clientWidth;
  const renderedHeight = image.height || image.clientHeight;

  if (!renderedWidth || !renderedHeight) {
    throw new Error('Gagal mendapatkan dimensi tampilan gambar');
  }

  const scaleX = image.naturalWidth / renderedWidth;
  const scaleY = image.naturalHeight / renderedHeight;

  // Set canvas size to the cropped area size (original resolution)
  canvas.width = Math.floor(pixelCrop.width * scaleX);
  canvas.height = Math.floor(pixelCrop.height * scaleY);

  // Set better image smoothing for quality
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.drawImage(
    image,
    pixelCrop.x * scaleX,
    pixelCrop.y * scaleY,
    pixelCrop.width * scaleX,
    pixelCrop.height * scaleY,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Gagal memproses data gambar (Canvas kosong)'));
        return;
      }
      const file = new File([blob], `cropped-${Date.now()}.jpg`, {
        type: 'image/jpeg',
        lastModified: Date.now(),
      });
      resolve(file);
    }, 'image/jpeg', 0.9);
  });
}
