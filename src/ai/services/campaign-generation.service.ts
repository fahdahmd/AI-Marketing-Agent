import "server-only";
import type { Platform } from "@prisma/client";
import { db } from "@/lib/db";
import { getAIProvider } from "@/ai/providers";
import { recordAIUsage } from "@/server/services/ai-usage.service";
import { assertCanGenerateText } from "@/server/services/entitlement.service";
import type { GenerationContext } from "@/ai/context";
import { campaignCoreSchema, type CampaignCore } from "@/ai/schemas/campaign.schema";
import { platformContentSchemas } from "@/ai/schemas/content.schema";
import { buildCampaignCorePrompt } from "@/ai/prompts/campaigns/core";
import { buildInstagramPrompt } from "@/ai/prompts/social/instagram";
import { buildFacebookPrompt } from "@/ai/prompts/social/facebook";
import { buildLinkedInPrompt } from "@/ai/prompts/social/linkedin";
import { buildXPrompt } from "@/ai/prompts/social/x";

const PLATFORM_PROMPT_BUILDERS: Record<Platform, (ctx: GenerationContext, core: CampaignCore) => { system: string; prompt: string }> = {
  INSTAGRAM: buildInstagramPrompt,
  FACEBOOK: buildFacebookPrompt,
  LINKEDIN: buildLinkedInPrompt,
  X: buildXPrompt,
};

function mapPlatformDataToContentFields(platform: Platform, data: unknown) {
  switch (platform) {
    case "INSTAGRAM": {
      const d = data as { hook: string; caption: string; cta: string; hashtags: string[]; creativeConcept: string };
      return { hook: d.hook, caption: d.caption, cta: d.cta, hashtags: d.hashtags, imagePrompt: d.creativeConcept, body: null as string | null };
    }
    case "FACEBOOK": {
      const d = data as { postCopy: string; cta: string; creativeConcept: string };
      return { hook: null as string | null, caption: d.postCopy, cta: d.cta, hashtags: [] as string[], imagePrompt: d.creativeConcept, body: null as string | null };
    }
    case "LINKEDIN": {
      const d = data as { hook: string; post: string; cta: string };
      return { hook: d.hook, caption: null as string | null, cta: d.cta, hashtags: [] as string[], imagePrompt: null as string | null, body: d.post };
    }
    case "X": {
      const d = data as { hook: string; post: string; cta: string };
      return { hook: d.hook, caption: d.post, cta: d.cta, hashtags: [] as string[], imagePrompt: null as string | null, body: null as string | null };
    }
  }
}

async function loadGenerationContext(campaignId: string): Promise<{ context: GenerationContext; workspaceId: string; platforms: Platform[] }> {
  const campaign = await db.campaign.findUniqueOrThrow({
    where: { id: campaignId },
    include: { brand: true, product: true },
  });

  const context: GenerationContext = {
    brand: campaign.brand,
    product: campaign.product,
    campaign: {
      promotionType: campaign.promotionType,
      objective: campaign.objective,
      idea: campaign.idea,
      targetAudience: campaign.targetAudience,
      tone: campaign.tone,
      platforms: campaign.platforms,
    },
  };

  return { context, workspaceId: campaign.brand.workspaceId, platforms: campaign.platforms };
}

/**
 * Generates the full campaign: strategic core once, then platform-specific
 * content per selected platform (each platform gets its own prompt and
 * schema rather than one generic call). Persists Content rows in
 * READY_FOR_REVIEW status — nothing is published without human approval.
 */
export async function generateCampaign(campaignId: string) {
  const { context, workspaceId, platforms } = await loadGenerationContext(campaignId);
  const provider = getAIProvider();

  await db.campaign.update({ where: { id: campaignId }, data: { status: "GENERATING" } });

  try {
    await assertCanGenerateText(workspaceId);
    const corePrompt = buildCampaignCorePrompt(context);
    const coreResult = await provider.generateStructured({
      schema: campaignCoreSchema,
      schemaName: "campaign_core",
      ...corePrompt,
    });

    await recordAIUsage({
      workspaceId,
      type: "TEXT_GENERATION",
      provider: provider.name,
      model: coreResult.model,
      promptTokens: coreResult.promptTokens,
      completionTokens: coreResult.completionTokens,
      totalTokens: coreResult.totalTokens,
      estimatedCostUsd: coreResult.estimatedCostUsd,
      metadata: { campaignId, kind: "campaign_core" },
    });

    await db.campaign.update({
      where: { id: campaignId },
      data: {
        concept: coreResult.data.concept,
        mainMessage: coreResult.data.mainMessage,
        headline: coreResult.data.headline,
        cta: coreResult.data.cta,
        creativeDirection: coreResult.data.creativeDirection,
        publishingStrategy: coreResult.data.publishingStrategy,
      },
    });

    let successCount = 0;
    for (const platform of platforms) {
      try {
        await generatePlatformContent(campaignId, platform, context, coreResult.data, workspaceId);
        successCount += 1;
      } catch (error) {
        console.error(`Failed to generate ${platform} content for campaign ${campaignId}`, error);
      }
    }

    await db.campaign.update({
      where: { id: campaignId },
      data: { status: successCount > 0 ? "ACTIVE" : "DRAFT" },
    });
  } catch (error) {
    await db.campaign.update({ where: { id: campaignId }, data: { status: "DRAFT" } });
    throw error;
  }

  return db.campaign.findUniqueOrThrow({ where: { id: campaignId }, include: { content: true } });
}

async function generatePlatformContent(
  campaignId: string,
  platform: Platform,
  context: GenerationContext,
  core: CampaignCore,
  workspaceId: string
) {
  await assertCanGenerateText(workspaceId);

  const provider = getAIProvider();
  const schema = platformContentSchemas[platform] as unknown as import("zod").ZodType<unknown>;
  const { system, prompt } = PLATFORM_PROMPT_BUILDERS[platform](context, core);

  const result = await provider.generateStructured({
    schema,
    schemaName: `content_${platform.toLowerCase()}`,
    system,
    prompt,
  });

  await recordAIUsage({
    workspaceId,
    type: "TEXT_GENERATION",
    provider: provider.name,
    model: result.model,
    promptTokens: result.promptTokens,
    completionTokens: result.completionTokens,
    totalTokens: result.totalTokens,
    estimatedCostUsd: result.estimatedCostUsd,
    metadata: { campaignId, platform },
  });

  const fields = mapPlatformDataToContentFields(platform, result.data);
  const campaign = await db.campaign.findUniqueOrThrow({ where: { id: campaignId } });

  const content = await db.content.create({
    data: {
      campaignId,
      brandId: campaign.brandId,
      platform,
      status: "READY_FOR_REVIEW",
      ...fields,
    },
  });

  await db.contentVariant.create({
    data: {
      contentId: content.id,
      label: "v1",
      headline: content.headline,
      caption: content.caption,
      body: content.body,
      cta: content.cta,
      hashtags: content.hashtags,
      imagePrompt: content.imagePrompt,
      isSelected: true,
    },
  });

  return content;
}

/**
 * Regenerates a single piece of platform content, keeping the original as
 * a variant in history rather than discarding it.
 */
export async function regenerateContent(contentId: string) {
  const content = await db.content.findUniqueOrThrow({
    where: { id: contentId },
    include: { campaign: { include: { brand: true, product: true } } },
  });

  const workspaceId = content.campaign.brand.workspaceId;
  await assertCanGenerateText(workspaceId);

  const context: GenerationContext = {
    brand: content.campaign.brand,
    product: content.campaign.product,
    campaign: {
      promotionType: content.campaign.promotionType,
      objective: content.campaign.objective,
      idea: content.campaign.idea,
      targetAudience: content.campaign.targetAudience,
      tone: content.campaign.tone,
      platforms: content.campaign.platforms,
    },
  };

  const core: CampaignCore = {
    concept: content.campaign.concept ?? "",
    mainMessage: content.campaign.mainMessage ?? "",
    headline: content.campaign.headline ?? "",
    cta: content.campaign.cta ?? "",
    creativeDirection: content.campaign.creativeDirection ?? "",
    publishingStrategy: content.campaign.publishingStrategy ?? "",
  };

  const provider = getAIProvider();
  const schema = platformContentSchemas[content.platform] as unknown as import("zod").ZodType<unknown>;
  const { system, prompt } = PLATFORM_PROMPT_BUILDERS[content.platform](context, core);

  const result = await provider.generateStructured({
    schema,
    schemaName: `content_${content.platform.toLowerCase()}_regen`,
    system,
    prompt: `${prompt}\n\nGenerate a fresh alternative — different wording and angle from any previous version.`,
  });

  await recordAIUsage({
    workspaceId,
    type: "TEXT_GENERATION",
    provider: provider.name,
    model: result.model,
    promptTokens: result.promptTokens,
    completionTokens: result.completionTokens,
    totalTokens: result.totalTokens,
    estimatedCostUsd: result.estimatedCostUsd,
    metadata: { contentId, platform: content.platform, kind: "regeneration" },
  });

  const fields = mapPlatformDataToContentFields(content.platform, result.data);

  const existingVariants = await db.contentVariant.count({ where: { contentId } });
  await db.contentVariant.updateMany({ where: { contentId }, data: { isSelected: false } });
  await db.contentVariant.create({
    data: {
      contentId,
      label: `v${existingVariants + 1}`,
      headline: fields.hook ?? null,
      caption: fields.caption,
      body: fields.body,
      cta: fields.cta,
      hashtags: fields.hashtags,
      imagePrompt: fields.imagePrompt,
      isSelected: true,
    },
  });

  return db.content.update({
    where: { id: contentId },
    data: { ...fields, status: "READY_FOR_REVIEW" },
  });
}
