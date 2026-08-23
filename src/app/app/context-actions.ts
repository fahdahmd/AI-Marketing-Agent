"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireUserId } from "@/lib/session";
import { requireWorkspaceMembership, requireBrandAccess } from "@/server/auth/authorize";

export async function setActiveWorkspaceAction(workspaceId: string) {
  const userId = await requireUserId();
  await requireWorkspaceMembership(workspaceId, userId);
  cookies().set("active_workspace_id", workspaceId, { httpOnly: true, sameSite: "lax", path: "/" });
  cookies().delete("active_brand_id");
  redirect("/app/dashboard");
}

export async function setActiveBrandAction(brandId: string) {
  const userId = await requireUserId();
  await requireBrandAccess(brandId, userId);
  cookies().set("active_brand_id", brandId, { httpOnly: true, sameSite: "lax", path: "/" });
  redirect("/app/dashboard");
}
