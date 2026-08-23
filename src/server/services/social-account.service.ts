import "server-only";
import { db } from "@/lib/db";
import { requireBrandAccess } from "@/server/auth/authorize";
import { assertCanAddSocialAccount } from "@/server/services/entitlement.service";
import { logAudit } from "@/server/services/audit-log.service";
import { getSocialProvider, isPlatformConfigured } from "@/social/providers";
import type { Platform } from "@prisma/client";

export async function listSocialAccountsForBrand(brandId: string, userId: string) {
  await requireBrandAccess(brandId, userId);
  return db.socialAccount.findMany({ where: { brandId }, orderBy: { createdAt: "asc" } });
}

/**
 * Connects an account for a platform. When the platform's real OAuth app
 * credentials aren't configured (the default in development), this
 * connects a MockSocialProvider account directly so publishing/scheduling
 * can be exercised end-to-end. When real credentials are configured, this
 * returns an authorize URL for the caller to redirect the user to instead.
 */
export async function connectSocialAccount(brandId: string, userId: string, platform: Platform, redirectUri: string) {
  const { brand } = await requireBrandAccess(brandId, userId);
  await assertCanAddSocialAccount(brand.workspaceId);

  const provider = getSocialProvider(platform);
  const result = await provider.connectAccount({ brandId, redirectUri });

  if ("authorizeUrl" in result) {
    return { redirect: result.authorizeUrl };
  }

  const account = await db.socialAccount.create({
    data: {
      brandId,
      platform,
      status: "CONNECTED",
      externalAccountId: result.externalAccountId,
      displayName: result.displayName,
      handle: result.handle,
      avatarUrl: result.avatarUrl,
      isMock: !isPlatformConfigured(platform),
      accessTokenEnc: result.accessToken,
      refreshTokenEnc: result.refreshToken,
      tokenExpiresAt: result.expiresAt,
    },
  });

  await logAudit({
    workspaceId: brand.workspaceId,
    userId,
    action: "social_account.connected",
    entityType: "SocialAccount",
    entityId: account.id,
    metadata: { platform },
  });

  return { account };
}

export async function disconnectSocialAccount(accountId: string, userId: string) {
  const account = await db.socialAccount.findUniqueOrThrow({ where: { id: accountId }, include: { brand: true } });
  await requireBrandAccess(account.brandId, userId);

  const provider = getSocialProvider(account.platform);
  await provider.disconnectAccount(account);

  await db.socialAccount.update({ where: { id: accountId }, data: { status: "DISCONNECTED" } });

  await logAudit({
    workspaceId: account.brand.workspaceId,
    userId,
    action: "social_account.disconnected",
    entityType: "SocialAccount",
    entityId: account.id,
  });
}
