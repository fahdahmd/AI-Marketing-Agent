import "server-only";
import { db } from "@/lib/db";
import { requireBrandAccess } from "@/server/auth/authorize";

export interface CalendarItem {
  id: string;
  platform: string;
  status: string;
  campaignName: string;
  caption: string | null;
  date: Date;
  kind: "scheduled" | "published" | "other";
}

export async function getCalendarItems(brandId: string, userId: string): Promise<CalendarItem[]> {
  await requireBrandAccess(brandId, userId);

  const content = await db.content.findMany({
    where: { brandId },
    include: {
      campaign: true,
      scheduledPosts: { orderBy: { scheduledFor: "desc" }, take: 1 },
      publishedPosts: { orderBy: { publishedAt: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
  });

  return content.map((c) => {
    const published = c.publishedPosts[0];
    const scheduled = c.scheduledPosts[0];
    const date = published?.publishedAt ?? scheduled?.scheduledFor ?? c.updatedAt;
    const kind: CalendarItem["kind"] = published ? "published" : scheduled ? "scheduled" : "other";

    return {
      id: c.id,
      platform: c.platform,
      status: c.status,
      campaignName: c.campaign.name,
      caption: c.caption ?? c.body ?? c.hook,
      date,
      kind,
    };
  });
}
