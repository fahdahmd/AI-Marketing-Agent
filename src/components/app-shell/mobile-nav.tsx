"use client";

import { useState } from "react";
import { Menu, Sparkles } from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { NavLinks } from "./nav-links";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 md:hidden" />
        <DialogPrimitive.Content className="fixed inset-y-0 left-0 z-50 flex h-full w-64 flex-col border-r bg-background md:hidden">
          <div className="flex h-16 items-center gap-2 border-b px-6">
            <Sparkles className="h-5 w-5 text-primary" />
            <DialogPrimitive.Title asChild>
              <span className="font-bold tracking-tight">AI Marketing Agent</span>
            </DialogPrimitive.Title>
          </div>
          <NavLinks onNavigate={() => setOpen(false)} />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
