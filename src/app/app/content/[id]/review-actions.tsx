"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X, RefreshCw, Send, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ContentStatus } from "@prisma/client";
import {
  approveContentAction,
  rejectContentAction,
  regenerateContentReviewAction,
  publishNowAction,
  scheduleContentAction,
} from "../actions";

interface SocialAccountOption {
  id: string;
  displayName: string | null;
  handle: string | null;
}

export function ReviewActions({
  contentId,
  status,
  accounts,
}: {
  contentId: string;
  status: ContentStatus;
  accounts: SocialAccountOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [scheduledFor, setScheduledFor] = useState("");

  const canApprove = status === "READY_FOR_REVIEW" || status === "REJECTED";
  const canPublish = status === "APPROVED";

  function run(fn: () => Promise<{ error?: string } | void>) {
    setError(undefined);
    startTransition(async () => {
      const result = await fn();
      if (result && "error" in result && result.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" disabled={pending} onClick={() => run(() => regenerateContentReviewAction(contentId))}>
          <RefreshCw className={`mr-2 h-4 w-4 ${pending ? "animate-spin" : ""}`} />
          Regenerate
        </Button>
        {canApprove && (
          <Button type="button" disabled={pending} onClick={() => run(() => approveContentAction(contentId))}>
            <Check className="mr-2 h-4 w-4" />
            Approve
          </Button>
        )}
        {status === "READY_FOR_REVIEW" && (
          <Button
            type="button"
            variant="outline"
            className="text-destructive hover:bg-destructive/10"
            disabled={pending}
            onClick={() => run(() => rejectContentAction(contentId, "Rejected by reviewer"))}
          >
            <X className="mr-2 h-4 w-4" />
            Reject
          </Button>
        )}
      </div>

      {canPublish && (
        <div className="space-y-3 border-t pt-4">
          {accounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No connected social account for this platform yet. Connect one from Integrations to publish.
            </p>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Publish to</Label>
                <Select value={accountId} onValueChange={setAccountId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.displayName ?? a.handle ?? a.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-wrap items-end gap-2">
                <Button
                  type="button"
                  disabled={pending || !accountId}
                  onClick={() => run(() => publishNowAction(contentId, accountId))}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Publish now
                </Button>
                <div className="space-y-2">
                  <Label htmlFor="scheduledFor" className="text-xs">
                    Or schedule for
                  </Label>
                  <Input
                    id="scheduledFor"
                    type="datetime-local"
                    value={scheduledFor}
                    onChange={(e) => setScheduledFor(e.target.value)}
                    className="w-56"
                  />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={pending || !accountId || !scheduledFor}
                  onClick={() => run(() => scheduleContentAction(contentId, accountId, new Date(scheduledFor).toISOString()))}
                >
                  <CalendarClock className="mr-2 h-4 w-4" />
                  Schedule
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
