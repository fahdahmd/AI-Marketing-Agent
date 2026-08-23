import "server-only";
import { db } from "@/lib/db";
import { requireBrandAccess } from "@/server/auth/authorize";
import { logAudit } from "@/server/services/audit-log.service";
import { NotFoundError, ValidationError } from "@/lib/errors";

export async function listRecommendationsForBrand(brandId: string, userId: string) {
  await requireBrandAccess(brandId, userId);
  return db.recommendation.findMany({
    where: { brandId, status: { not: "DISMISSED" } },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
  });
}

async function requireRecommendationAccess(recommendationId: string, userId: string) {
  const recommendation = await db.recommendation.findUnique({ where: { id: recommendationId }, include: { brand: true } });
  if (!recommendation) throw new NotFoundError("Recommendation");
  await requireBrandAccess(recommendation.brandId, userId);
  return recommendation;
}

export async function markRecommendationViewed(recommendationId: string, userId: string) {
  const recommendation = await requireRecommendationAccess(recommendationId, userId);
  if (recommendation.status !== "NEW") return recommendation;
  return db.recommendation.update({ where: { id: recommendationId }, data: { status: "VIEWED", viewedAt: new Date() } });
}

export async function acceptRecommendation(recommendationId: string, userId: string) {
  const recommendation = await requireRecommendationAccess(recommendationId, userId);
  const updated = await db.recommendation.update({
    where: { id: recommendationId },
    data: { status: "ACCEPTED", acceptedAt: new Date() },
  });

  await logAudit({
    workspaceId: recommendation.brand.workspaceId,
    userId,
    action: "recommendation.accepted",
    entityType: "Recommendation",
    entityId: recommendationId,
  });

  return updated;
}

export async function dismissRecommendation(recommendationId: string, userId: string) {
  const recommendation = await requireRecommendationAccess(recommendationId, userId);
  const updated = await db.recommendation.update({
    where: { id: recommendationId },
    data: { status: "DISMISSED", dismissedAt: new Date() },
  });

  await logAudit({
    workspaceId: recommendation.brand.workspaceId,
    userId,
    action: "recommendation.dismissed",
    entityType: "Recommendation",
    entityId: recommendationId,
  });

  return updated;
}

export async function completeRecommendation(recommendationId: string) {
  const recommendation = await db.recommendation.findUnique({ where: { id: recommendationId } });
  if (!recommendation) return;
  await db.recommendation.update({ where: { id: recommendationId }, data: { status: "COMPLETED", completedAt: new Date() } });
}

/**
 * Resolves what a recommendation's "Accept" action should prefill in the
 * campaign builder, per the recommendation -> campaign builder flow.
 */
export async function getRecommendationCampaignPrefill(recommendationId: string, userId: string) {
  const recommendation = await requireRecommendationAccess(recommendationId, userId);

  if (!["PROMOTE_PRODUCT", "REPURPOSE_CONTENT", "CAMPAIGN_IDEA"].includes(recommendation.type)) {
    throw new ValidationError("This recommendation doesn't lead to a campaign.");
  }

  let productId: string | undefined;
  let idea = recommendation.explanation;

  if (recommendation.sourceProductId) {
    productId = recommendation.sourceProductId;
  }

  if (recommendation.sourceContentId) {
    const content = await db.content.findUnique({ where: { id: recommendation.sourceContentId }, include: { campaign: true } });
    if (content) {
      productId = content.campaign.productId ?? productId;
      idea = `Repurpose this high-performing idea: ${content.campaign.idea}`;
    }
  }

  return { recommendationId, productId, idea, name: recommendation.title };
}
