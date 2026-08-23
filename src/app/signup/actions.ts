"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { registerUser } from "@/server/services/auth.service";
import { AppError } from "@/lib/errors";

export interface FormState {
  error?: string;
}

export async function signupAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const name = String(formData.get("name") ?? "");
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const workspaceName = String(formData.get("workspaceName") ?? "");

  try {
    await registerUser({ name, email, password, workspaceName });
  } catch (error) {
    if (error instanceof AppError) {
      return { error: error.message };
    }
    if (error && typeof error === "object" && "issues" in (error as any)) {
      return { error: "Please check the form and try again." };
    }
    console.error("Signup failed", error);
    return { error: "Something went wrong while creating your account." };
  }

  try {
    await signIn("credentials", { email, password, redirectTo: "/app/dashboard" });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Account created, but automatic sign-in failed. Please log in." };
    }
    throw error;
  }

  return {};
}
