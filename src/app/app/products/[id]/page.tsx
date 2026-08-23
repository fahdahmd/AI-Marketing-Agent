import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUserId } from "@/lib/session";
import { getProductForBrand } from "@/server/services/product.service";
import { NotFoundError, AuthorizationError } from "@/lib/errors";
import { ProductForm } from "../product-form";
import { updateProductAction } from "../actions";
import { DeleteProductButton } from "./delete-button";
import { ImageGallery } from "./image-gallery";

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const userId = await requireUserId();

  let product;
  try {
    product = await getProductForBrand(params.id, userId);
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof AuthorizationError) notFound();
    throw error;
  }

  const boundAction = updateProductAction.bind(null, product.id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{product.name}</h1>
          <p className="text-muted-foreground">Used as context for campaign and content generation.</p>
        </div>
        <DeleteProductButton productId={product.id} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Images</CardTitle>
          <CardDescription>The first image is used as the primary reference for AI creative generation.</CardDescription>
        </CardHeader>
        <CardContent>
          <ImageGallery productId={product.id} images={product.images} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Product details</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductForm
            action={boundAction}
            initial={{
              name: product.name,
              description: product.description,
              price: product.price ? Number(product.price) : "",
              currency: product.currency,
              productUrl: product.productUrl,
              features: product.features,
              benefits: product.benefits,
              targetAudience: product.targetAudience,
              keywords: product.keywords,
              notes: product.notes,
            }}
            submitLabel="Save changes"
            pendingLabel="Saving..."
          />
        </CardContent>
      </Card>
    </div>
  );
}
