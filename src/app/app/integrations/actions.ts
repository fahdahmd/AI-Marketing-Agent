"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import type { Platform } from "@prisma/client";
import { requireUserId } from "@/lib/session";
import { requireActiveBrand } from "@/lib/require-brand";
import { connectSocialAccount, disconnectSocialAccount } from "@/server/services/social-account.service";

export async function connectAccountAction(platform: Platform) {
  const userId = await requireUserId();
  const { brand } = await requireActiveBrand(userId);

  const host = headers().get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  const redirectUri = `${protocol}://${host}/api/social/${platform.toLowerCase()}/callback`;

  const result = await connectSocialAccount(brand.id, userId, platform, redirectUri);

  if ("redirect" in result && result.redirect) {
    redirect(result.redirect);
  }

  revalidatePath("/app/integrations");
}

export async function disconnectAccountAction(accountId: string) {
  const userId = await requireUserId();
  await disconnectSocialAccount(accountId, userId);
  revalidatePath("/app/integrations");
}
