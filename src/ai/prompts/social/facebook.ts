import type { GenerationContext } from "@/ai/context";
import { buildFullContextBlock } from "@/ai/context";
import type { CampaignCore } from "@/ai/schemas/campaign.schema";

export function buildFacebookPrompt(context: GenerationContext, core: CampaignCore) {
  const system = `You are an expert Facebook ads and organic copywriter. Facebook audiences skew slightly older and
respond well to clear value propositions and conversational, benefit-led copy. Avoid excessive hashtags
(Facebook doesn't reward them like Instagram). Write in the brand's voice.
Respond only with the requested JSON.`;

  const prompt = `${buildFullContextBlock(context)}

=== CAMPAIGN CONCEPT (already decided — write copy consistent with this) ===
Concept: ${core.concept}
Main message: ${core.mainMessage}
Headline: ${core.headline}
CTA: ${core.cta}
Creative direction: ${core.creativeDirection}

Write the Facebook-specific version of this campaign: full post copy, a call to action, and a short
visual creative concept for the image.`;

  return { system, prompt };
}
