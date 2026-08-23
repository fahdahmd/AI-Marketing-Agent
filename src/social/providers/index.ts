import "server-only";
import type { Platform } from "@prisma/client";
import type { SocialProvider } from "./social-provider";
import { MockSocialProvider } from "./mock-social-provider";

const REQUIRED_ENV: Record<Platform, [string, string]> = {
  INSTAGRAM: ["INSTAGRAM_CLIENT_ID", "INSTAGRAM_CLIENT_SECRET"],
  FACEBOOK: ["FACEBOOK_CLIENT_ID", "FACEBOOK_CLIENT_SECRET"],
  LINKEDIN: ["LINKEDIN_CLIENT_ID", "LINKEDIN_CLIENT_SECRET"],
  X: ["X_CLIENT_ID", "X_CLIENT_SECRET"],
};

const cache = new Map<Platform, SocialProvider>();

/**
 * Returns the real provider for a platform only when its OAuth app
 * credentials are configured; otherwise falls back to the mock so
 * publishing/scheduling always works end-to-end in development.
 */
export function getSocialProvider(platform: Platform): SocialProvider {
  const cached = cache.get(platform);
  if (cached) return cached;

  const [idVar, secretVar] = REQUIRED_ENV[platform];
  const isConfigured = Boolean(process.env[idVar] && process.env[secretVar]);

  let provider: SocialProvider;
  if (!isConfigured) {
    provider = new MockSocialProvider(platform);
  } else {
    switch (platform) {
      case "INSTAGRAM": {
        const { InstagramProvider } = require("./instagram-provider") as typeof import("./instagram-provider");
        provider = new InstagramProvider();
        break;
      }
      case "FACEBOOK": {
        const { FacebookProvider } = require("./facebook-provider") as typeof import("./facebook-provider");
        provider = new FacebookProvider();
        break;
      }
      case "LINKEDIN": {
        const { LinkedInProvider } = require("./linkedin-provider") as typeof import("./linkedin-provider");
        provider = new LinkedInProvider();
        break;
      }
      case "X": {
        const { XProvider } = require("./x-provider") as typeof import("./x-provider");
        provider = new XProvider();
        break;
      }
    }
  }

  cache.set(platform, provider);
  return provider;
}

export function isPlatformConfigured(platform: Platform): boolean {
  const [idVar, secretVar] = REQUIRED_ENV[platform];
  return Boolean(process.env[idVar] && process.env[secretVar]);
}

export * from "./social-provider";
