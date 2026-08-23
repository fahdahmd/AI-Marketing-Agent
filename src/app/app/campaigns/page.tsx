import Link from "next/link";
import { Plus, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUserId } from "@/lib/session";
import { requireActiveBrand } from "@/lib/require-brand";
import { listCampaignsForBrand } from "@/server/services/campaign.service";
import { formatDate } from "@/lib/utils";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "success"> = {
  DRAFT: "outline",
  GENERATING: "secondary",
  ACTIVE: "success",
  COMPLETED: "secondary",
  ARCHIVED: "outline",
};

export default async function CampaignsPage() {
  const userId = await requireUserId();
  const { brand } = await requireActiveBrand(userId);
  const campaigns = await listCampaignsForBrand(brand.id, userId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground">AI-generated campaigns for {brand.name}.</p>
        </div>
        <Button asChild>
          <Link href="/app/campaigns/new">
            <Plus className="mr-2 h-4 w-4" />
            New campaign
          </Link>
        </Button>
      </div>

      {campaigns.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Megaphone className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="font-medium">No campaigns yet</p>
              <p className="text-sm text-muted-foreground">Describe a marketing idea and let AI build your first campaign.</p>
            </div>
            <Button asChild>
              <Link href="/app/campaigns/new">Create your first campaign</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((c) => (
            <Link key={c.id} href={`/app/campaigns/${c.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="line-clamp-1 text-base">{c.name}</CardTitle>
                    <Badge variant={STATUS_VARIANT[c.status] ?? "outline"}>{c.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {c.objective.replace(/_/g, " ")} &middot; {c.product?.name ?? c.promotionType}
                  </p>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="line-clamp-2 text-sm text-muted-foreground">{c.idea}</p>
                  <div className="flex flex-wrap gap-1">
                    {c.platforms.map((p) => (
                      <Badge key={p} variant="outline" className="text-[10px]">
                        {p}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {c.content.length} content piece{c.content.length === 1 ? "" : "s"} &middot; {formatDate(c.createdAt)}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
