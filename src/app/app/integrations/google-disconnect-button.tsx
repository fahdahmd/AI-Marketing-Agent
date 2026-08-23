"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { disconnectGoogleAction } from "./google-actions";

export function GoogleDisconnectButton() {
  const [pending, startTransition] = useTransition();
  return (
    <Button size="sm" variant="outline" disabled={pending} onClick={() => startTransition(() => disconnectGoogleAction())}>
      {pending ? "Disconnecting..." : "Disconnect"}
    </Button>
  );
}
