import type { GenerationContext } from "@/ai/context";
import { buildFullContextBlock } from "@/ai/context";

export function buildCampaignCorePrompt(context: GenerationContext) {
  const system = `You are an expert marketing strategist and creative director working inside an AI marketing platform.
You design the strategic foundation of ad campaigns — the concept, message, and creative direction —
that platform-specific copywriters will build on next. Always write in the brand's voice.
Never make unverifiable claims (guaranteed results, guaranteed rankings, guaranteed sales).
Respond only with the requested JSON.`;

  const prompt = `${buildFullContextBlock(context)}

Design the strategic foundation for this marketing campaign. Produce:
- A campaign concept
- The main message
- A headline
- A primary call to action
- Creative direction for the visuals
- A short publishing strategy recommendation across the selected platforms`;

  return { system, prompt };
}
