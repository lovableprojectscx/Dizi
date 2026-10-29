import React from "react";
import { TrendingDown, Info } from "lucide-react";
import { Product, Store } from "@/lib/types";
import { getTiers, isWholesaleEligible } from "@/lib/wholesale";
import { cn } from "@/lib/utils";

interface WholesaleTableProps {
  product: Product;
  store: Store;
  className?: string;
}

/**
 * WholesaleTable - Tabla de precios por mayor mostrada en el modal de detalle del producto (RF-42.4).
 * Accesible (<table className="w-full">), integrada con el tema visual y modo oscuro.
 * Sin etiquetas 'Gamarra Deal' ni 'En Stock' (solicitud Jack).
 */
export const WholesaleTable: React.FC<WholesaleTableProps> = ({ product, store, className }) => {
  if (!isWholesaleEligible(product, store)) return null;

  const tiers = getTiers(product, store);
  if (tiers.length === 0) return null;

  const basePrice = Number(product.price ?? 0);

  return (
    <div
      className={cn("p-3.5 rounded-2xl border space-y-2.5 transition-colors", className)}
      style={{
        backgroundColor: "color-mix(in srgb, var(--primary) 4%, var(--card))",
        borderColor: "color-mix(in srgb, var(--primary) 18%, var(--border))",
      }}
    >
      <div className="flex items-center gap-1.5 text-xs font-extrabold" style={{ color: "var(--foreground)" }}>
        <TrendingDown className="w-4 h-4 shrink-0" style={{ color: "var(--primary)" }} />
        <span>Precios por mayor disponibles</span>
      </div>

      <table className="w-full text-xs text-left border-collapse">
        <thead>
          <tr
            className="text-[10px] font-bold uppercase tracking-wider border-b pb-1"
            style={{
              color: "var(--muted-foreground)",
              borderColor: "color-mix(in srgb, var(--border) 70%, transparent)",
            }}
          >
            <th scope="col" className="py-1.5 font-bold">Cantidad</th>
            <th scope="col" className="py-1.5 font-bold text-center">Precio c/u</th>
            <th scope="col" className="py-1.5 font-bold text-right">Ahorro</th>
          </tr>
        </thead>
        <tbody
          className="divide-y"
          style={{
            borderColor: "color-mix(in srgb, var(--border) 40%, transparent)",
          }}
        >
          {tiers.map((tier) => {
            const savingsPerUnit = basePrice > tier.price ? basePrice - tier.price : 0;
            const savingsPct = basePrice > 0 ? Math.round((savingsPerUnit / basePrice) * 100) : 0;

            return (
              <tr key={tier.min_qty} className="transition-colors hover:bg-black/5 dark:hover:bg-white/5">
                <td className="py-2 font-bold" style={{ color: "var(--foreground)" }}>
                  Desde {tier.min_qty} u.
                </td>
                <td className="py-2 font-black text-center" style={{ color: "var(--primary)" }}>
                  S/ {tier.price.toFixed(2)}
                </td>
                <td className="py-2 text-right">
                  <span className="inline-flex items-center text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    -{savingsPct}% (Ahorras S/ {savingsPerUnit.toFixed(2)})
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <p
        className="text-[10px] leading-tight pt-1 flex items-center gap-1 border-t"
        style={{
          color: "var(--muted-foreground)",
          borderColor: "color-mix(in srgb, var(--border) 50%, transparent)",
        }}
      >
        <Info className="w-3 h-3 shrink-0" style={{ color: "var(--primary)" }} />
        <span>Las tallas y colores de este producto suman juntos en el carrito.</span>
      </p>
    </div>
  );
};
