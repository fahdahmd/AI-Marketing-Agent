import "server-only";
import { db } from "@/lib/db";
import type { GoogleConnection } from "@prisma/client";

const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";

// Read-only scopes: this app only ever reports on Analytics/Search Console data, never modifies it.
const SCOPES = [
  "https://www.googleapis.com/auth/analytics.readonly",
  "https://www.googleapis.com/auth/webmasters.readonly",
].join(" ");

export function isGoogleOAuthConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

function requireCredentials() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Google is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.");
  }
  return { clientId, clientSecret };
}

export function getGoogleRedirectUri(): string {
  const base = process.env.APP_URL || "http://localhost:3000";
  return `${base}/api/integrations/google/callback`;
}

export function buildGoogleAuthorizeUrl(state: string): string {
  const { clientId } = requireCredentials();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getGoogleRedirectUri(),
    response_type: "code",
    scope: SCOPES,
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state,
  });
  return `${AUTH_ENDPOINT}?${params.toString()}`;
}

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

export async function exchangeGoogleCode(code: string): Promise<GoogleTokenResponse> {
  const { clientId, clientSecret } = requireCredentials();

  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: getGoogleRedirectUri(),
      grant_type: "authorization_code",
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(`Google token exchange failed: ${JSON.stringify(data)}`);
  return data;
}

async function refreshGoogleToken(refreshToken: string): Promise<GoogleTokenResponse> {
  const { clientId, clientSecret } = requireCredentials();

  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(`Google token refresh failed: ${JSON.stringify(data)}`);
  return data;
}

/**
 * Returns a valid access token for the connection, transparently refreshing
 * (and persisting the refresh) if the stored token has expired.
 */
export async function getValidAccessToken(connection: GoogleConnection): Promise<string> {
  const expiresAt = connection.tokenExpiresAt;
  const isExpired = !expiresAt || expiresAt.getTime() <= Date.now() + 60_000;

  if (!isExpired) return connection.accessTokenEnc;

  if (!connection.refreshTokenEnc) {
    throw new Error("Google connection has expired and has no refresh token. Reconnect from Integrations.");
  }

  const refreshed = await refreshGoogleToken(connection.refreshTokenEnc);

  await db.googleConnection.update({
    where: { id: connection.id },
    data: {
      accessTokenEnc: refreshed.access_token,
      tokenExpiresAt: new Date(Date.now() + refreshed.expires_in * 1000),
    },
  });

  return refreshed.access_token;
}
