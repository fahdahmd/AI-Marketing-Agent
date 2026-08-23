import "server-only";
import { db } from "@/lib/db";
import type { RecommendationPriority, RecommendationType } from "@prisma/client";

export interface RuleFinding {
  type: RecommendationType;
  evidence: Record<string, unknown>;
  sourceProductId?: string;
  sourceContentId?: string;
  priority: RecommendationPriority;
}

/**
 * Deterministic rules that scan real data for opportunities. Findings are
 * handed to the AI only to translate into a human-readable
 * explanation/action — the *decision* of what's worth recommending stays
 * rule-based so the engine doesn't hallucinate recommendations that
 * aren't backed by actual data (spec section 22).
 */
export async function runRecommendationRules(brandId: string): Promise<RuleFinding[]> {
  const findings: RuleFinding[] = [];

  await Promise.all([
    findRepurposeCandidates(brandId, findings),
    findUnpromotedProducts(brandId, findings),
    findSEOOpportunity(brandId, findings),
  ]);

  return findings;
}

/** IF a post significantly outperforms the brand average THEN recommend repurposing it. */
async function findRepurposeCandidates(brandId: string, findings: RuleFinding[]) {
  const posts = await db.publishedPost.findMany({
    where: { socialAccount: { brandId } },
    orderBy: { publishedAt: "desc" },
    take: 50,
  });
  if (posts.length < 3) return;

  const avgRate = posts.reduce((sum, p) => sum + p.engagementRate, 0) / posts.length;
  if (avgRate <= 0) return;

  const topPost = posts.reduce((best, p) => (p.engagementRate > best.engagementRate ? p : best), posts[0]);
  const multiplier = topPost.engagementRate / avgRate;

  if (multiplier >= 1.5) {
    findings.push({
      type: "REPURPOSE_CONTENT",
      evidence: {
        engagementRate: topPost.engagementRate,
        averageEngagementRate: Number(avgRate.toFixed(2)),
        multiplier: Number(multiplier.toFixed(1)),
      },
      sourceContentId: topPost.contentId,
      priority: multiplier >= 2.5 ? "HIGH" : "MEDIUM",
    });
  }
}

/** IF a product has no campaign in the last 30 days THEN recommend promoting it again. */
async function findUnpromotedProducts(brandId: string, findings: RuleFinding[]) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const products = await db.product.findMany({
    where: { brandId },
    include: { campaigns: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  for (const product of products) {
    const lastCampaign = product.campaigns[0];
    if (!lastCampaign) {
      findings.push({
        type: "PROMOTE_PRODUCT",
        evidence: { productName: product.name, reason: "never_promoted" },
        sourceProductId: product.id,
        priority: "MEDIUM",
      });
    } else if (lastCampaign.createdAt < thirtyDaysAgo) {
      findings.push({
        type: "PROMOTE_PRODUCT",
        evidence: { productName: product.name, reason: "stale", lastPromotedAt: lastCampaign.createdAt },
        sourceProductId: product.id,
        priority: "LOW",
      });
    }
  }
}

/** IF organic traffic/content is low AND a keyword opportunity exists THEN recommend SEO content. */
async function findSEOOpportunity(brandId: string, findings: RuleFinding[]) {
  const seoContentCount = await db.sEOContent.count({ where: { project: { brandId } } });
  if (seoContentCount > 0) return;

  const productWithKeywords = await db.product.findFirst({
    where: { brandId, keywords: { isEmpty: false } },
  });
  if (!productWithKeywords) return;

  findings.push({
    type: "SEO_CONTENT",
    evidence: { topic: productWithKeywords.keywords[0], productName: productWithKeywords.name, reason: "no_seo_content_yet" },
    sourceProductId: productWithKeywords.id,
    priority: "MEDIUM",
  });
}
