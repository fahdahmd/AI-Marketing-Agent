"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/session";
import { requireActiveBrand } from "@/lib/require-brand";
import { markNotificationRead, markAllNotificationsRead } from "@/server/services/notification.service";

export async function markReadAction(notificationId: string) {
  const userId = await requireUserId();
  await markNotificationRead(notificationId, userId);
  revalidatePath("/app/notifications");
}

export async function markAllReadAction() {
  const userId = await requireUserId();
  const { workspace } = await requireActiveBrand(userId);
  await markAllNotificationsRead(workspace.id, userId);
  revalidatePath("/app/notifications");
}
