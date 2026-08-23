import "server-only";
import type { SocialAccount } from "@prisma/client";
import type {
  ConnectedAccountInfo,
  PostAnalytics,
  PostContentInput,
  PublishResult,
  SocialProvider,
} from "./social-provider";

const GRAPH_API = "https://graph.facebook.com/v19.0";

/** Facebook Pages Graph API. Requires FACEBOOK_CLIENT_ID/SECRET and a completed OAuth flow per Page. */
export class FacebookProvider implements SocialProvider {
  readonly platform = "FACEBOOK" as const;
  readonly name = "facebook";

  private requireCredentials() {
    const clientId = process.env.FACEBOOK_CLIENT_ID;
    const clientSecret = process.env.FACEBOOK_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      throw new Error("Facebook is not configured. Set FACEBOOK_CLIENT_ID and FACEBOOK_CLIENT_SECRET.");
    }
    return { clientId, clientSecret };
  }

  async connectAccount({ redirectUri }: { brandId: string; redirectUri: string }): Promise<{ authorizeUrl: string }> {
    const { clientId } = this.requireCredentials();
    const scope = "pages_manage_posts,pages_read_engagement,pages_show_list";
    return {
      authorizeUrl: `https://www.facebook.com/v19.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code`,
    };
  }

  async disconnectAccount(): Promise<void> {
    this.requireCredentials();
  }

  async refreshToken(account: SocialAccount): Promise<{ accessToken: string; expiresAt?: Date }> {
    const { clientId, clientSecret } = this.requireCredentials();
    const res = await fetch(
      `${GRAPH_API}/oauth/access_token?grant_type=fb_exchange_token&client_id=${clientId}&client_secret=${clientSecret}&fb_exchange_token=${account.accessTokenEnc}`
    );
    const data = await res.json();
    if (!res.ok) throw new Error(`Facebook token refresh failed: ${JSON.stringify(data)}`);
    return { accessToken: data.access_token, expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : undefined };
  }

  async publishPost(account: SocialAccount, content: PostContentInput): Promise<PublishResult> {
    const accessToken = account.accessTokenEnc;
    if (!accessToken) throw new Error("This account has no stored access token.");

    const endpoint = content.imageUrl ? `${GRAPH_API}/${account.externalAccountId}/photos` : `${GRAPH_API}/${account.externalAccountId}/feed`;
    const body = content.imageUrl
      ? { url: content.imageUrl, caption: content.caption ?? "", access_token: accessToken }
      : { message: content.caption ?? "", access_token: accessToken };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`Facebook publish failed: ${JSON.stringify(data)}`);

    const postId = data.post_id ?? data.id;
    return { externalPostId: postId, externalUrl: `https://www.facebook.com/${postId}` };
  }

  async schedulePost(): Promise<{ accepted: boolean }> {
    return { accepted: true };
  }

  async getPosts(): Promise<PublishResult[]> {
    return [];
  }

  async getAnalytics(account: SocialAccount, externalPostId: string): Promise<PostAnalytics> {
    const accessToken = account.accessTokenEnc;
    const res = await fetch(
      `${GRAPH_API}/${externalPostId}/insights?metric=post_impressions,post_engaged_users&access_token=${accessToken}`
    );
    const data = await res.json();
    if (!res.ok) throw new Error(`Facebook analytics fetch failed: ${JSON.stringify(data)}`);

    const metric = (name: string) => data.data?.find((m: { name: string }) => m.name === name)?.values?.[0]?.value ?? 0;
    const impressions = metric("post_impressions");
    const engaged = metric("post_engaged_users");

    return {
      reach: impressions,
      impressions,
      likes: engaged,
      comments: 0,
      shares: 0,
      clicks: 0,
      engagementRate: impressions ? Number(((engaged / impressions) * 100).toFixed(2)) : 0,
    };
  }
}
