import "server-only";
import type { AIUsageType } from "@prisma/client";
import { db } from "@/lib/db";
import { CREDIT_COSTS } from "@/billing/plans";

export interface RecordUsageInput {
  workspaceId: string;
  type: AIUsageType;
  provider: string;
  model?: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  estimatedCostUsd?: number;
  metadata?: Record<string, unknown>;
}

export async function recordAIUsage(input: RecordUsageInput) {
  return db.aIUsage.create({
    data: {
      workspaceId: input.workspaceId,
      type: input.type,
      provider: input.provider,
      model: input.model,
      promptTokens: input.promptTokens,
      completionTokens: input.completionTokens,
      totalTokens: input.totalTokens,
      estimatedCostUsd: input.estimatedCostUsd,
      creditsConsumed: CREDIT_COSTS[input.type as keyof typeof CREDIT_COSTS] ?? 0,
      metadata: input.metadata as any,
    },
  });
}

function currentBillingPeriodStart(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export async function getMonthlyUsageCount(workspaceId: string, type: AIUsageType): Promise<number> {
  return db.aIUsage.count({
    where: {
      workspaceId,
      type,
      createdAt: { gte: currentBillingPeriodStart() },
    },
  });
}

export async function getUsageSummary(workspaceId: string) {
  const since = currentBillingPeriodStart();
  const usage = await db.aIUsage.findMany({ where: { workspaceId, createdAt: { gte: since } } });

  const textUsed = usage.filter((u) => u.type === "TEXT_GENERATION").length;
  const imageUsed = usage.filter((u) => u.type === "IMAGE_GENERATION").length;
  const seoUsed = usage.filter((u) => u.type === "SEO_GENERATION").length;
  const creditsConsumed = usage.reduce((sum, u) => sum + u.creditsConsumed, 0);
  const estimatedCostUsd = usage.reduce((sum, u) => sum + Number(u.estimatedCostUsd ?? 0), 0);

  return { periodStart: since, textUsed, imageUsed, seoUsed, creditsConsumed, estimatedCostUsd };
}
