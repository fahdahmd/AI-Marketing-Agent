"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteProductAction } from "../actions";

export function DeleteProductButton({ productId }: { productId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      className="text-destructive hover:bg-destructive/10"
      disabled={pending}
      onClick={() => {
        if (confirm("Delete this product? This cannot be undone.")) {
          startTransition(() => {
            deleteProductAction(productId);
          });
        }
      }}
    >
      <Trash2 className="mr-2 h-4 w-4" />
      {pending ? "Deleting..." : "Delete product"}
    </Button>
  );
}
