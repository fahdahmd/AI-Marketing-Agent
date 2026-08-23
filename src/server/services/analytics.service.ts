import "server-only";
import { db } from "@/lib/db";
import { requireBrandAccess } from "@/server/auth/authorize";

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

export interface OverviewMetrics {
  reach: number;
  impressions: number;
  engagement: number;
  engagementRate: number;
  followers: number;
  websiteVisits: number;
  leads: number;
  conversions: number;
  isMock: boolean;
}

export async function getOverviewMetrics(brandId: string, userId: string, days = 30): Promise<OverviewMetrics> {
  await requireBrandAccess(brandId, userId);
  const since = daysAgo(days);

  const snapshots = await db.analyticsSnapshot.findMany({ where: { brandId, date: { gte: since } } });

  const social = snapshots.filter((s) => s.source === "social");
  const web = snapshots.filter((s) => s.source === "google_analytics");

  const reach = social.reduce((sum, s) => sum + s.reach, 0);
  const impressions = social.reduce((sum, s) => sum + s.impressions, 0);
  const engagement = social.reduce((sum, s) => sum + s.engagement, 0);
  const followers = social.length ? Math.max(...social.map((s) => s.followers)) : 0;
  const websiteVisits = web.reduce((sum, s) => sum + s.websiteVisits, 0);
  const leads = web.reduce((sum, s) => sum + s.leads, 0);
  const conversions = web.reduce((sum, s) => sum + s.conversions, 0);

  return {
    reach,
    impressions,
    engagement,
    engagementRate: reach ? Number(((engagement / reach) * 100).toFixed(2)) : 0,
    followers,
    websiteVisits,
    leads,
    conversions,
    isMock: snapshots.length === 0 || snapshots.every((s) => s.isMock),
  };
}

export async function getSocialPerformanceByPlatform(brandId: string, userId: string, days = 30) {
  await requireBrandAccess(brandId, userId);
  const since = daysAgo(days);

  const accounts = await db.socialAccount.findMany({ where: { brandId } });
  const snapshots = await db.analyticsSnapshot.findMany({
    where: { brandId, source: "social", date: { gte: since }, socialAccountId: { not: null } },
  });

  return accounts.map((account) => {
    const accountSnapshots = snapshots.filter((s) => s.socialAccountId === account.id);
    const reach = accountSnapshots.reduce((sum, s) => sum + s.reach, 0);
    const engagement = accountSnapshots.reduce((sum, s) => sum + s.engagement, 0);
    return {
      platform: account.platform,
      displayName: account.displayName,
      reach,
      engagement,
      engagementRate: reach ? Number(((engagement / reach) * 100).toFixed(2)) : 0,
      followers: accountSnapshots.length ? Math.max(...accountSnapshots.map((s) => s.followers)) : 0,
    };
  });
}

export async function getTopContent(brandId: string, userId: string, limit = 5) {
  await requireBrandAccess(brandId, userId);
  return db.publishedPost.findMany({
    where: { socialAccount: { brandId } },
    include: { content: { include: { campaign: true } }, socialAccount: true },
    orderBy: { engagementRate: "desc" },
    take: limit,
  });
}

export async function getWorstContent(brandId: string, userId: string, limit = 5) {
  await requireBrandAccess(brandId, userId);
  return db.publishedPost.findMany({
    where: { socialAccount: { brandId } },
    include: { content: { include: { campaign: true } }, socialAccount: true },
    orderBy: { engagementRate: "asc" },
    take: limit,
  });
}

export async function getSEOOverview(brandId: string, userId: string, days = 30) {
  await requireBrandAccess(brandId, userId);
  const since = daysAgo(days);

  const snapshots = await db.analyticsSnapshot.findMany({
    where: { brandId, source: "search_console", date: { gte: since } },
    orderBy: { date: "asc" },
  });

  const organicClicks = snapshots.reduce((sum, s) => sum + s.organicClicks, 0);
  const organicImpressions = snapshots.reduce((sum, s) => sum + s.organicImpressions, 0);
  const avgCtr = snapshots.length ? snapshots.reduce((sum, s) => sum + s.ctr, 0) / snapshots.length : 0;
  const avgPosition = snapshots.length ? snapshots.reduce((sum, s) => sum + s.avgPosition, 0) / snapshots.length : 0;

  return {
    organicClicks,
    organicImpressions,
    ctr: Number(avgCtr.toFixed(2)),
    avgPosition: Number(avgPosition.toFixed(1)),
    trend: snapshots.map((s) => ({ date: s.date, organicClicks: s.organicClicks, organicImpressions: s.organicImpressions })),
    isMock: snapshots.length === 0 || snapshots.every((s) => s.isMock),
  };
}

export async function getReachTrend(brandId: string, userId: string, days = 30) {
  await requireBrandAccess(brandId, userId);
  const since = daysAgo(days);

  const snapshots = await db.analyticsSnapshot.findMany({
    where: { brandId, source: "social", date: { gte: since } },
    orderBy: { date: "asc" },
  });

  const byDate = new Map<string, { date: string; reach: number; engagement: number }>();
  for (const s of snapshots) {
    const key = s.date.toISOString().slice(0, 10);
    const existing = byDate.get(key) ?? { date: key, reach: 0, engagement: 0 };
    existing.reach += s.reach;
    existing.engagement += s.engagement;
    byDate.set(key, existing);
  }

  return Array.from(byDate.values());
}
