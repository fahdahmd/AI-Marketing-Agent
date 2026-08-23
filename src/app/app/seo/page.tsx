import Link from "next/link";
import { Search, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireUserId } from "@/lib/session";
import { requireActiveBrand } from "@/lib/require-brand";
import { listKeywordsForBrand, listSEOContentForBrand } from "@/server/services/seo.service";

export default async function SEOPage() {
  const userId = await requireUserId();
  const { brand } = await requireActiveBrand(userId);
  const [keywords, content] = await Promise.all([
    listKeywordsForBrand(brand.id, userId),
    listSEOContentForBrand(brand.id, userId),
  ]);

  const avgScore = content.length
    ? Math.round(content.reduce((sum, c) => sum + (c.seoScore ?? 0), 0) / content.length)
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">SEO</h1>
        <p className="text-muted-foreground">Keyword research and AI-generated SEO content for {brand.name}.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/app/seo/keywords">
          <Card className="h-full transition-shadow hover:shadow-md">
            <CardHeader className="flex-row items-center gap-3 space-y-0">
              <Search className="h-6 w-6 text-primary" />
              <CardTitle>Keyword ideas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{keywords.length} AI-generated keyword ideas so far.</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/app/seo/content">
          <Card className="h-full transition-shadow hover:shadow-md">
            <CardHeader className="flex-row items-center gap-3 space-y-0">
              <FileText className="h-6 w-6 text-primary" />
              <CardTitle>SEO content</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {content.length} pieces generated{avgScore != null ? ` · avg score ${avgScore}/100` : ""}.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Button asChild>
        <Link href="/app/seo/content/new">Generate SEO content</Link>
      </Button>
    </div>
  );
}
