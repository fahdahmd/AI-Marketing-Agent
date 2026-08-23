import type { Brand, Product } from "@prisma/client";

export interface CampaignRequestContext {
  promotionType: string;
  objective: string;
  idea: string;
  targetAudience?: string | null;
  tone?: string | null;
  platforms: string[];
}

export interface GenerationContext {
  brand: Pick<Brand, "name" | "industry" | "description" | "targetAudience" | "voice" | "customVoiceNotes" | "website" | "marketingGoals" | "competitors">;
  product?: Pick<Product, "name" | "description" | "price" | "currency" | "features" | "benefits" | "targetAudience" | "keywords"> | null;
  campaign: CampaignRequestContext;
  previousPerformanceNote?: string;
}

export function buildBrandContextBlock(brand: GenerationContext["brand"]): string {
  const lines = [
    `Brand name: ${brand.name}`,
    brand.industry ? `Industry: ${brand.industry}` : null,
    brand.description ? `Description: ${brand.description}` : null,
    brand.targetAudience ? `Brand target audience: ${brand.targetAudience}` : null,
    `Brand voice: ${brand.voice}`,
    brand.customVoiceNotes ? `Custom brand instructions: ${brand.customVoiceNotes}` : null,
    brand.marketingGoals?.length ? `Marketing goals: ${brand.marketingGoals.join(", ")}` : null,
    brand.competitors?.length ? `Competitors: ${brand.competitors.join(", ")}` : null,
    brand.website ? `Website: ${brand.website}` : null,
  ].filter(Boolean);
  return lines.join("\n");
}

export function buildProductContextBlock(product: GenerationContext["product"]): string {
  if (!product) return "No specific product selected — this campaign promotes the brand generally.";
  const lines = [
    `Product/service name: ${product.name}`,
    product.description ? `Description: ${product.description}` : null,
    product.price ? `Price: ${product.price} ${product.currency}` : null,
    product.features?.length ? `Features: ${product.features.join(", ")}` : null,
    product.benefits?.length ? `Benefits: ${product.benefits.join(", ")}` : null,
    product.targetAudience ? `Product target audience: ${product.targetAudience}` : null,
    product.keywords?.length ? `Keywords: ${product.keywords.join(", ")}` : null,
  ].filter(Boolean);
  return lines.join("\n");
}

export function buildCampaignContextBlock(campaign: CampaignRequestContext): string {
  const lines = [
    `Promoting: ${campaign.promotionType}`,
    `Objective: ${campaign.objective}`,
    `Marketing idea from user: ${campaign.idea}`,
    campaign.targetAudience ? `Target audience override: ${campaign.targetAudience}` : null,
    campaign.tone ? `Tone override: ${campaign.tone}` : null,
    `Platforms: ${campaign.platforms.join(", ")}`,
  ].filter(Boolean);
  return lines.join("\n");
}

export function buildFullContextBlock(context: GenerationContext): string {
  return [
    "=== BRAND CONTEXT ===",
    buildBrandContextBlock(context.brand),
    "",
    "=== PRODUCT CONTEXT ===",
    buildProductContextBlock(context.product),
    "",
    "=== CAMPAIGN CONTEXT ===",
    buildCampaignContextBlock(context.campaign),
    context.previousPerformanceNote ? `\n=== PREVIOUS PERFORMANCE ===\n${context.previousPerformanceNote}` : "",
  ].join("\n");
}
