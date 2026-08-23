import "server-only";
import { randomUUID } from "crypto";
import type { Platform, SocialAccount } from "@prisma/client";
import type {
  ConnectedAccountInfo,
  PostAnalytics,
  PostContentInput,
  PublishResult,
  SocialProvider,
} from "./social-provider";

/**
 * Simulates a fully working social platform without any external calls.
 * Used automatically for every platform in development, and for any
 * platform whose real OAuth app credentials aren't configured — so the
 * full publish/schedule/analytics loop is always exercisable.
 */
export class MockSocialProvider implements SocialProvider {
  readonly name = "mock";

  constructor(public readonly platform: Platform) {}

  async connectAccount({ brandId }: { brandId: string; redirectUri: string }): Promise<ConnectedAccountInfo> {
    return {
      externalAccountId: `mock_${this.platform.toLowerCase()}_${randomUUID().slice(0, 8)}`,
      displayName: `Mock ${this.platform} Account`,
      handle: `@mock_${brandId.slice(0, 6)}`,
      accessToken: `mock-token-${randomUUID()}`,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60),
    };
  }

  async disconnectAccount(): Promise<void> {
    // no external call needed for the mock
  }

  async refreshToken(): Promise<{ accessToken: string; expiresAt?: Date }> {
    return { accessToken: `mock-token-${randomUUID()}`, expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60) };
  }

  async publishPost(account: SocialAccount, _content: PostContentInput): Promise<PublishResult> {
    const externalPostId = `mockpost_${randomUUID().slice(0, 10)}`;
    return {
      externalPostId,
      externalUrl: `https://mock.local/${this.platform.toLowerCase()}/${account.handle ?? account.id}/${externalPostId}`,
    };
  }

  async schedulePost(): Promise<{ accepted: boolean }> {
    return { accepted: true };
  }

  async getPosts(): Promise<PublishResult[]> {
    return [];
  }

  async getAnalytics(): Promise<PostAnalytics> {
    const reach = 400 + Math.floor(Math.random() * 3600);
    const impressions = Math.round(reach * (1.1 + Math.random() * 0.6));
    const likes = Math.round(reach * (0.02 + Math.random() * 0.08));
    const comments = Math.round(likes * (0.05 + Math.random() * 0.15));
    const shares = Math.round(likes * (0.02 + Math.random() * 0.08));
    const clicks = Math.round(reach * (0.01 + Math.random() * 0.05));
    const engagementRate = Number((((likes + comments + shares) / Math.max(reach, 1)) * 100).toFixed(2));

    return { reach, impressions, likes, comments, shares, clicks, engagementRate };
  }
}
