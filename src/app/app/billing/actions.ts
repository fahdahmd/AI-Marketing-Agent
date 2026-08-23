"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { PlanKey } from "@prisma/client";
import { requireUserId } from "@/lib/session";
import { requireActiveBrand } from "@/lib/require-brand";
import { mockSubscribe, cancelSubscription, getCustomerPortalUrl } from "@/server/services/subscription.service";
import { AppError } from "@/lib/errors";

export interface FormState {
  error?: string;
}

export async function mockSubscribeAction(planKey: PlanKey) {
  const userId = await requireUserId();
  const { workspace } = await requireActiveBrand(userId);
  await mockSubscribe(workspace.id, userId, planKey);
  revalidatePath("/app/billing");
}

export async function cancelSubscriptionAction() {
  const userId = await requireUserId();
  const { workspace } = await requireActiveBrand(userId);
  await cancelSubscription(workspace.id, userId);
  revalidatePath("/app/billing");
}

export async function openCustomerPortalAction() {
  const userId = await requireUserId();
  const { workspace } = await requireActiveBrand(userId);

  let url: string | null;
  try {
    url = await getCustomerPortalUrl(workspace.id, userId);
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error("openCustomerPortalAction failed", error);
    throw new Error("Could not open billing portal.");
  }

  if (url) redirect(url);
  redirect("/app/billing");
}
