import type { GenerationContext } from "@/ai/context";
import { buildFullContextBlock } from "@/ai/context";
import type { CampaignCore } from "@/ai/schemas/campaign.schema";

export function buildXPrompt(context: GenerationContext, core: CampaignCore) {
  const system = `You are an expert X (formerly Twitter) copywriter. Posts must be extremely concise, punchy, and
conversational, ideally under 280 characters. Wit and a strong point of view perform well. Avoid
hashtag stuffing — at most one relevant hashtag if any. Write in the brand's voice.
Respond only with the requested JSON.`;

  const prompt = `${buildFullContextBlock(context)}

=== CAMPAIGN CONCEPT (already decided — write copy consistent with this) ===
Concept: ${core.concept}
Main message: ${core.mainMessage}
Headline: ${core.headline}
CTA: ${core.cta}
Creative direction: ${core.creativeDirection}

Write the X-specific version of this campaign: a short hook, the full post (under 280 characters), and
a call to action.`;

  return { system, prompt };
}
