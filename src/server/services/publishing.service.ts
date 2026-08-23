import "server-only";
import { db } from "@/lib/db";
import { requireContentAccess } from "@/server/auth/authorize";
import { getSocialProvider } from "@/social/providers";
import { logAudit } from "@/server/services/audit-log.service";
import { createNotification } from "@/server/services/notification.service";
import { enqueueOrRun } from "@/jobs/queue";
import { ValidationError } from "@/lib/errors";

async function loadPublishablePost(contentId: string, socialAccountId: string) {
  const content = await db.content.findUniqueOrThrow({ where: { id: contentId }, include: { brand: true } });
  const account = await db.socialAccount.findUniqueOrThrow({ where: { id: socialAccountId } });

  if (account.brandId !== content.brandId) {
    throw new ValidationError("That social account does not belong to this brand.");
  }
  if (account.platform !== content.platform) {
    throw new ValidationError(`This content is for ${content.platform}, not ${account.platform}.`);
  }
  if (account.status !== "CONNECTED") {
    throw new ValidationError("This social account is not connected.");
  }

  return { content, account };
}

export async function publishContentNow(contentId: string, userId: string, socialAccountId: string) {
  const { content: accessContent } = await requireContentAccess(contentId, userId);
  if (accessContent.status !== "APPROVED") {
    throw new ValidationError("Content must be approved before it can be published.");
  }

  const { content, account } = await loadPublishablePost(contentId, socialAccountId);

  await db.content.update({ where: { id: contentId }, data: { status: "PUBLISHING" } });

  const provider = getSocialProvider(account.platform);

  try {
    const result = await provider.publishPost(account, {
      caption: content.caption,
      body: content.body,
      hook: content.hook,
      cta: content.cta,
      hashtags: content.hashtags,
      imageUrl: content.imageUrl,
    });

    await db.publishedPost.create({
      data: {
        contentId,
        socialAccountId,
        externalPostId: result.externalPostId,
        externalUrl: result.externalUrl,
      },
    });

    await db.content.update({ where: { id: contentId }, data: { status: "PUBLISHED" } });

    await logAudit({ workspaceId: content.brand.workspaceId, userId, action: "content.published", entityType: "Content", entityId: contentId });
    await createNotification({
      workspaceId: content.brand.workspaceId,
      userId,
      type: "content.published",
      title: "Post published",
      message: `Your ${content.platform} post was published successfully.`,
      href: `/app/content/${contentId}`,
    });

    return result;
  } catch (error) {
    await db.content.update({ where: { id: contentId }, data: { status: "FAILED" } });
    await createNotification({
      workspaceId: content.brand.workspaceId,
      userId,
      type: "content.publish_failed",
      title: "Publishing failed",
      message: `Your ${content.platform} post failed to publish. ${error instanceof Error ? error.message : ""}`.trim(),
      href: `/app/content/${contentId}`,
    });
    throw error;
  }
}

export async function scheduleContent(contentId: string, userId: string, socialAccountId: string, scheduledFor: Date) {
  const { content: accessContent } = await requireContentAccess(contentId, userId);
  if (accessContent.status !== "APPROVED") {
    throw new ValidationError("Content must be approved before it can be scheduled.");
  }
  if (scheduledFor.getTime() <= Date.now()) {
    throw new ValidationError("Scheduled time must be in the future.");
  }

  const { content, account } = await loadPublishablePost(contentId, socialAccountId);

  const scheduledPost = await db.scheduledPost.create({
    data: { contentId, socialAccountId: account.id, scheduledFor, status: "PENDING" },
  });

  await db.content.update({ where: { id: contentId }, data: { status: "SCHEDULED" } });

  await logAudit({ workspaceId: content.brand.workspaceId, userId, action: "content.scheduled", entityType: "Content", entityId: contentId, metadata: { scheduledFor } });

  const delay = scheduledFor.getTime() - Date.now();
  await enqueueOrRun("publishScheduledPost", { scheduledPostId: scheduledPost.id }, processScheduledPostJob, { delay });

  return scheduledPost;
}

async function processScheduledPostJob(data: { scheduledPostId: string }) {
  await processScheduledPost(data.scheduledPostId);
}

/**
 * Executes a due scheduled post. Idempotent: only PENDING/FAILED posts
 * under the retry cap are processed, so both the BullMQ worker and the
 * DB-backed poller (src/jobs/scheduled-post-poller.ts) can safely call
 * this without double-publishing.
 */
export async function processScheduledPost(scheduledPostId: string) {
  const scheduledPost = await db.scheduledPost.findUnique({
    where: { id: scheduledPostId },
    include: { content: { include: { brand: true } }, socialAccount: true },
  });
  if (!scheduledPost || scheduledPost.status === "PUBLISHED" || scheduledPost.status === "CANCELED") return;

  await db.scheduledPost.update({ where: { id: scheduledPostId }, data: { status: "PROCESSING", attempts: { increment: 1 } } });
  await db.content.update({ where: { id: scheduledPost.contentId }, data: { status: "PUBLISHING" } });

  const provider = getSocialProvider(scheduledPost.socialAccount.platform);

  try {
    const result = await provider.publishPost(scheduledPost.socialAccount, {
      caption: scheduledPost.content.caption,
      body: scheduledPost.content.body,
      hook: scheduledPost.content.hook,
      cta: scheduledPost.content.cta,
      hashtags: scheduledPost.content.hashtags,
      imageUrl: scheduledPost.content.imageUrl,
    });

    await db.publishedPost.create({
      data: {
        contentId: scheduledPost.contentId,
        socialAccountId: scheduledPost.socialAccountId,
        scheduledPostId: scheduledPost.id,
        externalPostId: result.externalPostId,
        externalUrl: result.externalUrl,
      },
    });

    await db.scheduledPost.update({ where: { id: scheduledPostId }, data: { status: "PUBLISHED" } });
    await db.content.update({ where: { id: scheduledPost.contentId }, data: { status: "PUBLISHED" } });

    await createNotification({
      workspaceId: scheduledPost.content.brand.workspaceId,
      type: "content.published",
      title: "Scheduled post published",
      message: `Your scheduled ${scheduledPost.socialAccount.platform} post was published successfully.`,
      href: `/app/content/${scheduledPost.contentId}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await db.scheduledPost.update({ where: { id: scheduledPostId }, data: { status: "FAILED", lastError: message } });
    await db.content.update({ where: { id: scheduledPost.contentId }, data: { status: "FAILED" } });

    await createNotification({
      workspaceId: scheduledPost.content.brand.workspaceId,
      type: "content.publish_failed",
      title: "Scheduled post failed",
      message: `Your scheduled ${scheduledPost.socialAccount.platform} post failed to publish: ${message}`,
      href: `/app/content/${scheduledPost.contentId}`,
    });
  }
}
