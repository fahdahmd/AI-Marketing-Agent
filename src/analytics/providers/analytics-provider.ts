export interface SocialSnapshotData {
  reach: number;
  impressions: number;
  engagement: number;
  engagementRate: number;
  followers: number;
}

export interface WebAnalyticsSnapshotData {
  websiteVisits: number;
  leads: number;
  conversions: number;
}

export interface SearchConsoleSnapshotData {
  organicClicks: number;
  organicImpressions: number;
  ctr: number;
  avgPosition: number;
}

/**
 * Abstraction over analytics data sources. Real providers require their
 * respective OAuth credentials; MockAnalyticsProvider (clearly labeled via
 * AnalyticsSnapshot.isMock) is used automatically otherwise so the
 * dashboard and analytics pages are always populated in development.
 */
export interface SocialAnalyticsProvider {
  readonly name: string;
  fetchSnapshot(params: { followerBaseline: number }): Promise<SocialSnapshotData>;
}

export interface GoogleConnectionLike {
  id: string;
  accessTokenEnc: string;
  refreshTokenEnc: string | null;
  tokenExpiresAt: Date | null;
  gaPropertyId: string | null;
  searchConsoleSiteUrl: string | null;
}

export interface GoogleAnalyticsProvider {
  readonly name: string;
  fetchSnapshot(params: { connection?: GoogleConnectionLike | null; date: Date }): Promise<WebAnalyticsSnapshotData>;
}

export interface SearchConsoleProvider {
  readonly name: string;
  fetchSnapshot(params: { connection?: GoogleConnectionLike | null; date: Date }): Promise<SearchConsoleSnapshotData>;
}
