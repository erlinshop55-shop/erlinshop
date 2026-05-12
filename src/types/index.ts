/**
 * Standard API response structure for Server Actions
 */
export interface ApiResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Cloudinary Upload Widget result structure
 */
export interface CloudinaryInfo {
  secure_url: string;
  public_id: string;
  format: string;
  width: number;
  height: number;
  resource_type: string;
  coordinates?: {
    custom?: unknown[];
  };
  [key: string]: unknown;
}


export interface CloudinaryResult {
  event?: string;
  info?: string | CloudinaryInfo;
}

/**
 * Pagination metadata and data wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  metadata: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
