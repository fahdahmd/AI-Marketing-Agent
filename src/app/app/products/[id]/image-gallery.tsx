"use client";

import { useTransition } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { removeProductImageAction } from "../actions";

interface ProductImageItem {
  id: string;
  url: string;
  isPrimary: boolean;
}

export function ImageGallery({ productId, images }: { productId: string; images: ProductImageItem[] }) {
  const [pending, startTransition] = useTransition();

  if (images.length === 0) {
    return <p className="text-sm text-muted-foreground">No images uploaded yet.</p>;
  }

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
      {images.map((image) => (
        <div key={image.id} className="group relative aspect-square overflow-hidden rounded-md border bg-muted">
          <Image src={image.url} alt="" fill className="object-cover" />
          {image.isPrimary && (
            <span className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
              Primary
            </span>
          )}
          <button
            type="button"
            disabled={pending}
            className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
            onClick={() => startTransition(() => removeProductImageAction(productId, image.id))}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
}
