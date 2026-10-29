import React, { useState } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2, Calculator, AlertTriangle, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProductVariation, WholesaleTier } from "@/lib/types";
import { hasDisparateVariationPrices, validateTiers } from "@/lib/wholesale";

interface WholesaleEditorProps {
  tiers: WholesaleTier[];
  onChange: (newTiers: WholesaleTier[]) => void;
  productPrice: number | null | undefined;
  variations?: ProductVariation[];
  disabled?: boolean;
}

/**
 * WholesaleEditor - Sección de configuración de precios por mayor en el formulario de producto (RF-42.2).
 * Ajustes Jack:
 * - Precios con punto "." (ej: 28.00).
 * - Etiquetas limpias: "Nivel 1", "Nivel 2", "Nivel 3" (sin "(Docena)").
 * - Simulador interactivo en tiempo real.
 * - Deshabilitado con explicación si existen variaciones con precios diferentes (E8).
 */
export const WholesaleEditor: React.FC<WholesaleEditorProps> = ({
  tiers,
  onChange,
  productPrice,
  variations = [],
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(tiers.length > 0);
  const [simQty, setSimQty] = useState<number>(3);

  const basePrice = productPrice !== null && productPrice !== undefined ? Number(productPrice) : null;
  const isInvalidBasePrice = basePrice === null || isNaN(basePrice) || basePrice <= 0;

  // Escenario 8: Variaciones con precios distintos
  const hasDifferentVarPrices = variations.some(
    (v) => v.price !== null && v.price !== undefined && Number(v.price) !== basePrice,
  );

  const validation = validateTiers(tiers, basePrice, variations);

  const handleAddTier = () => {
    if (tiers.length >= 3) return;
    const lastTier = tiers[tiers.length - 1];
    const nextQty = lastTier ? Number(lastTier.min_qty) + 3 : 3;
    const nextPrice = lastTier
      ? Math.max(1, Number((lastTier.price * 0.9).toFixed(2)))
      : basePrice
        ? Math.max(1, Number((basePrice * 0.85).toFixed(2)))
        : 10;

    const newTiers = [...tiers, { min_qty: nextQty, price: nextPrice }];
    onChange(newTiers);
  };

  const handleRemoveTier = (index: number) => {
    const newTiers = tiers.filter((_, i) => i !== index);
    onChange(newTiers);
  };

  const handleTierChange = (index: number, field: "min_qty" | "price", rawValue: string) => {
    const updated = tiers.map((tier, i) => {
      if (i !== index) return tier;

      if (field === "min_qty") {
        const cleanInt = parseInt(rawValue.replace(/[^0-9]/g, ""), 10);
        return {
          ...tier,
          min_qty: isNaN(cleanInt) ? 0 : cleanInt,
        };
      } else {
        // Precios con punto decimal
        const cleanPriceStr = rawValue.replace(",", ".").replace(/[^0-9.]/g, "");
        // Evitar múltiples puntos
        const parts = cleanPriceStr.split(".");
        const sanitized = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join("")}` : cleanPriceStr;
        const num = sanitized === "" ? 0 : parseFloat(sanitized);

        return {
          ...tier,
          price: isNaN(num) ? 0 : num,
        };
      }
    });

    onChange(updated);
  };

  // Cálculo para el simulador rápido
  const sortedTiers = [...tiers].sort((a, b) => a.min_qty - b.min_qty);
  let simAppliedTier: WholesaleTier | null = null;
  for (const t of sortedTiers) {
    if (simQty >= t.min_qty && (!simAppliedTier || t.price < simAppliedTier.price)) {
      simAppliedTier = t;
    }
  }

  const simUnitPrice = simAppliedTier && basePrice && simAppliedTier.price < basePrice ? simAppliedTier.price : basePrice || 0;
  const simTotal = simUnitPrice * simQty;
  const simSavings = basePrice && basePrice > simUnitPrice ? (basePrice - simUnitPrice) * simQty : 0;
  const simSavingsPct = basePrice && basePrice > 0 ? Math.round(((basePrice - simUnitPrice) / basePrice) * 100) : 0;

  return (
    <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800/80 space-y-3">
      {/* Cabecera plegable */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between text-left group cursor-pointer select-none"
      >
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
            %
          </div>
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/90 flex items-center gap-1.5 cursor-pointer">
              Precio por Mayor (Escala por volumen)
              {tiers.length > 0 && (
                <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                  {tiers.length} {tiers.length === 1 ? "nivel" : "niveles"}
                </span>
              )}
            </Label>
            <p className="text-[10px] text-muted-foreground">
              Define precios especiales para clientes que compran por cantidad (1 a 3 niveles).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-slate-400 group-hover:text-slate-600">
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {/* Contenido desplegado */}
      {isOpen && (
        <div className="space-y-4 pt-1">
          {/* Bloqueo si variaciones tienen precios distintos (Escenario 8) */}
          {hasDifferentVarPrices ? (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-200 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" />
                <span>Precios por mayor deshabilitados para este producto</span>
              </div>
              <p className="text-[11px] leading-relaxed opacity-90">
                Este producto tiene variaciones con precios individuales distintos. Para activar precios por mayor,
                todas las opciones deben compartir el mismo precio base.
              </p>
            </div>
          ) : isInvalidBasePrice ? (
            <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-muted-foreground">
              Ingresa primero un precio regular para este producto para poder configurar precios por mayor.
            </div>
          ) : (
            <div className="space-y-3">
              {/* Lista de niveles */}
              {tiers.length === 0 ? (
                <div className="p-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-2">
                  <p className="text-xs text-muted-foreground">No has configurado ningún nivel para este producto.</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddTier}
                    disabled={disabled}
                    className="h-8 text-xs font-bold gap-1.5 rounded-xl border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                  >
                    <Plus className="h-3.5 w-3.5" /> Configurar Primer Nivel
                  </Button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {tiers.map((tier, idx) => {
                    const savingsPerUnit = basePrice && basePrice > tier.price ? basePrice - tier.price : 0;
                    const savingsPct = basePrice && basePrice > 0 ? Math.round((savingsPerUnit / basePrice) * 100) : 0;

                    return (
                      <div
                        key={idx}
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-black">
                              {idx + 1}
                            </span>
                            Nivel {idx + 1}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleRemoveTier(idx)}
                            className="text-xs text-muted-foreground hover:text-red-500 transition-colors p-1"
                            title="Eliminar nivel"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <Label className="text-[10px] font-bold text-muted-foreground block mb-1">
                              A partir de (unidades):
                            </Label>
                            <Input
                              type="number"
                              min={2}
                              value={tier.min_qty || ""}
                              onChange={(e) => handleTierChange(idx, "min_qty", e.target.value)}
                              placeholder="Ej: 3"
                              className="h-8 text-xs font-bold"
                            />
                          </div>

                          <div>
                            <Label className="text-[10px] font-bold text-muted-foreground block mb-1">
                              Precio c/u (con punto):
                            </Label>
                            <div className="relative">
                              <span className="absolute left-2.5 top-2 text-xs text-muted-foreground font-bold select-none">
                                S/
                              </span>
                              <Input
                                type="text"
                                inputMode="decimal"
                                value={tier.price !== undefined && tier.price !== null ? tier.price.toString() : ""}
                                onChange={(e) => handleTierChange(idx, "price", e.target.value)}
                                placeholder="0.00"
                                className="pl-7 h-8 text-xs font-bold text-indigo-600 dark:text-indigo-400"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Ahorro calculado */}
                        <div className="flex items-center justify-between text-[11px] pt-0.5">
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                            {savingsPct > 0
                              ? `Ahorro: -${savingsPct}% (S/ ${savingsPerUnit.toFixed(2)} c/u)`
                              : "Sin ahorro frente al precio base"}
                          </span>
                          <span className="text-muted-foreground text-[10px]">Pedidos ≥ {tier.min_qty} u.</span>
                        </div>
                      </div>
                    );
                  })}

                  {tiers.length < 3 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddTier}
                      disabled={disabled}
                      className="w-full h-8 text-xs font-bold gap-1 rounded-xl border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-400 text-indigo-600 dark:text-indigo-400"
                    >
                      <Plus className="h-3 w-3" /> Agregar Nivel {tiers.length + 1}
                    </Button>
                  )}
                </div>
              )}

              {/* Mensaje de validación si hay error */}
              {!validation.valid && (
                <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 flex items-start gap-2 text-xs text-red-600 dark:text-red-400 font-medium">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{validation.error}</span>
                </div>
              )}

              {/* SIMULADOR EN VIVO PARA EL COMERCIANTE (RF-42.2) */}
              {tiers.length > 0 && validation.valid && (
                <div className="p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/50 dark:bg-indigo-950/20 space-y-2">
                  <div className="flex items-center justify-between text-xs font-extrabold text-indigo-950 dark:text-indigo-200">
                    <span className="flex items-center gap-1.5">
                      <Calculator className="h-3.5 w-3.5 text-indigo-600" />
                      Simulador para el cliente
                    </span>
                    <span className="text-[10px] text-muted-foreground">Prueba rápida</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Si te piden:</span>
                    <input
                      type="number"
                      min={1}
                      max={999}
                      value={simQty}
                      onChange={(e) => setSimQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-14 h-7 text-center text-xs font-bold rounded-lg border bg-white dark:bg-slate-900"
                    />
                    <span className="text-xs text-muted-foreground">unidades →</span>
                    <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
                      S/ {simUnitPrice.toFixed(2)} c/u
                    </span>
                  </div>

                  <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border text-xs space-y-0.5">
                    <div className="flex justify-between font-bold text-slate-800 dark:text-slate-200">
                      <span>Total a cobrar por WhatsApp:</span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-black">
                        S/ {simTotal.toFixed(2)}
                      </span>
                    </div>
                    {simSavings > 0 && (
                      <div className="flex justify-between text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        <span>Ahorro del cliente:</span>
                        <span>
                          S/ {simSavings.toFixed(2)} (-{simSavingsPct}%)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
