import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUserId } from "@/lib/session";
import { requireActiveBrand } from "@/lib/require-brand";
import { listProductsForBrand } from "@/server/services/product.service";
import { SEOGenerateForm } from "./seo-generate-form";

export default async function NewSEOContentPage({
  searchParams,
}: {
  searchParams: { topic?: string; recommendationId?: string };
}) {
  const userId = await requireUserId();
  const { brand } = await requireActiveBrand(userId);
  const products = await listProductsForBrand(brand.id, userId);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Generate SEO content</h1>
        <p className="text-muted-foreground">The AI writes a full piece with title, meta tags, outline, FAQ, and an internal SEO score.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Content details</CardTitle>
          <CardDescription>Generation typically takes 10-30 seconds.</CardDescription>
        </CardHeader>
        <CardContent>
          <SEOGenerateForm
            products={products.map((p) => ({ id: p.id, name: p.name }))}
            defaultTopic={searchParams.topic}
            recommendationId={searchParams.recommendationId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
