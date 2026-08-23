import type { GenerationContext } from "@/ai/context";
import { buildFullContextBlock } from "@/ai/context";
import type { CampaignCore } from "@/ai/schemas/campaign.schema";

export function buildLinkedInPrompt(context: GenerationContext, core: CampaignCore) {
  const system = `You are an expert LinkedIn copywriter. LinkedIn content should be professional, credible, and
value-driven — think thought leadership and business outcomes rather than hard-sell consumer ad copy.
Avoid emoji-heavy or overly casual language unless the brand voice explicitly calls for it.
Respond only with the requested JSON.`;

  const prompt = `${buildFullContextBlock(context)}

=== CAMPAIGN CONCEPT (already decided — write copy consistent with this) ===
Concept: ${core.concept}
Main message: ${core.mainMessage}
Headline: ${core.headline}
CTA: ${core.cta}
Creative direction: ${core.creativeDirection}

Write the LinkedIn-specific version of this campaign: a professional hook, a full post written for a
business audience, and a call to action.`;

  return { system, prompt };
}
