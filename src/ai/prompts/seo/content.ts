import type { Brand, Product } from "@prisma/client";
import { buildBrandContextBlock, buildProductContextBlock } from "@/ai/context";

const TYPE_GUIDANCE: Record<string, string> = {
  article: "Write a full-length, helpful SEO blog article that genuinely answers the searcher's question.",
  product_description: "Write persuasive, SEO-aware product description copy for an e-commerce product page.",
  landing_page: "Write conversion-focused landing page copy that is also SEO-aware.",
  faq: "Write a comprehensive FAQ-style page answering common questions about the topic.",
};

export function buildSEOContentPrompt(
  brand: Brand,
  product: Product | null,
  params: { type: string; topic: string }
) {
  const system = `You are an expert SEO content writer. You write genuinely useful, well-structured content
that satisfies search intent — not keyword-stuffed filler. Use the brand's voice. Never claim or
imply guaranteed search rankings. Write the article field in markdown with headings matching the
outline. Respond only with the requested JSON.`;

  const prompt = `${buildBrandContextBlock(brand)}

=== PRODUCT CONTEXT ===
${buildProductContextBlock(product)}

=== CONTENT REQUEST ===
Type: ${params.type}
Guidance: ${TYPE_GUIDANCE[params.type] ?? TYPE_GUIDANCE.article}
Topic / primary keyword focus: ${params.topic}

Produce the primary keyword, secondary keywords, search intent, SEO title, meta title, meta
description, an outline, the full content, an FAQ section, and internal link suggestions.`;

  return { system, prompt };
}
