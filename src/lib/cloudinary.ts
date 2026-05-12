import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Extracts the public_id from a Cloudinary URL and deletes the image.
 * Works for standard Cloudinary URLs.
 */
export async function deleteCloudinaryImage(imageUrl: string): Promise<boolean> {
  if (!imageUrl?.includes("cloudinary.com")) return false;

  try {
    const urlParts = imageUrl.split("/");
    const fileNameWithExt = urlParts.at(-1);
    
    if (!fileNameWithExt) return false;
    
    const publicId = fileNameWithExt.split(".")[0];
    
    if (publicId) {
      const result = await cloudinary.uploader.destroy(publicId);
      return result.result === "ok";
    }
    
    return false;
  } catch (error) {
    console.error("Failed to delete image from Cloudinary:", error);
    return false;
  }
}

/**
 * Generates a signature for signed uploads.
 * Requires parameters to be signed (e.g., timestamp, folder).
 */
export function generateSignature(paramsToSign: Record<string, any>) {
  return cloudinary.utils.api_sign_request(paramsToSign, process.env.CLOUDINARY_API_SECRET!);
}

export { cloudinary };
