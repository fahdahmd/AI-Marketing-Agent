import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUserId } from "@/lib/session";
import { requireActiveBrand } from "@/lib/require-brand";
import { listProductsForBrand } from "@/server/services/product.service";
import { getRecommendationCampaignPrefill } from "@/server/services/recommendation.service";
import { CampaignForm } from "../campaign-form";

export default async function NewCampaignPage({
  searchParams,
}: {
  searchParams: { recommendationId?: string };
}) {
  const userId = await requireUserId();
  const { brand } = await requireActiveBrand(userId);
  const products = await listProductsForBrand(brand.id, userId);

  const prefill = searchParams.recommendationId
    ? await getRecommendationCampaignPrefill(searchParams.recommendationId, userId).catch(() => undefined)
    : undefined;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">New campaign</h1>
        <p className="text-muted-foreground">
          The AI will use your brand and product context to generate platform-specific content for review.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Campaign details</CardTitle>
          <CardDescription>Generation typically takes 10-30 seconds.</CardDescription>
        </CardHeader>
        <CardContent>
          <CampaignForm products={products.map((p) => ({ id: p.id, name: p.name }))} prefill={prefill} />
        </CardContent>
      </Card>
    </div>
  );
}
