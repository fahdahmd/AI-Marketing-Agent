import "server-only";
import type { Plan, PlanKey } from "@prisma/client";
import { db } from "@/lib/db";
import { PLAN_DEFINITIONS, PLAN_ORDER, getPaddlePriceId } from "@/billing/plans";

/**
 * Ensures the Plan table mirrors the central plan config, then returns the row.
 * Idempotent — safe to call on every access instead of relying solely on a seed script.
 */
export async function getOrSyncPlan(key: PlanKey): Promise<Plan> {
  const def = PLAN_DEFINITIONS[key];
  return db.plan.upsert({
    where: { key },
    create: {
      key,
      name: def.name,
      priceMonthly: def.priceMonthly,
      paddlePriceId: getPaddlePriceId(key) ?? null,
      aiPostsPerMonth: def.aiPostsPerMonth,
      aiImagesPerMonth: def.aiImagesPerMonth,
      seoGenPerMonth: def.seoGenPerMonth,
      socialAccounts: def.socialAccounts,
      teamMembers: def.teamMembers,
      brands: def.brands,
      hasScheduling: def.hasScheduling,
      hasAdvancedAnalytics: def.hasAdvancedAnalytics,
      hasAIRecommendations: def.hasAIRecommendations,
      hasSEOAnalytics: def.hasSEOAnalytics,
      hasApprovalWorkflows: def.hasApprovalWorkflows,
      hasWhiteLabel: def.hasWhiteLabel,
      hasPrioritySupport: def.hasPrioritySupport,
    },
    update: {
      name: def.name,
      priceMonthly: def.priceMonthly,
      paddlePriceId: getPaddlePriceId(key) ?? null,
      aiPostsPerMonth: def.aiPostsPerMonth,
      aiImagesPerMonth: def.aiImagesPerMonth,
      seoGenPerMonth: def.seoGenPerMonth,
      socialAccounts: def.socialAccounts,
      teamMembers: def.teamMembers,
      brands: def.brands,
      hasScheduling: def.hasScheduling,
      hasAdvancedAnalytics: def.hasAdvancedAnalytics,
      hasAIRecommendations: def.hasAIRecommendations,
      hasSEOAnalytics: def.hasSEOAnalytics,
      hasApprovalWorkflows: def.hasApprovalWorkflows,
      hasWhiteLabel: def.hasWhiteLabel,
      hasPrioritySupport: def.hasPrioritySupport,
    },
  });
}

export async function syncAllPlans(): Promise<Plan[]> {
  const plans: Plan[] = [];
  for (const key of PLAN_ORDER) {
    plans.push(await getOrSyncPlan(key));
  }
  return plans;
}

export async function getPlanByPaddlePriceId(paddlePriceId: string): Promise<Plan | null> {
  return db.plan.findFirst({ where: { paddlePriceId } });
}
