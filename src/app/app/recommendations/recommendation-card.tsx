"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, X, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Recommendation } from "@prisma/client";
import { acceptRecommendationAction, dismissRecommendationAction } from "./actions";

const PRIORITY_VARIANT = { HIGH: "destructive", MEDIUM: "warning", LOW: "outline" } as const;

const TYPE_LABEL: Record<string, string> = {
  PROMOTE_PRODUCT: "Promote product",
  SEO_CONTENT: "SEO opportunity",
  REPURPOSE_CONTENT: "Repurpose content",
  CAMPAIGN_IDEA: "Campaign idea",
  CONNECT_SOCIAL_ACCOUNT: "Connect account",
  GENERAL: "Recommendation",
};

export function RecommendationCard({ recommendation }: { recommendation: Recommendation }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <Badge variant="outline">{TYPE_LABEL[recommendation.type] ?? recommendation.type}</Badge>
          <Badge variant={PRIORITY_VARIANT[recommendation.priority]}>{recommendation.priority}</Badge>
        </div>
        <div>
          <p className="font-semibold">{recommendation.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{recommendation.explanation}</p>
        </div>
        {recommendation.expectedImpact && (
          <p className="flex items-center gap-1.5 text-xs text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            {recommendation.expectedImpact}
          </p>
        )}
        <div className="flex gap-2 pt-1">
          <Button
            size="sm"
            disabled={pending}
            onClick={() => startTransition(() => acceptRecommendationAction(recommendation.id))}
          >
            {recommendation.action}
            <ArrowRight className="ml-2 h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await dismissRecommendationAction(recommendation.id);
                router.refresh();
              })
            }
          >
            <X className="mr-1 h-3.5 w-3.5" />
            Dismiss
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
