import Link from "next/link";
import { FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireUserId } from "@/lib/session";
import { requireActiveBrand } from "@/lib/require-brand";
import { listContentForBrand } from "@/server/services/content.service";
import { ContentStatusBadge } from "@/components/content/status-badge";
import { formatDate } from "@/lib/utils";
import type { ContentStatus } from "@prisma/client";

const STATUS_FILTERS: { label: string; value: ContentStatus | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "Ready for review", value: "READY_FOR_REVIEW" },
  { label: "Approved", value: "APPROVED" },
  { label: "Scheduled", value: "SCHEDULED" },
  { label: "Published", value: "PUBLISHED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Failed", value: "FAILED" },
];

export default async function ContentPage({ searchParams }: { searchParams: { status?: string } }) {
  const userId = await requireUserId();
  const { brand } = await requireActiveBrand(userId);
  const statusFilter = searchParams.status as ContentStatus | undefined;
  const content = await listContentForBrand(brand.id, userId, statusFilter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Content</h1>
        <p className="text-muted-foreground">Every piece of AI-generated content for {brand.name}, across all campaigns.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <Link
            key={f.value}
            href={f.value === "ALL" ? "/app/content" : `/app/content?status=${f.value}`}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              (f.value === "ALL" && !statusFilter) || statusFilter === f.value
                ? "border-primary bg-primary text-primary-foreground"
                : "hover:bg-accent"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {content.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <FileText className="h-10 w-10 text-muted-foreground" />
            <p className="font-medium">No content here yet</p>
            <p className="text-sm text-muted-foreground">Generate a campaign to see content appear for review.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {content.map((c) => (
            <Link key={c.id} href={`/app/content/${c.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{c.platform}</Badge>
                    <ContentStatusBadge status={c.status} />
                  </div>
                  <p className="line-clamp-1 text-sm font-medium">{c.campaign.name}</p>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{c.caption || c.body || c.hook || "No copy yet"}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(c.updatedAt)}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
