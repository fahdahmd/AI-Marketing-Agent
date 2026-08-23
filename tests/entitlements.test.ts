import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { testDb, uniqueEmail } from "./helpers/db";
import { getOrSyncPlan } from "@/server/services/plan.service";
import { recordAIUsage, getMonthlyUsageCount } from "@/server/services/ai-usage.service";
import { assertCanGenerateText, getEntitlements } from "@/server/services/entitlement.service";
import { UsageLimitError } from "@/lib/errors";
import { CREDIT_COSTS } from "@/billing/plans";

describe("credit system and entitlements", () => {
  let workspaceId: string;
  let userId: string;

  beforeAll(async () => {
    const user = await testDb.user.create({ data: { email: uniqueEmail("entitlement-owner"), name: "Owner" } });
    userId = user.id;

    const freePlan = await getOrSyncPlan("FREE");

    const workspace = await testDb.workspace.create({
      data: {
        name: "Entitlement Test Workspace",
        slug: `entitlement-test-${Date.now()}`,
        members: { create: { userId, role: "OWNER" } },
        subscription: { create: { planId: freePlan.id, status: "ACTIVE", currentPeriodStart: new Date() } },
      },
    });
    workspaceId = workspace.id;
  });

  afterAll(async () => {
    await testDb.aIUsage.deleteMany({ where: { workspaceId } });
    await testDb.workspace.delete({ where: { id: workspaceId } });
    await testDb.user.delete({ where: { id: userId } });
    await testDb.$disconnect();
  });

  it("records credits consumed per generation type", async () => {
    const usage = await recordAIUsage({ workspaceId, type: "TEXT_GENERATION", provider: "mock" });
    expect(usage.creditsConsumed).toBe(CREDIT_COSTS.TEXT_GENERATION);

    const imageUsage = await recordAIUsage({ workspaceId, type: "IMAGE_GENERATION", provider: "mock" });
    expect(imageUsage.creditsConsumed).toBe(CREDIT_COSTS.IMAGE_GENERATION);
  });

  it("counts monthly usage per type", async () => {
    const count = await getMonthlyUsageCount(workspaceId, "TEXT_GENERATION");
    expect(count).toBeGreaterThanOrEqual(1);
  });

  it("allows generation while under the plan limit", async () => {
    await expect(assertCanGenerateText(workspaceId)).resolves.toBeUndefined();
  });

  it("blocks generation once the monthly plan limit is reached", async () => {
    const { plan } = await getEntitlements(workspaceId);
    const alreadyUsed = await getMonthlyUsageCount(workspaceId, "TEXT_GENERATION");
    const remaining = plan.aiPostsPerMonth - alreadyUsed;

    for (let i = 0; i < remaining; i++) {
      await recordAIUsage({ workspaceId, type: "TEXT_GENERATION", provider: "mock" });
    }

    await expect(assertCanGenerateText(workspaceId)).rejects.toBeInstanceOf(UsageLimitError);
  });

  it("reflects usage in getEntitlements remaining counts", async () => {
    const entitlements = await getEntitlements(workspaceId);
    expect(entitlements.remaining.aiPosts).toBe(0);
  });
});
