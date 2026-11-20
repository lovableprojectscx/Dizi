/**
 * @file PanelHero.tsx
 * @description Franja índigo reutilizable de bienvenida/cabecera para Inicio y Promociona (F54).
 * Usa exclusivamente tokens de marca (`bg-dizi-indigo`, `text-dizi-cream`, `dark:border-dizi-indigo-light/40`)
 * garantizando contraste AAA (10,69:1) tanto en modo claro como en modo oscuro (RNF-54.3 / RNF-54.4).
 */

import React from "react";
import { cn } from "@/lib/utils";

export interface PanelHeroProps {
  /** Parte inicial del título en tono suavizado (ej. "Hola,"). Opcional. */
  titleLead?: string;
  /** Parte principal del título en crema sólido (Sora Bold). */
  title: string;
  /** Subtítulo opcional en Inter 16 px. */
  subtitle?: string;
  /** Etiqueta de estado o plan en 13 px (ej. "Plan Semilla" o "Prueba · quedan 2 días"). */
  badge?: string;
  /** Acción secundaria dentro de la franja (ej. "Ver mi catálogo"). */
  action?: React.ReactNode;
  /** Contenido lateral derecho en escritorio / inferior en móvil (ej. ProductMosaic). */
  rightSlot?: React.ReactNode;
  className?: string;
}

export function PanelHero({
  titleLead,
  title,
  subtitle,
  badge,
  action,
  rightSlot,
  className,
}: PanelHeroProps) {
  return (
    <section
      data-testid="panel-hero"
      className={cn(
        "rounded-2xl bg-dizi-indigo text-dizi-cream p-5 sm:p-7 shadow-sm border border-transparent dark:border-dizi-indigo-light/40 overflow-hidden",
        className,
      )}
    >
      <div
        className={cn(
          "flex flex-col gap-5",
          rightSlot && "lg:flex-row lg:items-center lg:justify-between lg:gap-8",
        )}
      >
        <div className="min-w-0 flex-1 space-y-3">
          {badge && (
            <span
              data-testid="panel-hero-badge"
              className="inline-flex items-center rounded-full bg-dizi-cream/15 border border-dizi-cream/25 px-3 py-1 text-[13px] font-semibold text-dizi-cream leading-none"
            >
              {badge}
            </span>
          )}

          <h1 className="font-heading font-bold text-[26px] sm:text-[32px] leading-[1.15] tracking-tight text-dizi-cream break-words">
            {titleLead ? (
              <>
                <span className="text-dizi-cream/80">{titleLead} </span>
                <span>{title}</span>
              </>
            ) : (
              title
            )}
          </h1>

          {subtitle && (
            <p className="text-[16px] leading-relaxed text-dizi-cream/90 max-w-xl">
              {subtitle}
            </p>
          )}

          {action && <div className="pt-1 hidden lg:block">{action}</div>}
        </div>

        {rightSlot && (
          <div className="w-full lg:w-[232px] xl:w-[248px] shrink-0">{rightSlot}</div>
        )}

        {action && <div className="lg:hidden">{action}</div>}
      </div>
    </section>
  );
}
