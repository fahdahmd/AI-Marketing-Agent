import "server-only";
import { MockSocialAnalyticsProvider, MockGoogleAnalyticsProvider, MockSearchConsoleProvider } from "./mock-analytics-provider";
import type { GoogleAnalyticsProvider, SearchConsoleProvider, SocialAnalyticsProvider } from "./analytics-provider";

function isGoogleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function getSocialAnalyticsProvider(): SocialAnalyticsProvider {
  // Real per-post social analytics come from SocialProvider.getAnalytics (src/social);
  // this brand-level snapshot provider is mock-only until we aggregate that into snapshots.
  return new MockSocialAnalyticsProvider();
}

export function getGoogleAnalyticsProvider(): GoogleAnalyticsProvider {
  if (isGoogleConfigured()) {
    const { RealGoogleAnalyticsProvider } = require("./real-google-analytics-provider") as typeof import("./real-google-analytics-provider");
    try {
      return new RealGoogleAnalyticsProvider();
    } catch {
      return new MockGoogleAnalyticsProvider();
    }
  }
  return new MockGoogleAnalyticsProvider();
}

export function getSearchConsoleProvider(): SearchConsoleProvider {
  if (isGoogleConfigured()) {
    const { RealSearchConsoleProvider } = require("./real-search-console-provider") as typeof import("./real-search-console-provider");
    try {
      return new RealSearchConsoleProvider();
    } catch {
      return new MockSearchConsoleProvider();
    }
  }
  return new MockSearchConsoleProvider();
}

export * from "./analytics-provider";
