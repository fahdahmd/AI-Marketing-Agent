import type { Platform } from "@prisma/client";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireUserId } from "@/lib/session";
import { requireActiveBrand } from "@/lib/require-brand";
import { listSocialAccountsForBrand } from "@/server/services/social-account.service";
import { isPlatformConfigured } from "@/social/providers";
import { isGoogleOAuthConfigured } from "@/google/oauth";
import { getGoogleConnection, listAvailableGoogleResources } from "@/server/services/google-connection.service";
import { ConnectButton, DisconnectButton } from "./connect-button";
import { GoogleSelectionForm } from "./google-selection-form";
import { GoogleDisconnectButton } from "./google-disconnect-button";

const PLATFORMS: { key: Platform; label: string; description: string }[] = [
  { key: "INSTAGRAM", label: "Instagram", description: "Publish feed posts and track engagement." },
  { key: "FACEBOOK", label: "Facebook", description: "Publish page posts and track engagement." },
  { key: "LINKEDIN", label: "LinkedIn", description: "Publish company page updates." },
  { key: "X", label: "X", description: "Publish posts to your X profile." },
];

export default async function IntegrationsPage({
  searchParams,
}: {
  searchParams: { google_connected?: string; google_error?: string };
}) {
  const userId = await requireUserId();
  const { brand } = await requireActiveBrand(userId);
  const accounts = await listSocialAccountsForBrand(brand.id, userId);

  const googleConfigured = isGoogleOAuthConfigured();
  const googleConnection = googleConfigured ? await getGoogleConnection(brand.id, userId) : null;
  const googleResources = googleConnection ? await listAvailableGoogleResources(brand.id, userId) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Integrations</h1>
        <p className="text-muted-foreground">Connect social accounts and analytics sources for {brand.name}.</p>
      </div>

      {searchParams.google_connected && (
        <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4" />
          Google connected. Select a property and site below to start syncing real data.
        </div>
      )}
      {searchParams.google_error && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4" />
          Google connection failed ({searchParams.google_error}). Please try again.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {PLATFORMS.map((platform) => {
          const platformAccounts = accounts.filter((a) => a.platform === platform.key && a.status === "CONNECTED");
          const configured = isPlatformConfigured(platform.key);

          return (
            <Card key={platform.key}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{platform.label}</CardTitle>
                  {!configured && (
                    <Badge variant="secondary" className="text-[10px]">
                      Mock mode
                    </Badge>
                  )}
                </div>
                <CardDescription>{platform.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {platformAccounts.length === 0 ? (
                  <ConnectButton platform={platform.key} />
                ) : (
                  <div className="space-y-2">
                    {platformAccounts.map((account) => (
                      <div key={account.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
                        <div>
                          <p className="font-medium">{account.displayName}</p>
                          <p className="text-xs text-muted-foreground">{account.handle}</p>
                        </div>
                        <DisconnectButton accountId={account.id} />
                      </div>
                    ))}
                    <ConnectButton platform={platform.key} />
                  </div>
                )}
                {!configured && (
                  <p className="text-xs text-muted-foreground">
                    No {platform.label} OAuth app configured — connecting uses a simulated mock account so you can test the
                    full publish workflow. Set {platform.key}_CLIENT_ID / {platform.key}_CLIENT_SECRET to go live.
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Google Analytics &amp; Search Console</CardTitle>
              {!googleConfigured && (
                <Badge variant="secondary" className="text-[10px]">
                  Mock mode
                </Badge>
              )}
            </div>
            <CardDescription>Sync real website traffic and organic search performance.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!googleConfigured && (
              <p className="text-xs text-muted-foreground">
                No Google OAuth app configured — analytics use simulated demo data. Set GOOGLE_CLIENT_ID /
                GOOGLE_CLIENT_SECRET to go live.
              </p>
            )}
            {googleConfigured && !googleConnection && (
              <Button asChild size="sm">
                <a href="/api/integrations/google/connect">Connect Google</a>
              </Button>
            )}
            {googleConfigured && googleConnection && (
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-md border p-2 text-sm">
                  <div>
                    <p className="font-medium">Connected</p>
                    <p className="text-xs text-muted-foreground">
                      {googleConnection.gaPropertyId ? "Property selected" : "No property selected yet"} &middot;{" "}
                      {googleConnection.searchConsoleSiteUrl ? "Site selected" : "No site selected yet"}
                    </p>
                  </div>
                  <GoogleDisconnectButton />
                </div>
                <GoogleSelectionForm
                  properties={googleResources?.properties ?? []}
                  sites={googleResources?.sites ?? []}
                  currentPropertyId={googleConnection.gaPropertyId}
                  currentSiteUrl={googleConnection.searchConsoleSiteUrl}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
