import { Sparkles } from "lucide-react";
import { NavLinks } from "./nav-links";

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r bg-card/50 md:flex">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <Sparkles className="h-5 w-5 text-primary" />
        <span className="font-bold tracking-tight">AI Marketing Agent</span>
      </div>
      <NavLinks />
    </aside>
  );
}
