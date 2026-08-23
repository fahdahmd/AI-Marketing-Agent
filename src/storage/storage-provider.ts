export interface UploadInput {
  buffer: Buffer;
  filename: string;
  contentType: string;
  folder: string;
}

export interface UploadResult {
  url: string;
  key: string;
}

export interface StorageProvider {
  readonly name: string;
  upload(input: UploadInput): Promise<UploadResult>;
  delete(key: string): Promise<void>;
}

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8MB
export const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

export function assertValidImageFile(file: File) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error(`Unsupported file type: ${file.type}. Allowed: ${ALLOWED_IMAGE_TYPES.join(", ")}`);
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(`File too large. Max size is ${MAX_UPLOAD_BYTES / 1024 / 1024}MB.`);
  }
}
