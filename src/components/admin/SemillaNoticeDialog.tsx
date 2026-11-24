/**
 * @file SemillaNoticeDialog.tsx
 * @description Ventana informativa de una sola vez (por tienda y fecha S) para avisar
 * a las tiendas en plan gratis efectivo sobre la transición de F57.1.
 */

import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PLANS, type Store } from "@/lib/types";
import type { AppConfigState } from "@/lib/access-state";
import {
  daysUntilSemillaFin,
  formatDayBeforeSemillaFin,
  formatSemillaCountdown,
  formatSemillaFin,
  getSemillaNoticeStorageKey,
  shouldShowSemillaNotice,
} from "@/lib/semilla-notice";

export interface SemillaNoticeDialogProps {
  store: Store | undefined;
  config: AppConfigState;
}

function readSeenFromStorage(storageKey: string | null): boolean {
  if (!storageKey || typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(storageKey) === "1";
  } catch {
    return false;
  }
}

export function SemillaNoticeDialog({ store, config }: SemillaNoticeDialogProps) {
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);

  const eligible = shouldShowSemillaNotice(store, config);
  const fechaFin = formatSemillaFin(config);
  const fechaDiaAnterior = formatDayBeforeSemillaFin(config);
  const daysLeft = daysUntilSemillaFin(config);

  const storageKey =
    store?.id && config.semillaFin
      ? getSemillaNoticeStorageKey(store.id, config.semillaFin)
      : null;

  const alreadySeen = dismissedKey === storageKey || readSeenFromStorage(storageKey);
  const isOpen =
    eligible &&
    Boolean(storageKey) &&
    Boolean(fechaFin) &&
    Boolean(fechaDiaAnterior) &&
    daysLeft !== null &&
    !alreadySeen;

  const handleDismiss = () => {
    if (!storageKey) return;
    try {
      window.localStorage.setItem(storageKey, "1");
    } catch {
      // Ignorar errores si el navegador bloquea localStorage
    }
    setDismissedKey(storageKey);
  };

  if (!isOpen || !fechaFin || !fechaDiaAnterior || daysLeft === null) {
    return null;
  }

  const precioDesde = PLANS.emprendedor.price.toFixed(2);
  const countdownText = formatSemillaCountdown(daysLeft);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          handleDismiss();
        }
      }}
    >
      <DialogContent
        data-testid="semilla-notice-dialog"
        className="w-[calc(100vw-2rem)] max-w-md rounded-2xl p-5 sm:p-6 max-h-[90dvh] overflow-y-auto bg-card text-card-foreground border border-border shadow-2xl gap-4"
      >
        <DialogHeader className="space-y-1 text-left pr-6">
          <DialogTitle className="font-heading font-bold text-xl leading-tight text-foreground">
            Cambia el plan gratis
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Te avisamos con tiempo cómo seguirá funcionando tu catálogo.
          </DialogDescription>
        </DialogHeader>

        {/* Bloque índigo con la fecha S en grande y cuenta regresiva */}
        <div className="rounded-xl bg-dizi-indigo text-dizi-cream px-4 py-3.5 text-center space-y-1">
          <p className="text-xs font-medium text-dizi-cream/80">
            El cambio empieza el
          </p>
          <p
            data-testid="semilla-notice-date"
            className="font-heading font-extrabold text-2xl sm:text-[26px] leading-tight text-dizi-cream"
          >
            {fechaFin}
          </p>
          <div className="pt-0.5">
            <span
              data-testid="semilla-notice-countdown"
              className="inline-flex items-center rounded-full bg-dizi-cream/15 border border-dizi-cream/25 px-3 py-0.5 text-xs font-semibold text-dizi-cream"
            >
              {countdownText}
            </span>
          </div>
        </div>

        {/* 3 pasos simples */}
        <ol className="space-y-2.5 text-sm leading-snug text-foreground">
          <li className="flex items-start gap-2.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-dizi-indigo/10 dark:bg-dizi-indigo-light/20 text-dizi-indigo dark:text-dizi-cream text-xs font-bold mt-0.5">
              1
            </span>
            <span>Hasta el {fechaDiaAnterior} todo sigue igual.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-dizi-indigo/10 dark:bg-dizi-indigo-light/20 text-dizi-indigo dark:text-dizi-cream text-xs font-bold mt-0.5">
              2
            </span>
            <span>El {fechaFin} te regalamos 7 días de Pro.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-dizi-indigo/10 dark:bg-dizi-indigo-light/20 text-dizi-indigo dark:text-dizi-cream text-xs font-bold mt-0.5">
              3
            </span>
            <span>
              Después eliges tu plan desde S/ {precioDesde}. Si no, tu catálogo queda en pausa; no se borra nada.
            </span>
          </li>
        </ol>

        {/* Botones: principal coral (--primary) "Ver planes" y secundario "Entendido" */}
        <div className="flex flex-col gap-2 sm:flex-row-reverse pt-1">
          <Button
            asChild
            data-testid="semilla-notice-ver-planes"
            className="h-11 w-full sm:flex-1 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm"
          >
            <Link to="/admin/plan" onClick={handleDismiss}>
              Ver planes
            </Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            data-testid="semilla-notice-entendido"
            onClick={handleDismiss}
            className="h-11 w-full sm:flex-1 rounded-xl font-semibold text-sm"
          >
            Entendido
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
