import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductForm } from "../product-form";
import { createProductAction } from "../actions";

export default function NewProductPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Add a product</h1>
        <p className="text-muted-foreground">The AI uses this information when generating campaigns and content.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Product details</CardTitle>
          <CardDescription>Only the name is required — you can fill in the rest later.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProductForm action={createProductAction} submitLabel="Create product" pendingLabel="Creating..." />
        </CardContent>
      </Card>
    </div>
  );
}
