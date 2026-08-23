import "server-only";
import OpenAI from "openai";
import type { GenerateImageOptions, GenerateImageResult, ImageProvider } from "./image-provider";

const ESTIMATED_COST_PER_IMAGE_USD = 0.04;

export class OpenAIImageProvider implements ImageProvider {
  readonly name = "openai";
  private client: OpenAI;
  private model: string;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not set. Set AI_PROVIDER=mock to use the mock provider instead.");
    }
    this.client = new OpenAI({ apiKey });
    this.model = process.env.OPENAI_IMAGE_MODEL || "dall-e-3";
  }

  async generateImage(options: GenerateImageOptions): Promise<GenerateImageResult> {
    const response = await this.client.images.generate({
      model: this.model,
      prompt: options.prompt,
      size: options.size ?? "1024x1024",
      n: 1,
      response_format: "b64_json",
    });

    const b64 = response.data?.[0]?.b64_json;
    if (!b64) throw new Error("Image provider did not return image data.");

    return {
      buffer: Buffer.from(b64, "base64"),
      contentType: "image/png",
      provider: this.name,
      model: this.model,
      estimatedCostUsd: ESTIMATED_COST_PER_IMAGE_USD,
    };
  }
}
