import type { Platform } from "@prisma/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireUserId } from "@/lib/session";
import { requireActiveBrand } from "@/lib/require-brand";
import { listSocialAccountsForBrand } from "@/server/services/social-account.service";
import { isPlatformConfigured } from "@/social/providers";
import { ConnectButton, DisconnectButton } from "./connect-button";

const PLATFORMS: { key: Platform; label: string; description: string }[] = [
  { key: "INSTAGRAM", label: "Instagram", description: "Publish feed posts and track engagement." },
  { key: "FACEBOOK", label: "Facebook", description: "Publish page posts and track engagement." },
  { key: "LINKEDIN", label: "LinkedIn", description: "Publish company page updates." },
  { key: "X", label: "X", description: "Publish posts to your X profile." },
];

export default async function IntegrationsPage() {
  const userId = await requireUserId();
  const { brand } = await requireActiveBrand(userId);
  const accounts = await listSocialAccountsForBrand(brand.id, userId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Integrations</h1>
        <p className="text-muted-foreground">Connect social accounts so approved content can be published.</p>
      </div>

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
      </div>
    </div>
  );
}
