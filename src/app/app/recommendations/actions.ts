"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUserId } from "@/lib/session";
import { requireActiveBrand } from "@/lib/require-brand";
import { generateRecommendations } from "@/ai/services/recommendation-generation.service";
import { acceptRecommendation, dismissRecommendation } from "@/server/services/recommendation.service";
import { db } from "@/lib/db";
import { requireBrandAccess } from "@/server/auth/authorize";

export async function generateRecommendationsAction() {
  const userId = await requireUserId();
  const { brand } = await requireActiveBrand(userId);
  await generateRecommendations(brand.id);
  revalidatePath("/app/recommendations");
  revalidatePath("/app/dashboard");
}

export async function dismissRecommendationAction(recommendationId: string) {
  const userId = await requireUserId();
  await dismissRecommendation(recommendationId, userId);
  revalidatePath("/app/recommendations");
}

export async function acceptRecommendationAction(recommendationId: string) {
  const userId = await requireUserId();
  const recommendation = await db.recommendation.findUniqueOrThrow({ where: { id: recommendationId } });
  await requireBrandAccess(recommendation.brandId, userId);
  await acceptRecommendation(recommendationId, userId);

  if (recommendation.type === "SEO_CONTENT") {
    const topic = (recommendation.evidence as { topic?: string })?.topic ?? "";
    redirect(`/app/seo/content?recommendationId=${recommendationId}&topic=${encodeURIComponent(topic)}`);
  }

  redirect(`/app/campaigns/new?recommendationId=${recommendationId}`);
}
