import "server-only";
import { auth } from "@/auth";
import { AuthenticationError } from "@/lib/errors";

export async function getCurrentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

export async function requireUserId(): Promise<string> {
  const userId = await getCurrentUserId();
  if (!userId) throw new AuthenticationError();
  return userId;
}
