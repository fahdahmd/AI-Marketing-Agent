"use client";

import { useFormState, useFormStatus } from "react-dom";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { FormState } from "./actions";

const VOICE_OPTIONS = [
  { value: "PROFESSIONAL", label: "Professional" },
  { value: "FRIENDLY", label: "Friendly" },
  { value: "BOLD", label: "Bold" },
  { value: "EDUCATIONAL", label: "Educational" },
  { value: "FUNNY", label: "Funny" },
  { value: "LUXURY", label: "Luxury" },
  { value: "CASUAL", label: "Casual" },
];

export interface BrandFormValues {
  name?: string;
  website?: string | null;
  industry?: string | null;
  description?: string | null;
  targetAudience?: string | null;
  voice?: string;
  customVoiceNotes?: string | null;
  marketingGoals?: string[];
  competitors?: string[];
  logoUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
}

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? pendingLabel : label}
    </Button>
  );
}

export function BrandForm({
  action,
  initial,
  submitLabel,
  pendingLabel,
}: {
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
  initial?: BrandFormValues;
  submitLabel: string;
  pendingLabel: string;
}) {
  const [state, formAction] = useFormState<FormState, FormData>(action, {});

  return (
    <form action={formAction} className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground">Basics</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Brand name</Label>
            <Input id="name" name="name" defaultValue={initial?.name} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input id="website" name="website" type="url" placeholder="https://example.com" defaultValue={initial?.website ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="industry">Industry</Label>
            <Input id="industry" name="industry" placeholder="e.g. Outdoor gear" defaultValue={initial?.industry ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="voice">Brand voice</Label>
            <Select name="voice" defaultValue={initial?.voice ?? "PROFESSIONAL"}>
              <SelectTrigger id="voice">
                <SelectValue placeholder="Select a voice" />
              </SelectTrigger>
              <SelectContent>
                {VOICE_OPTIONS.map((v) => (
                  <SelectItem key={v.value} value={v.value}>
                    {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Radix Select doesn't submit a native form value on its own trigger; mirror it via hidden input */}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" rows={3} defaultValue={initial?.description ?? ""} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground">Audience &amp; goals</h2>
        <div className="space-y-2">
          <Label htmlFor="targetAudience">Target audience</Label>
          <Textarea id="targetAudience" name="targetAudience" rows={2} defaultValue={initial?.targetAudience ?? ""} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="marketingGoals">Marketing goals (comma separated)</Label>
            <Input id="marketingGoals" name="marketingGoals" placeholder="Grow awareness, drive sales" defaultValue={initial?.marketingGoals?.join(", ")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="competitors">Competitors (optional, comma separated)</Label>
            <Input id="competitors" name="competitors" defaultValue={initial?.competitors?.join(", ")} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="customVoiceNotes">Custom brand instructions (optional)</Label>
          <Textarea
            id="customVoiceNotes"
            name="customVoiceNotes"
            rows={2}
            placeholder="Anything else the AI should always know about how you communicate"
            defaultValue={initial?.customVoiceNotes ?? ""}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground">Identity</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2 sm:col-span-1">
            <Label htmlFor="logo">Logo</Label>
            <Input id="logo" name="logo" type="file" accept="image/png,image/jpeg,image/webp" />
            {initial?.logoUrl && (
              <div className="mt-2 flex h-16 w-16 items-center justify-center overflow-hidden rounded-md border bg-muted">
                <Image src={initial.logoUrl} alt="Current logo" width={64} height={64} className="object-cover" />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="primaryColor">Primary color</Label>
            <Input id="primaryColor" name="primaryColor" type="text" placeholder="#4F46E5" defaultValue={initial?.primaryColor ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="secondaryColor">Secondary color</Label>
            <Input id="secondaryColor" name="secondaryColor" type="text" placeholder="#111827" defaultValue={initial?.secondaryColor ?? ""} />
          </div>
        </div>
      </section>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <SubmitButton label={submitLabel} pendingLabel={pendingLabel} />
    </form>
  );
}
