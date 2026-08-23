import type { Brand } from "@prisma/client";
import type { RuleFinding } from "@/recommendations/rules";
import { buildBrandContextBlock } from "@/ai/context";

const TYPE_GUIDANCE: Record<string, string> = {
  REPURPOSE_CONTENT: "Recommend repurposing the high-performing post — suggest reusing its angle on another platform or as a new campaign.",
  PROMOTE_PRODUCT: "Recommend running a new campaign for this product.",
  SEO_CONTENT: "Recommend creating an SEO article/content piece targeting the given topic.",
  CAMPAIGN_IDEA: "Recommend a new campaign idea.",
  CONNECT_SOCIAL_ACCOUNT: "Recommend connecting a social account to unlock publishing.",
  GENERAL: "Provide a general marketing recommendation.",
};

export function buildRecommendationPrompt(brand: Brand, finding: RuleFinding) {
  const system = `You are an AI marketing analyst. You turn structured performance data into a single, concise,
actionable recommendation for a busy marketer. Be specific and reference the evidence. Do not invent
numbers beyond what's given. Do not guarantee results. Respond only with the requested JSON.`;

  const prompt = `${buildBrandContextBlock(brand)}

=== FINDING ===
Type: ${finding.type}
Guidance: ${TYPE_GUIDANCE[finding.type] ?? TYPE_GUIDANCE.GENERAL}
Evidence: ${JSON.stringify(finding.evidence, null, 2)}

Write a recommendation based on this finding.`;

  return { system, prompt };
}
