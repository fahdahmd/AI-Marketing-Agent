import type { Platform, SocialAccount } from "@prisma/client";

export interface ConnectedAccountInfo {
  externalAccountId: string;
  displayName: string;
  handle?: string;
  avatarUrl?: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
}

export interface PostContentInput {
  caption?: string | null;
  body?: string | null;
  hook?: string | null;
  cta?: string | null;
  hashtags?: string[];
  imageUrl?: string | null;
}

export interface PublishResult {
  externalPostId: string;
  externalUrl?: string;
}

export interface PostAnalytics {
  reach: number;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
  engagementRate: number;
}

/**
 * Abstraction over any social platform's publishing API. Nothing else in
 * the app should call a platform SDK/API directly — everything routes
 * through this so publishing, scheduling, and analytics sync all work the
 * same way regardless of which platform (or the mock) is behind them.
 */
export interface SocialProvider {
  readonly platform: Platform;
  readonly name: string;

  /** Builds the OAuth authorization URL the user is redirected to, or connects a mock account directly. */
  connectAccount(params: { brandId: string; redirectUri: string }): Promise<ConnectedAccountInfo | { authorizeUrl: string }>;
  disconnectAccount(account: SocialAccount): Promise<void>;
  refreshToken(account: SocialAccount): Promise<{ accessToken: string; expiresAt?: Date }>;
  publishPost(account: SocialAccount, content: PostContentInput): Promise<PublishResult>;
  schedulePost(account: SocialAccount, content: PostContentInput, scheduledFor: Date): Promise<{ accepted: boolean }>;
  getPosts(account: SocialAccount, limit?: number): Promise<PublishResult[]>;
  getAnalytics(account: SocialAccount, externalPostId: string): Promise<PostAnalytics>;
}
