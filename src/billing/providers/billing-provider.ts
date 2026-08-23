export interface CustomerPortalResult {
  url: string;
}

export type CancelEffectiveFrom = "immediately" | "next_billing_period";

/**
 * Abstraction over the subscription-management side of the billing
 * provider (cancel/pause/resume/customer portal). Checkout itself is
 * initiated client-side via Paddle.js overlay checkout (see
 * src/app/(marketing)/pricing) since that's Paddle's recommended flow —
 * this interface covers everything the server needs to do afterward.
 */
export interface BillingProvider {
  readonly name: string;
  createCustomerPortalSession(customerId: string, subscriptionIds: string[]): Promise<CustomerPortalResult | null>;
  cancelSubscription(subscriptionId: string, effectiveFrom: CancelEffectiveFrom): Promise<void>;
  pauseSubscription(subscriptionId: string): Promise<void>;
  resumeSubscription(subscriptionId: string): Promise<void>;
}
