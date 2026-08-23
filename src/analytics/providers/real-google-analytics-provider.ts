import "server-only";
import { isGoogleOAuthConfigured, getValidAccessToken } from "@/google/oauth";
import { fetchGA4DailyReport } from "@/google/api";
import { db } from "@/lib/db";
import type { GoogleAnalyticsProvider, GoogleConnectionLike, WebAnalyticsSnapshotData } from "./analytics-provider";

/** Google Analytics Data API (GA4). Requires a completed OAuth connection with a selected property, per brand. */
export class RealGoogleAnalyticsProvider implements GoogleAnalyticsProvider {
  readonly name = "google_analytics";

  constructor() {
    if (!isGoogleOAuthConfigured()) {
      throw new Error("Google is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.");
    }
  }

  async fetchSnapshot({ connection, date }: { connection?: GoogleConnectionLike | null; date: Date }): Promise<WebAnalyticsSnapshotData> {
    if (!connection || !connection.gaPropertyId) {
      throw new Error("No Google Analytics property connected for this brand yet.");
    }

    const fullConnection = await db.googleConnection.findUniqueOrThrow({ where: { id: connection.id } });
    const accessToken = await getValidAccessToken(fullConnection);

    return fetchGA4DailyReport(accessToken, connection.gaPropertyId, date);
  }
}
