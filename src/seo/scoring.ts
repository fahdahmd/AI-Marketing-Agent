import type { SEOContentGenerated } from "@/ai/schemas/seo.schema";

/**
 * Deterministic, explainable internal content score (0-100) — the same
 * philosophy as the Marketing Score: simple rules a user could read and
 * verify themselves, not a black-box AI guess. This is NOT a ranking
 * prediction; see the disclaimer shown alongside it in the UI.
 */
export function computeSEOScore(content: SEOContentGenerated): number {
  let score = 0;
  const keyword = content.primaryKeyword.toLowerCase().trim();

  if (keyword && content.seoTitle.toLowerCase().includes(keyword)) score += 15;
  if (keyword && content.metaDescription.toLowerCase().includes(keyword)) score += 10;

  const metaLen = content.metaDescription.length;
  if (metaLen >= 120 && metaLen <= 160) score += 10;
  else if (metaLen > 0) score += 5;

  const titleLen = content.seoTitle.length;
  if (titleLen >= 40 && titleLen <= 60) score += 10;
  else if (titleLen > 0) score += 5;

  if (content.outline.length >= 3) score += 15;
  else if (content.outline.length > 0) score += 7;

  const wordCount = content.article.trim().split(/\s+/).filter(Boolean).length;
  if (wordCount >= 600) score += 15;
  else if (wordCount >= 300) score += 8;

  if (content.faq.length >= 2) score += 10;
  else if (content.faq.length > 0) score += 5;

  if (content.internalLinkSuggestions.length >= 2) score += 10;
  else if (content.internalLinkSuggestions.length > 0) score += 5;

  const articleLower = content.article.toLowerCase();
  const secondaryHits = content.secondaryKeywords.filter((k) => articleLower.includes(k.toLowerCase())).length;
  score += Math.min(5, secondaryHits);

  return Math.max(0, Math.min(100, Math.round(score)));
}
