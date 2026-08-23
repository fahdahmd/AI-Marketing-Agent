import "server-only";
import type { BillingProvider, CancelEffectiveFrom, CustomerPortalResult } from "./billing-provider";

/**
 * Used automatically when PADDLE_API_KEY isn't configured. There's no
 * remote subscription to manage, so these are no-ops — the actual state
 * change happens in subscription.service.ts against our own database,
 * simulating what a real webhook would have done.
 */
export class MockBillingProvider implements BillingProvider {
  readonly name = "mock";

  async createCustomerPortalSession(): Promise<CustomerPortalResult | null> {
    return null;
  }

  async cancelSubscription(_subscriptionId: string, _effectiveFrom: CancelEffectiveFrom): Promise<void> {
    // no remote subscription to cancel in mock mode
  }

  async pauseSubscription(): Promise<void> {
    // no remote subscription to pause in mock mode
  }

  async resumeSubscription(): Promise<void> {
    // no remote subscription to resume in mock mode
  }
}
