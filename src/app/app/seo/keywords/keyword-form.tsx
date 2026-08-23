"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { generateKeywordsAction, type FormState } from "../actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Generating..." : "Generate ideas"}
    </Button>
  );
}

export function KeywordForm() {
  const [state, formAction] = useFormState<FormState, FormData>(generateKeywordsAction, {});

  return (
    <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1 space-y-2">
        <label htmlFor="topic" className="text-sm font-medium">
          Topic or keyword
        </label>
        <Input id="topic" name="topic" placeholder="e.g. insulated water bottles" required />
      </div>
      <SubmitButton />
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
