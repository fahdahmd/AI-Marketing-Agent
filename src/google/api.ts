import "server-only";

const GA4_DATA_API = "https://analyticsdata.googleapis.com/v1beta";
const GA4_ADMIN_API = "https://analyticsadmin.googleapis.com/v1beta";
const SEARCH_CONSOLE_API = "https://www.googleapis.com/webmasters/v3";

async function googleFetch(url: string, accessToken: string, init?: RequestInit) {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Google API request failed (${url}): ${JSON.stringify(data)}`);
  return data;
}

export interface GA4Property {
  propertyId: string; // "properties/123456789"
  displayName: string;
  accountName: string;
}

/** Lists GA4 properties the connected account can access, for the connect-flow picker. */
export async function listGA4Properties(accessToken: string): Promise<GA4Property[]> {
  const data = await googleFetch(`${GA4_ADMIN_API}/accountSummaries?pageSize=200`, accessToken);

  const properties: GA4Property[] = [];
  for (const account of data.accountSummaries ?? []) {
    for (const prop of account.propertySummaries ?? []) {
      properties.push({
        propertyId: prop.property,
        displayName: prop.displayName,
        accountName: account.displayName,
      });
    }
  }
  return properties;
}

export interface SearchConsoleSite {
  siteUrl: string;
  permissionLevel: string;
}

/** Lists Search Console properties the connected account can access. */
export async function listSearchConsoleSites(accessToken: string): Promise<SearchConsoleSite[]> {
  const data = await googleFetch(`${SEARCH_CONSOLE_API}/sites`, accessToken);
  return (data.siteEntry ?? []).map((s: any) => ({ siteUrl: s.siteUrl, permissionLevel: s.permissionLevel }));
}

export interface GA4ReportResult {
  websiteVisits: number;
  leads: number;
  conversions: number;
}

/** Fetches a single-day GA4 report (sessions as visits, key events as conversions/leads proxy). */
export async function fetchGA4DailyReport(accessToken: string, propertyId: string, date: Date): Promise<GA4ReportResult> {
  const isoDate = date.toISOString().slice(0, 10);

  const data = await googleFetch(`${GA4_DATA_API}/${propertyId}:runReport`, accessToken, {
    method: "POST",
    body: JSON.stringify({
      dateRanges: [{ startDate: isoDate, endDate: isoDate }],
      metrics: [{ name: "sessions" }, { name: "conversions" }, { name: "keyEvents" }],
    }),
  });

  const row = data.rows?.[0];
  const sessions = Number(row?.metricValues?.[0]?.value ?? 0);
  const conversions = Number(row?.metricValues?.[1]?.value ?? row?.metricValues?.[2]?.value ?? 0);

  return {
    websiteVisits: sessions,
    leads: Math.round(conversions * 1.5), // leads proxy: conversions plus soft-conversion estimate
    conversions: Math.round(conversions),
  };
}

export interface SearchConsoleDailyResult {
  organicClicks: number;
  organicImpressions: number;
  ctr: number;
  avgPosition: number;
}

/** Fetches a single-day Search Console report. */
export async function fetchSearchConsoleDailyReport(
  accessToken: string,
  siteUrl: string,
  date: Date
): Promise<SearchConsoleDailyResult> {
  const isoDate = date.toISOString().slice(0, 10);

  const data = await googleFetch(`${SEARCH_CONSOLE_API}/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, accessToken, {
    method: "POST",
    body: JSON.stringify({ startDate: isoDate, endDate: isoDate, dimensions: ["date"], rowLimit: 1 }),
  });

  const row = data.rows?.[0];
  return {
    organicClicks: Math.round(row?.clicks ?? 0),
    organicImpressions: Math.round(row?.impressions ?? 0),
    ctr: Number(((row?.ctr ?? 0) * 100).toFixed(2)),
    avgPosition: Number((row?.position ?? 0).toFixed(1)),
  };
}
