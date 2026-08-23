import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { testDb, uniqueEmail } from "./helpers/db";
import { runRecommendationRules } from "@/recommendations/rules";
import { getOrSyncPlan } from "@/server/services/plan.service";

describe("recommendation rule engine", () => {
  let brandId: string;
  let workspaceId: string;
  let userId: string;

  beforeAll(async () => {
    const user = await testDb.user.create({ data: { email: uniqueEmail("rules-owner"), name: "Owner" } });
    userId = user.id;
    const plan = await getOrSyncPlan("FREE");

    const workspace = await testDb.workspace.create({
      data: {
        name: "Rules Test Workspace",
        slug: `rules-test-${Date.now()}`,
        members: { create: { userId, role: "OWNER" } },
        subscription: { create: { planId: plan.id, status: "ACTIVE", currentPeriodStart: new Date() } },
      },
    });
    workspaceId = workspace.id;

    const brand = await testDb.brand.create({ data: { workspaceId, name: "Rules Test Brand" } });
    brandId = brand.id;

    // A product that has never been promoted -> should trigger PROMOTE_PRODUCT.
    await testDb.product.create({ data: { brandId, name: "Never Promoted Product" } });

    // Published posts: three average performers, one clear outperformer -> should trigger REPURPOSE_CONTENT.
    const socialAccount = await testDb.socialAccount.create({
      data: { brandId, platform: "INSTAGRAM", status: "CONNECTED", externalAccountId: "acct-1", isMock: true },
    });
    const campaign = await testDb.campaign.create({
      data: { brandId, name: "Rules Campaign", promotionType: "BRAND", objective: "AWARENESS", idea: "idea", platforms: ["INSTAGRAM"] },
    });

    const rates = [2, 2.2, 1.8, 9]; // last one is the clear outlier
    for (const rate of rates) {
      const content = await testDb.content.create({
        data: { campaignId: campaign.id, brandId, platform: "INSTAGRAM", status: "PUBLISHED", caption: "post" },
      });
      await testDb.publishedPost.create({
        data: { contentId: content.id, socialAccountId: socialAccount.id, externalPostId: `p-${rate}`, engagementRate: rate, reach: 1000 },
      });
    }
  });

  afterAll(async () => {
    await testDb.publishedPost.deleteMany({ where: { socialAccount: { brandId } } });
    await testDb.content.deleteMany({ where: { brandId } });
    await testDb.campaign.deleteMany({ where: { brandId } });
    await testDb.socialAccount.deleteMany({ where: { brandId } });
    await testDb.product.deleteMany({ where: { brandId } });
    await testDb.brand.delete({ where: { id: brandId } });
    await testDb.workspace.delete({ where: { id: workspaceId } });
    await testDb.user.delete({ where: { id: userId } });
    await testDb.$disconnect();
  });

  it("recommends promoting a product that has never had a campaign", async () => {
    const findings = await runRecommendationRules(brandId);
    const promoteFinding = findings.find((f) => f.type === "PROMOTE_PRODUCT");
    expect(promoteFinding).toBeDefined();
    expect(promoteFinding?.evidence.reason).toBe("never_promoted");
  });

  it("recommends repurposing the post that significantly outperforms the average", async () => {
    const findings = await runRecommendationRules(brandId);
    const repurposeFinding = findings.find((f) => f.type === "REPURPOSE_CONTENT");
    expect(repurposeFinding).toBeDefined();
    expect(repurposeFinding?.evidence.engagementRate).toBe(9);
    expect(Number(repurposeFinding?.evidence.multiplier)).toBeGreaterThan(1.5);
  });
});
