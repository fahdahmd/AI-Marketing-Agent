import Link from "next/link";
import Image from "next/image";
import { Plus, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUserId } from "@/lib/session";
import { requireActiveBrand } from "@/lib/require-brand";
import { listProductsForBrand } from "@/server/services/product.service";
import { formatCurrency } from "@/lib/utils";

export default async function ProductsPage() {
  const userId = await requireUserId();
  const { brand } = await requireActiveBrand(userId);
  const products = await listProductsForBrand(brand.id, userId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">What the AI promotes when it builds campaigns for {brand.name}.</p>
        </div>
        <Button asChild>
          <Link href="/app/products/new">
            <Plus className="mr-2 h-4 w-4" />
            Add product
          </Link>
        </Button>
      </div>

      {products.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Package className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="font-medium">No products yet</p>
              <p className="text-sm text-muted-foreground">Add a product or service so the AI knows what to market.</p>
            </div>
            <Button asChild>
              <Link href="/app/products/new">Add your first product</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => {
            const primary = product.images.find((i) => i.isPrimary) ?? product.images[0];
            return (
              <Link key={product.id} href={`/app/products/${product.id}`}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <div className="flex h-36 items-center justify-center overflow-hidden rounded-t-lg bg-muted">
                    {primary ? (
                      <Image src={primary.url} alt={product.name} width={300} height={144} className="h-36 w-full object-cover" />
                    ) : (
                      <Package className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <CardHeader>
                    <CardTitle className="line-clamp-1 text-base">{product.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="line-clamp-2 text-sm text-muted-foreground">
                    {product.description || "No description yet."}
                  </CardContent>
                  {product.price != null && (
                    <CardFooter className="text-sm font-medium">
                      {formatCurrency(Number(product.price) * 100, product.currency)}
                    </CardFooter>
                  )}
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
