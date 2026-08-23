import "server-only";
import type { AIProvider } from "./ai-provider";
import { MockAIProvider } from "./mock-ai-provider";

let cached: AIProvider | undefined;

export function getAIProvider(): AIProvider {
  if (cached) return cached;

  const selected = process.env.AI_PROVIDER || "mock";

  if (selected === "openai" && process.env.OPENAI_API_KEY) {
    const { OpenAIProvider } = require("./openai-provider") as typeof import("./openai-provider");
    cached = new OpenAIProvider();
  } else {
    cached = new MockAIProvider();
  }

  return cached;
}

export * from "./ai-provider";
