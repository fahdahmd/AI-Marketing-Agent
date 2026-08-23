import "server-only";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireBrandAccess, requireProductAccess } from "@/server/auth/authorize";
import { logAudit } from "@/server/services/audit-log.service";
import { getStorageProvider, assertValidImageFile } from "@/storage";

export const productInputSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(4000).optional(),
  price: z.coerce.number().nonnegative().optional(),
  currency: z.string().length(3).default("USD"),
  productUrl: z.string().url().optional().or(z.literal("")),
  features: z.array(z.string()).default([]),
  benefits: z.array(z.string()).default([]),
  targetAudience: z.string().max(2000).optional(),
  keywords: z.array(z.string()).default([]),
  notes: z.string().max(2000).optional(),
});

export type ProductInput = z.infer<typeof productInputSchema>;

export async function listProductsForBrand(brandId: string, userId: string) {
  await requireBrandAccess(brandId, userId);
  return db.product.findMany({
    where: { brandId },
    orderBy: { createdAt: "desc" },
    include: { images: true },
  });
}

export async function getProductForBrand(productId: string, userId: string) {
  const { product } = await requireProductAccess(productId, userId);
  return db.product.findUniqueOrThrow({ where: { id: product.id }, include: { images: true } });
}

export async function createProduct(brandId: string, userId: string, input: ProductInput) {
  const { brand } = await requireBrandAccess(brandId, userId);
  const data = productInputSchema.parse(input);

  const product = await db.product.create({
    data: {
      brandId,
      name: data.name,
      description: data.description || null,
      price: data.price ?? null,
      currency: data.currency,
      productUrl: data.productUrl || null,
      features: data.features,
      benefits: data.benefits,
      targetAudience: data.targetAudience || null,
      keywords: data.keywords,
      notes: data.notes || null,
    },
  });

  await logAudit({ workspaceId: brand.workspaceId, userId, action: "product.created", entityType: "Product", entityId: product.id, metadata: { name: product.name } });

  return product;
}

export async function updateProduct(productId: string, userId: string, input: Partial<ProductInput>) {
  const { product } = await requireProductAccess(productId, userId);
  const data = productInputSchema.partial().parse(input);

  const updated = await db.product.update({
    where: { id: productId },
    data: {
      ...data,
      productUrl: data.productUrl === "" ? null : data.productUrl,
    },
  });

  await logAudit({ workspaceId: product.brand.workspaceId, userId, action: "product.updated", entityType: "Product", entityId: productId });

  return updated;
}

export async function deleteProduct(productId: string, userId: string) {
  const { product } = await requireProductAccess(productId, userId);
  const images = await db.productImage.findMany({ where: { productId } });

  const storage = getStorageProvider();
  await Promise.all(
    images.map(async (image) => {
      try {
        const key = new URL(image.url, "http://local").pathname.replace(/^\/uploads\//, "");
        await storage.delete(key);
      } catch {
        // best-effort cleanup
      }
    })
  );

  await db.product.delete({ where: { id: productId } });

  await logAudit({ workspaceId: product.brand.workspaceId, userId, action: "product.deleted", entityType: "Product", entityId: productId });
}

export async function addProductImage(productId: string, userId: string, file: File, isPrimary = false) {
  const { product } = await requireProductAccess(productId, userId);
  assertValidImageFile(file);

  const buffer = Buffer.from(await file.arrayBuffer());
  const storage = getStorageProvider();
  const { url } = await storage.upload({
    buffer,
    filename: file.name,
    contentType: file.type,
    folder: `products/${productId}`,
  });

  if (isPrimary) {
    await db.productImage.updateMany({ where: { productId }, data: { isPrimary: false } });
  }

  const image = await db.productImage.create({
    data: { productId, url, alt: product.name, isPrimary },
  });

  await logAudit({ workspaceId: product.brand.workspaceId, userId, action: "product.image_added", entityType: "Product", entityId: productId });

  return image;
}

export async function removeProductImage(imageId: string, userId: string) {
  const image = await db.productImage.findUniqueOrThrow({
    where: { id: imageId },
    include: { product: { include: { brand: true } } },
  });
  await requireProductAccess(image.productId, userId);

  const storage = getStorageProvider();
  try {
    const key = new URL(image.url, "http://local").pathname.replace(/^\/uploads\//, "");
    await storage.delete(key);
  } catch {
    // best-effort cleanup
  }

  await db.productImage.delete({ where: { id: imageId } });
}
