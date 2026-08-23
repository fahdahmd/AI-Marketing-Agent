import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addMonths, subMonths } from "date-fns";
import { requireUserId } from "@/lib/session";
import { requireActiveBrand } from "@/lib/require-brand";
import { getCalendarItems } from "@/server/services/calendar.service";
import { Button } from "@/components/ui/button";
import { MonthView } from "./month-view";
import { ListView } from "./list-view";

export default async function CalendarPage({ searchParams }: { searchParams: { view?: string; month?: string } }) {
  const userId = await requireUserId();
  const { brand } = await requireActiveBrand(userId);
  const items = await getCalendarItems(brand.id, userId);

  const view = searchParams.view === "list" ? "list" : "month";
  const monthDate = searchParams.month ? new Date(searchParams.month) : new Date();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground">Drafts, scheduled, and published content for {brand.name}.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 rounded-md border p-1">
            <Link
              href={`/app/calendar?view=month&month=${monthDate.toISOString()}`}
              className={`rounded px-2 py-1 text-xs font-medium ${view === "month" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}
            >
              Month
            </Link>
            <Link
              href="/app/calendar?view=list"
              className={`rounded px-2 py-1 text-xs font-medium ${view === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}
            >
              List
            </Link>
          </div>
          {view === "month" && (
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" asChild>
                <Link href={`/app/calendar?view=month&month=${subMonths(monthDate, 1).toISOString()}`}>
                  <ChevronLeft className="h-4 w-4" />
                </Link>
              </Button>
              <span className="min-w-28 text-center text-sm font-medium">{format(monthDate, "MMMM yyyy")}</span>
              <Button variant="outline" size="icon" asChild>
                <Link href={`/app/calendar?view=month&month=${addMonths(monthDate, 1).toISOString()}`}>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {view === "month" ? <MonthView items={items} monthDate={monthDate} /> : <ListView items={items} />}
    </div>
  );
}
