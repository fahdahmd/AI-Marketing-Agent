import type { Brand } from "@prisma/client";
import { buildBrandContextBlock } from "@/ai/context";

export function buildKeywordIdeasPrompt(brand: Brand, topic: string) {
  const system = `You are an SEO strategist. You generate keyword research ideas grounded in reasonable
inference from the topic and brand context. You NEVER invent specific search volume numbers,
difficulty scores, or ranking data — you only have knowledge of language and topics, not live
search data. Respond only with the requested JSON.`;

  const prompt = `${buildBrandContextBlock(brand)}

=== TOPIC ===
${topic}

Generate keyword research for this topic: related keywords, long-tail keyword phrases, the dominant
search intent, content ideas that would target this topic, and thematic keyword clusters.`;

  return { system, prompt };
}
