import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { testDb, uniqueEmail } from "./helpers/db";
import { approveContent, rejectContent, updateContent } from "@/server/services/content.service";
import { getOrSyncPlan } from "@/server/services/plan.service";
import { ValidationError } from "@/lib/errors";

describe("content approval workflow", () => {
  let userId: string;
  let brandId: string;
  let campaignId: string;

  beforeAll(async () => {
    const user = await testDb.user.create({ data: { email: uniqueEmail("approver"), name: "Approver" } });
    userId = user.id;

    const plan = await getOrSyncPlan("FREE");
    const workspace = await testDb.workspace.create({
      data: {
        name: "Approval Test Workspace",
        slug: `approval-test-${Date.now()}`,
        members: { create: { userId, role: "OWNER" } },
        subscription: { create: { planId: plan.id, status: "ACTIVE", currentPeriodStart: new Date() } },
      },
    });

    const brand = await testDb.brand.create({ data: { workspaceId: workspace.id, name: "Approval Test Brand" } });
    brandId = brand.id;

    const campaign = await testDb.campaign.create({
      data: { brandId, name: "Approval Campaign", promotionType: "BRAND", objective: "AWARENESS", idea: "idea", platforms: ["INSTAGRAM"] },
    });
    campaignId = campaign.id;
  });

  afterAll(async () => {
    await testDb.content.deleteMany({ where: { brandId } });
    await testDb.campaign.deleteMany({ where: { brandId } });
    const brand = await testDb.brand.findUniqueOrThrow({ where: { id: brandId } });
    await testDb.brand.delete({ where: { id: brandId } });
    await testDb.workspace.delete({ where: { id: brand.workspaceId } });
    await testDb.user.delete({ where: { id: userId } });
    await testDb.$disconnect();
  });

  async function createContent() {
    return testDb.content.create({
      data: { campaignId, brandId, platform: "INSTAGRAM", status: "READY_FOR_REVIEW", caption: "Original caption" },
    });
  }

  it("approves content that is ready for review", async () => {
    const content = await createContent();
    const approved = await approveContent(content.id, userId);
    expect(approved.status).toBe("APPROVED");
    expect(approved.approvedByUserId).toBe(userId);
    expect(approved.approvedAt).not.toBeNull();
  });

  it("rejects content with a reason and allows re-approval afterward", async () => {
    const content = await createContent();
    const rejected = await rejectContent(content.id, userId, "Off-brand tone");
    expect(rejected.status).toBe("REJECTED");
    expect(rejected.rejectionReason).toBe("Off-brand tone");

    const approved = await approveContent(content.id, userId);
    expect(approved.status).toBe("APPROVED");
    expect(approved.rejectionReason).toBeNull();
  });

  it("refuses to approve content that is already published", async () => {
    const content = await createContent();
    await testDb.content.update({ where: { id: content.id }, data: { status: "PUBLISHED" } });

    await expect(approveContent(content.id, userId)).rejects.toBeInstanceOf(ValidationError);
  });

  it("lets the user edit content fields and preserves other fields", async () => {
    const content = await createContent();
    const updated = await updateContent(content.id, userId, { caption: "Edited caption", cta: "Buy now" });
    expect(updated.caption).toBe("Edited caption");
    expect(updated.cta).toBe("Buy now");
    expect(updated.status).toBe("READY_FOR_REVIEW"); // editing doesn't change status
  });
});
