import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireUserId } from "@/lib/session";
import { getCampaignForUser } from "@/server/services/campaign.service";
import { NotFoundError, AuthorizationError } from "@/lib/errors";
import { ContentStatusBadge } from "@/components/content/status-badge";
import { PlatformPreview } from "@/components/content/platform-preview";
import { RegenerateButton } from "./regenerate-button";

export default async function CampaignDetailPage({ params }: { params: { id: string } }) {
  const userId = await requireUserId();

  let campaign;
  try {
    campaign = await getCampaignForUser(params.id, userId);
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof AuthorizationError) notFound();
    throw error;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{campaign.name}</h1>
          <p className="text-muted-foreground">
            {campaign.objective.replace(/_/g, " ")} &middot; {campaign.product?.name ?? campaign.promotionType}
          </p>
        </div>
        <Badge>{campaign.status}</Badge>
      </div>

      {campaign.status === "GENERATING" && (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Generating your campaign — this page will update automatically once it&apos;s ready. Refresh in a few seconds.
          </CardContent>
        </Card>
      )}

      {campaign.concept && (
        <Card>
          <CardHeader>
            <CardTitle>Campaign strategy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="font-medium">Concept:</span> {campaign.concept}</p>
            <p><span className="font-medium">Main message:</span> {campaign.mainMessage}</p>
            <p><span className="font-medium">Headline:</span> {campaign.headline}</p>
            <p><span className="font-medium">CTA:</span> {campaign.cta}</p>
            <p><span className="font-medium">Creative direction:</span> {campaign.creativeDirection}</p>
            <p><span className="font-medium">Publishing strategy:</span> {campaign.publishingStrategy}</p>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="mb-3 text-lg font-semibold">Generated content</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {campaign.content.map((content) => (
            <div key={content.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline">{content.platform}</Badge>
                <ContentStatusBadge status={content.status} />
              </div>
              <PlatformPreview
                platform={content.platform}
                content={{
                  brandName: "Your Brand",
                  hook: content.hook,
                  caption: content.caption,
                  body: content.body,
                  cta: content.cta,
                  hashtags: content.hashtags,
                  imageUrl: content.imageUrl,
                }}
              />
              <div className="flex gap-2">
                <Button asChild size="sm">
                  <Link href={`/app/content/${content.id}`}>Review &amp; edit</Link>
                </Button>
                <RegenerateButton contentId={content.id} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
