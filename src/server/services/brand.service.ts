import "server-only";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireWorkspaceMembership, requireBrandAccess } from "@/server/auth/authorize";
import { UsageLimitError } from "@/lib/errors";
import { getOrSyncPlan } from "@/server/services/plan.service";
import { logAudit } from "@/server/services/audit-log.service";

export const brandVoiceValues = [
  "PROFESSIONAL",
  "FRIENDLY",
  "BOLD",
  "EDUCATIONAL",
  "FUNNY",
  "LUXURY",
  "CASUAL",
] as const;

export const brandInputSchema = z.object({
  name: z.string().min(1).max(120),
  website: z.string().url().optional().or(z.literal("")),
  industry: z.string().max(120).optional(),
  description: z.string().max(2000).optional(),
  targetAudience: z.string().max(2000).optional(),
  voice: z.enum(brandVoiceValues).default("PROFESSIONAL"),
  customVoiceNotes: z.string().max(2000).optional(),
  marketingGoals: z.array(z.string()).default([]),
  competitors: z.array(z.string()).default([]),
  // Populated from our own storage provider (relative path or absolute URL), not user-typed input.
  logoUrl: z.string().min(1).optional().or(z.literal("")),
  primaryColor: z.string().max(20).optional(),
  secondaryColor: z.string().max(20).optional(),
});

export type BrandInput = z.infer<typeof brandInputSchema>;

export async function listBrandsForWorkspace(workspaceId: string, userId: string) {
  await requireWorkspaceMembership(workspaceId, userId);
  return db.brand.findMany({ where: { workspaceId }, orderBy: { createdAt: "asc" } });
}

export async function createBrand(workspaceId: string, userId: string, input: BrandInput) {
  const membership = await requireWorkspaceMembership(workspaceId, userId);

  const workspace = await db.workspace.findUniqueOrThrow({
    where: { id: workspaceId },
    include: { subscription: { include: { plan: true } }, brands: true },
  });

  const plan = workspace.subscription?.plan ?? (await getOrSyncPlan("FREE"));
  if (workspace.brands.length >= plan.brands) {
    throw new UsageLimitError(
      `You've reached the ${plan.brands} brand limit included in your ${plan.name} plan. Upgrade to add more brands.`
    );
  }

  const data = brandInputSchema.parse(input);

  const brand = await db.brand.create({
    data: {
      workspaceId,
      name: data.name,
      website: data.website || null,
      industry: data.industry || null,
      description: data.description || null,
      targetAudience: data.targetAudience || null,
      voice: data.voice,
      customVoiceNotes: data.customVoiceNotes || null,
      marketingGoals: data.marketingGoals,
      competitors: data.competitors,
      logoUrl: data.logoUrl || null,
      primaryColor: data.primaryColor || null,
      secondaryColor: data.secondaryColor || null,
      onboardingCompletedAt: new Date(),
    },
  });

  await logAudit({ workspaceId, userId, action: "brand.created", entityType: "Brand", entityId: brand.id, metadata: { name: brand.name } });

  return brand;
}

export async function updateBrand(brandId: string, userId: string, input: Partial<BrandInput>) {
  const { brand } = await requireBrandAccess(brandId, userId);
  const data = brandInputSchema.partial().parse(input);

  const updated = await db.brand.update({
    where: { id: brandId },
    data: {
      ...data,
      website: data.website === "" ? null : data.website,
      logoUrl: data.logoUrl === "" ? null : data.logoUrl,
    },
  });

  await logAudit({ workspaceId: brand.workspaceId, userId, action: "brand.updated", entityType: "Brand", entityId: brand.id });

  return updated;
}

export async function getBrandContext(brandId: string, userId: string) {
  const { brand } = await requireBrandAccess(brandId, userId);
  return brand;
}
