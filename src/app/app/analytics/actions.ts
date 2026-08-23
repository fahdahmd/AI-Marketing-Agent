"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/session";
import { requireActiveBrand } from "@/lib/require-brand";
import { syncAllAnalytics } from "@/server/services/analytics-sync.service";

export async function syncAnalyticsAction() {
  const userId = await requireUserId();
  const { brand } = await requireActiveBrand(userId);
  await syncAllAnalytics(brand.id, userId);
  revalidatePath("/app/analytics");
  revalidatePath("/app/dashboard");
}
