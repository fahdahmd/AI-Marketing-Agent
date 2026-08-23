export interface GenerateImageOptions {
  prompt: string;
  size?: "1024x1024" | "1792x1024" | "1024x1792";
}

export interface GenerateImageResult {
  /** Raw bytes of the generated image, so the caller can persist it via StorageProvider. */
  buffer: Buffer;
  contentType: string;
  provider: string;
  model: string;
  estimatedCostUsd?: number;
}

/**
 * Abstraction over any image-generation backend. Nothing else in the app
 * should call an image-generation SDK directly.
 */
export interface ImageProvider {
  readonly name: string;
  generateImage(options: GenerateImageOptions): Promise<GenerateImageResult>;
}
