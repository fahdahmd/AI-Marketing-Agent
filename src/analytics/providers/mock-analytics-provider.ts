import "server-only";
import type {
  GoogleAnalyticsProvider,
  SearchConsoleProvider,
  SearchConsoleSnapshotData,
  SocialAnalyticsProvider,
  SocialSnapshotData,
  WebAnalyticsSnapshotData,
} from "./analytics-provider";

function jitter(base: number, spreadPct: number): number {
  const spread = base * spreadPct;
  return Math.max(0, Math.round(base + (Math.random() * 2 - 1) * spread));
}

export class MockSocialAnalyticsProvider implements SocialAnalyticsProvider {
  readonly name = "mock";

  async fetchSnapshot({ followerBaseline }: { followerBaseline: number }): Promise<SocialSnapshotData> {
    const reach = jitter(Math.max(followerBaseline * 0.6, 300), 0.4);
    const impressions = Math.round(reach * (1.2 + Math.random() * 0.5));
    const engagement = Math.round(reach * (0.03 + Math.random() * 0.06));
    const followers = followerBaseline + Math.round(Math.random() * 12 - 2);

    return {
      reach,
      impressions,
      engagement,
      engagementRate: reach ? Number(((engagement / reach) * 100).toFixed(2)) : 0,
      followers: Math.max(followers, 0),
    };
  }
}

export class MockGoogleAnalyticsProvider implements GoogleAnalyticsProvider {
  readonly name = "mock";

  async fetchSnapshot(): Promise<WebAnalyticsSnapshotData> {
    const websiteVisits = jitter(500, 0.5);
    const leads = Math.round(websiteVisits * (0.02 + Math.random() * 0.03));
    const conversions = Math.round(leads * (0.15 + Math.random() * 0.2));

    return { websiteVisits, leads, conversions };
  }
}

export class MockSearchConsoleProvider implements SearchConsoleProvider {
  readonly name = "mock";

  async fetchSnapshot(): Promise<SearchConsoleSnapshotData> {
    const organicImpressions = jitter(2000, 0.5);
    const ctr = Number((1.5 + Math.random() * 3).toFixed(2));
    const organicClicks = Math.round(organicImpressions * (ctr / 100));
    const avgPosition = Number((8 + Math.random() * 15).toFixed(1));

    return { organicClicks, organicImpressions, ctr, avgPosition };
  }
}
