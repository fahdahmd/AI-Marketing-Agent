import "server-only";
import type { GoogleAnalyticsProvider, WebAnalyticsSnapshotData } from "./analytics-provider";

/**
 * Google Analytics Data API (GA4). Requires GOOGLE_CLIENT_ID/SECRET plus a
 * completed OAuth flow and a configured GA4 property ID per brand —
 * neither is wired up yet in this MVP, so the factory in ./index.ts falls
 * back to the mock provider until those are configured.
 */
export class RealGoogleAnalyticsProvider implements GoogleAnalyticsProvider {
  readonly name = "google_analytics";

  constructor() {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      throw new Error("Google Analytics is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.");
    }
  }

  async fetchSnapshot(): Promise<WebAnalyticsSnapshotData> {
    throw new Error(
      "Google Analytics OAuth connection has not been completed for this brand. Connect it from Integrations, or the app will keep using demo data."
    );
  }
}
