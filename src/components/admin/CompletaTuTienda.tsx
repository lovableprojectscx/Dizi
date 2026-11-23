/**
 * @file CompletaTuTienda.tsx
 * @description Tarjeta de progreso inicial en Inicio (/admin/dashboard) para tiendas creadas
 * a partir de F49 (RF-49.8). Reemplaza al antiguo modal OnboardingWizard con 5 tareas
 * cuyo estado se calcula desde la tienda real.
 */

import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, Circle, Sparkles, X, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Store } from "@/lib/types";
import { getRubroDefaults } from "@/lib/rubros";
import { getGrantedRewards } from "@/lib/trial-rewards";

/**
 * Fecha de corte del despliegue de F49: tiendas creadas antes de este instante
 * no ven la tarjeta "Completa tu tienda" (RNF-49.1 y decisión de Jack).
 */
export const F49_COMPLETA_TU_TIENDA_CUTOFF = "2026-11-17T23:00:00.000Z";

const DISMISSED_KEY_PREFIX = "dizi_completa_tu_tienda_dismissed_";
const DESIGN_CONFIRMED_KEY_PREFIX = "dizi_design_confirmed_";

export function isStoreEligibleForCompletaTuTienda(
  store: Pick<Store, "createdAt"> | null | undefined,
): boolean {
  if (!store?.createdAt) return false;
  const createdMs = new Date(store.createdAt).getTime();
  const cutoffMs = new Date(F49_COMPLETA_TU_TIENDA_CUTOFF).getTime();
  if (Number.isNaN(createdMs) || Number.isNaN(cutoffMs)) return false;
  return createdMs >= cutoffMs;
}

export function isDesignConfirmed(storeId: string): boolean {
  if (typeof window === "undefined" || !storeId) return false;
  try {
    return window.localStorage.getItem(`${DESIGN_CONFIRMED_KEY_PREFIX}${storeId}`) === "1";
  } catch {
    return false;
  }
}

export function markDesignConfirmed(storeId: string): void {
  if (typeof window === "undefined" || !storeId) return;
  try {
    window.localStorage.setItem(`${DESIGN_CONFIRMED_KEY_PREFIX}${storeId}`, "1");
  } catch {
    // Silencioso sin localStorage
  }
}

export function isCompletaTuTiendaDismissed(storeId: string): boolean {
  if (typeof window === "undefined" || !storeId) return false;
  try {
    return window.localStorage.getItem(`${DISMISSED_KEY_PREFIX}${storeId}`) === "1";
  } catch {
    return false;
  }
}

export function dismissCompletaTuTienda(storeId: string): void {
  if (typeof window === "undefined" || !storeId) return;
  try {
    window.localStorage.setItem(`${DISMISSED_KEY_PREFIX}${storeId}`, "1");
  } catch {
    // Silencioso sin localStorage
  }
}

export interface CompletaTask {
  id: "logo" | "portada" | "diseno" | "bio" | "productos";
  label: string;
  done: boolean;
  to: string;
  detail?: string;
  reward?: string;
  rewardEarned?: boolean;
}

export function getCompletaTuTiendaTasks(
  store: Store,
  designConfirmed = false,
  grantedRewards?: { productos_3?: boolean; marca?: boolean; compartir?: boolean },
): CompletaTask[] {
  const defaults = getRubroDefaults(store.niche);
  const realProductsCount = (store.products || []).filter((p) => !p.isSample).length;

  const hasLogo = Boolean(store.logo && store.logo.trim().length > 0);
  const hasPortada = Boolean(
    (store.banners && store.banners.length > 0) ||
      (store.bannerImage && store.bannerImage.trim().length > 0) ||
      (store.bannerTagline && store.bannerTagline.trim().length > 0) ||
      (store.bannerTitle && store.bannerTitle.trim().length > 0),
  );
  const hasDesign =
    designConfirmed || (Boolean(store.model) && store.model !== defaults.model);
  const hasBio = Boolean(store.bioLinksEnabled);
  const hasThreeProducts = realProductsCount >= 3;
  const isTrial = store.subscriptionStatus === "trial";

  const marcaEarned = Boolean(grantedRewards?.marca) || (hasLogo && hasPortada);
  const productosEarned = Boolean(grantedRewards?.productos_3) || hasThreeProducts;

  return [
    {
      id: "logo",
      label: "Sube el logo de tu negocio",
      done: hasLogo,
      to: "/admin/configuracion",
    },
    {
      id: "portada",
      label: "Agrega portada o eslogan",
      done: hasPortada,
      to: "/admin/diseno",
      reward: isTrial ? "logo + portada: +2 días" : undefined,
      rewardEarned: marcaEarned,
    },
    {
      id: "diseno",
      label: "Personaliza o confirma tu diseño",
      done: hasDesign,
      to: "/admin/diseno",
    },
    {
      id: "bio",
      label: "Activa tu Link en Bio",
      done: hasBio,
      to: "/admin/link-bio",
    },
    {
      id: "productos",
      label: "Publica al menos 3 productos",
      detail: `${Math.min(realProductsCount, 3)}/3`,
      done: hasThreeProducts,
      to: "/admin/productos",
      reward: isTrial ? "+3 días" : undefined,
      rewardEarned: productosEarned,
    },
  ];
}

export function CompletaTuTienda({ store }: { store: Store }) {
  const [dismissed, setDismissed] = useState(() => isCompletaTuTiendaDismissed(store.id));
  const [designConfirmed, setDesignConfirmed] = useState(() => isDesignConfirmed(store.id));
  const [grantedRewards, setGrantedRewards] = useState<{
    productos_3?: boolean;
    marca?: boolean;
    compartir?: boolean;
  }>({});

  useEffect(() => {
    setDismissed(isCompletaTuTiendaDismissed(store.id));
    setDesignConfirmed(isDesignConfirmed(store.id));
  }, [store.id]);

  useEffect(() => {
    if (store?.id && store.subscriptionStatus === "trial") {
      getGrantedRewards(store.id).then((rewards) => {
        setGrantedRewards(rewards);
      });
    }
  }, [store?.id, store?.subscriptionStatus, store?.planExpiresAt]);

  if (!isStoreEligibleForCompletaTuTienda(store) || dismissed) {
    return null;
  }

  const tasks = getCompletaTuTiendaTasks(store, designConfirmed, grantedRewards);
  const completedCount = tasks.filter((t) => t.done).length;

  if (completedCount === tasks.length) {
    return null;
  }

  const progressPct = Math.round((completedCount / tasks.length) * 100);

  const handleDismiss = () => {
    dismissCompletaTuTienda(store.id);
    setDismissed(true);
  };

  const handleConfirmDesign = () => {
    markDesignConfirmed(store.id);
    setDesignConfirmed(true);
  };

  return (
    <Card
      data-testid="completa-tu-tienda-card"
      className="border border-primary/25 bg-gradient-to-br from-primary/[0.04] via-card to-card shadow-xs rounded-2xl overflow-hidden"
    >
      <CardContent className="p-4 sm:p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-heading font-extrabold text-foreground">
                  Completa tu tienda
                </h2>
                <span
                  data-testid="completa-tu-tienda-count"
                  className="text-[11px] font-extrabold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full"
                >
                  {completedCount} de {tasks.length}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Deja tu catálogo listo para vender más por WhatsApp y redes.
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            aria-label="Cerrar tarjeta Completa tu tienda"
            className="h-11 w-11 -mr-2 -mt-2 rounded-xl text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Barra de progreso */}
        <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 rounded-full"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* 5 tareas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={cn(
                "flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 min-h-[44px] transition-colors",
                task.done
                  ? "border-emerald-200/80 bg-emerald-50/60 dark:border-emerald-900/40 dark:bg-emerald-950/20"
                  : "border-border/70 bg-background hover:border-primary/40",
              )}
            >
              <Link
                to={task.to}
                className="flex items-center gap-2.5 min-w-0 flex-1"
              >
                {task.done ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                )}
                <span
                  className={cn(
                    "text-xs font-semibold leading-snug",
                    task.done ? "text-emerald-900 dark:text-emerald-200 line-through" : "text-foreground",
                  )}
                >
                  {task.label}
                </span>
                {task.detail && (
                  <span className="text-[10px] font-bold text-muted-foreground shrink-0">
                    ({task.detail})
                  </span>
                )}
                {task.reward && (
                  <span
                    data-testid={`task-reward-${task.id}`}
                    className={cn(
                      "text-[10px] font-extrabold px-1.5 py-0.5 rounded-md shrink-0 whitespace-nowrap ml-auto mr-1",
                      task.rewardEarned
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300/40"
                    )}
                  >
                    {task.rewardEarned
                      ? (task.id === "portada" ? "✓ +2 días ganado" : `✓ ${task.reward} ganado`)
                      : task.reward}
                  </span>
                )}
              </Link>

              {!task.done && task.id === "diseno" ? (
                <button
                  type="button"
                  onClick={handleConfirmDesign}
                  className="text-[11px] font-bold text-primary hover:underline px-2 py-1 min-h-[32px] shrink-0 cursor-pointer"
                >
                  Confirmar
                </button>
              ) : !task.done ? (
                <Link
                  to={task.to}
                  aria-label={`Ir a ${task.label}`}
                  className="text-muted-foreground hover:text-primary shrink-0 p-1"
                >
                  <ChevronRight className="h-4 w-4" />
                </Link>
              ) : null}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
