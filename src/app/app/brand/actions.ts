"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { requireUserId } from "@/lib/session";
import { createBrand, updateBrand, brandVoiceValues } from "@/server/services/brand.service";
import { getStorageProvider, assertValidImageFile } from "@/storage";
import { AppError } from "@/lib/errors";
import { resolveActiveWorkspace } from "@/lib/require-context";

export interface FormState {
  error?: string;
}

function parseListField(formData: FormData, name: string): string[] {
  const raw = String(formData.get(name) ?? "");
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

async function extractBrandFields(formData: FormData) {
  const logoFile = formData.get("logo");
  let logoUrl: string | undefined;

  if (logoFile instanceof File && logoFile.size > 0) {
    assertValidImageFile(logoFile);
    const buffer = Buffer.from(await logoFile.arrayBuffer());
    const storage = getStorageProvider();
    const result = await storage.upload({
      buffer,
      filename: logoFile.name,
      contentType: logoFile.type,
      folder: "brand-logos",
    });
    logoUrl = result.url;
  }

  const voice = String(formData.get("voice") ?? "PROFESSIONAL");

  return {
    name: String(formData.get("name") ?? ""),
    website: String(formData.get("website") ?? ""),
    industry: String(formData.get("industry") ?? ""),
    description: String(formData.get("description") ?? ""),
    targetAudience: String(formData.get("targetAudience") ?? ""),
    voice: (brandVoiceValues as readonly string[]).includes(voice) ? (voice as (typeof brandVoiceValues)[number]) : "PROFESSIONAL",
    customVoiceNotes: String(formData.get("customVoiceNotes") ?? ""),
    marketingGoals: parseListField(formData, "marketingGoals"),
    competitors: parseListField(formData, "competitors"),
    logoUrl,
    primaryColor: String(formData.get("primaryColor") ?? ""),
    secondaryColor: String(formData.get("secondaryColor") ?? ""),
  };
}

export async function createBrandAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUserId();
  const { activeWorkspace } = await resolveActiveWorkspace(userId);
  if (!activeWorkspace) return { error: "No active workspace found." };

  try {
    const fields = await extractBrandFields(formData);
    const brand = await createBrand(activeWorkspace.id, userId, fields);
    cookies().set("active_brand_id", brand.id, { httpOnly: true, sameSite: "lax", path: "/" });
  } catch (error) {
    if (error instanceof AppError) return { error: error.message };
    console.error("createBrandAction failed", error);
    return { error: "Something went wrong while creating your brand." };
  }

  revalidatePath("/app", "layout");
  redirect("/app/dashboard");
}

export async function updateBrandAction(brandId: string, _prevState: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUserId();

  try {
    const fields = await extractBrandFields(formData);
    await updateBrand(brandId, userId, fields);
  } catch (error) {
    if (error instanceof AppError) return { error: error.message };
    console.error("updateBrandAction failed", error);
    return { error: "Something went wrong while saving your brand." };
  }

  revalidatePath("/app", "layout");
  return {};
}
