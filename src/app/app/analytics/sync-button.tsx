"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { syncAnalyticsAction } from "./actions";

export function SyncButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await syncAnalyticsAction();
          router.refresh();
        })
      }
    >
      <RefreshCw className={`mr-2 h-4 w-4 ${pending ? "animate-spin" : ""}`} />
      {pending ? "Syncing..." : "Sync now"}
    </Button>
  );
}
