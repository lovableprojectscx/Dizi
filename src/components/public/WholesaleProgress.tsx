import React from "react";
import { Zap, CheckCircle2, Lightbulb } from "lucide-react";
import { Product, Store } from "@/lib/types";
import { getNextTier, getUnitPrice, isWholesaleEligible } from "@/lib/wholesale";
import { formatPrice } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

interface WholesaleProgressProps {
  product: Product;
  totalProductQty: number;
  store: Store;
  className?: string;
}

/**
 * WholesaleProgress - Indicador de progreso y confirmación de precios por mayor en el carrito (RF-42.6, F42.1).
 * R2: Texto en una línea (máximo 2) y barra debajo a todo el ancho con contador a la derecha.
 * R4: Todos los precios usan formatPrice.
 * Soporta tema dinámico (var(--primary)) y modo oscuro.
 */
export const WholesaleProgress: React.FC<WholesaleProgressProps> = ({
  product,
  totalProductQty,
  store,
  className,
}) => {
  if (!isWholesaleEligible(product, store) || totalProductQty <= 0) {
    return null;
  }

  const unitCalc = getUnitPrice(product, totalProductQty, store);
  const next = getNextTier(product, totalProductQty, store);

  // Si ya se aplicó el precio por mayor
  if (unitCalc.isWholesaleApplied) {
    const formattedPrice = formatPrice(unitCalc.unitPrice);

    return (
      <div
        className={cn("px-2.5 py-2 rounded-xl border text-xs space-y-1.5 transition-colors", className)}
        style={{
          backgroundColor: "color-mix(in srgb, #10b981 8%, var(--card))",
          borderColor: "color-mix(in srgb, #10b981 25%, var(--border))",
        }}
        aria-live="polite"
      >
        <div className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span className="leading-tight">
            Precio x mayor: {formattedPrice} c/u · {totalProductQty} u.
          </span>
        </div>

        {/* Sugerencia a un nivel aún mejor (solo si faltan 3 o menos) */}
        {next && next.shouldShowSuggestion && (
          <div
            className="pt-1.5 border-t space-y-1.5"
            style={{
              borderColor: "color-mix(in srgb, #10b981 18%, transparent)",
            }}
          >
            <div
              className="flex items-center gap-1 text-[11px]"
              style={{ color: "var(--muted-foreground)" }}
            >
              <Lightbulb className="w-3 h-3 text-amber-500 shrink-0" />
              <span className="leading-tight">
                Agrega {next.missingUnits} u. más y pagas{" "}
                <b className="font-bold text-emerald-600 dark:text-emerald-400">
                  {formatPrice(next.targetPrice)} c/u
                </b>
              </span>
            </div>

            {/* Barra a todo el ancho con contador a la derecha */}
            <div className="flex items-center gap-2">
              <div
                className="flex-1 h-1.5 rounded-full overflow-hidden"
                style={{ backgroundColor: "color-mix(in srgb, #10b981 20%, transparent)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-300 bg-emerald-500"
                  style={{
                    width: `${Math.min(Math.round((totalProductQty / next.nextTier.min_qty) * 100), 100)}%`,
                  }}
                />
              </div>
              <span
                className="text-[10px] font-extrabold shrink-0 px-1.5 py-0.5 rounded"
                style={{
                  color: "#059669",
                  backgroundColor: "color-mix(in srgb, #10b981 15%, transparent)",
                }}
              >
                {totalProductQty} de {next.nextTier.min_qty}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Si aún no alcanza el nivel, pero faltan 3 o menos unidades (Ajuste Jack: missingUnits <= 3)
  if (next && next.shouldShowSuggestion) {
    const minQty = next.nextTier.min_qty;
    const progressPct = Math.min(Math.round((totalProductQty / minQty) * 100), 100);

    return (
      <div
        className={cn("p-2.5 rounded-xl border text-xs space-y-1.5 transition-colors", className)}
        style={{
          backgroundColor: "color-mix(in srgb, var(--primary) 6%, var(--card))",
          borderColor: "color-mix(in srgb, var(--primary) 22%, var(--border))",
        }}
        aria-live="polite"
      >
        <div className="flex items-center gap-1.5 font-bold" style={{ color: "var(--foreground)" }}>
          <Zap className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--primary)" }} />
          <span className="leading-tight">
            Agrega {next.missingUnits} {next.missingUnits === 1 ? "más" : "más"} y pagas{" "}
            <b style={{ color: "var(--primary)" }}>{formatPrice(next.targetPrice)} c/u</b>
          </span>
        </div>

        {/* Barra de progreso a todo el ancho con "1 de 3" a la derecha de la barra (R2) */}
        <div className="flex items-center gap-2">
          <div
            className="flex-1 h-1.5 rounded-full overflow-hidden"
            style={{ backgroundColor: "color-mix(in srgb, var(--border) 80%, transparent)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${progressPct}%`,
                backgroundColor: "var(--primary)",
              }}
            />
          </div>
          <span
            className="text-[10px] font-extrabold shrink-0 px-1.5 py-0.5 rounded-md"
            style={{
              color: "var(--primary)",
              backgroundColor: "color-mix(in srgb, var(--primary) 12%, transparent)",
            }}
          >
            {totalProductQty} de {minQty}
          </span>
        </div>
      </div>
    );
  }

  return null;
};
