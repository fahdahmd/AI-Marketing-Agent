import "server-only";
import { redirect } from "next/navigation";
import { resolveActiveWorkspace, resolveActiveBrand } from "@/lib/require-context";

/**
 * Pages under /app that operate on brand-scoped data should call this to
 * get a guaranteed active workspace + brand, or be redirected into the
 * brand-creation flow if the workspace has none yet.
 */
export async function requireActiveBrand(userId: string) {
  const { activeWorkspace } = await resolveActiveWorkspace(userId);
  if (!activeWorkspace) redirect("/signup");

  const { activeBrand } = await resolveActiveBrand(activeWorkspace.id);
  if (!activeBrand) redirect("/app/brand/new");

  return { workspace: activeWorkspace, brand: activeBrand };
}
