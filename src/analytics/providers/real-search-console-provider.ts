import "server-only";
import { isGoogleOAuthConfigured, getValidAccessToken } from "@/google/oauth";
import { fetchSearchConsoleDailyReport } from "@/google/api";
import { db } from "@/lib/db";
import type { GoogleConnectionLike, SearchConsoleProvider, SearchConsoleSnapshotData } from "./analytics-provider";

/** Google Search Console API. Requires a completed OAuth connection with a selected site, per brand. */
export class RealSearchConsoleProvider implements SearchConsoleProvider {
  readonly name = "search_console";

  constructor() {
    if (!isGoogleOAuthConfigured()) {
      throw new Error("Search Console is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.");
    }
  }

  async fetchSnapshot({ connection, date }: { connection?: GoogleConnectionLike | null; date: Date }): Promise<SearchConsoleSnapshotData> {
    if (!connection || !connection.searchConsoleSiteUrl) {
      throw new Error("No Search Console site connected for this brand yet.");
    }

    const fullConnection = await db.googleConnection.findUniqueOrThrow({ where: { id: connection.id } });
    const accessToken = await getValidAccessToken(fullConnection);

    return fetchSearchConsoleDailyReport(accessToken, connection.searchConsoleSiteUrl, date);
  }
}
