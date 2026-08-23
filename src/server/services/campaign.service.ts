import "server-only";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireBrandAccess, requireCampaignAccess } from "@/server/auth/authorize";
import { logAudit } from "@/server/services/audit-log.service";
import { createNotification } from "@/server/services/notification.service";
import { generateCampaign } from "@/ai/services/campaign-generation.service";

export const campaignInputSchema = z.object({
  name: z.string().min(1).max(200),
  promotionType: z.enum(["PRODUCT", "SERVICE", "BRAND", "WEBSITE", "CUSTOM"]),
  productId: z.string().optional(),
  objective: z.enum([
    "AWARENESS",
    "ENGAGEMENT",
    "WEBSITE_TRAFFIC",
    "LEADS",
    "SALES",
    "PRODUCT_LAUNCH",
    "PROMOTION",
    "RETARGETING",
  ]),
  idea: z.string().min(10, "Describe your marketing idea in a bit more detail").max(4000),
  targetAudience: z.string().max(2000).optional(),
  tone: z.string().max(200).optional(),
  platforms: z.array(z.enum(["INSTAGRAM", "FACEBOOK", "LINKEDIN", "X"])).min(1, "Select at least one platform"),
});

export type CampaignInput = z.infer<typeof campaignInputSchema>;

export async function listCampaignsForBrand(brandId: string, userId: string) {
  await requireBrandAccess(brandId, userId);
  return db.campaign.findMany({
    where: { brandId },
    orderBy: { createdAt: "desc" },
    include: { product: true, content: true },
  });
}

export async function getCampaignForUser(campaignId: string, userId: string) {
  const { campaign } = await requireCampaignAccess(campaignId, userId);
  return db.campaign.findUniqueOrThrow({
    where: { id: campaign.id },
    include: { product: true, content: { include: { variants: true } } },
  });
}

/**
 * Creates the campaign row and synchronously runs AI generation. There's
 * no queue in front of this for the MVP — generation is fast enough
 * (seconds) that the request/response cycle can carry it, and it keeps
 * the review workflow simple. Scheduled publishing and analytics sync
 * (src/jobs) use a real queue since those are genuinely time-deferred.
 */
export async function createCampaignAndGenerate(brandId: string, userId: string, input: CampaignInput) {
  const { brand } = await requireBrandAccess(brandId, userId);
  const data = campaignInputSchema.parse(input);

  const campaign = await db.campaign.create({
    data: {
      brandId,
      productId: data.productId || null,
      name: data.name,
      promotionType: data.promotionType,
      objective: data.objective,
      idea: data.idea,
      targetAudience: data.targetAudience || null,
      tone: data.tone || null,
      platforms: data.platforms,
      status: "DRAFT",
    },
  });

  await logAudit({ workspaceId: brand.workspaceId, userId, action: "campaign.created", entityType: "Campaign", entityId: campaign.id, metadata: { name: campaign.name } });

  await generateCampaign(campaign.id);

  await createNotification({
    workspaceId: brand.workspaceId,
    userId,
    type: "campaign.ready_for_review",
    title: "Campaign ready for review",
    message: `"${campaign.name}" has been generated and is ready for your review.`,
    href: `/app/campaigns/${campaign.id}`,
  });

  await logAudit({ workspaceId: brand.workspaceId, userId, action: "campaign.ai_content_generated", entityType: "Campaign", entityId: campaign.id });

  return campaign;
}
