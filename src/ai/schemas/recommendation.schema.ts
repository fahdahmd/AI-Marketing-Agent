import { z } from "zod";

export const recommendationContentSchema = z.object({
  title: z.string().describe("A short, actionable recommendation title, e.g. 'Promote Product X again'"),
  explanation: z.string().describe("1-2 sentences explaining why this is recommended, referencing the evidence"),
  expectedImpact: z.string().describe("A short statement of the expected impact if the user acts on this"),
});

export type RecommendationContent = z.infer<typeof recommendationContentSchema>;
