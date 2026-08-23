import "server-only";
import type { ImageProvider } from "./image-provider";
import { MockImageProvider } from "./mock-image-provider";

let cached: ImageProvider | undefined;

export function getImageProvider(): ImageProvider {
  if (cached) return cached;

  const selected = process.env.AI_PROVIDER || "mock";

  if (selected === "openai" && process.env.OPENAI_API_KEY) {
    const { OpenAIImageProvider } = require("./openai-image-provider") as typeof import("./openai-image-provider");
    cached = new OpenAIImageProvider();
  } else {
    cached = new MockImageProvider();
  }

  return cached;
}

export * from "./image-provider";
