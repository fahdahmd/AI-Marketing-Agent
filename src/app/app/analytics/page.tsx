import Link from "next/link";
import { Eye, Heart, Globe, Users, Target, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireUserId } from "@/lib/session";
import { requireActiveBrand } from "@/lib/require-brand";
import {
  getOverviewMetrics,
  getSocialPerformanceByPlatform,
  getTopContent,
  getWorstContent,
  getSEOOverview,
  getReachTrend,
} from "@/server/services/analytics.service";
import { StatCard } from "@/components/dashboard/stat-card";
import { formatDate } from "@/lib/utils";
import { ReachChart } from "./reach-chart";
import { SyncButton } from "./sync-button";

const RANGES = [
  { label: "7 days", value: 7 },
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
];

export default async function AnalyticsPage({ searchParams }: { searchParams: { range?: string } }) {
  const userId = await requireUserId();
  const { brand } = await requireActiveBrand(userId);
  const days = Number(searchParams.range) || 30;

  const [overview, platforms, topContent, worstContent, seo, trend] = await Promise.all([
    getOverviewMetrics(brand.id, userId, days),
    getSocialPerformanceByPlatform(brand.id, userId, days),
    getTopContent(brand.id, userId, 5),
    getWorstContent(brand.id, userId, 5),
    getSEOOverview(brand.id, userId, days),
    getReachTrend(brand.id, userId, days),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">Performance for {brand.name}.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 rounded-md border p-1">
            {RANGES.map((r) => (
              <Link
                key={r.value}
                href={`/app/analytics?range=${r.value}`}
                className={`rounded px-2 py-1 text-xs font-medium ${days === r.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}
              >
                {r.label}
              </Link>
            ))}
          </div>
          <SyncButton />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        <StatCard label="Reach" value={overview.reach} icon={Eye} />
        <StatCard label="Engagement" value={overview.engagement} icon={Heart} />
        <StatCard label="Website visits" value={overview.websiteVisits} icon={Globe} />
        <StatCard label="Followers" value={overview.followers} icon={Users} />
        <StatCard label="Leads" value={overview.leads} icon={Target} />
        <StatCard label="Conversions" value={overview.conversions} icon={TrendingUp} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reach &amp; engagement trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ReachChart data={trend} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Social performance by platform</CardTitle>
        </CardHeader>
        <CardContent>
          {platforms.length === 0 ? (
            <p className="text-sm text-muted-foreground">Connect a social account to see platform breakdowns.</p>
          ) : (
            <div className="space-y-2">
              {platforms.map((p) => (
                <div key={p.platform + (p.displayName ?? "")} className="flex items-center justify-between rounded-md border p-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{p.platform}</Badge>
                    <span className="text-muted-foreground">{p.displayName}</span>
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>Reach: {p.reach}</span>
                    <span>Engagement: {p.engagement}</span>
                    <span>Rate: {p.engagementRate}%</span>
                    <span>Followers: {p.followers}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Best posts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {topContent.length === 0 && <p className="text-sm text-muted-foreground">No published posts yet.</p>}
            {topContent.map((post) => (
              <Link
                key={post.id}
                href={`/app/content/${post.contentId}`}
                className="flex items-center justify-between rounded-md border p-2 text-sm hover:bg-accent"
              >
                <span className="truncate">{post.content.campaign.name}</span>
                <Badge variant="success">{post.engagementRate}%</Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Underperforming posts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {worstContent.length === 0 && <p className="text-sm text-muted-foreground">No published posts yet.</p>}
            {worstContent.map((post) => (
              <Link
                key={post.id}
                href={`/app/content/${post.contentId}`}
                className="flex items-center justify-between rounded-md border p-2 text-sm hover:bg-accent"
              >
                <span className="truncate">{post.content.campaign.name}</span>
                <Badge variant="outline">{post.engagementRate}%</Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>SEO</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Organic clicks</p>
              <p className="text-lg font-semibold">{seo.organicClicks}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Impressions</p>
              <p className="text-lg font-semibold">{seo.organicImpressions}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">CTR</p>
              <p className="text-lg font-semibold">{seo.ctr}%</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Avg. position</p>
              <p className="text-lg font-semibold">{seo.avgPosition}</p>
            </div>
          </div>
          {seo.isMock && <p className="mt-3 text-xs text-muted-foreground">Demo data — connect Search Console for real numbers.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
