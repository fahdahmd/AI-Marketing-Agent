import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireUserId } from "@/lib/session";
import { requireActiveBrand } from "@/lib/require-brand";
import { listKeywordsForBrand } from "@/server/services/seo.service";
import { KeywordForm } from "./keyword-form";

export default async function SEOKeywordsPage() {
  const userId = await requireUserId();
  const { brand } = await requireActiveBrand(userId);
  const keywords = await listKeywordsForBrand(brand.id, userId);

  const grouped = keywords.reduce<Record<string, typeof keywords>>((acc, k) => {
    (acc[k.type] ??= []).push(k);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Keyword ideas</h1>
        <p className="text-muted-foreground">
          AI-generated keyword suggestions — not verified search volume data. Connect a real SEO data
          source in the future for verified metrics.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <KeywordForm />
        </CardContent>
      </Card>

      {Object.keys(grouped).length === 0 ? (
        <p className="text-sm text-muted-foreground">No keyword ideas yet — generate some above.</p>
      ) : (
        Object.entries(grouped).map(([type, items]) => (
          <Card key={type}>
            <CardHeader>
              <CardTitle className="text-sm capitalize">{type.replace("-", " ")} keywords</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {items.map((k) => (
                <Badge key={k.id} variant="outline">
                  {k.keyword}
                </Badge>
              ))}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
