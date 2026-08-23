import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { testDb, uniqueEmail } from "./helpers/db";
import {
  requireWorkspaceMembership,
  requireWorkspaceOwner,
  requireBrandAccess,
} from "@/server/auth/authorize";
import { AuthorizationError, NotFoundError } from "@/lib/errors";

describe("workspace isolation", () => {
  let ownerId: string;
  let outsiderId: string;
  let memberId: string;
  let workspaceId: string;
  let brandId: string;

  beforeAll(async () => {
    const owner = await testDb.user.create({ data: { email: uniqueEmail("owner"), name: "Owner" } });
    const outsider = await testDb.user.create({ data: { email: uniqueEmail("outsider"), name: "Outsider" } });
    const member = await testDb.user.create({ data: { email: uniqueEmail("member"), name: "Member" } });
    ownerId = owner.id;
    outsiderId = outsider.id;
    memberId = member.id;

    const plan = await testDb.plan.upsert({
      where: { key: "FREE" },
      create: {
        key: "FREE",
        name: "Free",
        priceMonthly: 0,
        aiPostsPerMonth: 10,
        aiImagesPerMonth: 5,
        seoGenPerMonth: 2,
        socialAccounts: 1,
        teamMembers: 1,
        brands: 1,
      },
      update: {},
    });

    const workspace = await testDb.workspace.create({
      data: {
        name: "Isolation Test Workspace",
        slug: `isolation-test-${Date.now()}`,
        members: {
          create: [
            { userId: ownerId, role: "OWNER" },
            { userId: memberId, role: "MEMBER" },
          ],
        },
        subscription: { create: { planId: plan.id, status: "ACTIVE", currentPeriodStart: new Date() } },
      },
    });
    workspaceId = workspace.id;

    const brand = await testDb.brand.create({
      data: { workspaceId, name: "Test Brand", voice: "PROFESSIONAL" },
    });
    brandId = brand.id;
  });

  afterAll(async () => {
    await testDb.brand.deleteMany({ where: { workspaceId } });
    await testDb.workspace.delete({ where: { id: workspaceId } });
    await testDb.user.deleteMany({ where: { id: { in: [ownerId, outsiderId, memberId] } } });
    await testDb.$disconnect();
  });

  it("allows a member to access their workspace", async () => {
    const membership = await requireWorkspaceMembership(workspaceId, memberId);
    expect(membership.role).toBe("MEMBER");
  });

  it("denies a non-member access to the workspace", async () => {
    await expect(requireWorkspaceMembership(workspaceId, outsiderId)).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("denies a non-owner member from owner-only actions", async () => {
    await expect(requireWorkspaceOwner(workspaceId, memberId)).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("allows the owner to perform owner-only actions", async () => {
    const membership = await requireWorkspaceOwner(workspaceId, ownerId);
    expect(membership.role).toBe("OWNER");
  });

  it("allows a member to access a brand within their workspace", async () => {
    const { brand } = await requireBrandAccess(brandId, memberId);
    expect(brand.id).toBe(brandId);
  });

  it("prevents a user from another workspace accessing this brand", async () => {
    await expect(requireBrandAccess(brandId, outsiderId)).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("throws NotFoundError for a brand that does not exist", async () => {
    await expect(requireBrandAccess("non-existent-id", ownerId)).rejects.toBeInstanceOf(NotFoundError);
  });
});
