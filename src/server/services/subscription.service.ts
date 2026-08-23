import "server-only";
import { randomUUID } from "crypto";
import type { PlanKey } from "@prisma/client";
import { db } from "@/lib/db";
import { requireWorkspaceOwner } from "@/server/auth/authorize";
import { getBillingProvider } from "@/billing/providers";
import { getOrSyncPlan } from "@/server/services/plan.service";
import { getEntitlements } from "@/server/services/entitlement.service";
import { logAudit } from "@/server/services/audit-log.service";
import { createNotification } from "@/server/services/notification.service";
import { ValidationError } from "@/lib/errors";

export async function getBillingOverview(workspaceId: string, userId: string) {
  await requireWorkspaceOwner(workspaceId, userId).catch(() => null); // owners get full detail; members can still view read-only via getEntitlements
  return getEntitlements(workspaceId);
}

/**
 * Simulates what a Paddle webhook would do after a successful checkout,
 * for development without real Paddle credentials. Only reachable when
 * the mock billing provider is active — see the guard in the server
 * action that calls this.
 */
export async function mockSubscribe(workspaceId: string, userId: string, planKey: PlanKey) {
  await requireWorkspaceOwner(workspaceId, userId);

  const plan = await getOrSyncPlan(planKey);
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const subscription = await db.subscription.upsert({
    where: { workspaceId },
    create: {
      workspaceId,
      planId: plan.id,
      status: "ACTIVE",
      paddleCustomerId: `mock_cus_${randomUUID().slice(0, 8)}`,
      paddleSubscriptionId: `mock_sub_${randomUUID().slice(0, 8)}`,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
    },
    update: {
      planId: plan.id,
      status: "ACTIVE",
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
    },
  });

  await logAudit({ workspaceId, userId, action: "subscription.changed", entityType: "Subscription", entityId: subscription.id, metadata: { plan: planKey, provider: "mock" } });
  await createNotification({
    workspaceId,
    userId,
    type: "subscription.updated",
    title: "Plan updated",
    message: `You're now on the ${plan.name} plan (simulated checkout — no real payment was processed).`,
    href: "/app/billing",
  });

  return subscription;
}

export async function cancelSubscription(workspaceId: string, userId: string) {
  await requireWorkspaceOwner(workspaceId, userId);

  const subscription = await db.subscription.findUnique({ where: { workspaceId } });
  if (!subscription) throw new ValidationError("No active subscription to cancel.");

  const provider = getBillingProvider();

  if (provider.name === "paddle" && subscription.paddleSubscriptionId) {
    await provider.cancelSubscription(subscription.paddleSubscriptionId, "next_billing_period");
    await db.subscription.update({ where: { workspaceId }, data: { cancelAtPeriodEnd: true } });
  } else {
    // Mock mode: no webhook will arrive, so cancel immediately in our own DB.
    const freePlan = await getOrSyncPlan("FREE");
    await db.subscription.update({ where: { workspaceId }, data: { status: "CANCELED", planId: freePlan.id, cancelAtPeriodEnd: false } });
  }

  await logAudit({ workspaceId, userId, action: "subscription.canceled", entityType: "Subscription", entityId: subscription.id });
  await createNotification({
    workspaceId,
    userId,
    type: "subscription.updated",
    title: "Subscription canceled",
    message: "Your subscription has been canceled.",
    href: "/app/billing",
  });
}

export async function getCustomerPortalUrl(workspaceId: string, userId: string): Promise<string | null> {
  await requireWorkspaceOwner(workspaceId, userId);

  const subscription = await db.subscription.findUnique({ where: { workspaceId } });
  if (!subscription?.paddleCustomerId || !subscription.paddleSubscriptionId) return null;

  const provider = getBillingProvider();
  const result = await provider.createCustomerPortalSession(subscription.paddleCustomerId, [subscription.paddleSubscriptionId]);
  return result?.url ?? null;
}
