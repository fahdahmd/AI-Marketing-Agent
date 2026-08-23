import "server-only";
import { db } from "@/lib/db";
import { getAIProvider } from "@/ai/providers";
import { recommendationContentSchema } from "@/ai/schemas/recommendation.schema";
import { buildRecommendationPrompt } from "@/ai/prompts/recommendations/build";
import { runRecommendationRules, type RuleFinding } from "@/recommendations/rules";
import type { RecommendationType } from "@prisma/client";

const ACTION_LABELS: Record<RecommendationType, string> = {
  PROMOTE_PRODUCT: "Create Campaign",
  SEO_CONTENT: "Create SEO Article",
  REPURPOSE_CONTENT: "Repurpose",
  CAMPAIGN_IDEA: "Create Campaign",
  CONNECT_SOCIAL_ACCOUNT: "Connect Account",
  GENERAL: "View Details",
};
import { recordAIUsage } from "@/server/services/ai-usage.service";
import { createNotification } from "@/server/services/notification.service";

const DEDUPE_WINDOW_DAYS = 14;

async function isDuplicate(brandId: string, finding: RuleFinding): Promise<boolean> {
  const since = new Date();
  since.setDate(since.getDate() - DEDUPE_WINDOW_DAYS);

  const existing = await db.recommendation.findFirst({
    where: {
      brandId,
      type: finding.type,
      status: { in: ["NEW", "VIEWED", "ACCEPTED"] },
      createdAt: { gte: since },
      ...(finding.sourceProductId ? { sourceProductId: finding.sourceProductId } : {}),
      ...(finding.sourceContentId ? { sourceContentId: finding.sourceContentId } : {}),
    },
  });

  return Boolean(existing);
}

/**
 * Runs the deterministic rule engine, then asks the AI to turn each new
 * (non-duplicate) finding into a human-readable recommendation. Returns
 * the recommendations created.
 */
export async function generateRecommendations(brandId: string) {
  const brand = await db.brand.findUniqueOrThrow({ where: { id: brandId } });
  const findings = await runRecommendationRules(brandId);

  const created = [];

  for (const finding of findings) {
    if (await isDuplicate(brandId, finding)) continue;

    const provider = getAIProvider();
    const { system, prompt } = buildRecommendationPrompt(brand, finding);

    const result = await provider.generateStructured({
      schema: recommendationContentSchema,
      schemaName: "recommendation_content",
      system,
      prompt,
    });

    await recordAIUsage({
      workspaceId: brand.workspaceId,
      type: "RECOMMENDATION_GENERATION",
      provider: provider.name,
      model: result.model,
      promptTokens: result.promptTokens,
      completionTokens: result.completionTokens,
      totalTokens: result.totalTokens,
      estimatedCostUsd: result.estimatedCostUsd,
      metadata: { brandId, findingType: finding.type },
    });

    const recommendation = await db.recommendation.create({
      data: {
        brandId,
        type: finding.type,
        title: result.data.title,
        explanation: result.data.explanation,
        evidence: finding.evidence as any,
        priority: finding.priority,
        expectedImpact: result.data.expectedImpact,
        action: ACTION_LABELS[finding.type],
        status: "NEW",
        sourceProductId: finding.sourceProductId,
        sourceContentId: finding.sourceContentId,
      },
    });

    created.push(recommendation);
  }

  if (created.length > 0) {
    await createNotification({
      workspaceId: brand.workspaceId,
      type: "recommendation.new",
      title: created.length === 1 ? "New AI recommendation" : `${created.length} new AI recommendations`,
      message: created[0].title,
      href: "/app/recommendations",
    });
  }

  return created;
}
