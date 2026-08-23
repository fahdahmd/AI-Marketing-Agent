"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/session";
import { requireActiveBrand } from "@/lib/require-brand";
import { saveGoogleSelection, disconnectGoogle } from "@/server/services/google-connection.service";
import { AppError } from "@/lib/errors";

export interface FormState {
  error?: string;
  success?: string;
}

export async function saveGoogleSelectionAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUserId();
  const { brand } = await requireActiveBrand(userId);

  const gaPropertyId = String(formData.get("gaPropertyId") ?? "") || null;
  const searchConsoleSiteUrl = String(formData.get("searchConsoleSiteUrl") ?? "") || null;

  try {
    await saveGoogleSelection(brand.id, userId, gaPropertyId, searchConsoleSiteUrl);
  } catch (error) {
    if (error instanceof AppError) return { error: error.message };
    console.error("saveGoogleSelectionAction failed", error);
    return { error: "Something went wrong while saving." };
  }

  revalidatePath("/app/integrations");
  return { success: "Saved." };
}

export async function disconnectGoogleAction() {
  const userId = await requireUserId();
  const { brand } = await requireActiveBrand(userId);
  await disconnectGoogle(brand.id, userId);
  revalidatePath("/app/integrations");
}
