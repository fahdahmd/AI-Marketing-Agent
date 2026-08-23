import "server-only";
import { db } from "@/lib/db";
import { requireWorkspaceMembership } from "@/server/auth/authorize";

export type NotificationType =
  | "campaign.ready_for_review"
  | "content.published"
  | "content.publish_failed"
  | "recommendation.new"
  | "subscription.updated"
  | "usage.limit_reached";

export interface CreateNotificationInput {
  workspaceId: string;
  userId?: string | null;
  type: NotificationType;
  title: string;
  message: string;
  href?: string;
}

export async function createNotification(input: CreateNotificationInput) {
  return db.notification.create({
    data: {
      workspaceId: input.workspaceId,
      userId: input.userId ?? null,
      type: input.type,
      title: input.title,
      message: input.message,
      href: input.href,
    },
  });
}

export async function getUnreadCount(workspaceId: string, userId: string) {
  await requireWorkspaceMembership(workspaceId, userId);
  return db.notification.count({
    where: {
      workspaceId,
      readAt: null,
      OR: [{ userId }, { userId: null }],
    },
  });
}

export async function listNotifications(workspaceId: string, userId: string, limit = 30) {
  await requireWorkspaceMembership(workspaceId, userId);
  return db.notification.findMany({
    where: { workspaceId, OR: [{ userId }, { userId: null }] },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function markNotificationRead(notificationId: string, userId: string) {
  const notification = await db.notification.findUniqueOrThrow({ where: { id: notificationId } });
  await requireWorkspaceMembership(notification.workspaceId, userId);
  return db.notification.update({ where: { id: notificationId }, data: { readAt: new Date() } });
}

export async function markAllNotificationsRead(workspaceId: string, userId: string) {
  await requireWorkspaceMembership(workspaceId, userId);
  return db.notification.updateMany({
    where: { workspaceId, readAt: null, OR: [{ userId }, { userId: null }] },
    data: { readAt: new Date() },
  });
}
