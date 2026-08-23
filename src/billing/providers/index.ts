import "server-only";
import type { BillingProvider } from "./billing-provider";
import { MockBillingProvider } from "./mock-provider";

let cached: BillingProvider | undefined;

export function isPaddleConfigured(): boolean {
  return Boolean(process.env.PADDLE_API_KEY);
}

export function getBillingProvider(): BillingProvider {
  if (cached) return cached;

  if (process.env.BILLING_PROVIDER === "paddle" && isPaddleConfigured()) {
    const { PaddleBillingProvider } = require("./paddle-provider") as typeof import("./paddle-provider");
    cached = new PaddleBillingProvider();
  } else {
    cached = new MockBillingProvider();
  }

  return cached;
}

export * from "./billing-provider";
