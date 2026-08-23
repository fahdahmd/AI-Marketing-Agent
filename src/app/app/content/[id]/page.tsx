import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireUserId } from "@/lib/session";
import { getContentForUser } from "@/server/services/content.service";
import { db } from "@/lib/db";
import { NotFoundError, AuthorizationError } from "@/lib/errors";
import { PlatformPreview } from "@/components/content/platform-preview";
import { ContentStatusBadge } from "@/components/content/status-badge";
import { ContentEditForm } from "./edit-form";
import { ReviewActions } from "./review-actions";

export default async function ContentReviewPage({ params }: { params: { id: string } }) {
  const userId = await requireUserId();

  let content;
  try {
    content = await getContentForUser(params.id, userId);
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof AuthorizationError) notFound();
    throw error;
  }

  const accounts = await db.socialAccount.findMany({
    where: { brandId: content.brandId, platform: content.platform, status: "CONNECTED" },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{content.campaign.name}</h1>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant="outline">{content.platform}</Badge>
            <ContentStatusBadge status={content.status} />
          </div>
        </div>
      </div>

      {content.rejectionReason && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="py-4 text-sm text-destructive">Rejected: {content.rejectionReason}</CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground">Preview</h2>
          <PlatformPreview
            platform={content.platform}
            content={{
              brandName: content.brand.name,
              logoUrl: content.brand.logoUrl,
              hook: content.hook,
              caption: content.caption,
              body: content.body,
              cta: content.cta,
              hashtags: content.hashtags,
              imageUrl: content.imageUrl,
            }}
          />
          <ReviewActions contentId={content.id} status={content.status} accounts={accounts.map((a) => ({ id: a.id, displayName: a.displayName, handle: a.handle }))} />
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Edit content</CardTitle>
            </CardHeader>
            <CardContent>
              <ContentEditForm
                contentId={content.id}
                platform={content.platform}
                initial={{
                  headline: content.headline,
                  hook: content.hook,
                  caption: content.caption,
                  body: content.body,
                  cta: content.cta,
                  hashtags: content.hashtags,
                  imagePrompt: content.imagePrompt,
                }}
              />
            </CardContent>
          </Card>

          {content.variants.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Version history</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground">
                {content.variants.map((v) => (
                  <div key={v.id} className="flex items-center justify-between">
                    <span>{v.label}</span>
                    {v.isSelected && <Badge variant="secondary">Current</Badge>}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
