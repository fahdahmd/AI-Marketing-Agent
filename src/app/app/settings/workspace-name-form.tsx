"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateWorkspaceNameAction, type FormState } from "./actions";

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : "Save"}
    </Button>
  );
}

export function WorkspaceNameForm({ initialName }: { initialName: string }) {
  const [state, formAction] = useFormState<FormState, FormData>(updateWorkspaceNameAction, {});

  return (
    <form action={formAction} className="flex items-end gap-3">
      <div className="flex-1 space-y-2">
        <label htmlFor="name" className="text-sm font-medium">
          Workspace name
        </label>
        <Input id="name" name="name" defaultValue={initialName} required />
      </div>
      <SaveButton />
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
