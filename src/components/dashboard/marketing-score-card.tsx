import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { MarketingScoreBreakdown } from "@/server/services/marketing-score.service";

const ROWS: { key: keyof MarketingScoreBreakdown; label: string }[] = [
  { key: "socialMedia", label: "Social Media" },
  { key: "content", label: "Content" },
  { key: "seo", label: "SEO" },
  { key: "engagement", label: "Engagement" },
  { key: "conversion", label: "Conversion" },
];

export function MarketingScoreCard({ score }: { score: MarketingScoreBreakdown }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-baseline justify-between">
          <span>Marketing Score</span>
          <span className="text-3xl font-bold text-primary">{score.overall}/100</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {ROWS.map((row) => (
          <div key={row.key} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{row.label}</span>
              <span className="font-medium">{score[row.key]}</span>
            </div>
            <Progress value={Number(score[row.key])} />
          </div>
        ))}
        <p className="pt-1 text-[11px] text-muted-foreground">
          {score.isDemoData ? "Based on demo data. " : ""}
          Internal product metric — not an official industry benchmark or ranking guarantee.
        </p>
      </CardContent>
    </Card>
  );
}
