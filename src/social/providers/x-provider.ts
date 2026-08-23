import "server-only";
import type { SocialAccount } from "@prisma/client";
import type { PostAnalytics, PostContentInput, PublishResult, SocialProvider } from "./social-provider";

const API_BASE = "https://api.twitter.com/2";

/** X (Twitter) API v2. Requires X_CLIENT_ID/SECRET and a completed OAuth 2.0 (PKCE) flow per account. */
export class XProvider implements SocialProvider {
  readonly platform = "X" as const;
  readonly name = "x";

  private requireCredentials() {
    const clientId = process.env.X_CLIENT_ID;
    const clientSecret = process.env.X_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      throw new Error("X is not configured. Set X_CLIENT_ID and X_CLIENT_SECRET.");
    }
    return { clientId, clientSecret };
  }

  async connectAccount({ redirectUri }: { brandId: string; redirectUri: string }): Promise<{ authorizeUrl: string }> {
    const { clientId } = this.requireCredentials();
    const scope = "tweet.read tweet.write users.read offline.access";
    return {
      authorizeUrl: `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=state&code_challenge=challenge&code_challenge_method=plain`,
    };
  }

  async disconnectAccount(): Promise<void> {
    this.requireCredentials();
  }

  async refreshToken(account: SocialAccount): Promise<{ accessToken: string; expiresAt?: Date }> {
    const { clientId, clientSecret } = this.requireCredentials();
    const res = await fetch("https://api.twitter.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: account.refreshTokenEnc ?? "" }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`X token refresh failed: ${JSON.stringify(data)}`);
    return { accessToken: data.access_token, expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : undefined };
  }

  async publishPost(account: SocialAccount, content: PostContentInput): Promise<PublishResult> {
    const accessToken = account.accessTokenEnc;
    if (!accessToken) throw new Error("This account has no stored access token.");

    const text = [content.hook, content.caption].filter(Boolean).join(" ");
    const res = await fetch(`${API_BASE}/tweets`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ text }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`X publish failed: ${JSON.stringify(data)}`);

    return { externalPostId: data.data.id, externalUrl: `https://x.com/${account.handle ?? "i"}/status/${data.data.id}` };
  }

  async schedulePost(): Promise<{ accepted: boolean }> {
    return { accepted: true };
  }

  async getPosts(): Promise<PublishResult[]> {
    return [];
  }

  async getAnalytics(account: SocialAccount, externalPostId: string): Promise<PostAnalytics> {
    const accessToken = account.accessTokenEnc;
    const res = await fetch(`${API_BASE}/tweets/${externalPostId}?tweet.fields=public_metrics`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`X analytics fetch failed: ${JSON.stringify(data)}`);

    const metrics = data.data?.public_metrics ?? {};
    const impressions = metrics.impression_count ?? 0;
    const likes = metrics.like_count ?? 0;
    const comments = metrics.reply_count ?? 0;
    const shares = metrics.retweet_count ?? 0;

    return {
      reach: impressions,
      impressions,
      likes,
      comments,
      shares,
      clicks: 0,
      engagementRate: impressions ? Number((((likes + comments + shares) / impressions) * 100).toFixed(2)) : 0,
    };
  }
}
