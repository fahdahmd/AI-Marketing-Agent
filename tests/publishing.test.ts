import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { testDb, uniqueEmail } from "./helpers/db";
import { publishContentNow } from "@/server/services/publishing.service";
import { getOrSyncPlan } from "@/server/services/plan.service";

describe("social publishing service", () => {
  let userId: string;
  let workspaceId: string;
  let brandId: string;
  let contentId: string;
  let socialAccountId: string;

  beforeAll(async () => {
    const user = await testDb.user.create({ data: { email: uniqueEmail("publisher"), name: "Publisher" } });
    userId = user.id;

    const plan = await getOrSyncPlan("FREE");

    const workspace = await testDb.workspace.create({
      data: {
        name: "Publishing Test Workspace",
        slug: `publishing-test-${Date.now()}`,
        members: { create: { userId, role: "OWNER" } },
        subscription: { create: { planId: plan.id, status: "ACTIVE", currentPeriodStart: new Date() } },
      },
    });
    workspaceId = workspace.id;

    const brand = await testDb.brand.create({ data: { workspaceId, name: "Publish Test Brand" } });
    brandId = brand.id;

    const socialAccount = await testDb.socialAccount.create({
      data: {
        brandId,
        platform: "INSTAGRAM",
        status: "CONNECTED",
        externalAccountId: "mock_test_account",
        displayName: "Mock Test Account",
        isMock: true,
        accessTokenEnc: "mock-token",
      },
    });
    socialAccountId = socialAccount.id;

    const campaign = await testDb.campaign.create({
      data: {
        brandId,
        name: "Test Campaign",
        promotionType: "BRAND",
        objective: "AWARENESS",
        idea: "Test idea",
        platforms: ["INSTAGRAM"],
        status: "ACTIVE",
      },
    });

    const content = await testDb.content.create({
      data: {
        campaignId: campaign.id,
        brandId,
        platform: "INSTAGRAM",
        status: "APPROVED",
        caption: "Test caption",
        hashtags: ["test"],
      },
    });
    contentId = content.id;
  });

  afterAll(async () => {
    await testDb.publishedPost.deleteMany({ where: { contentId } });
    await testDb.content.deleteMany({ where: { brandId } });
    await testDb.campaign.deleteMany({ where: { brandId } });
    await testDb.socialAccount.deleteMany({ where: { brandId } });
    await testDb.brand.delete({ where: { id: brandId } });
    await testDb.workspace.delete({ where: { id: workspaceId } });
    await testDb.user.delete({ where: { id: userId } });
    await testDb.$disconnect();
  });

  it("publishes approved content via the mock social provider and updates status", async () => {
    const result = await publishContentNow(contentId, userId, socialAccountId);
    expect(result.externalPostId).toBeTruthy();

    const content = await testDb.content.findUniqueOrThrow({ where: { id: contentId } });
    expect(content.status).toBe("PUBLISHED");

    const published = await testDb.publishedPost.findFirst({ where: { contentId } });
    expect(published).not.toBeNull();
    expect(published?.externalPostId).toBe(result.externalPostId);
  });

  it("rejects publishing content that isn't approved", async () => {
    const campaign = await testDb.campaign.findFirstOrThrow({ where: { brandId } });
    const draftContent = await testDb.content.create({
      data: { campaignId: campaign.id, brandId, platform: "INSTAGRAM", status: "READY_FOR_REVIEW", caption: "Draft" },
    });

    await expect(publishContentNow(draftContent.id, userId, socialAccountId)).rejects.toThrow();
  });
});
