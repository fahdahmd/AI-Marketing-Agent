"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { saveGoogleSelectionAction, type FormState } from "./google-actions";
import type { GA4Property, SearchConsoleSite } from "@/google/api";

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Saving..." : "Save"}
    </Button>
  );
}

export function GoogleSelectionForm({
  properties,
  sites,
  currentPropertyId,
  currentSiteUrl,
}: {
  properties: GA4Property[];
  sites: SearchConsoleSite[];
  currentPropertyId?: string | null;
  currentSiteUrl?: string | null;
}) {
  const [state, formAction] = useFormState<FormState, FormData>(saveGoogleSelectionAction, {});

  return (
    <form action={formAction} className="space-y-3">
      <div className="space-y-2">
        <Label className="text-xs">Analytics property</Label>
        <Select name="gaPropertyId" defaultValue={currentPropertyId ?? undefined}>
          <SelectTrigger>
            <SelectValue placeholder={properties.length ? "Select a property" : "No properties found"} />
          </SelectTrigger>
          <SelectContent>
            {properties.map((p) => (
              <SelectItem key={p.propertyId} value={p.propertyId}>
                {p.displayName} ({p.accountName})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Search Console site</Label>
        <Select name="searchConsoleSiteUrl" defaultValue={currentSiteUrl ?? undefined}>
          <SelectTrigger>
            <SelectValue placeholder={sites.length ? "Select a site" : "No sites found"} />
          </SelectTrigger>
          <SelectContent>
            {sites.map((s) => (
              <SelectItem key={s.siteUrl} value={s.siteUrl}>
                {s.siteUrl}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {state.error && <p className="text-xs text-destructive">{state.error}</p>}
      {state.success && <p className="text-xs text-emerald-600">{state.success}</p>}
      <SaveButton />
    </form>
  );
}
