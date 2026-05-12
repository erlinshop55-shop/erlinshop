export type PendingImageStatus = 'idle' | 'processing' | 'uploading' | 'success' | 'error';

export interface PendingImage {
  id: string;
  file: File;
  preview: string;
  status: PendingImageStatus;
  url?: string;
  error?: string;
  progress?: number;
}

export interface CloudinarySignatureResponse {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
}
