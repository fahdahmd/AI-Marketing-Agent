import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUserId } from "@/lib/session";
import { requireActiveBrand } from "@/lib/require-brand";
import { BrandForm } from "./brand-form";
import { updateBrandAction } from "./actions";

export default async function BrandPage() {
  const userId = await requireUserId();
  const { brand } = await requireActiveBrand(userId);

  const boundAction = updateBrandAction.bind(null, brand.id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Brand</h1>
        <p className="text-muted-foreground">This context is included in every AI generation for {brand.name}.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Brand profile</CardTitle>
          <CardDescription>Update your brand identity, voice, and audience.</CardDescription>
        </CardHeader>
        <CardContent>
          <BrandForm
            action={boundAction}
            initial={{
              name: brand.name,
              website: brand.website,
              industry: brand.industry,
              description: brand.description,
              targetAudience: brand.targetAudience,
              voice: brand.voice,
              customVoiceNotes: brand.customVoiceNotes,
              marketingGoals: brand.marketingGoals,
              competitors: brand.competitors,
              logoUrl: brand.logoUrl,
              primaryColor: brand.primaryColor,
              secondaryColor: brand.secondaryColor,
            }}
            submitLabel="Save changes"
            pendingLabel="Saving..."
          />
        </CardContent>
      </Card>
    </div>
  );
}
