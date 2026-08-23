import "server-only";
import { db } from "@/lib/db";
import { UsageLimitError } from "@/lib/errors";
import { getOrSyncPlan } from "@/server/services/plan.service";
import { getMonthlyUsageCount, getUsageSummary } from "@/server/services/ai-usage.service";

/**
 * Single source of truth for "can this workspace do X" — everything else
 * (routes, server actions, UI) should ask this instead of re-deriving
 * plan logic. Falls back to the Free plan if a workspace somehow has no
 * subscription row (shouldn't happen given workspace creation always
 * attaches one, but keeps this resilient).
 */
export async function getWorkspacePlan(workspaceId: string) {
  const subscription = await db.subscription.findUnique({
    where: { workspaceId },
    include: { plan: true },
  });
  if (subscription) return { subscription, plan: subscription.plan };

  const plan = await getOrSyncPlan("FREE");
  return { subscription: null, plan };
}

export async function getEntitlements(workspaceId: string) {
  const { plan, subscription } = await getWorkspacePlan(workspaceId);
  const usage = await getUsageSummary(workspaceId);

  return {
    plan,
    subscription,
    usage,
    limits: {
      aiPostsPerMonth: plan.aiPostsPerMonth,
      aiImagesPerMonth: plan.aiImagesPerMonth,
      seoGenPerMonth: plan.seoGenPerMonth,
      socialAccounts: plan.socialAccounts,
      teamMembers: plan.teamMembers,
      brands: plan.brands,
    },
    remaining: {
      aiPosts: Math.max(plan.aiPostsPerMonth - usage.textUsed, 0),
      aiImages: Math.max(plan.aiImagesPerMonth - usage.imageUsed, 0),
      seoGenerations: Math.max(plan.seoGenPerMonth - usage.seoUsed, 0),
    },
    features: {
      hasScheduling: plan.hasScheduling,
      hasAdvancedAnalytics: plan.hasAdvancedAnalytics,
      hasAIRecommendations: plan.hasAIRecommendations,
      hasSEOAnalytics: plan.hasSEOAnalytics,
      hasApprovalWorkflows: plan.hasApprovalWorkflows,
      hasWhiteLabel: plan.hasWhiteLabel,
      hasPrioritySupport: plan.hasPrioritySupport,
    },
  };
}

export async function assertCanGenerateText(workspaceId: string) {
  const { plan } = await getWorkspacePlan(workspaceId);
  const used = await getMonthlyUsageCount(workspaceId, "TEXT_GENERATION");
  if (used >= plan.aiPostsPerMonth) {
    throw new UsageLimitError(
      `You've used all ${plan.aiPostsPerMonth} AI post generations included in your ${plan.name} plan.`
    );
  }
}

export async function assertCanGenerateImage(workspaceId: string) {
  const { plan } = await getWorkspacePlan(workspaceId);
  const used = await getMonthlyUsageCount(workspaceId, "IMAGE_GENERATION");
  if (used >= plan.aiImagesPerMonth) {
    throw new UsageLimitError(
      `You've used all ${plan.aiImagesPerMonth} AI image generations included in your ${plan.name} plan.`
    );
  }
}

export async function assertCanGenerateSEO(workspaceId: string) {
  const { plan } = await getWorkspacePlan(workspaceId);
  const used = await getMonthlyUsageCount(workspaceId, "SEO_GENERATION");
  if (used >= plan.seoGenPerMonth) {
    throw new UsageLimitError(
      `You've used all ${plan.seoGenPerMonth} SEO generations included in your ${plan.name} plan.`
    );
  }
}

export async function assertCanAddSocialAccount(workspaceId: string) {
  const { plan } = await getWorkspacePlan(workspaceId);
  const count = await db.socialAccount.count({ where: { brand: { workspaceId } } });
  if (count >= plan.socialAccounts) {
    throw new UsageLimitError(
      `You've reached the ${plan.socialAccounts} social account limit included in your ${plan.name} plan.`
    );
  }
}

export async function assertFeature(workspaceId: string, feature: keyof Awaited<ReturnType<typeof getEntitlements>>["features"]) {
  const { features, plan } = await getEntitlements(workspaceId);
  if (!features[feature]) {
    throw new UsageLimitError(`This feature isn't included in your ${plan.name} plan. Upgrade to unlock it.`);
  }
}
