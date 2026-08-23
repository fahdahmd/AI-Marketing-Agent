import "server-only";
import { db } from "@/lib/db";
import { getAIProvider } from "@/ai/providers";
import { keywordIdeasSchema, seoContentSchema, type SEOContentGenerated } from "@/ai/schemas/seo.schema";
import { buildKeywordIdeasPrompt } from "@/ai/prompts/seo/keywords";
import { buildSEOContentPrompt } from "@/ai/prompts/seo/content";
import { recordAIUsage } from "@/server/services/ai-usage.service";
import { assertCanGenerateSEO } from "@/server/services/entitlement.service";
import { computeSEOScore } from "@/seo/scoring";
import { getOrCreateSEOProject } from "@/server/services/seo.service";

export async function generateKeywordIdeas(brandId: string, topic: string) {
  const brand = await db.brand.findUniqueOrThrow({ where: { id: brandId } });
  await assertCanGenerateSEO(brand.workspaceId);

  const provider = getAIProvider();
  const { system, prompt } = buildKeywordIdeasPrompt(brand, topic);

  const result = await provider.generateStructured({
    schema: keywordIdeasSchema,
    schemaName: "keyword_ideas",
    system,
    prompt,
  });

  await recordAIUsage({
    workspaceId: brand.workspaceId,
    type: "SEO_GENERATION",
    provider: provider.name,
    model: result.model,
    promptTokens: result.promptTokens,
    completionTokens: result.completionTokens,
    totalTokens: result.totalTokens,
    estimatedCostUsd: result.estimatedCostUsd,
    metadata: { brandId, topic, kind: "keyword_ideas" },
  });

  const project = await getOrCreateSEOProject(brandId);

  const rows = [
    ...result.data.relatedKeywords.map((k) => ({ keyword: k, type: "related" })),
    ...result.data.longTailKeywords.map((k) => ({ keyword: k, type: "long-tail" })),
  ];

  await db.sEOKeyword.createMany({
    data: rows.map((r) => ({
      projectId: project.id,
      keyword: r.keyword,
      type: r.type,
      searchIntent: result.data.searchIntent,
      source: "AI_GENERATED",
    })),
  });

  return { ideas: result.data, projectId: project.id };
}

export async function generateSEOContent(
  brandId: string,
  params: { type: string; topic: string; productId?: string }
) {
  const brand = await db.brand.findUniqueOrThrow({ where: { id: brandId } });
  await assertCanGenerateSEO(brand.workspaceId);

  const product = params.productId ? await db.product.findUnique({ where: { id: params.productId } }) : null;

  const provider = getAIProvider();
  const { system, prompt } = buildSEOContentPrompt(brand, product, params);

  const result = await provider.generateStructured({
    schema: seoContentSchema,
    schemaName: "seo_content",
    system,
    prompt,
  });

  await recordAIUsage({
    workspaceId: brand.workspaceId,
    type: "SEO_GENERATION",
    provider: provider.name,
    model: result.model,
    promptTokens: result.promptTokens,
    completionTokens: result.completionTokens,
    totalTokens: result.totalTokens,
    estimatedCostUsd: result.estimatedCostUsd,
    metadata: { brandId, topic: params.topic, kind: "seo_content", contentType: params.type },
  });

  const project = await getOrCreateSEOProject(brandId);
  const score = computeSEOScore(result.data as SEOContentGenerated);

  const seoContent = await db.sEOContent.create({
    data: {
      projectId: project.id,
      brandId,
      type: params.type,
      primaryKeyword: result.data.primaryKeyword,
      secondaryKeywords: result.data.secondaryKeywords,
      searchIntent: result.data.searchIntent,
      seoTitle: result.data.seoTitle,
      metaTitle: result.data.metaTitle,
      metaDescription: result.data.metaDescription,
      outline: result.data.outline,
      article: result.data.article,
      faq: result.data.faq,
      internalLinks: result.data.internalLinkSuggestions,
      seoScore: score,
    },
  });

  return seoContent;
}
