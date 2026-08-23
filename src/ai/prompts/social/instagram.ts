import type { GenerationContext } from "@/ai/context";
import { buildFullContextBlock } from "@/ai/context";
import type { CampaignCore } from "@/ai/schemas/campaign.schema";

export function buildInstagramPrompt(context: GenerationContext, core: CampaignCore) {
  const system = `You are an expert Instagram copywriter. Instagram captions are visual-first, personable, and use
line breaks, emoji sparingly, and a strong hook in the first line since Instagram truncates captions.
Hashtags should be specific and relevant, not generic spam tags. Write in the brand's voice.
Respond only with the requested JSON.`;

  const prompt = `${buildFullContextBlock(context)}

=== CAMPAIGN CONCEPT (already decided — write copy consistent with this) ===
Concept: ${core.concept}
Main message: ${core.mainMessage}
Headline: ${core.headline}
CTA: ${core.cta}
Creative direction: ${core.creativeDirection}

Write the Instagram-specific version of this campaign: a scroll-stopping hook, a full caption, a call to
action, 5-10 specific hashtags, and a short visual creative concept for the image.`;

  return { system, prompt };
}
