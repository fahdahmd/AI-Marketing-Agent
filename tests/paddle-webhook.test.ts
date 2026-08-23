import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { testDb, uniqueEmail } from "./helpers/db";
import { handleVerifiedPaddleEvent } from "@/server/services/paddle-webhook.service";
import { getOrSyncPlan } from "@/server/services/plan.service";
import { getWorkspacePlan } from "@/server/services/entitlement.service";

const STARTER_PRICE_ID = "pri_test_starter_webhook";
const RUN_ID = Date.now(); // keeps event IDs unique across repeated local test runs

describe("Paddle webhook processing", () => {
  let workspaceId: string;
  let userId: string;
  const eventIds: string[] = [];

  function nextEventId(label: string) {
    const id = `evt_test_${RUN_ID}_${label}`;
    eventIds.push(id);
    return id;
  }

  beforeAll(async () => {
    const user = await testDb.user.create({ data: { email: uniqueEmail("webhook-owner"), name: "Owner" } });
    userId = user.id;

    const freePlan = await getOrSyncPlan("FREE");
    await getOrSyncPlan("STARTER");
    await testDb.plan.update({ where: { key: "STARTER" }, data: { paddlePriceId: STARTER_PRICE_ID } });

    const workspace = await testDb.workspace.create({
      data: {
        name: "Webhook Test Workspace",
        slug: `webhook-test-${RUN_ID}`,
        members: { create: { userId, role: "OWNER" } },
        subscription: { create: { planId: freePlan.id, status: "ACTIVE", currentPeriodStart: new Date() } },
      },
    });
    workspaceId = workspace.id;
  });

  afterAll(async () => {
    await testDb.paddleEvent.deleteMany({ where: { paddleEventId: { in: eventIds } } });
    await testDb.workspace.delete({ where: { id: workspaceId } });
    await testDb.user.delete({ where: { id: userId } });
    await testDb.$disconnect();
  });

  function subscriptionCreatedEvent(eventId: string) {
    return {
      eventId,
      eventType: "subscription.created",
      data: {
        id: "sub_test_123",
        status: "active",
        customerId: "ctm_test_123",
        customData: { workspaceId },
        items: [{ price: { id: STARTER_PRICE_ID } }],
        currentBillingPeriod: { startsAt: new Date().toISOString(), endsAt: new Date(Date.now() + 2592000000).toISOString() },
        scheduledChange: null,
      },
    };
  }

  it("upgrades the workspace plan on subscription.created", async () => {
    await handleVerifiedPaddleEvent(subscriptionCreatedEvent(nextEventId("created")));

    const { plan } = await getWorkspacePlan(workspaceId);
    expect(plan.key).toBe("STARTER");
  });

  it("is idempotent — processing the same event twice only applies it once", async () => {
    const duplicateEventId = eventIds[0]; // replay the very first event

    // Downgrade back to FREE directly, then replay the SAME event id.
    const freePlan = await getOrSyncPlan("FREE");
    await testDb.subscription.update({ where: { workspaceId }, data: { planId: freePlan.id } });

    await handleVerifiedPaddleEvent(subscriptionCreatedEvent(duplicateEventId)); // already marked processed

    const { plan } = await getWorkspacePlan(workspaceId);
    expect(plan.key).toBe("FREE"); // unchanged, because the duplicate was skipped

    const eventCount = await testDb.paddleEvent.count({ where: { paddleEventId: duplicateEventId } });
    expect(eventCount).toBe(1);
  });

  it("processes a new event id normally after a duplicate was skipped", async () => {
    await handleVerifiedPaddleEvent(subscriptionCreatedEvent(nextEventId("created-2")));

    const { plan } = await getWorkspacePlan(workspaceId);
    expect(plan.key).toBe("STARTER");
  });

  it("falls back to Free entitlements when a subscription is canceled", async () => {
    await handleVerifiedPaddleEvent({
      eventId: nextEventId("canceled"),
      eventType: "subscription.canceled",
      data: {
        id: "sub_test_123",
        customData: { workspaceId },
      },
    });

    const { plan, subscription } = await getWorkspacePlan(workspaceId);
    expect(plan.key).toBe("FREE");
    expect(subscription?.status).toBe("CANCELED");
  });
});
