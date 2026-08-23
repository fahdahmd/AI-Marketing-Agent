"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/session";
import { updateContent, approveContent, rejectContent } from "@/server/services/content.service";
import { regenerateContent } from "@/ai/services/campaign-generation.service";
import { publishContentNow, scheduleContent } from "@/server/services/publishing.service";
import { requireContentAccess } from "@/server/auth/authorize";
import { AppError } from "@/lib/errors";

export interface FormState {
  error?: string;
  success?: string;
}

function parseHashtags(formData: FormData): string[] | undefined {
  const raw = formData.get("hashtags");
  if (raw == null) return undefined;
  return String(raw)
    .split(",")
    .map((s) => s.trim().replace(/^#/, ""))
    .filter(Boolean);
}

export async function updateContentAction(contentId: string, _prevState: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUserId();

  try {
    await updateContent(contentId, userId, {
      headline: formData.get("headline") != null ? String(formData.get("headline")) : undefined,
      hook: formData.get("hook") != null ? String(formData.get("hook")) : undefined,
      caption: formData.get("caption") != null ? String(formData.get("caption")) : undefined,
      body: formData.get("body") != null ? String(formData.get("body")) : undefined,
      cta: formData.get("cta") != null ? String(formData.get("cta")) : undefined,
      hashtags: parseHashtags(formData),
      imagePrompt: formData.get("imagePrompt") != null ? String(formData.get("imagePrompt")) : undefined,
    });
  } catch (error) {
    if (error instanceof AppError) return { error: error.message };
    console.error("updateContentAction failed", error);
    return { error: "Something went wrong while saving." };
  }

  revalidatePath(`/app/content/${contentId}`);
  return { success: "Saved." };
}

export async function regenerateContentReviewAction(contentId: string) {
  const userId = await requireUserId();
  await requireContentAccess(contentId, userId);
  await regenerateContent(contentId);
  revalidatePath(`/app/content/${contentId}`);
}

export async function approveContentAction(contentId: string) {
  const userId = await requireUserId();
  await approveContent(contentId, userId);
  revalidatePath(`/app/content/${contentId}`);
  revalidatePath("/app/content");
}

export async function rejectContentAction(contentId: string, reason?: string) {
  const userId = await requireUserId();
  await rejectContent(contentId, userId, reason);
  revalidatePath(`/app/content/${contentId}`);
  revalidatePath("/app/content");
}

export async function publishNowAction(contentId: string, socialAccountId: string): Promise<FormState> {
  const userId = await requireUserId();
  try {
    await publishContentNow(contentId, userId, socialAccountId);
  } catch (error) {
    if (error instanceof AppError) return { error: error.message };
    console.error("publishNowAction failed", error);
    return { error: "Publishing failed. Please try again." };
  }
  revalidatePath(`/app/content/${contentId}`);
  revalidatePath("/app/content");
  return { success: "Published!" };
}

export async function scheduleContentAction(contentId: string, socialAccountId: string, scheduledForIso: string): Promise<FormState> {
  const userId = await requireUserId();
  try {
    await scheduleContent(contentId, userId, socialAccountId, new Date(scheduledForIso));
  } catch (error) {
    if (error instanceof AppError) return { error: error.message };
    console.error("scheduleContentAction failed", error);
    return { error: "Scheduling failed. Please try again." };
  }
  revalidatePath(`/app/content/${contentId}`);
  revalidatePath("/app/content");
  revalidatePath("/app/calendar");
  return { success: "Scheduled!" };
}
