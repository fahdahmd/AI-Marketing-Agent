import "server-only";
import { db } from "@/lib/db";
import { AuthorizationError, NotFoundError } from "@/lib/errors";
import type { WorkspaceRole } from "@prisma/client";

/**
 * All tenant-scoped data access must go through these helpers so that
 * workspace isolation is enforced consistently at the service layer,
 * never left to the UI or to ad-hoc route-handler checks.
 */

export async function requireWorkspaceMembership(workspaceId: string, userId: string) {
  const membership = await db.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });
  if (!membership) {
    throw new AuthorizationError("You don't have access to this workspace.");
  }
  return membership;
}

export async function requireWorkspaceOwner(workspaceId: string, userId: string) {
  const membership = await requireWorkspaceMembership(workspaceId, userId);
  if (membership.role !== "OWNER") {
    throw new AuthorizationError("Only the workspace owner can do that.");
  }
  return membership;
}

export function assertRole(role: WorkspaceRole, allowed: WorkspaceRole[]) {
  if (!allowed.includes(role)) {
    throw new AuthorizationError();
  }
}

/**
 * Resolves a brand while verifying the requesting user belongs to the
 * brand's workspace. Throws NotFoundError if the brand does not exist,
 * and AuthorizationError if the user is not a member of its workspace —
 * this is the single choke point that prevents cross-workspace access.
 */
export async function requireBrandAccess(brandId: string, userId: string) {
  const brand = await db.brand.findUnique({ where: { id: brandId } });
  if (!brand) throw new NotFoundError("Brand");

  const membership = await requireWorkspaceMembership(brand.workspaceId, userId);
  return { brand, membership };
}

export async function requireProductAccess(productId: string, userId: string) {
  const product = await db.product.findUnique({ where: { id: productId }, include: { brand: true } });
  if (!product) throw new NotFoundError("Product");

  const membership = await requireWorkspaceMembership(product.brand.workspaceId, userId);
  return { product, membership };
}

export async function requireCampaignAccess(campaignId: string, userId: string) {
  const campaign = await db.campaign.findUnique({ where: { id: campaignId }, include: { brand: true } });
  if (!campaign) throw new NotFoundError("Campaign");

  const membership = await requireWorkspaceMembership(campaign.brand.workspaceId, userId);
  return { campaign, membership };
}

export async function requireContentAccess(contentId: string, userId: string) {
  const content = await db.content.findUnique({ where: { id: contentId }, include: { brand: true } });
  if (!content) throw new NotFoundError("Content");

  const membership = await requireWorkspaceMembership(content.brand.workspaceId, userId);
  return { content, membership };
}
