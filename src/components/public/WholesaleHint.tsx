import React from "react";
import { Tag } from "lucide-react";
import { Product, Store } from "@/lib/types";
import { isWholesaleEligible } from "@/lib/wholesale";
import { cn } from "@/lib/utils";

interface WholesaleHintProps {
  product: Product;
  store: Store;
  className?: string;
  variant?: "pill" | "overlay";
}

/**
 * WholesaleHint - Etiqueta indicadora de precio por mayor en las tarjetas del catálogo (RF-42.5).
 * Se adapta automáticamente al color de marca (var(--primary)) y a fondos oscuros o claros.
 */
export const WholesaleHint: React.FC<WholesaleHintProps> = ({ product, store, className, variant = "pill" }) => {
  if (!isWholesaleEligible(product, store)) return null;

  if (variant === "overlay") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 text-[10px] font-bold text-white/95 bg-black/40 backdrop-blur-xs px-1.5 py-0.5 rounded-md border border-white/20 shadow-xs",
          className,
        )}
      >
        <Tag className="w-2.5 h-2.5 opacity-90 shrink-0" />
        <span>Precio x mayor</span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md border",
        className,
      )}
      style={{
        color: "var(--primary)",
        backgroundColor: "color-mix(in srgb, var(--primary) 10%, transparent)",
        borderColor: "color-mix(in srgb, var(--primary) 20%, transparent)",
      }}
    >
      <Tag className="w-2.5 h-2.5 shrink-0 opacity-80" />
      <span>Precio x mayor</span>
    </span>
  );
};
