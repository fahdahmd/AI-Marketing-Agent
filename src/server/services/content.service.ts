import "server-only";
import { z } from "zod";
import { db } from "@/lib/db";
import type { ContentStatus } from "@prisma/client";
import { requireContentAccess, requireBrandAccess } from "@/server/auth/authorize";
import { logAudit } from "@/server/services/audit-log.service";
import { ValidationError } from "@/lib/errors";

export async function getContentForUser(contentId: string, userId: string) {
  const { content } = await requireContentAccess(contentId, userId);
  return db.content.findUniqueOrThrow({
    where: { id: content.id },
    include: {
      campaign: true,
      brand: true,
      variants: { orderBy: { createdAt: "asc" } },
      scheduledPosts: { orderBy: { createdAt: "desc" }, take: 1 },
      publishedPosts: { orderBy: { publishedAt: "desc" }, take: 1 },
    },
  });
}

export async function listContentForBrand(brandId: string, userId: string, status?: ContentStatus) {
  await requireBrandAccess(brandId, userId);
  return db.content.findMany({
    where: { brandId, ...(status ? { status } : {}) },
    orderBy: { updatedAt: "desc" },
    include: { campaign: true },
  });
}

export const contentEditSchema = z.object({
  headline: z.string().max(200).optional(),
  hook: z.string().max(500).optional(),
  caption: z.string().max(4000).optional(),
  body: z.string().max(8000).optional(),
  cta: z.string().max(200).optional(),
  hashtags: z.array(z.string()).optional(),
  imagePrompt: z.string().max(2000).optional(),
});

export type ContentEditInput = z.infer<typeof contentEditSchema>;

export async function updateContent(contentId: string, userId: string, input: ContentEditInput) {
  const { content } = await requireContentAccess(contentId, userId);
  const data = contentEditSchema.parse(input);

  const updated = await db.content.update({ where: { id: contentId }, data });

  await logAudit({ workspaceId: content.brand.workspaceId, userId, action: "content.edited", entityType: "Content", entityId: contentId });

  return updated;
}

export async function approveContent(contentId: string, userId: string) {
  const { content } = await requireContentAccess(contentId, userId);
  if (content.status !== "READY_FOR_REVIEW" && content.status !== "REJECTED") {
    throw new ValidationError(`Content in status ${content.status} cannot be approved.`);
  }

  const updated = await db.content.update({
    where: { id: contentId },
    data: { status: "APPROVED", approvedAt: new Date(), approvedByUserId: userId, rejectionReason: null },
  });

  await logAudit({ workspaceId: content.brand.workspaceId, userId, action: "content.approved", entityType: "Content", entityId: contentId });

  return updated;
}

export async function rejectContent(contentId: string, userId: string, reason?: string) {
  const { content } = await requireContentAccess(contentId, userId);

  const updated = await db.content.update({
    where: { id: contentId },
    data: { status: "REJECTED", rejectionReason: reason || null },
  });

  await logAudit({ workspaceId: content.brand.workspaceId, userId, action: "content.rejected", entityType: "Content", entityId: contentId, metadata: { reason } });

  return updated;
}
