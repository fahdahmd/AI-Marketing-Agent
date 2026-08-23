import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BrandForm } from "../brand-form";
import { createBrandAction } from "../actions";

export default function NewBrandPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tell us about your brand</h1>
        <p className="text-muted-foreground">
          This context is used every time the AI generates a campaign, so the more detail you give, the better the output.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Brand profile</CardTitle>
          <CardDescription>You can edit this anytime from Brand settings.</CardDescription>
        </CardHeader>
        <CardContent>
          <BrandForm action={createBrandAction} submitLabel="Create brand" pendingLabel="Creating..." />
        </CardContent>
      </Card>
    </div>
  );
}
