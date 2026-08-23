import type { ZodType } from "zod";

export interface GenerateTextOptions {
  system?: string;
  prompt: string;
  temperature?: number;
  maxTokens?: number;
}

export interface UsageInfo {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  estimatedCostUsd?: number;
}

export interface GenerateTextResult extends UsageInfo {
  text: string;
  model: string;
}

export interface GenerateStructuredOptions<T> extends GenerateTextOptions {
  schema: ZodType<T>;
  schemaName: string;
}

export interface GenerateStructuredResult<T> extends UsageInfo {
  data: T;
  model: string;
}

/**
 * Abstraction over any text-generation backend. Campaign, social, SEO, and
 * recommendation generation all go through this — nothing else in the app
 * should call an LLM SDK directly.
 */
export interface AIProvider {
  readonly name: string;
  generateText(options: GenerateTextOptions): Promise<GenerateTextResult>;
  generateStructured<T>(options: GenerateStructuredOptions<T>): Promise<GenerateStructuredResult<T>>;
}
