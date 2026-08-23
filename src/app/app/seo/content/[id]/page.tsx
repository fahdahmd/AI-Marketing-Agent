import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireUserId } from "@/lib/session";
import { getSEOContentForUser } from "@/server/services/seo.service";
import { NotFoundError, AuthorizationError } from "@/lib/errors";
import { SEOEditForm } from "./edit-form";

export default async function SEOContentDetailPage({ params }: { params: { id: string } }) {
  const userId = await requireUserId();

  let content;
  try {
    content = await getSEOContentForUser(params.id, userId);
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof AuthorizationError) notFound();
    throw error;
  }

  const faq = (content.faq as { question: string; answer: string }[] | null) ?? [];
  const outline = (content.outline as string[] | null) ?? [];
  const internalLinks = (content.internalLinks as string[] | null) ?? [];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{content.seoTitle || content.primaryKeyword}</h1>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant="outline">{content.type.replace("_", " ")}</Badge>
            <Badge variant="outline">{content.primaryKeyword}</Badge>
          </div>
        </div>
        {content.seoScore != null && (
          <div className="text-right">
            <p className="text-3xl font-bold text-primary">{content.seoScore}/100</p>
            <p className="text-xs text-muted-foreground">Internal SEO score</p>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        This score is an internal AI/content quality estimate based on title, meta description, structure, and
        completeness — it does NOT guarantee search rankings.
      </p>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Edit content</CardTitle>
            </CardHeader>
            <CardContent>
              <SEOEditForm
                contentId={content.id}
                initial={{
                  seoTitle: content.seoTitle,
                  metaTitle: content.metaTitle,
                  metaDescription: content.metaDescription,
                  article: content.article,
                }}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Outline</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                {outline.map((o, i) => (
                  <li key={i}>{o}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">FAQ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {faq.map((f, i) => (
                <div key={i}>
                  <p className="text-sm font-medium">{f.question}</p>
                  <p className="text-xs text-muted-foreground">{f.answer}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Internal link suggestions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm text-muted-foreground">
              {internalLinks.map((link, i) => (
                <p key={i}>&bull; {link}</p>
              ))}
            </CardContent>
          </Card>

          {content.secondaryKeywords.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Secondary keywords</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-1">
                {content.secondaryKeywords.map((k) => (
                  <Badge key={k} variant="outline" className="text-[10px]">
                    {k}
                  </Badge>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
