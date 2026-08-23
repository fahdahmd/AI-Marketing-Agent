"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cancelSubscriptionAction } from "./actions";

export function CancelButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      className="text-destructive hover:bg-destructive/10"
      disabled={pending}
      onClick={() => {
        if (confirm("Cancel your subscription? You'll move to the Free plan.")) {
          startTransition(async () => {
            await cancelSubscriptionAction();
            router.refresh();
          });
        }
      }}
    >
      {pending ? "Canceling..." : "Cancel subscription"}
    </Button>
  );
}
