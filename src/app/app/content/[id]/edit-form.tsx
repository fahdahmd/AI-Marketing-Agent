"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { Platform } from "@prisma/client";
import { updateContentAction, type FormState } from "../actions";

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" disabled={pending}>
      {pending ? "Saving..." : "Save changes"}
    </Button>
  );
}

export function ContentEditForm({
  contentId,
  platform,
  initial,
}: {
  contentId: string;
  platform: Platform;
  initial: {
    headline: string | null;
    hook: string | null;
    caption: string | null;
    body: string | null;
    cta: string | null;
    hashtags: string[];
    imagePrompt: string | null;
  };
}) {
  const boundAction = updateContentAction.bind(null, contentId);
  const [state, formAction] = useFormState<FormState, FormData>(boundAction, {});

  return (
    <form action={formAction} className="space-y-4">
      {platform === "LINKEDIN" && (
        <>
          <div className="space-y-2">
            <Label htmlFor="hook">Hook</Label>
            <Textarea id="hook" name="hook" rows={2} defaultValue={initial.hook ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="body">Post</Label>
            <Textarea id="body" name="body" rows={6} defaultValue={initial.body ?? ""} />
          </div>
        </>
      )}

      {(platform === "INSTAGRAM" || platform === "X") && (
        <div className="space-y-2">
          <Label htmlFor="hook">Hook</Label>
          <Textarea id="hook" name="hook" rows={2} defaultValue={initial.hook ?? ""} />
        </div>
      )}

      {platform !== "LINKEDIN" && (
        <div className="space-y-2">
          <Label htmlFor="caption">{platform === "X" ? "Post" : "Caption"}</Label>
          <Textarea id="caption" name="caption" rows={5} defaultValue={initial.caption ?? ""} />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="cta">Call to action</Label>
        <Input id="cta" name="cta" defaultValue={initial.cta ?? ""} />
      </div>

      {platform === "INSTAGRAM" && (
        <div className="space-y-2">
          <Label htmlFor="hashtags">Hashtags (comma separated)</Label>
          <Input id="hashtags" name="hashtags" defaultValue={initial.hashtags.join(", ")} />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="imagePrompt">Image prompt (creative direction)</Label>
        <Textarea id="imagePrompt" name="imagePrompt" rows={2} defaultValue={initial.imagePrompt ?? ""} />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.success && <p className="text-sm text-emerald-600">{state.success}</p>}
      <SaveButton />
    </form>
  );
}
