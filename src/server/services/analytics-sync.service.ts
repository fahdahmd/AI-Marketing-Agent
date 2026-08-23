import "server-only";
import { db } from "@/lib/db";
import { requireBrandAccess } from "@/server/auth/authorize";
import { getSocialAnalyticsProvider, getGoogleAnalyticsProvider, getSearchConsoleProvider } from "@/analytics/providers";
import { getSocialProvider } from "@/social/providers";

function todayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

async function upsertSnapshot(
  brandId: string,
  source: string,
  socialAccountId: string | null,
  data: Partial<{
    reach: number;
    impressions: number;
    engagement: number;
    engagementRate: number;
    followers: number;
    websiteVisits: number;
    leads: number;
    conversions: number;
    organicClicks: number;
    organicImpressions: number;
    ctr: number;
    avgPosition: number;
  }>,
  isMock: boolean
) {
  return db.analyticsSnapshot.create({
    data: { brandId, source, socialAccountId, date: todayUtc(), isMock, ...data },
  });
}

/** Syncs a brand-level snapshot per connected social account (mock-based for now). */
export async function syncSocialAnalytics(brandId: string) {
  const accounts = await db.socialAccount.findMany({ where: { brandId, status: "CONNECTED" } });
  const provider = getSocialAnalyticsProvider();

  const results = [];
  for (const account of accounts) {
    const data = await provider.fetchSnapshot({ followerBaseline: 800 });
    results.push(await upsertSnapshot(brandId, "social", account.id, data, true));
  }

  // Refresh engagement numbers on recently published posts so "top content" stays current.
  const recentPosts = await db.publishedPost.findMany({
    where: { socialAccount: { brandId } },
    include: { socialAccount: true },
    orderBy: { publishedAt: "desc" },
    take: 25,
  });

  for (const post of recentPosts) {
    try {
      const socialProvider = getSocialProvider(post.socialAccount.platform);
      const metrics = await socialProvider.getAnalytics(post.socialAccount, post.externalPostId);
      await db.publishedPost.update({ where: { id: post.id }, data: metrics });
    } catch {
      // real providers may not be reachable without full OAuth; skip silently
    }
  }

  return results;
}

export async function syncGoogleAnalytics(brandId: string) {
  const provider = getGoogleAnalyticsProvider();
  const isMock = provider.name === "mock";
  const connection = await db.googleConnection.findUnique({ where: { brandId } });

  try {
    const data = await provider.fetchSnapshot({ connection, date: todayUtc() });
    return [await upsertSnapshot(brandId, "google_analytics", null, data, isMock)];
  } catch (error) {
    if (isMock) throw error;
    // no connection yet, or the real API call failed — fall back to mock so the dashboard stays populated
    const { MockGoogleAnalyticsProvider } = await import("@/analytics/providers/mock-analytics-provider");
    const data = await new MockGoogleAnalyticsProvider().fetchSnapshot();
    return [await upsertSnapshot(brandId, "google_analytics", null, data, true)];
  }
}

export async function syncSearchConsole(brandId: string) {
  const provider = getSearchConsoleProvider();
  const isMock = provider.name === "mock";
  const connection = await db.googleConnection.findUnique({ where: { brandId } });

  // Search Console data typically lags 2-3 days behind real-time.
  const queryDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

  try {
    const data = await provider.fetchSnapshot({ connection, date: queryDate });
    return [await upsertSnapshot(brandId, "search_console", null, data, isMock)];
  } catch (error) {
    if (isMock) throw error;
    const { MockSearchConsoleProvider } = await import("@/analytics/providers/mock-analytics-provider");
    const data = await new MockSearchConsoleProvider().fetchSnapshot();
    return [await upsertSnapshot(brandId, "search_console", null, data, true)];
  }
}

export async function syncAllAnalytics(brandId: string, userId: string) {
  await requireBrandAccess(brandId, userId);
  await syncSocialAnalytics(brandId);
  await syncGoogleAnalytics(brandId);
  await syncSearchConsole(brandId);
}
