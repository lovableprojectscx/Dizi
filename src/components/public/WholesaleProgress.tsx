import React from "react";
import { Zap, CheckCircle2, Lightbulb } from "lucide-react";
import { Product, Store } from "@/lib/types";
import { getNextTier, getUnitPrice, isWholesaleEligible } from "@/lib/wholesale";
import { cn } from "@/lib/utils";

interface WholesaleProgressProps {
  product: Product;
  totalProductQty: number;
  store: Store;
  className?: string;
}

/**
 * WholesaleProgress - Indicador de progreso y confirmación de precios por mayor en el carrito (RF-42.6).
 * Ajuste Jack: La sugerencia ("Agrega N más") se muestra solo si faltan 3 unidades o menos.
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
    return (
      <div
        className={cn("p-2.5 rounded-xl border text-xs space-y-1.5 transition-colors", className)}
        style={{
          backgroundColor: "color-mix(in srgb, #10b981 8%, var(--card))",
          borderColor: "color-mix(in srgb, #10b981 25%, var(--border))",
        }}
        aria-live="polite"
      >
        <div className="flex items-center justify-between font-extrabold text-emerald-600 dark:text-emerald-400">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Precio x mayor: S/ {unitCalc.unitPrice.toFixed(2)} c/u</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/20">
            {totalProductQty} u.
          </span>
        </div>

        {unitCalc.totalSavings > 0 && (
          <div
            className="flex items-center justify-between text-[11px] font-semibold pt-1 border-t"
            style={{
              color: "var(--foreground)",
              borderColor: "color-mix(in srgb, #10b981 18%, transparent)",
            }}
          >
            <span style={{ color: "var(--muted-foreground)" }}>Ahorraste en este producto:</span>
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
              S/ {unitCalc.totalSavings.toFixed(2)}
            </span>
          </div>
        )}

        {/* Sugerencia a un nivel aún mejor (solo si faltan 3 o menos) */}
        {next && next.shouldShowSuggestion && (
          <div
            className="flex items-center gap-1 text-[10px] pt-1 border-t"
            style={{
              color: "var(--muted-foreground)",
              borderColor: "color-mix(in srgb, #10b981 18%, transparent)",
            }}
          >
            <Lightbulb className="w-3 h-3 text-amber-500 shrink-0" />
            <span>
              Agrega {next.missingUnits} u. más y pagas{" "}
              <b className="font-bold text-emerald-600 dark:text-emerald-400">S/ {next.targetPrice.toFixed(2)} c/u</b>
            </span>
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
        <div className="flex items-center justify-between font-bold" style={{ color: "var(--foreground)" }}>
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--primary)" }} />
            <span>
              Agrega {next.missingUnits} {next.missingUnits === 1 ? "más" : "más"} y pagas{" "}
              <b style={{ color: "var(--primary)" }}>S/ {next.targetPrice.toFixed(2)} c/u</b>
            </span>
          </div>
          <span
            className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md"
            style={{
              color: "var(--primary)",
              backgroundColor: "color-mix(in srgb, var(--primary) 12%, transparent)",
            }}
          >
            {totalProductQty} de {minQty}
          </span>
        </div>

        {/* Barra de progreso con color del tema */}
        <div
          className="w-full h-1.5 rounded-full overflow-hidden"
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
      </div>
    );
  }

  return null;
};
