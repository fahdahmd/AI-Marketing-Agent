import { describe, it, expect } from "vitest";
import { computeSEOScore } from "@/seo/scoring";
import type { SEOContentGenerated } from "@/ai/schemas/seo.schema";

function baseContent(overrides: Partial<SEOContentGenerated> = {}): SEOContentGenerated {
  return {
    primaryKeyword: "insulated water bottle",
    secondaryKeywords: ["cold water bottle", "vacuum flask"],
    searchIntent: "commercial",
    seoTitle: "Best Insulated Water Bottle Guide for 2026",
    metaTitle: "Best Insulated Water Bottle Guide",
    metaDescription:
      "Discover the best insulated water bottle for staying hydrated. Our guide covers cold water bottle options and vacuum flask picks for every budget.",
    outline: ["Intro", "Why insulation matters", "Top picks", "Buying guide", "FAQ"],
    article: Array(650).fill("word").join(" ") + " cold water bottle vacuum flask",
    faq: [
      { question: "How long does it stay cold?", answer: "Up to 24 hours." },
      { question: "Is it dishwasher safe?", answer: "Hand wash recommended." },
    ],
    internalLinkSuggestions: ["/products/cold-bottle", "/blog/hydration-tips"],
    ...overrides,
  };
}

describe("computeSEOScore", () => {
  it("scores a well-optimized piece highly", () => {
    const score = computeSEOScore(baseContent());
    expect(score).toBeGreaterThanOrEqual(80);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("scores a thin, unoptimized piece lower", () => {
    const thin = baseContent({
      seoTitle: "Untitled",
      metaTitle: "Untitled",
      metaDescription: "",
      outline: [],
      article: "Short text.",
      faq: [],
      internalLinkSuggestions: [],
    });
    const score = computeSEOScore(thin);
    expect(score).toBeLessThan(30);
  });

  it("never returns a value outside 0-100", () => {
    const score = computeSEOScore(baseContent({ article: "" }));
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});
