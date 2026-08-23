"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createCampaignAction, type FormState } from "./actions";

const PROMOTION_TYPES = [
  { value: "PRODUCT", label: "Product" },
  { value: "SERVICE", label: "Service" },
  { value: "BRAND", label: "Brand" },
  { value: "WEBSITE", label: "Website" },
  { value: "CUSTOM", label: "Custom" },
];

const OBJECTIVES = [
  { value: "AWARENESS", label: "Awareness" },
  { value: "ENGAGEMENT", label: "Engagement" },
  { value: "WEBSITE_TRAFFIC", label: "Website traffic" },
  { value: "LEADS", label: "Leads" },
  { value: "SALES", label: "Sales" },
  { value: "PRODUCT_LAUNCH", label: "Product launch" },
  { value: "PROMOTION", label: "Promotion" },
  { value: "RETARGETING", label: "Retargeting" },
];

const PLATFORMS = [
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "FACEBOOK", label: "Facebook" },
  { value: "LINKEDIN", label: "LinkedIn" },
  { value: "X", label: "X" },
];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto">
      <Sparkles className="mr-2 h-4 w-4" />
      {pending ? "Generating your campaign..." : "Generate campaign"}
    </Button>
  );
}

export function CampaignForm({ products }: { products: { id: string; name: string }[] }) {
  const [state, formAction] = useFormState<FormState, FormData>(createCampaignAction, {});
  const [promotionType, setPromotionType] = useState("PRODUCT");
  const [platforms, setPlatforms] = useState<string[]>(["INSTAGRAM", "FACEBOOK"]);

  return (
    <form action={formAction} className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground">What are you promoting?</h2>
        <div className="space-y-2">
          <Label htmlFor="name">Campaign name</Label>
          <Input id="name" name="name" placeholder="Summer launch push" required />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="promotionType">Promoting</Label>
            <Select name="promotionType" value={promotionType} onValueChange={setPromotionType}>
              <SelectTrigger id="promotionType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROMOTION_TYPES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {promotionType === "PRODUCT" && (
            <div className="space-y-2">
              <Label htmlFor="productId">Product</Label>
              <Select name="productId">
                <SelectTrigger id="productId">
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {products.length === 0 && (
                    <div className="px-3 py-2 text-sm text-muted-foreground">No products yet</div>
                  )}
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="objective">Objective</Label>
          <Select name="objective" defaultValue="AWARENESS">
            <SelectTrigger id="objective">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OBJECTIVES.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground">Marketing idea</h2>
        <div className="space-y-2">
          <Label htmlFor="idea">Describe what you want</Label>
          <Textarea
            id="idea"
            name="idea"
            rows={4}
            required
            placeholder="Create an energetic advertisement for our new fitness bottle. Emphasize that it keeps water cold for 24 hours."
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="targetAudience">Target audience (optional override)</Label>
            <Input id="targetAudience" name="targetAudience" placeholder="Leave blank to use brand default" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tone">Tone (optional override)</Label>
            <Input id="tone" name="tone" placeholder="e.g. energetic, playful" />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground">Platforms</h2>
        <div className="flex flex-wrap gap-3">
          {PLATFORMS.map((p) => {
            const checked = platforms.includes(p.value);
            return (
              <label
                key={p.value}
                className={`cursor-pointer rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
                  checked ? "border-primary bg-primary text-primary-foreground" : "border-input hover:bg-accent"
                }`}
              >
                <input
                  type="checkbox"
                  name="platforms"
                  value={p.value}
                  checked={checked}
                  className="sr-only"
                  onChange={(e) => {
                    setPlatforms((prev) => (e.target.checked ? [...prev, p.value] : prev.filter((v) => v !== p.value)));
                  }}
                />
                {p.label}
              </label>
            );
          })}
        </div>
      </section>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <SubmitButton />
    </form>
  );
}
