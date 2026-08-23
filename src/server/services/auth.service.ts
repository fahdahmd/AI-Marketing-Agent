import "server-only";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { ConflictError, ValidationError } from "@/lib/errors";
import { createWorkspaceForUser } from "@/server/services/workspace.service";

export const signupSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  workspaceName: z.string().min(1, "Workspace name is required").max(100),
});

export type SignupInput = z.infer<typeof signupSchema>;

export async function registerUser(input: SignupInput) {
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.errors[0]?.message ?? "Invalid input", parsed.error);
  }
  const data = parsed.data;
  const email = data.email.toLowerCase();

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    throw new ConflictError("An account with this email already exists.");
  }

  const passwordHash = await bcrypt.hash(data.password, 12);

  const user = await db.user.create({
    data: { name: data.name, email, passwordHash },
  });

  const workspace = await createWorkspaceForUser(user.id, data.workspaceName);

  return { user, workspace };
}

export function assertValid<T>(schema: { parse: (v: unknown) => T }, value: unknown): T {
  try {
    return schema.parse(value);
  } catch (e) {
    throw new ValidationError("Invalid input", e);
  }
}
