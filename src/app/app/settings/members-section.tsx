"use client";

import { useTransition } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { addMemberAction, removeMemberAction, type FormState } from "./actions";

interface MemberItem {
  id: string;
  role: string;
  name: string | null;
  email: string;
}

function AddButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Adding..." : "Add"}
    </Button>
  );
}

function RemoveMemberButton({ memberId }: { memberId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      className="text-muted-foreground hover:text-destructive"
      onClick={() => startTransition(() => removeMemberAction(memberId))}
    >
      <X className="h-4 w-4" />
    </button>
  );
}

export function MembersSection({ members, isOwner }: { members: MemberItem[]; isOwner: boolean }) {
  const [state, formAction] = useFormState<FormState, FormData>(addMemberAction, {});

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {members.map((m) => (
          <div key={m.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
            <div>
              <p className="font-medium">{m.name || m.email}</p>
              <p className="text-xs text-muted-foreground">{m.email}</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={m.role === "OWNER" ? "default" : "outline"}>{m.role}</Badge>
              {isOwner && m.role !== "OWNER" && <RemoveMemberButton memberId={m.id} />}
            </div>
          </div>
        ))}
      </div>

      {isOwner && (
        <form action={formAction} className="flex items-end gap-3">
          <div className="flex-1 space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Add member by email
            </label>
            <Input id="email" name="email" type="email" placeholder="teammate@company.com" required />
            <p className="text-xs text-muted-foreground">They need an existing account with this email.</p>
          </div>
          <AddButton />
        </form>
      )}
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.success && <p className="text-sm text-emerald-600">{state.success}</p>}
    </div>
  );
}
