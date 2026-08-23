import Link from "next/link";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  format,
} from "date-fns";
import { Badge } from "@/components/ui/badge";
import type { CalendarItem } from "@/server/services/calendar.service";

const STATUS_DOT: Record<string, string> = {
  READY_FOR_REVIEW: "bg-amber-500",
  APPROVED: "bg-emerald-500",
  SCHEDULED: "bg-blue-500",
  PUBLISHING: "bg-blue-500",
  PUBLISHED: "bg-emerald-600",
  FAILED: "bg-red-500",
  REJECTED: "bg-red-400",
  DRAFT: "bg-gray-400",
  GENERATING: "bg-gray-400",
};

export function MonthView({ items, monthDate }: { items: CalendarItem[]; monthDate: Date }) {
  const start = startOfWeek(startOfMonth(monthDate));
  const end = endOfWeek(endOfMonth(monthDate));
  const days = eachDayOfInterval({ start, end });

  return (
    <div className="grid grid-cols-7 gap-px overflow-hidden rounded-md border bg-border text-xs">
      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
        <div key={d} className="bg-muted p-2 text-center font-medium text-muted-foreground">
          {d}
        </div>
      ))}
      {days.map((day) => {
        const dayItems = items.filter((i) => isSameDay(i.date, day));
        const inMonth = isSameMonth(day, monthDate);
        return (
          <div key={day.toISOString()} className={`min-h-[100px] bg-background p-1.5 ${inMonth ? "" : "opacity-40"}`}>
            <p className="mb-1 text-[11px] text-muted-foreground">{format(day, "d")}</p>
            <div className="space-y-1">
              {dayItems.slice(0, 3).map((item) => (
                <Link
                  key={item.id}
                  href={`/app/content/${item.id}`}
                  className="flex items-center gap-1 truncate rounded bg-accent px-1 py-0.5 hover:bg-accent/70"
                >
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_DOT[item.status] ?? "bg-gray-400"}`} />
                  <span className="truncate">{item.campaignName}</span>
                </Link>
              ))}
              {dayItems.length > 3 && <p className="text-[10px] text-muted-foreground">+{dayItems.length - 3} more</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
