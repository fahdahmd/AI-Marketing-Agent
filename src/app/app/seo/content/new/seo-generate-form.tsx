"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateSEOContentAction, type FormState } from "../../actions";

const TYPES = [
  { value: "article", label: "SEO article" },
  { value: "product_description", label: "Product description" },
  { value: "landing_page", label: "Landing page copy" },
  { value: "faq", label: "FAQ page" },
];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Generating (10-30s)..." : "Generate"}
    </Button>
  );
}

export function SEOGenerateForm({
  products,
  defaultTopic,
  recommendationId,
}: {
  products: { id: string; name: string }[];
  defaultTopic?: string;
  recommendationId?: string;
}) {
  const [state, formAction] = useFormState<FormState, FormData>(generateSEOContentAction, {});

  return (
    <form action={formAction} className="space-y-4">
      {recommendationId && <input type="hidden" name="recommendationId" value={recommendationId} />}
      <div className="space-y-2">
        <Label htmlFor="type">Content type</Label>
        <Select name="type" defaultValue="article">
          <SelectTrigger id="type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="topic">Topic / primary keyword</Label>
        <Input id="topic" name="topic" defaultValue={defaultTopic} placeholder="e.g. best insulated water bottles" required />
      </div>
      {products.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="productId">Related product (optional)</Label>
          <Select name="productId">
            <SelectTrigger id="productId">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              {products.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <SubmitButton />
    </form>
  );
}
