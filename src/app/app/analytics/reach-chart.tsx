"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export function ReachChart({ data }: { data: { date: string; reach: number; engagement: number }[] }) {
  if (data.length === 0) {
    return <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">No data yet for this period.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="reachGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(245 75% 59%)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="hsl(245 75% 59%)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Area type="monotone" dataKey="reach" stroke="hsl(245 75% 59%)" fill="url(#reachGradient)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
