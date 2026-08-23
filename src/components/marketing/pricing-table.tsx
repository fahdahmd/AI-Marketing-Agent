import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PLAN_DEFINITIONS, PLAN_ORDER } from "@/billing/plans";

export function PricingTable() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {PLAN_ORDER.map((key) => {
        const plan = PLAN_DEFINITIONS[key];
        const isGrowth = key === "GROWTH";
        return (
          <Card key={key} className={isGrowth ? "border-primary shadow-md" : ""}>
            <CardHeader>
              {isGrowth && <p className="text-xs font-semibold text-primary">Most popular</p>}
              <CardTitle>{plan.name}</CardTitle>
              <p className="text-3xl font-bold">
                ${(plan.priceMonthly / 100).toFixed(0)}
                <span className="text-sm font-normal text-muted-foreground">/mo</span>
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>
              <Button asChild className="w-full" variant={isGrowth ? "default" : "outline"}>
                <Link href="/signup">{key === "FREE" ? "Start Free" : "Get Started"}</Link>
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
