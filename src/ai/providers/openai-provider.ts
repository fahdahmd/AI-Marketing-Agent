import "server-only";
import OpenAI from "openai";
import { zodToJsonSchema } from "zod-to-json-schema";
import type {
  AIProvider,
  GenerateStructuredOptions,
  GenerateStructuredResult,
  GenerateTextOptions,
  GenerateTextResult,
} from "./ai-provider";

// Rough blended per-1K-token pricing used only for internal cost estimates
// shown in usage tracking — not billed to the customer directly.
const PRICE_PER_1K_INPUT_USD = 0.15;
const PRICE_PER_1K_OUTPUT_USD = 0.6;

function estimateCostUsd(promptTokens = 0, completionTokens = 0): number {
  return (promptTokens / 1000) * PRICE_PER_1K_INPUT_USD + (completionTokens / 1000) * PRICE_PER_1K_OUTPUT_USD;
}

export class OpenAIProvider implements AIProvider {
  readonly name = "openai";
  private client: OpenAI;
  private model: string;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not set. Set AI_PROVIDER=mock to use the mock provider instead.");
    }
    this.client = new OpenAI({ apiKey });
    this.model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  }

  async generateText(options: GenerateTextOptions): Promise<GenerateTextResult> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 1200,
      messages: [
        ...(options.system ? [{ role: "system" as const, content: options.system }] : []),
        { role: "user" as const, content: options.prompt },
      ],
    });

    const text = response.choices[0]?.message?.content ?? "";
    const usage = response.usage;

    return {
      text,
      model: this.model,
      promptTokens: usage?.prompt_tokens,
      completionTokens: usage?.completion_tokens,
      totalTokens: usage?.total_tokens,
      estimatedCostUsd: estimateCostUsd(usage?.prompt_tokens, usage?.completion_tokens),
    };
  }

  async generateStructured<T>(options: GenerateStructuredOptions<T>): Promise<GenerateStructuredResult<T>> {
    const jsonSchema = zodToJsonSchema(options.schema, options.schemaName);

    const response = await this.client.chat.completions.create({
      model: this.model,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 2000,
      messages: [
        ...(options.system ? [{ role: "system" as const, content: options.system }] : []),
        { role: "user" as const, content: options.prompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: options.schemaName,
          schema: jsonSchema as Record<string, unknown>,
          strict: false,
        },
      },
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    const usage = response.usage;

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error("AI provider returned invalid JSON.");
    }

    const result = options.schema.safeParse(parsed);
    if (!result.success) {
      throw new Error(`AI response failed schema validation: ${result.error.message}`);
    }

    return {
      data: result.data,
      model: this.model,
      promptTokens: usage?.prompt_tokens,
      completionTokens: usage?.completion_tokens,
      totalTokens: usage?.total_tokens,
      estimatedCostUsd: estimateCostUsd(usage?.prompt_tokens, usage?.completion_tokens),
    };
  }
}
