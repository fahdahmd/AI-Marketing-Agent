import Link from "next/link";
import { Plus, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireUserId } from "@/lib/session";
import { requireActiveBrand } from "@/lib/require-brand";
import { listSEOContentForBrand } from "@/server/services/seo.service";
import { formatDate } from "@/lib/utils";

export default async function SEOContentListPage() {
  const userId = await requireUserId();
  const { brand } = await requireActiveBrand(userId);
  const content = await listSEOContentForBrand(brand.id, userId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">SEO content</h1>
          <p className="text-muted-foreground">Articles, product descriptions, and landing pages generated for {brand.name}.</p>
        </div>
        <Button asChild>
          <Link href="/app/seo/content/new">
            <Plus className="mr-2 h-4 w-4" />
            Generate content
          </Link>
        </Button>
      </div>

      {content.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <FileText className="h-10 w-10 text-muted-foreground" />
            <p className="font-medium">No SEO content yet</p>
            <Button asChild size="sm">
              <Link href="/app/seo/content/new">Generate your first piece</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {content.map((c) => (
            <Link key={c.id} href={`/app/seo/content/${c.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{c.type.replace("_", " ")}</Badge>
                    {c.seoScore != null && <Badge variant={c.seoScore >= 70 ? "success" : "warning"}>{c.seoScore}/100</Badge>}
                  </div>
                  <p className="line-clamp-1 text-sm font-medium">{c.seoTitle || c.primaryKeyword}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(c.createdAt)}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
