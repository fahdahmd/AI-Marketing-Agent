import "server-only";
import { Paddle, Environment } from "@paddle/paddle-node-sdk";
import type { BillingProvider, CancelEffectiveFrom, CustomerPortalResult } from "./billing-provider";

/**
 * Real Paddle Billing integration via the official Node SDK. Method
 * signatures verified against @paddle/paddle-node-sdk's own type
 * definitions (not guessed) — see subscriptions.cancel/pause/resume and
 * customerPortalSessions.create.
 */
export class PaddleBillingProvider implements BillingProvider {
  readonly name = "paddle";
  readonly client: Paddle;

  constructor() {
    const apiKey = process.env.PADDLE_API_KEY;
    if (!apiKey) {
      throw new Error("PADDLE_API_KEY is not set. Set BILLING_PROVIDER=mock to use the mock provider instead.");
    }
    const environment = process.env.PADDLE_ENVIRONMENT === "production" ? Environment.production : Environment.sandbox;
    this.client = new Paddle(apiKey, { environment });
  }

  async createCustomerPortalSession(customerId: string, subscriptionIds: string[]): Promise<CustomerPortalResult | null> {
    const session = await this.client.customerPortalSessions.create(customerId, subscriptionIds);
    return { url: session.urls.general.overview };
  }

  async cancelSubscription(subscriptionId: string, effectiveFrom: CancelEffectiveFrom): Promise<void> {
    await this.client.subscriptions.cancel(subscriptionId, { effectiveFrom });
  }

  async pauseSubscription(subscriptionId: string): Promise<void> {
    await this.client.subscriptions.pause(subscriptionId, { effectiveFrom: "next_billing_period" });
  }

  async resumeSubscription(subscriptionId: string): Promise<void> {
    await this.client.subscriptions.resume(subscriptionId, { effectiveFrom: "immediately" });
  }
}
