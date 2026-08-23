import { Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { requireUserId } from "@/lib/session";
import { requireActiveBrand } from "@/lib/require-brand";
import { listRecommendationsForBrand } from "@/server/services/recommendation.service";
import { generateRecommendations } from "@/ai/services/recommendation-generation.service";
import { RecommendationCard } from "./recommendation-card";
import { GenerateButton } from "./generate-button";

export default async function RecommendationsPage() {
  const userId = await requireUserId();
  const { brand } = await requireActiveBrand(userId);

  let recommendations = await listRecommendationsForBrand(brand.id, userId);

  if (recommendations.length === 0) {
    // First visit — generate immediately so the page never looks empty
    // when there's real data to learn from.
    await generateRecommendations(brand.id).catch(() => undefined);
    recommendations = await listRecommendationsForBrand(brand.id, userId);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Recommendations</h1>
          <p className="text-muted-foreground">AI-analyzed opportunities based on your real performance data.</p>
        </div>
        <GenerateButton />
      </div>

      {recommendations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Sparkles className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="font-medium">No recommendations yet</p>
              <p className="text-sm text-muted-foreground">
                Publish a few posts and add products so the AI has data to analyze.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recommendations.map((rec) => (
            <RecommendationCard key={rec.id} recommendation={rec} />
          ))}
        </div>
      )}
    </div>
  );
}
