import "server-only";
import { db } from "@/lib/db";
import { requireBrandAccess } from "@/server/auth/authorize";

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

export interface MarketingScoreBreakdown {
  overall: number;
  socialMedia: number;
  content: number;
  seo: number;
  engagement: number;
  conversion: number;
  isDemoData: boolean;
}

/**
 * Transparent, deterministic internal scoring — NOT an official industry
 * metric or a ranking/performance guarantee. Each sub-score is a simple,
 * documented 0-100 formula so it can be explained to users and tuned over
 * time without becoming a black box.
 */
export async function computeMarketingScore(brandId: string, userId: string): Promise<MarketingScoreBreakdown> {
  await requireBrandAccess(brandId, userId);

  const since = new Date();
  since.setDate(since.getDate() - 30);

  const [socialSnapshots, webSnapshots, content, seoContent] = await Promise.all([
    db.analyticsSnapshot.findMany({ where: { brandId, source: "social", date: { gte: since } } }),
    db.analyticsSnapshot.findMany({ where: { brandId, source: "google_analytics", date: { gte: since } } }),
    db.content.findMany({ where: { brandId, createdAt: { gte: since } } }),
    db.sEOContent.findMany({ where: { project: { brandId } }, orderBy: { createdAt: "desc" }, take: 10 }),
  ]);

  // Social Media: follower trend + reach-to-follower ratio.
  const followers = socialSnapshots.length ? Math.max(...socialSnapshots.map((s) => s.followers)) : 0;
  const avgReach = socialSnapshots.length ? socialSnapshots.reduce((sum, s) => sum + s.reach, 0) / socialSnapshots.length : 0;
  const reachRatio = followers > 0 ? avgReach / followers : 0;
  const socialMedia = clamp(reachRatio * 100);

  // Content: share of generated content that made it to APPROVED/PUBLISHED rather than REJECTED/FAILED.
  const decided = content.filter((c) => !["DRAFT", "GENERATING", "READY_FOR_REVIEW"].includes(c.status));
  const healthy = decided.filter((c) => ["APPROVED", "SCHEDULED", "PUBLISHING", "PUBLISHED"].includes(c.status));
  const contentScore = decided.length ? clamp((healthy.length / decided.length) * 100) : 50;

  // SEO: average internal SEO content score across recent articles/pages.
  const seoScore = seoContent.length
    ? clamp(seoContent.reduce((sum, c) => sum + (c.seoScore ?? 0), 0) / seoContent.length)
    : 50;

  // Engagement: average engagement rate, scaled so 6%+ engagement hits 100.
  const avgEngagementRate = socialSnapshots.length
    ? socialSnapshots.reduce((sum, s) => sum + s.engagementRate, 0) / socialSnapshots.length
    : 0;
  const engagement = clamp((avgEngagementRate / 6) * 100);

  // Conversion: conversions as a share of website visits, scaled so a 10% conversion rate hits 100.
  const visits = webSnapshots.reduce((sum, s) => sum + s.websiteVisits, 0);
  const conversions = webSnapshots.reduce((sum, s) => sum + s.conversions, 0);
  const conversionRate = visits > 0 ? conversions / visits : 0;
  const conversion = clamp((conversionRate / 0.1) * 100);

  const overall = Math.round((socialMedia + contentScore + seoScore + engagement + conversion) / 5);

  return {
    overall,
    socialMedia: Math.round(socialMedia),
    content: Math.round(contentScore),
    seo: Math.round(seoScore),
    engagement: Math.round(engagement),
    conversion: Math.round(conversion),
    isDemoData: socialSnapshots.every((s) => s.isMock) && webSnapshots.every((s) => s.isMock),
  };
}
