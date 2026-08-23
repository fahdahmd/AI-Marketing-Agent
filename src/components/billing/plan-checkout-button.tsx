"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Paddle } from "@paddle/paddle-js";
import type { PlanKey } from "@prisma/client";
import { Button } from "@/components/ui/button";

interface PlanCheckoutButtonProps {
  planKey: PlanKey;
  planName: string;
  priceId?: string | null;
  workspaceId?: string;
  customerEmail?: string;
  isPaddleConfigured: boolean;
  paddleClientToken?: string;
  paddleEnvironment?: "sandbox" | "production";
  label?: string;
  variant?: "default" | "outline" | "secondary";
  mockSubscribeAction?: (planKey: PlanKey) => Promise<void>;
}

export function PlanCheckoutButton({
  planKey,
  planName,
  priceId,
  workspaceId,
  customerEmail,
  isPaddleConfigured,
  paddleClientToken,
  paddleEnvironment,
  label,
  variant = "default",
  mockSubscribeAction,
}: PlanCheckoutButtonProps) {
  const router = useRouter();
  const [paddle, setPaddle] = useState<Paddle>();
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!isPaddleConfigured || !paddleClientToken || !priceId) return;
    let cancelled = false;
    import("@paddle/paddle-js").then(({ initializePaddle }) => {
      initializePaddle({ token: paddleClientToken, environment: paddleEnvironment }).then((instance) => {
        if (!cancelled) setPaddle(instance);
      });
    });
    return () => {
      cancelled = true;
    };
  }, [isPaddleConfigured, paddleClientToken, priceId, paddleEnvironment]);

  if (planKey === "FREE") {
    return null;
  }

  if (isPaddleConfigured && priceId) {
    return (
      <Button
        variant={variant}
        disabled={!paddle}
        onClick={() =>
          paddle?.Checkout.open({
            items: [{ priceId, quantity: 1 }],
            customer: customerEmail ? { email: customerEmail } : undefined,
            customData: workspaceId ? { workspaceId } : undefined,
          })
        }
      >
        {label ?? `Upgrade to ${planName}`}
      </Button>
    );
  }

  if (!mockSubscribeAction) return null;

  return (
    <Button
      variant={variant}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await mockSubscribeAction(planKey);
          router.refresh();
        })
      }
    >
      {pending ? "Processing..." : (label ?? `Upgrade to ${planName} (simulated)`)}
    </Button>
  );
}
