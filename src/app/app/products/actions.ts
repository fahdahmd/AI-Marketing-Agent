"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUserId } from "@/lib/session";
import { requireActiveBrand } from "@/lib/require-brand";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  addProductImage,
  removeProductImage,
} from "@/server/services/product.service";
import { AppError } from "@/lib/errors";

export interface FormState {
  error?: string;
}

function parseListField(formData: FormData, name: string): string[] {
  return String(formData.get(name) ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function extractProductFields(formData: FormData) {
  return {
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
    price: formData.get("price") ? Number(formData.get("price")) : undefined,
    currency: String(formData.get("currency") ?? "USD"),
    productUrl: String(formData.get("productUrl") ?? ""),
    features: parseListField(formData, "features"),
    benefits: parseListField(formData, "benefits"),
    targetAudience: String(formData.get("targetAudience") ?? ""),
    keywords: parseListField(formData, "keywords"),
    notes: String(formData.get("notes") ?? ""),
  };
}

export async function createProductAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUserId();
  const { brand } = await requireActiveBrand(userId);

  let productId: string;
  try {
    const product = await createProduct(brand.id, userId, extractProductFields(formData));
    productId = product.id;

    const images = formData.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
    for (let i = 0; i < images.length; i++) {
      await addProductImage(productId, userId, images[i], i === 0);
    }
  } catch (error) {
    if (error instanceof AppError) return { error: error.message };
    console.error("createProductAction failed", error);
    return { error: "Something went wrong while creating the product." };
  }

  revalidatePath("/app/products");
  redirect(`/app/products/${productId}`);
}

export async function updateProductAction(productId: string, _prevState: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUserId();

  try {
    await updateProduct(productId, userId, extractProductFields(formData));

    const images = formData.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
    for (const image of images) {
      await addProductImage(productId, userId, image, false);
    }
  } catch (error) {
    if (error instanceof AppError) return { error: error.message };
    console.error("updateProductAction failed", error);
    return { error: "Something went wrong while saving the product." };
  }

  revalidatePath(`/app/products/${productId}`);
  revalidatePath("/app/products");
  return {};
}

export async function deleteProductAction(productId: string) {
  const userId = await requireUserId();
  await deleteProduct(productId, userId);
  revalidatePath("/app/products");
  redirect("/app/products");
}

export async function removeProductImageAction(productId: string, imageId: string) {
  const userId = await requireUserId();
  await removeProductImage(imageId, userId);
  revalidatePath(`/app/products/${productId}`);
}
