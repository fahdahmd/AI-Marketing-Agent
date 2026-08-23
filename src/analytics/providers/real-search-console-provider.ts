import "server-only";
import type { SearchConsoleProvider, SearchConsoleSnapshotData } from "./analytics-provider";

/**
 * Google Search Console API. Requires GOOGLE_CLIENT_ID/SECRET plus a
 * completed OAuth flow and a verified property per brand — not wired up
 * yet in this MVP, so the factory falls back to the mock provider.
 */
export class RealSearchConsoleProvider implements SearchConsoleProvider {
  readonly name = "search_console";

  constructor() {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      throw new Error("Search Console is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.");
    }
  }

  async fetchSnapshot(): Promise<SearchConsoleSnapshotData> {
    throw new Error(
      "Search Console OAuth connection has not been completed for this brand. Connect it from Integrations, or the app will keep using demo data."
    );
  }
}
