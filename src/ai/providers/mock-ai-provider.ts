import type {
  AIProvider,
  GenerateStructuredOptions,
  GenerateStructuredResult,
  GenerateTextOptions,
  GenerateTextResult,
} from "./ai-provider";
import { mockFromZodSchema } from "./mock-data-generator";

/**
 * Deterministic, zero-cost provider used whenever AI_PROVIDER is unset or
 * "mock", and automatically in test environments. Lets the entire product
 * be exercised end-to-end without external API credentials. All output is
 * clearly prefixed with "[MOCK]" so it's never confused with real AI output.
 */
export class MockAIProvider implements AIProvider {
  readonly name = "mock";

  async generateText(options: GenerateTextOptions): Promise<GenerateTextResult> {
    const snippet = options.prompt.slice(0, 140).replace(/\s+/g, " ").trim();
    return {
      text: `[MOCK AI OUTPUT] Generated in response to: "${snippet}${options.prompt.length > 140 ? "..." : ""}". Set AI_PROVIDER=openai and OPENAI_API_KEY to see real generations.`,
      model: "mock-ai-v1",
      promptTokens: Math.ceil(options.prompt.length / 4),
      completionTokens: 40,
      totalTokens: Math.ceil(options.prompt.length / 4) + 40,
      estimatedCostUsd: 0,
    };
  }

  async generateStructured<T>(options: GenerateStructuredOptions<T>): Promise<GenerateStructuredResult<T>> {
    const data = mockFromZodSchema(options.schema, options.schemaName);
    return {
      data,
      model: "mock-ai-v1",
      promptTokens: Math.ceil(options.prompt.length / 4),
      completionTokens: 120,
      totalTokens: Math.ceil(options.prompt.length / 4) + 120,
      estimatedCostUsd: 0,
    };
  }
}
