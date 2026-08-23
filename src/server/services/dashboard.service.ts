import "server-only";
import { db } from "@/lib/db";
import { syncAllAnalytics } from "@/server/services/analytics-sync.service";

/**
 * Ensures a brand has at least one analytics snapshot from the last 24h
 * before rendering the dashboard, so the product looks populated
 * immediately in development/demo mode without requiring a real
 * scheduled background job to have run yet.
 */
export async function ensureRecentAnalytics(brandId: string, userId: string) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recent = await db.analyticsSnapshot.findFirst({ where: { brandId, createdAt: { gte: since } } });
  if (recent) return;

  const hasAnyConnection = await db.socialAccount.count({ where: { brandId, status: "CONNECTED" } });
  if (hasAnyConnection === 0) return;

  try {
    await syncAllAnalytics(brandId, userId);
  } catch (error) {
    console.error("ensureRecentAnalytics failed", error);
  }
}
