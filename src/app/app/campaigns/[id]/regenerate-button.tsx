"use client";

import { useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { regenerateContentAction } from "../actions";

export function RegenerateButton({ contentId }: { contentId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() => startTransition(() => regenerateContentAction(contentId))}
    >
      <RefreshCw className={`mr-2 h-3.5 w-3.5 ${pending ? "animate-spin" : ""}`} />
      {pending ? "Regenerating..." : "Regenerate"}
    </Button>
  );
}
