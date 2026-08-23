import { z } from "zod";

export const keywordIdeasSchema = z.object({
  relatedKeywords: z.array(z.string()).describe("5-10 related keywords"),
  longTailKeywords: z.array(z.string()).describe("5-10 long-tail keyword phrases"),
  searchIntent: z.string().describe("The dominant search intent for this topic: informational, commercial, transactional, or navigational, with a brief note"),
  contentIdeas: z.array(z.string()).describe("3-6 content ideas that would target this topic"),
  keywordClusters: z
    .array(z.object({ clusterName: z.string(), keywords: z.array(z.string()) }))
    .describe("2-4 thematic clusters grouping the keywords above"),
});

export type KeywordIdeas = z.infer<typeof keywordIdeasSchema>;

export const seoContentTypeValues = ["article", "product_description", "landing_page", "faq"] as const;

export const seoContentSchema = z.object({
  primaryKeyword: z.string(),
  secondaryKeywords: z.array(z.string()).describe("3-6 secondary keywords"),
  searchIntent: z.string(),
  seoTitle: z.string().describe("40-60 characters"),
  metaTitle: z.string().describe("Under 60 characters"),
  metaDescription: z.string().describe("120-160 characters"),
  outline: z.array(z.string()).describe("4-8 section headings for the content"),
  article: z.string().describe("The full content, written in markdown with headings matching the outline, at least 500 words"),
  faq: z.array(z.object({ question: z.string(), answer: z.string() })).describe("3-5 frequently asked questions with answers"),
  internalLinkSuggestions: z.array(z.string()).describe("2-4 suggested internal link anchor texts/topics"),
});

export type SEOContentGenerated = z.infer<typeof seoContentSchema>;
