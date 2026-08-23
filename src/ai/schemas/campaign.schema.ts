import { z } from "zod";

export const campaignCoreSchema = z.object({
  concept: z.string().describe("A 1-2 sentence description of the overall campaign concept"),
  mainMessage: z.string().describe("The single core message this campaign communicates"),
  headline: z.string().describe("A short, punchy headline for the campaign"),
  cta: z.string().describe("The primary call to action, e.g. 'Shop Now'"),
  creativeDirection: z.string().describe("Guidance for what the visual creative should look like"),
  publishingStrategy: z.string().describe("A short recommendation on how/when to publish this campaign across the chosen platforms"),
});

export type CampaignCore = z.infer<typeof campaignCoreSchema>;
