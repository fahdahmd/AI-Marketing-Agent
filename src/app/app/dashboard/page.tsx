import Link from "next/link";
import { Eye, Heart, Globe, Users, Target, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireUserId } from "@/lib/session";
import { requireActiveBrand } from "@/lib/require-brand";
import { ensureRecentAnalytics } from "@/server/services/dashboard.service";
import { getOverviewMetrics, getTopContent } from "@/server/services/analytics.service";
import { computeMarketingScore } from "@/server/services/marketing-score.service";
import { db } from "@/lib/db";
import { StatCard } from "@/components/dashboard/stat-card";
import { MarketingScoreCard } from "@/components/dashboard/marketing-score-card";
import { formatDate } from "@/lib/utils";

export default async function DashboardPage() {
  const userId = await requireUserId();
  const { brand } = await requireActiveBrand(userId);

  await ensureRecentAnalytics(brand.id, userId);

  const [overview, score, topContent, recommendations] = await Promise.all([
    getOverviewMetrics(brand.id, userId, 30),
    computeMarketingScore(brand.id, userId),
    getTopContent(brand.id, userId, 3),
    db.recommendation.findMany({
      where: { brandId: brand.id, status: { in: ["NEW", "VIEWED"] } },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      take: 3,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back — here&apos;s how {brand.name} is doing (last 30 days).</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <MarketingScoreCard score={score} />
        </div>
        <div className="grid grid-cols-2 gap-4 lg:col-span-2">
          <StatCard label="Reach" value={overview.reach} icon={Eye} />
          <StatCard label="Engagement" value={overview.engagement} icon={Heart} suffix={` (${overview.engagementRate}%)`} />
          <StatCard label="Website visits" value={overview.websiteVisits} icon={Globe} />
          <StatCard label="Followers" value={overview.followers} icon={Users} />
          <StatCard label="Leads" value={overview.leads} icon={Target} />
          <StatCard label="Conversions" value={overview.conversions} icon={TrendingUp} />
        </div>
      </div>

      {overview.isMock && (
        <p className="text-xs text-muted-foreground">
          Showing demo analytics data. Connect real social and web analytics accounts from Integrations for live numbers.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topContent.length === 0 ? (
              <p className="text-sm text-muted-foreground">Publish content to see your best performers here.</p>
            ) : (
              topContent.map((post) => (
                <Link
                  key={post.id}
                  href={`/app/content/${post.contentId}`}
                  className="flex items-center justify-between rounded-md border p-3 text-sm transition-colors hover:bg-accent"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{post.content.campaign.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {post.socialAccount.platform} &middot; {formatDate(post.publishedAt)}
                    </p>
                  </div>
                  <Badge variant="success">{post.engagementRate}% eng.</Badge>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI recommended actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recommendations.length === 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">No recommendations yet — check back after you publish a few posts.</p>
                <Button asChild size="sm" variant="outline">
                  <Link href="/app/recommendations">View recommendations</Link>
                </Button>
              </div>
            ) : (
              recommendations.map((rec) => (
                <div key={rec.id} className="rounded-md border p-3">
                  <p className="text-sm font-medium">{rec.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{rec.explanation}</p>
                  <Button asChild size="sm" className="mt-2">
                    <Link href="/app/recommendations">{rec.action}</Link>
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
