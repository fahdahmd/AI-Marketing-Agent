import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatNumber } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  suffix,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  suffix?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-semibold">
            {formatNumber(value)}
            {suffix}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
