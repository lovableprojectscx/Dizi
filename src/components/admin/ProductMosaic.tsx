/**
 * @file ProductMosaic.tsx
 * @description Mosaico de hasta 4 fotos reales de productos en la franja de Inicio (RF-54.2).
 * Se adapta a 1, 2, 3 o 4 fotos sin huecos vacíos, y muestra estado vacío cuando hay 0 fotos.
 */

import { ImageIcon } from "lucide-react";
import { toSupabaseUrl } from "@/lib/image-utils";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/types";

export interface ProductMosaicProps {
  products: Product[];
}

export function ProductMosaic({ products }: ProductMosaicProps) {
  const items = products.slice(0, 4);

  if (items.length === 0) {
    return (
      <div
        data-testid="product-mosaic-empty"
        className="rounded-xl border border-dashed border-dizi-cream/35 bg-dizi-cream/10 px-4 py-6 flex flex-col items-center justify-center text-center gap-2 min-h-[112px] lg:min-h-[180px]"
      >
        <div className="h-9 w-9 rounded-lg bg-dizi-cream/15 flex items-center justify-center text-dizi-cream">
          <ImageIcon className="h-5 w-5" aria-hidden="true" />
        </div>
        <p className="text-[13px] font-medium text-dizi-cream/90">
          Aquí aparecerán tus productos
        </p>
      </div>
    );
  }

  const gridColsClass =
    items.length === 1
      ? "grid-cols-1 max-w-[160px] lg:max-w-none"
      : items.length === 2
        ? "grid-cols-2"
        : items.length === 3
          ? "grid-cols-3"
          : "grid-cols-4 lg:grid-cols-2";

  return (
    <div
      data-testid="product-mosaic"
      className={cn("grid gap-2", gridColsClass)}
    >
      {items.map((product) => {
        const src = toSupabaseUrl(product.image) || product.image;
        return (
          <div
            key={product.id}
            data-testid="product-mosaic-item"
            data-product-id={product.id}
            className="aspect-square rounded-xl overflow-hidden bg-dizi-cream/15 border border-dizi-cream/20"
          >
            <img
              src={src}
              alt={product.name}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>
        );
      })}
    </div>
  );
}
