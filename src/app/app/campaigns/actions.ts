"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUserId } from "@/lib/session";
import { requireActiveBrand } from "@/lib/require-brand";
import { createCampaignAndGenerate, campaignInputSchema } from "@/server/services/campaign.service";
import { regenerateContent } from "@/ai/services/campaign-generation.service";
import { requireContentAccess } from "@/server/auth/authorize";
import { AppError } from "@/lib/errors";

export interface FormState {
  error?: string;
}

export async function createCampaignAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUserId();
  const { brand } = await requireActiveBrand(userId);

  const platforms = formData.getAll("platforms").map(String);

  const parsed = campaignInputSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    promotionType: String(formData.get("promotionType") ?? "PRODUCT"),
    productId: String(formData.get("productId") ?? "") || undefined,
    objective: String(formData.get("objective") ?? "AWARENESS"),
    idea: String(formData.get("idea") ?? ""),
    targetAudience: String(formData.get("targetAudience") ?? "") || undefined,
    tone: String(formData.get("tone") ?? "") || undefined,
    platforms,
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Please check the form and try again." };
  }

  let campaignId: string;
  try {
    const campaign = await createCampaignAndGenerate(brand.id, userId, parsed.data);
    campaignId = campaign.id;
  } catch (error) {
    if (error instanceof AppError) return { error: error.message };
    console.error("createCampaignAction failed", error);
    return { error: "Something went wrong while generating your campaign." };
  }

  revalidatePath("/app/campaigns");
  redirect(`/app/campaigns/${campaignId}`);
}

export async function regenerateContentAction(contentId: string) {
  const userId = await requireUserId();
  const { content } = await requireContentAccess(contentId, userId);
  await regenerateContent(contentId);
  revalidatePath(`/app/campaigns/${content.campaignId}`);
  revalidatePath(`/app/content/${contentId}`);
}
