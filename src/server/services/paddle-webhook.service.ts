import "server-only";
import { EventName, type SubscriptionCreatedNotification, type SubscriptionNotification } from "@paddle/paddle-node-sdk";
import type { SubscriptionStatus as PrismaSubscriptionStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { getBillingProvider } from "@/billing/providers";
import { PaddleBillingProvider } from "@/billing/providers/paddle-provider";
import { getOrSyncPlan, getPlanByPaddlePriceId } from "@/server/services/plan.service";
import { createNotification } from "@/server/services/notification.service";
import { AuthenticationError, ValidationError } from "@/lib/errors";

type SubscriptionEventData = SubscriptionCreatedNotification | SubscriptionNotification;

function mapPaddleStatus(status: string): PrismaSubscriptionStatus {
  switch (status) {
    case "active":
      return "ACTIVE";
    case "trialing":
      return "TRIALING";
    case "past_due":
      return "PAST_DUE";
    case "paused":
      return "PAUSED";
    case "canceled":
      return "CANCELED";
    default:
      return "ACTIVE";
  }
}

async function resolveWorkspaceId(
  data: SubscriptionEventData
): Promise<string | null> {
  const fromCustomData = (data.customData as Record<string, unknown> | null)?.workspaceId;
  if (typeof fromCustomData === "string") return fromCustomData;

  const existing = await db.subscription.findUnique({ where: { paddleSubscriptionId: data.id } });
  return existing?.workspaceId ?? null;
}

async function upsertSubscriptionFromPaddle(data: SubscriptionEventData) {
  const workspaceId = await resolveWorkspaceId(data);
  if (!workspaceId) {
    console.error("Paddle webhook: could not resolve workspaceId for subscription", data.id);
    return;
  }

  const priceId = data.items[0]?.price?.id;
  const plan = priceId ? await getPlanByPaddlePriceId(priceId) : null;
  if (!plan) {
    console.error("Paddle webhook: no internal plan mapped to Paddle price", priceId);
    return;
  }

  const status = mapPaddleStatus(data.status);
  const cancelAtPeriodEnd = data.scheduledChange?.action === "cancel";

  await db.subscription.upsert({
    where: { workspaceId },
    create: {
      workspaceId,
      planId: plan.id,
      status,
      paddleCustomerId: data.customerId,
      paddleSubscriptionId: data.id,
      paddlePriceId: priceId,
      currentPeriodStart: data.currentBillingPeriod?.startsAt ? new Date(data.currentBillingPeriod.startsAt) : null,
      currentPeriodEnd: data.currentBillingPeriod?.endsAt ? new Date(data.currentBillingPeriod.endsAt) : null,
      cancelAtPeriodEnd,
    },
    update: {
      planId: plan.id,
      status,
      paddleCustomerId: data.customerId,
      paddleSubscriptionId: data.id,
      paddlePriceId: priceId,
      currentPeriodStart: data.currentBillingPeriod?.startsAt ? new Date(data.currentBillingPeriod.startsAt) : null,
      currentPeriodEnd: data.currentBillingPeriod?.endsAt ? new Date(data.currentBillingPeriod.endsAt) : null,
      cancelAtPeriodEnd,
    },
  });

  await createNotification({
    workspaceId,
    type: "subscription.updated",
    title: "Your subscription was updated",
    message: `Your plan is now ${plan.name} (${status.toLowerCase()}).`,
    href: "/app/billing",
  });
}

async function handleSubscriptionCanceled(data: SubscriptionEventData) {
  const workspaceId = await resolveWorkspaceId(data);
  if (!workspaceId) return;

  const freePlan = await getOrSyncPlan("FREE");

  await db.subscription.updateMany({
    where: { workspaceId },
    data: { status: "CANCELED", planId: freePlan.id, cancelAtPeriodEnd: false },
  });

  await createNotification({
    workspaceId,
    type: "subscription.updated",
    title: "Subscription canceled",
    message: "Your subscription has been canceled. You've been moved to the Free plan.",
    href: "/app/billing",
  });
}

async function handlePaymentFailed(workspaceId: string | null) {
  if (!workspaceId) return;

  await db.subscription.updateMany({ where: { workspaceId }, data: { status: "PAST_DUE" } });

  await createNotification({
    workspaceId,
    type: "subscription.updated",
    title: "Payment failed",
    message: "We couldn't process your latest payment. Please update your billing details to avoid losing access.",
    href: "/app/billing",
  });
}

/**
 * Deduplicates and dispatches an already signature-verified Paddle event.
 * Split out from processPaddleWebhook so idempotency/dispatch logic can be
 * unit-tested with a synthetic event, without needing real Paddle
 * credentials to exercise signature verification.
 */
export async function handleVerifiedPaddleEvent(event: { eventId: string; eventType: string; data: unknown }) {
  const workspaceIdHint =
    typeof (event.data as any)?.customData?.workspaceId === "string" ? (event.data as any).customData.workspaceId : undefined;

  const paddleEvent = await db.paddleEvent.upsert({
    where: { paddleEventId: event.eventId },
    create: { paddleEventId: event.eventId, eventType: event.eventType, payload: event as any, workspaceId: workspaceIdHint },
    update: {},
  });

  if (paddleEvent.processedAt) {
    return; // already processed — duplicate delivery
  }

  try {
    switch (event.eventType) {
      case EventName.SubscriptionCreated:
      case EventName.SubscriptionActivated:
      case EventName.SubscriptionUpdated:
        await upsertSubscriptionFromPaddle(event.data as SubscriptionEventData);
        break;
      case EventName.SubscriptionCanceled:
        await handleSubscriptionCanceled(event.data as SubscriptionEventData);
        break;
      case EventName.SubscriptionPaused: {
        const workspaceId = await resolveWorkspaceId(event.data as SubscriptionEventData);
        if (workspaceId) {
          await db.subscription.updateMany({ where: { workspaceId }, data: { status: "PAUSED" } });
          await createNotification({ workspaceId, type: "subscription.updated", title: "Subscription paused", message: "Your subscription has been paused.", href: "/app/billing" });
        }
        break;
      }
      case EventName.SubscriptionResumed:
        await upsertSubscriptionFromPaddle(event.data as SubscriptionEventData);
        break;
      case EventName.TransactionPaymentFailed: {
        const workspaceId = ((event.data as any).customData as Record<string, unknown> | null)?.workspaceId as string | undefined;
        await handlePaymentFailed(workspaceId ?? null);
        break;
      }
      case EventName.TransactionCompleted:
        // Subscription lifecycle events carry the authoritative state; nothing to do here beyond logging.
        break;
      default:
        break;
    }

    await db.paddleEvent.update({ where: { id: paddleEvent.id }, data: { processedAt: new Date() } });
  } catch (error) {
    await db.paddleEvent.update({ where: { id: paddleEvent.id }, data: { error: error instanceof Error ? error.message : String(error) } });
    throw error;
  }
}

/**
 * Verifies a raw webhook delivery's signature, then hands the verified
 * event to handleVerifiedPaddleEvent. This is the entry point the
 * /api/billing/paddle/webhook route calls.
 */
export async function processPaddleWebhook(rawBody: string, signature: string) {
  const provider = getBillingProvider();
  if (!(provider instanceof PaddleBillingProvider)) {
    throw new ValidationError("Paddle webhooks are not applicable when billing is running in mock mode.");
  }

  const secretKey = process.env.PADDLE_WEBHOOK_SECRET;
  if (!secretKey) throw new ValidationError("PADDLE_WEBHOOK_SECRET is not configured.");

  let event;
  try {
    event = await provider.client.webhooks.unmarshal(rawBody, secretKey, signature);
  } catch (error) {
    throw new AuthenticationError("Invalid Paddle webhook signature.");
  }
  if (!event) throw new AuthenticationError("Invalid Paddle webhook signature.");

  await handleVerifiedPaddleEvent(event);
}
