"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { updateSEOContentAction, type FormState } from "../../actions";

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : "Save changes"}
    </Button>
  );
}

export function SEOEditForm({
  contentId,
  initial,
}: {
  contentId: string;
  initial: { seoTitle: string | null; metaTitle: string | null; metaDescription: string | null; article: string | null };
}) {
  const boundAction = updateSEOContentAction.bind(null, contentId);
  const [state, formAction] = useFormState<FormState, FormData>(boundAction, {});

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="seoTitle">SEO title</Label>
        <Input id="seoTitle" name="seoTitle" defaultValue={initial.seoTitle ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="metaTitle">Meta title</Label>
        <Input id="metaTitle" name="metaTitle" defaultValue={initial.metaTitle ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="metaDescription">Meta description</Label>
        <Textarea id="metaDescription" name="metaDescription" rows={2} defaultValue={initial.metaDescription ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="article">Article (markdown)</Label>
        <Textarea id="article" name="article" rows={16} defaultValue={initial.article ?? ""} className="font-mono text-xs" />
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.success && <p className="text-sm text-emerald-600">{state.success}</p>}
      <SaveButton />
    </form>
  );
}
