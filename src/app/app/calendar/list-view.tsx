import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ContentStatusBadge } from "@/components/content/status-badge";
import { formatDate } from "@/lib/utils";
import type { CalendarItem } from "@/server/services/calendar.service";
import type { ContentStatus } from "@prisma/client";

export function ListView({ items }: { items: CalendarItem[] }) {
  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-sm text-muted-foreground">Nothing on the calendar yet.</CardContent>
      </Card>
    );
  }

  const sorted = [...items].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="space-y-2">
      {sorted.map((item) => (
        <Link key={item.id} href={`/app/content/${item.id}`}>
          <Card className="transition-shadow hover:shadow-md">
            <CardContent className="flex items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <div className="mb-1 flex items-center gap-2">
                  <Badge variant="outline">{item.platform}</Badge>
                  <ContentStatusBadge status={item.status as ContentStatus} />
                </div>
                <p className="truncate text-sm font-medium">{item.campaignName}</p>
                <p className="truncate text-xs text-muted-foreground">{item.caption}</p>
              </div>
              <p className="shrink-0 text-xs text-muted-foreground">{formatDate(item.date)}</p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
