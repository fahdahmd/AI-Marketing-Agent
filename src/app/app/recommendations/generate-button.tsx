"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateRecommendationsAction } from "./actions";

export function GenerateButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await generateRecommendationsAction();
          router.refresh();
        })
      }
    >
      <Sparkles className={`mr-2 h-4 w-4 ${pending ? "animate-pulse" : ""}`} />
      {pending ? "Analyzing..." : "Refresh recommendations"}
    </Button>
  );
}
