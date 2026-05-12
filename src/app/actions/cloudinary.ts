'use server';

import { auth } from "@clerk/nextjs/server";
import { generateSignature } from "@/lib/cloudinary";

/**
 * Server Action to generate a Cloudinary signature for client-side signed uploads.
 */
export async function getCloudinarySignature(folder: string = "erlins-shop/products") {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const timestamp = Math.round(new Date().getTime() / 1000);
  const paramsToSign = {
    timestamp,
    folder,
  };

  const signature = generateSignature(paramsToSign);

  return {
    signature,
    timestamp,
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
  };
}
