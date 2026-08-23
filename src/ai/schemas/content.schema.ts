import { z } from "zod";

export const instagramContentSchema = z.object({
  hook: z.string().describe("The first line that stops the scroll"),
  caption: z.string().describe("The full Instagram caption"),
  cta: z.string(),
  hashtags: z.array(z.string()).describe("5-10 relevant hashtags, without the # symbol"),
  creativeConcept: z.string().describe("A visual description to guide image generation"),
});

export const facebookContentSchema = z.object({
  postCopy: z.string().describe("The full Facebook post copy"),
  cta: z.string(),
  creativeConcept: z.string().describe("A visual description to guide image generation"),
});

export const linkedinContentSchema = z.object({
  hook: z.string().describe("A professional opening line"),
  post: z.string().describe("The full LinkedIn post, written for a professional audience"),
  cta: z.string(),
});

export const xContentSchema = z.object({
  hook: z.string().describe("A short, attention-grabbing opening"),
  post: z.string().describe("The full post, concise and punchy (under 280 characters)"),
  cta: z.string(),
});

export const platformContentSchemas = {
  INSTAGRAM: instagramContentSchema,
  FACEBOOK: facebookContentSchema,
  LINKEDIN: linkedinContentSchema,
  X: xContentSchema,
} as const;

export type PlatformKey = keyof typeof platformContentSchemas;
export type InstagramContent = z.infer<typeof instagramContentSchema>;
export type FacebookContent = z.infer<typeof facebookContentSchema>;
export type LinkedInContent = z.infer<typeof linkedinContentSchema>;
export type XContent = z.infer<typeof xContentSchema>;
