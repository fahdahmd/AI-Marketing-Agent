import "server-only";
import { db } from "@/lib/db";
import { getActiveWorkspaceIdCookie, getActiveBrandIdCookie } from "@/lib/active-context";
import { listWorkspacesForUser } from "@/server/services/workspace.service";

export async function resolveActiveWorkspace(userId: string) {
  const workspaces = await listWorkspacesForUser(userId);
  if (workspaces.length === 0) return { workspaces, activeWorkspace: null };

  const cookieId = getActiveWorkspaceIdCookie();
  const activeWorkspace = workspaces.find((w) => w.id === cookieId) ?? workspaces[0];

  return { workspaces, activeWorkspace };
}

export async function resolveActiveBrand(workspaceId: string) {
  const brands = await db.brand.findMany({ where: { workspaceId }, orderBy: { createdAt: "asc" } });
  if (brands.length === 0) return { brands, activeBrand: null };

  const cookieId = getActiveBrandIdCookie();
  const activeBrand = brands.find((b) => b.id === cookieId) ?? brands[0];

  return { brands, activeBrand };
}
