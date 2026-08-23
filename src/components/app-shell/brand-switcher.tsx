import { ChevronsUpDown, Palette, Plus } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { setActiveBrandAction } from "@/app/app/context-actions";

interface BrandOption {
  id: string;
  name: string;
}

export function BrandSwitcher({
  brands,
  activeBrandId,
}: {
  brands: BrandOption[];
  activeBrandId?: string;
}) {
  const active = brands.find((b) => b.id === activeBrandId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="max-w-[180px] justify-between">
          <span className="flex items-center gap-2 truncate">
            <Palette className="h-4 w-4 shrink-0" />
            <span className="truncate">{active?.name ?? "Select brand"}</span>
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Brands</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {brands.map((b) => (
          <form key={b.id} action={setActiveBrandAction.bind(null, b.id)}>
            <DropdownMenuItem asChild>
              <button type="submit" className="w-full text-left">
                {b.name}
                {b.id === activeBrandId && <span className="ml-auto text-xs text-muted-foreground">Active</span>}
              </button>
            </DropdownMenuItem>
          </form>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/app/brand/new" className="flex items-center">
            <Plus className="mr-2 h-4 w-4" />
            New brand
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
