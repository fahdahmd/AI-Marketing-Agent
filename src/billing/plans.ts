import type { PlanKey } from "@prisma/client";

/**
 * Single source of truth for pricing plan configuration.
 * Nothing else in the app should hardcode plan limits, prices, or feature flags —
 * read them from here (or from the Plan table, which is upserted from this config).
 */
export interface PlanDefinition {
  key: PlanKey;
  name: string;
  priceMonthly: number; // cents
  paddlePriceIdEnvVar: string | null;

  aiPostsPerMonth: number;
  aiImagesPerMonth: number;
  seoGenPerMonth: number;
  socialAccounts: number;
  teamMembers: number;
  brands: number;

  hasScheduling: boolean;
  hasAdvancedAnalytics: boolean;
  hasAIRecommendations: boolean;
  hasSEOAnalytics: boolean;
  hasApprovalWorkflows: boolean;
  hasWhiteLabel: boolean;
  hasPrioritySupport: boolean;

  features: string[];
}

export const PLAN_DEFINITIONS: Record<PlanKey, PlanDefinition> = {
  FREE: {
    key: "FREE",
    name: "Free",
    priceMonthly: 0,
    paddlePriceIdEnvVar: null,
    aiPostsPerMonth: 10,
    aiImagesPerMonth: 5,
    seoGenPerMonth: 2,
    socialAccounts: 1,
    teamMembers: 1,
    brands: 1,
    hasScheduling: false,
    hasAdvancedAnalytics: false,
    hasAIRecommendations: false,
    hasSEOAnalytics: false,
    hasApprovalWorkflows: false,
    hasWhiteLabel: false,
    hasPrioritySupport: false,
    features: ["1 social account", "10 AI posts/month", "5 AI images/month", "2 SEO generations/month", "Basic dashboard", "1 brand"],
  },
  STARTER: {
    key: "STARTER",
    name: "Starter",
    priceMonthly: 1900,
    paddlePriceIdEnvVar: "PADDLE_STARTER_PRICE_ID",
    aiPostsPerMonth: 100,
    aiImagesPerMonth: 50,
    seoGenPerMonth: 10,
    socialAccounts: 3,
    teamMembers: 1,
    brands: 1,
    hasScheduling: true,
    hasAdvancedAnalytics: false,
    hasAIRecommendations: false,
    hasSEOAnalytics: false,
    hasApprovalWorkflows: false,
    hasWhiteLabel: false,
    hasPrioritySupport: false,
    features: ["3 social accounts", "100 AI posts/month", "50 AI images/month", "10 SEO generations/month", "Scheduling", "Brand voice", "Content calendar", "Basic analytics", "1 brand"],
  },
  GROWTH: {
    key: "GROWTH",
    name: "Growth",
    priceMonthly: 4900,
    paddlePriceIdEnvVar: "PADDLE_GROWTH_PRICE_ID",
    aiPostsPerMonth: 500,
    aiImagesPerMonth: 200,
    seoGenPerMonth: 50,
    socialAccounts: 10,
    teamMembers: 5,
    brands: 3,
    hasScheduling: true,
    hasAdvancedAnalytics: true,
    hasAIRecommendations: true,
    hasSEOAnalytics: true,
    hasApprovalWorkflows: true,
    hasWhiteLabel: false,
    hasPrioritySupport: false,
    features: ["10 social accounts", "500 AI posts/month", "200 AI images/month", "50 SEO generations/month", "Advanced analytics", "AI recommendations", "SEO analytics", "Approval workflows", "5 team members", "Multiple brands"],
  },
  PRO: {
    key: "PRO",
    name: "Pro",
    priceMonthly: 9900,
    paddlePriceIdEnvVar: "PADDLE_PRO_PRICE_ID",
    aiPostsPerMonth: 1000,
    aiImagesPerMonth: 500,
    seoGenPerMonth: 100,
    socialAccounts: 20,
    teamMembers: 10,
    brands: 10,
    hasScheduling: true,
    hasAdvancedAnalytics: true,
    hasAIRecommendations: true,
    hasSEOAnalytics: true,
    hasApprovalWorkflows: true,
    hasWhiteLabel: false,
    hasPrioritySupport: true,
    features: ["20 social accounts", "1,000 AI posts/month", "500 AI images/month", "100 SEO generations/month", "Advanced AI recommendations", "Advanced analytics", "Multiple brands", "10 team members", "Priority AI generation"],
  },
  AGENCY: {
    key: "AGENCY",
    name: "Agency",
    priceMonthly: 19900,
    paddlePriceIdEnvVar: "PADDLE_AGENCY_PRICE_ID",
    aiPostsPerMonth: 2000,
    aiImagesPerMonth: 1000,
    seoGenPerMonth: 200,
    socialAccounts: 50,
    teamMembers: 999,
    brands: 999,
    hasScheduling: true,
    hasAdvancedAnalytics: true,
    hasAIRecommendations: true,
    hasSEOAnalytics: true,
    hasApprovalWorkflows: true,
    hasWhiteLabel: true,
    hasPrioritySupport: true,
    features: ["50 social accounts", "2,000 AI posts/month", "1,000 AI images/month", "200 SEO generations/month", "Unlimited team members", "Multiple brands", "Client management", "White-label capabilities", "Priority support"],
  },
};

export const PLAN_ORDER: PlanKey[] = ["FREE", "STARTER", "GROWTH", "PRO", "AGENCY"];

export function getPaddlePriceId(key: PlanKey): string | undefined {
  const envVar = PLAN_DEFINITIONS[key].paddlePriceIdEnvVar;
  if (!envVar) return undefined;
  return process.env[envVar];
}

/**
 * Credit costs per generation type. Centralized so nothing else in the
 * app hardcodes credit pricing.
 */
export const CREDIT_COSTS = {
  TEXT_GENERATION: 1,
  IMAGE_GENERATION: 3,
  SEO_GENERATION: 5,
  RECOMMENDATION_GENERATION: 0, // recommendation generation is a platform-run background job, not user-billed
} as const;
