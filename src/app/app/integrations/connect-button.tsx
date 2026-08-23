"use client";

import { useTransition } from "react";
import type { Platform } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { connectAccountAction, disconnectAccountAction } from "./actions";

export function ConnectButton({ platform }: { platform: Platform }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button size="sm" disabled={pending} onClick={() => startTransition(() => connectAccountAction(platform))}>
      {pending ? "Connecting..." : "Connect"}
    </Button>
  );
}

export function DisconnectButton({ accountId }: { accountId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button size="sm" variant="outline" disabled={pending} onClick={() => startTransition(() => disconnectAccountAction(accountId))}>
      {pending ? "Disconnecting..." : "Disconnect"}
    </Button>
  );
}
