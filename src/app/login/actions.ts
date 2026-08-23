"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export interface FormState {
  error?: string;
}

export async function loginAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const callbackUrl = String(formData.get("callbackUrl") ?? "/app/dashboard");

  try {
    await signIn("credentials", { email, password, redirectTo: callbackUrl || "/app/dashboard" });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    throw error;
  }

  return {};
}
