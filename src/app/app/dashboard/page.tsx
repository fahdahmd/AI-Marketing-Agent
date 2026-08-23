import { requireUserId } from "@/lib/session";
import { requireActiveBrand } from "@/lib/require-brand";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const userId = await requireUserId();
  const { brand } = await requireActiveBrand(userId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back — here&apos;s how {brand.name} is doing.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Dashboard is being wired up</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Marketing score, overview metrics, top content, and AI recommended actions land here shortly.
        </CardContent>
      </Card>
    </div>
  );
}
