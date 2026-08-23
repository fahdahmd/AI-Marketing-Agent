import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { resolveActiveWorkspace, resolveActiveBrand } from "@/lib/require-context";
import { requireBrandAccess } from "@/server/auth/authorize";
import { exchangeGoogleCode } from "@/google/oauth";
import { db } from "@/lib/db";
import { logAudit } from "@/server/services/audit-log.service";

const STATE_COOKIE = "google_oauth_state";
const APP_URL = process.env.APP_URL || "http://localhost:3000";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.redirect(new URL("/login", APP_URL));

  const url = req.nextUrl;
  const error = url.searchParams.get("error");
  if (error) {
    return NextResponse.redirect(new URL(`/app/integrations?google_error=${encodeURIComponent(error)}`, APP_URL));
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const expectedState = cookies().get(STATE_COOKIE)?.value;
  cookies().delete(STATE_COOKIE);

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(new URL("/app/integrations?google_error=invalid_state", APP_URL));
  }

  const { activeWorkspace } = await resolveActiveWorkspace(session.user.id);
  if (!activeWorkspace) return NextResponse.redirect(new URL("/signup", APP_URL));

  const { activeBrand } = await resolveActiveBrand(activeWorkspace.id);
  if (!activeBrand) return NextResponse.redirect(new URL("/app/brand/new", APP_URL));

  const { brand } = await requireBrandAccess(activeBrand.id, session.user.id);

  try {
    const tokens = await exchangeGoogleCode(code);

    await db.googleConnection.upsert({
      where: { brandId: brand.id },
      create: {
        brandId: brand.id,
        accessTokenEnc: tokens.access_token,
        refreshTokenEnc: tokens.refresh_token,
        tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        scope: tokens.scope,
      },
      update: {
        accessTokenEnc: tokens.access_token,
        // Google only returns a refresh_token on the first consent — keep the existing one otherwise.
        ...(tokens.refresh_token ? { refreshTokenEnc: tokens.refresh_token } : {}),
        tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        scope: tokens.scope,
      },
    });

    await logAudit({ workspaceId: brand.workspaceId, userId: session.user.id, action: "google.connected", entityType: "GoogleConnection", entityId: brand.id });
  } catch (err) {
    console.error("Google OAuth callback failed", err);
    return NextResponse.redirect(new URL("/app/integrations?google_error=token_exchange_failed", APP_URL));
  }

  return NextResponse.redirect(new URL("/app/integrations?google_connected=1", APP_URL));
}
