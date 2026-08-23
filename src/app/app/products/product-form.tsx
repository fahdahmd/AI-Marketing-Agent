"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { FormState } from "./actions";

export interface ProductFormValues {
  name?: string;
  description?: string | null;
  price?: number | string | null;
  currency?: string;
  productUrl?: string | null;
  features?: string[];
  benefits?: string[];
  targetAudience?: string | null;
  keywords?: string[];
  notes?: string | null;
}

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? pendingLabel : label}
    </Button>
  );
}

export function ProductForm({
  action,
  initial,
  submitLabel,
  pendingLabel,
  allowImages = true,
}: {
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
  initial?: ProductFormValues;
  submitLabel: string;
  pendingLabel: string;
  allowImages?: boolean;
}) {
  const [state, formAction] = useFormState<FormState, FormData>(action, {});

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" defaultValue={initial?.name} required />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" rows={3} defaultValue={initial?.description ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="price">Price</Label>
          <Input id="price" name="price" type="number" step="0.01" min="0" defaultValue={initial?.price ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <Input id="currency" name="currency" maxLength={3} defaultValue={initial?.currency ?? "USD"} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="productUrl">Product URL</Label>
          <Input id="productUrl" name="productUrl" type="url" placeholder="https://example.com/product" defaultValue={initial?.productUrl ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="features">Features (comma separated)</Label>
          <Input id="features" name="features" defaultValue={initial?.features?.join(", ")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="benefits">Benefits (comma separated)</Label>
          <Input id="benefits" name="benefits" defaultValue={initial?.benefits?.join(", ")} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="targetAudience">Target audience</Label>
          <Textarea id="targetAudience" name="targetAudience" rows={2} defaultValue={initial?.targetAudience ?? ""} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="keywords">Keywords (comma separated)</Label>
          <Input id="keywords" name="keywords" defaultValue={initial?.keywords?.join(", ")} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="notes">Additional notes</Label>
          <Textarea id="notes" name="notes" rows={2} defaultValue={initial?.notes ?? ""} />
        </div>
        {allowImages && (
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="images">Product images</Label>
            <Input id="images" name="images" type="file" accept="image/png,image/jpeg,image/webp" multiple />
          </div>
        )}
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <SubmitButton label={submitLabel} pendingLabel={pendingLabel} />
    </form>
  );
}
