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

/**
 * Instagram Graph API (content publishing requires an Instagram Business
 * Account connected to a Facebook Page). Real publishing requires
 * INSTAGRAM_CLIENT_ID/SECRET plus a completed OAuth flow per account —
 * until configured, the factory in ./index.ts falls back to the mock.
 */
export class InstagramProvider implements SocialProvider {
  readonly platform = "INSTAGRAM" as const;
  readonly name = "instagram";

  private requireCredentials() {
    const clientId = process.env.INSTAGRAM_CLIENT_ID;
    const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      throw new Error("Instagram is not configured. Set INSTAGRAM_CLIENT_ID and INSTAGRAM_CLIENT_SECRET.");
    }
    return { clientId, clientSecret };
  }

  async connectAccount({ redirectUri }: { brandId: string; redirectUri: string }): Promise<{ authorizeUrl: string }> {
    const { clientId } = this.requireCredentials();
    const scope = "instagram_basic,instagram_content_publish,pages_show_list";
    const authorizeUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code`;
    return { authorizeUrl };
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
    if (!res.ok) throw new Error(`Instagram token refresh failed: ${JSON.stringify(data)}`);
    return { accessToken: data.access_token, expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : undefined };
  }

  async publishPost(account: SocialAccount, content: PostContentInput): Promise<PublishResult> {
    if (!content.imageUrl) throw new Error("Instagram posts require an image.");
    const accessToken = account.accessTokenEnc;
    if (!accessToken) throw new Error("This account has no stored access token.");

    const createRes = await fetch(`${GRAPH_API}/${account.externalAccountId}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_url: content.imageUrl, caption: content.caption ?? "", access_token: accessToken }),
    });
    const createData = await createRes.json();
    if (!createRes.ok) throw new Error(`Instagram media creation failed: ${JSON.stringify(createData)}`);

    const publishRes = await fetch(`${GRAPH_API}/${account.externalAccountId}/media_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creation_id: createData.id, access_token: accessToken }),
    });
    const publishData = await publishRes.json();
    if (!publishRes.ok) throw new Error(`Instagram publish failed: ${JSON.stringify(publishData)}`);

    return { externalPostId: publishData.id, externalUrl: `https://www.instagram.com/p/${publishData.id}` };
  }

  async schedulePost(): Promise<{ accepted: boolean }> {
    // Instagram's API has no native future-scheduling for this content type;
    // our own ScheduledPost + background worker calls publishPost() at the target time.
    return { accepted: true };
  }

  async getPosts(): Promise<PublishResult[]> {
    return [];
  }

  async getAnalytics(account: SocialAccount, externalPostId: string): Promise<PostAnalytics> {
    const accessToken = account.accessTokenEnc;
    const res = await fetch(
      `${GRAPH_API}/${externalPostId}/insights?metric=impressions,reach,likes,comments,shares&access_token=${accessToken}`
    );
    const data = await res.json();
    if (!res.ok) throw new Error(`Instagram analytics fetch failed: ${JSON.stringify(data)}`);

    const metric = (name: string) => data.data?.find((m: { name: string }) => m.name === name)?.values?.[0]?.value ?? 0;
    const reach = metric("reach");
    const likes = metric("likes");
    const comments = metric("comments");
    const shares = metric("shares");

    return {
      reach,
      impressions: metric("impressions"),
      likes,
      comments,
      shares,
      clicks: 0,
      engagementRate: reach ? Number((((likes + comments + shares) / reach) * 100).toFixed(2)) : 0,
    };
  }
}
