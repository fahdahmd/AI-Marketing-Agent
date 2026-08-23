import "server-only";
import type { SocialAccount } from "@prisma/client";
import type { PostAnalytics, PostContentInput, PublishResult, SocialProvider } from "./social-provider";

const API_BASE = "https://api.linkedin.com/v2";

/** LinkedIn API v2 (UGC Posts). Requires LINKEDIN_CLIENT_ID/SECRET and a completed OAuth flow per account. */
export class LinkedInProvider implements SocialProvider {
  readonly platform = "LINKEDIN" as const;
  readonly name = "linkedin";

  private requireCredentials() {
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      throw new Error("LinkedIn is not configured. Set LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET.");
    }
    return { clientId, clientSecret };
  }

  async connectAccount({ redirectUri }: { brandId: string; redirectUri: string }): Promise<{ authorizeUrl: string }> {
    const { clientId } = this.requireCredentials();
    const scope = "w_member_social,r_organization_social,w_organization_social";
    return {
      authorizeUrl: `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`,
    };
  }

  async disconnectAccount(): Promise<void> {
    this.requireCredentials();
  }

  async refreshToken(account: SocialAccount): Promise<{ accessToken: string; expiresAt?: Date }> {
    const { clientId, clientSecret } = this.requireCredentials();
    const res = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: account.refreshTokenEnc ?? "",
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`LinkedIn token refresh failed: ${JSON.stringify(data)}`);
    return { accessToken: data.access_token, expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : undefined };
  }

  async publishPost(account: SocialAccount, content: PostContentInput): Promise<PublishResult> {
    const accessToken = account.accessTokenEnc;
    if (!accessToken) throw new Error("This account has no stored access token.");

    const text = [content.hook, content.body].filter(Boolean).join("\n\n");
    const res = await fetch(`${API_BASE}/ugcPosts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify({
        author: `urn:li:organization:${account.externalAccountId}`,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: { text },
            shareMediaCategory: "NONE",
          },
        },
        visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`LinkedIn publish failed: ${JSON.stringify(data)}`);

    const postId = res.headers.get("x-restli-id") ?? data.id;
    return { externalPostId: postId, externalUrl: `https://www.linkedin.com/feed/update/${postId}` };
  }

  async schedulePost(): Promise<{ accepted: boolean }> {
    return { accepted: true };
  }

  async getPosts(): Promise<PublishResult[]> {
    return [];
  }

  async getAnalytics(): Promise<PostAnalytics> {
    // LinkedIn's organizational share statistics API requires additional
    // admin-level permissions beyond posting; not implemented without a
    // registered LinkedIn app to verify against.
    throw new Error("LinkedIn analytics require an approved LinkedIn Marketing Developer Platform app.");
  }
}
