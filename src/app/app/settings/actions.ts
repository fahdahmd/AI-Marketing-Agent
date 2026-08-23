"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/session";
import { requireActiveBrand } from "@/lib/require-brand";
import { updateWorkspaceName, addMemberByEmail, removeMember } from "@/server/services/workspace.service";
import { AppError } from "@/lib/errors";

export interface FormState {
  error?: string;
  success?: string;
}

export async function updateWorkspaceNameAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUserId();
  const { workspace } = await requireActiveBrand(userId);
  const name = String(formData.get("name") ?? "").trim();

  if (!name) return { error: "Workspace name is required." };

  try {
    await updateWorkspaceName(workspace.id, userId, name);
  } catch (error) {
    if (error instanceof AppError) return { error: error.message };
    console.error("updateWorkspaceNameAction failed", error);
    return { error: "Something went wrong." };
  }

  revalidatePath("/app/settings");
  revalidatePath("/app", "layout");
  return { success: "Saved." };
}

export async function addMemberAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUserId();
  const { workspace } = await requireActiveBrand(userId);
  const email = String(formData.get("email") ?? "").trim();

  if (!email) return { error: "Enter an email address." };

  try {
    await addMemberByEmail(workspace.id, userId, email);
  } catch (error) {
    if (error instanceof AppError) return { error: error.message };
    console.error("addMemberAction failed", error);
    return { error: "Something went wrong." };
  }

  revalidatePath("/app/settings");
  return { success: "Member added." };
}

export async function removeMemberAction(memberId: string) {
  const userId = await requireUserId();
  const { workspace } = await requireActiveBrand(userId);
  await removeMember(workspace.id, userId, memberId);
  revalidatePath("/app/settings");
}
