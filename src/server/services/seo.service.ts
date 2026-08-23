import "server-only";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireBrandAccess } from "@/server/auth/authorize";
import { NotFoundError } from "@/lib/errors";
import { logAudit } from "@/server/services/audit-log.service";

export async function getOrCreateSEOProject(brandId: string) {
  const existing = await db.sEOProject.findFirst({ where: { brandId }, orderBy: { createdAt: "asc" } });
  if (existing) return existing;

  const brand = await db.brand.findUniqueOrThrow({ where: { id: brandId } });
  return db.sEOProject.create({ data: { brandId, name: `${brand.name} SEO` } });
}

export async function listKeywordsForBrand(brandId: string, userId: string) {
  await requireBrandAccess(brandId, userId);
  const project = await db.sEOProject.findFirst({ where: { brandId } });
  if (!project) return [];
  return db.sEOKeyword.findMany({ where: { projectId: project.id }, orderBy: { createdAt: "desc" } });
}

export async function listSEOContentForBrand(brandId: string, userId: string) {
  await requireBrandAccess(brandId, userId);
  const project = await db.sEOProject.findFirst({ where: { brandId } });
  if (!project) return [];
  return db.sEOContent.findMany({ where: { projectId: project.id }, orderBy: { createdAt: "desc" } });
}

export async function getSEOContentForUser(seoContentId: string, userId: string) {
  const content = await db.sEOContent.findUnique({ where: { id: seoContentId } });
  if (!content) throw new NotFoundError("SEO content");
  await requireBrandAccess(content.brandId, userId);
  return content;
}

export const seoContentEditSchema = z.object({
  seoTitle: z.string().max(200).optional(),
  metaTitle: z.string().max(200).optional(),
  metaDescription: z.string().max(400).optional(),
  article: z.string().max(20000).optional(),
});

export async function updateSEOContent(seoContentId: string, userId: string, input: z.infer<typeof seoContentEditSchema>) {
  const content = await getSEOContentForUser(seoContentId, userId);
  const data = seoContentEditSchema.parse(input);

  const updated = await db.sEOContent.update({ where: { id: seoContentId }, data });

  await logAudit({ workspaceId: (await requireBrandAccess(content.brandId, userId)).brand.workspaceId, userId, action: "seo_content.edited", entityType: "SEOContent", entityId: seoContentId });

  return updated;
}
