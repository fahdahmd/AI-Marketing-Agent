import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { requireUserId } from "@/lib/session";
import { requireActiveBrand } from "@/lib/require-brand";
import { getBillingOverview } from "@/server/services/subscription.service";
import { isPaddleConfigured } from "@/billing/providers";
import { PLAN_DEFINITIONS, PLAN_ORDER, getPaddlePriceId } from "@/billing/plans";
import { formatDate } from "@/lib/utils";
import { db } from "@/lib/db";
import { PlanCheckoutButton } from "@/components/billing/plan-checkout-button";
import { mockSubscribeAction, openCustomerPortalAction } from "./actions";
import { CancelButton } from "./cancel-button";

export default async function BillingPage() {
  const userId = await requireUserId();
  const { workspace } = await requireActiveBrand(userId);
  const overview = await getBillingOverview(workspace.id, userId);
  const user = await db.user.findUnique({ where: { id: userId } });

  const paddleReady = isPaddleConfigured();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
        <p className="text-muted-foreground">Manage your plan and usage for {workspace.name}.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Current plan: {overview.plan.name}</CardTitle>
              <CardDescription>
                {overview.subscription?.status ?? "ACTIVE"}
                {overview.subscription?.currentPeriodEnd && (
                  <> &middot; renews {formatDate(overview.subscription.currentPeriodEnd)}</>
                )}
                {overview.subscription?.cancelAtPeriodEnd && <> &middot; cancels at period end</>}
              </CardDescription>
            </div>
            {!paddleReady && (
              <Badge variant="secondary">Mock billing (simulated checkout)</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">AI posts</span>
                <span>{overview.usage.textUsed} / {overview.limits.aiPostsPerMonth}</span>
              </div>
              <Progress value={(overview.usage.textUsed / Math.max(overview.limits.aiPostsPerMonth, 1)) * 100} />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">AI images</span>
                <span>{overview.usage.imageUsed} / {overview.limits.aiImagesPerMonth}</span>
              </div>
              <Progress value={(overview.usage.imageUsed / Math.max(overview.limits.aiImagesPerMonth, 1)) * 100} />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">SEO generations</span>
                <span>{overview.usage.seoUsed} / {overview.limits.seoGenPerMonth}</span>
              </div>
              <Progress value={(overview.usage.seoUsed / Math.max(overview.limits.seoGenPerMonth, 1)) * 100} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {overview.usage.creditsConsumed} credits consumed this billing period &middot; est. cost $
            {overview.usage.estimatedCostUsd.toFixed(2)}
          </p>

          <div className="flex flex-wrap gap-2 pt-2">
            {overview.plan.key !== "FREE" && (
              <>
                {paddleReady ? (
                  <form action={openCustomerPortalAction}>
                    <Button type="submit" variant="outline">
                      Manage billing
                    </Button>
                  </form>
                ) : null}
                <CancelButton />
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Plans</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PLAN_ORDER.map((key) => {
            const def = PLAN_DEFINITIONS[key];
            const isCurrent = overview.plan.key === key;
            return (
              <Card key={key} className={isCurrent ? "border-primary" : ""}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-base">
                    {def.name}
                    {isCurrent && <Badge>Current</Badge>}
                  </CardTitle>
                  <CardDescription>${(def.priceMonthly / 100).toFixed(0)}/mo</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    {def.features.slice(0, 4).map((f) => (
                      <li key={f}>&bull; {f}</li>
                    ))}
                  </ul>
                  {!isCurrent && (
                    <PlanCheckoutButton
                      planKey={key}
                      planName={def.name}
                      priceId={getPaddlePriceId(key)}
                      workspaceId={workspace.id}
                      customerEmail={user?.email}
                      isPaddleConfigured={paddleReady}
                      paddleClientToken={process.env.PADDLE_CLIENT_TOKEN}
                      paddleEnvironment={process.env.PADDLE_ENVIRONMENT === "production" ? "production" : "sandbox"}
                      variant="outline"
                      mockSubscribeAction={mockSubscribeAction}
                    />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
