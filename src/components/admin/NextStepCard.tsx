/**
 * @file NextStepCard.tsx
 * @description Tarjeta única "Tu siguiente paso" en Inicio (RF-54.3 / RF-54.4).
 * Reutiliza `CompletaTuTienda` cuando la tienda es elegible (caso b), usa colores de marca
 * (índigo + coral CTA con texto `#1E1B4B`), y reserva el borde ámbar solo para productos incompletos.
 */

import { Link } from "@tanstack/react-router";
import { AlertCircle, ArrowRight, Clock, Gift, Plus, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CompletaTuTienda } from "@/components/admin/CompletaTuTienda";
import { cn } from "@/lib/utils";
import type { NextStepResult } from "@/lib/panel-home";
import type { Store } from "@/lib/types";

export interface NextStepCardProps {
  store: Store;
  nextStep: NextStepResult;
}

function getStepIcon(id: NextStepResult["principal"]["id"]) {
  switch (id) {
    case "no-products":
      return Plus;
    case "incomplete-products":
      return AlertCircle;
    case "trial-ending":
      return Clock;
    case "survey":
      return Gift;
    default:
      return Sparkles;
  }
}

export function NextStepCard({ store, nextStep }: NextStepCardProps) {
  const { principal, tambien } = nextStep;

  // Caso (b): CompletaTuTienda ocupa este lugar sin otra tarjeta de paso
  if (principal.id === "completa-tu-tienda") {
    return (
      <div data-testid="next-step-section" data-next-step-id="completa-tu-tienda">
        <CompletaTuTienda store={store} />
      </div>
    );
  }

  const Icon = getStepIcon(principal.id);
  const isWarning = principal.tone === "warning";

  return (
    <section
      data-testid="next-step-section"
      data-next-step-id={principal.id}
      aria-label="Tu siguiente paso"
      className="space-y-2.5"
    >
      <Card
        className={cn(
          "rounded-2xl bg-card shadow-xs overflow-hidden border",
          isWarning
            ? "border-amber-400 dark:border-amber-500/70"
            : "border-dizi-indigo/15 dark:border-dizi-indigo-light/35",
        )}
      >
        <CardContent className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0">
            <div
              className={cn(
                "h-11 w-11 rounded-xl flex items-center justify-center shrink-0",
                isWarning
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                  : "bg-secondary text-brand",
              )}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
            </div>

            <div className="space-y-1 min-w-0">
              <p className="text-[13px] font-semibold uppercase tracking-wide text-brand">
                Tu siguiente paso
              </p>
              <h2 className="font-heading font-semibold text-[20px] sm:text-[24px] leading-snug text-foreground">
                {principal.title}
              </h2>
              <p className="text-[16px] leading-relaxed text-muted-foreground">
                {principal.description}
              </p>
            </div>
          </div>

          <Button
            asChild
            className="rounded-xl bg-primary hover:bg-primary/90 text-dizi-ink font-bold text-[16px] min-h-[48px] px-5 w-full sm:w-auto shrink-0 shadow-xs transition-colors duration-200 motion-reduce:transition-none cursor-pointer"
          >
            <Link to={principal.to}>
              <span>{principal.ctaLabel}</span>
              <ArrowRight className="h-4 w-4 ml-1.5" aria-hidden="true" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      {tambien.length > 0 && (
        <div
          data-testid="next-step-also-pending"
          className="flex flex-wrap items-center gap-x-3 gap-y-1 px-1 text-[13px] text-muted-foreground"
        >
          <span className="font-semibold text-foreground">También pendiente:</span>
          {tambien.map((item, idx) => (
            <span key={item.id} className="inline-flex items-center gap-3">
              <Link
                to={item.to}
                className="font-semibold text-brand hover:underline underline-offset-2"
              >
                {item.label}
              </Link>
              {idx < tambien.length - 1 && (
                <span aria-hidden="true" className="text-muted-foreground/50">
                  ·
                </span>
              )}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
