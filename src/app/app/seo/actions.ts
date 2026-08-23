"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUserId } from "@/lib/session";
import { requireActiveBrand } from "@/lib/require-brand";
import { generateKeywordIdeas, generateSEOContent } from "@/ai/services/seo-generation.service";
import { updateSEOContent } from "@/server/services/seo.service";
import { completeRecommendation } from "@/server/services/recommendation.service";
import { AppError } from "@/lib/errors";

export interface FormState {
  error?: string;
  success?: string;
}

export async function generateKeywordsAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUserId();
  const { brand } = await requireActiveBrand(userId);
  const topic = String(formData.get("topic") ?? "").trim();

  if (!topic) return { error: "Enter a topic or keyword." };

  try {
    await generateKeywordIdeas(brand.id, topic);
  } catch (error) {
    if (error instanceof AppError) return { error: error.message };
    console.error("generateKeywordsAction failed", error);
    return { error: "Something went wrong generating keyword ideas." };
  }

  revalidatePath("/app/seo/keywords");
  return { success: "Keyword ideas generated." };
}

export async function generateSEOContentAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUserId();
  const { brand } = await requireActiveBrand(userId);

  const type = String(formData.get("type") ?? "article");
  const topic = String(formData.get("topic") ?? "").trim();
  const productId = String(formData.get("productId") ?? "") || undefined;
  const recommendationId = String(formData.get("recommendationId") ?? "") || undefined;

  if (!topic) return { error: "Enter a topic or primary keyword." };

  let contentId: string;
  try {
    const content = await generateSEOContent(brand.id, { type, topic, productId });
    contentId = content.id;
  } catch (error) {
    if (error instanceof AppError) return { error: error.message };
    console.error("generateSEOContentAction failed", error);
    return { error: "Something went wrong generating SEO content." };
  }

  if (recommendationId) {
    await completeRecommendation(recommendationId);
  }

  revalidatePath("/app/seo/content");
  redirect(`/app/seo/content/${contentId}`);
}

export async function updateSEOContentAction(seoContentId: string, _prevState: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUserId();

  try {
    await updateSEOContent(seoContentId, userId, {
      seoTitle: String(formData.get("seoTitle") ?? ""),
      metaTitle: String(formData.get("metaTitle") ?? ""),
      metaDescription: String(formData.get("metaDescription") ?? ""),
      article: String(formData.get("article") ?? ""),
    });
  } catch (error) {
    if (error instanceof AppError) return { error: error.message };
    console.error("updateSEOContentAction failed", error);
    return { error: "Something went wrong while saving." };
  }

  revalidatePath(`/app/seo/content/${seoContentId}`);
  return { success: "Saved." };
}
