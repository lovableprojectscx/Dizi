/**
 * @file admin.dashboard.tsx
 * @description Pantalla Inicio (/admin/dashboard) renovada en F54 y F55.1:
 * 1. Franja índigo de bienvenida con plan/prueba, mosaico de hasta 4 fotos y "Ver mi catálogo".
 * 2. Tarjeta única "Tu siguiente paso" (RF-54.3 / RF-54.4) con "También pendiente".
 * 3. "Comparte tu tienda" (ShareStoreCard compacto, F55.1).
 * 4. Números en total (Productos activos, Visitas, Clics a WhatsApp): 1 tarjeta con 3 columnas
 *    divididas en celular (<640 px) y 3 tarjetas en escritorio (≥640 px), sin "Plan actual".
 */

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Eye, MessageCircle, Package } from "lucide-react";
import { useApp } from "@/lib/store";
import { PLANS } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { canStoreTakeSurvey, SURVEY_VERSION } from "@/lib/survey";
import { ShareStoreCard } from "@/components/admin/ShareStoreCard";
import {
  getCompletaTuTiendaTasks,
  isCompletaTuTiendaDismissed,
  isDesignConfirmed,
  isStoreEligibleForCompletaTuTienda,
} from "@/components/admin/CompletaTuTienda";
import { PanelHero } from "@/components/admin/PanelHero";
import { ProductMosaic } from "@/components/admin/ProductMosaic";
import { NextStepCard } from "@/components/admin/NextStepCard";
import { claimTrialRewards } from "@/lib/trial-rewards";
import { getMosaicProducts, getNextStep, getTrialStatus } from "@/lib/panel-home";

export const Route = createFileRoute("/admin/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const id = useApp((s) => s.currentStoreId);
  const store = useApp((s) => s.stores.find((st) => st.id === id) ?? s.stores[0]);
  const fetchData = useApp((s) => s.fetchData);

  const [surveyEligible, setSurveyEligible] = useState(false);
  const getMySurveyResponse = useApp((s) => s.getMySurveyResponse);

  useEffect(() => {
    if (!store) {
      setSurveyEligible(false);
      return;
    }
    if (!canStoreTakeSurvey(store, false)) {
      setSurveyEligible(false);
      return;
    }
    let active = true;
    getMySurveyResponse(store.id, SURVEY_VERSION).then((resp) => {
      if (active) {
        setSurveyEligible(!resp);
      }
    });
    return () => {
      active = false;
    };
  }, [store?.id, store?.plan, store?.slug, store?.subscriptionStatus, getMySurveyResponse]);

  const { isTrial, daysLeft } = store ? getTrialStatus(store) : { isTrial: false, daysLeft: 0 };

  // Evaluar logros de prueba Pro al entrar a Inicio (RF-55.7)
  useEffect(() => {
    if (store?.id && isTrial) {
      claimTrialRewards(store.id).then((res) => {
        if (res.totalDaysAdded > 0) {
          useApp.getState().applyGrantedTrialDays(store.id, res.totalDaysAdded);
          fetchData(true);
        }
      });
    }
  }, [store?.id, isTrial, fetchData]);

  const mosaicProducts = useMemo(
    () => (store ? getMosaicProducts(store, 4) : []),
    [store],
  );

  if (!store) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-[16px] text-muted-foreground font-medium">
            Cargando tu espacio...
          </p>
        </div>
      </div>
    );
  }

  const plan = PLANS[store.plan];
  const trialPlanName = store.plan === "pro" ? "Pro" : (PLANS[store.plan]?.name || "Pro");
  const planBadgeText = isTrial
    ? daysLeft === 1
      ? `Prueba ${trialPlanName} · queda 1 día`
      : `Prueba ${trialPlanName} · quedan ${daysLeft} días`
    : `Plan ${plan.name}`;

  const completaEligible = isStoreEligibleForCompletaTuTienda(store);
  const completaDismissed = isCompletaTuTiendaDismissed(store.id);
  const completaCompletedAll = completaEligible
    ? getCompletaTuTiendaTasks(store, isDesignConfirmed(store.id)).every((t) => t.done)
    : false;

  const nextStep = getNextStep(store, {
    surveyEligible,
    completaTuTiendaEligible: completaEligible,
    completaTuTiendaDismissed: completaDismissed,
    completaTuTiendaCompletedAll: completaCompletedAll,
  });

  const activeProducts = store.products.filter((p) => p.visible).length;
  const activeProductsValue = `${activeProducts}/${plan.productLimit === Infinity ? "∞" : plan.productLimit}`;

  const metrics = [
    {
      id: "productos",
      label: "Productos activos",
      value: activeProductsValue,
      icon: Package,
    },
    {
      id: "visitas",
      label: "Visitas",
      value: String(store.views || 0),
      icon: Eye,
    },
    {
      id: "whatsapp",
      label: "Clics a WhatsApp",
      value: String(store.whatsappClicks || 0),
      icon: MessageCircle,
    },
  ];

  return (
    <div className="space-y-5 sm:space-y-6 max-w-5xl mx-auto pb-10">
      {/* 1. Franja de bienvenida índigo + mosaico de 4 fotos reales */}
      <PanelHero
        titleLead="Hola,"
        title={store.name}
        badge={planBadgeText}
        rightSlot={<ProductMosaic products={mosaicProducts} />}
        action={
          <a
            href={`/t/${store.slug}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-dizi-cream text-dizi-indigo hover:bg-dizi-cream/90 font-semibold text-[16px] min-h-[44px] px-4 w-full lg:w-auto transition-colors duration-200 motion-reduce:transition-none"
          >
            <span>Ver mi catálogo</span>
            <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
          </a>
        }
      />

      {/* 2. Una sola tarjeta "Tu siguiente paso" + "También pendiente" */}
      <NextStepCard store={store} nextStep={nextStep} />

      {/* 3. "Comparte tu tienda" — Bloque único y compacto (F55.1) */}
      <ShareStoreCard store={store} />

      {/* 4. Números: 3 valores con "en total", sin "Plan actual" */}
      <section aria-label="Números de tu tienda" data-testid="dashboard-metrics">
        {/* Celular (< 640 px): una sola tarjeta con los 3 valores en fila separados por líneas */}
        <Card className="sm:hidden rounded-2xl border border-border bg-card shadow-xs">
          <CardContent className="p-0 grid grid-cols-3 divide-x divide-border">
            {metrics.map((metric) => (
              <div
                key={metric.id}
                data-testid={`metric-mobile-${metric.id}`}
                className="px-2.5 py-4 flex flex-col items-center justify-between text-center gap-1 min-w-0"
              >
                <span className="text-[13px] font-medium text-muted-foreground leading-tight">
                  {metric.label}
                </span>
                <span className="font-heading font-bold text-[22px] leading-tight text-foreground tabular-nums">
                  {metric.value}
                </span>
                <span className="text-[13px] text-muted-foreground">en total</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Tablet y escritorio (≥ 640 px): 3 tarjetas */}
        <div className="hidden sm:grid sm:grid-cols-3 gap-4">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <Card
                key={metric.id}
                data-testid={`metric-card-${metric.id}`}
                className="rounded-2xl border border-border bg-card shadow-xs"
              >
                <CardContent className="p-5 flex flex-col justify-between gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-semibold text-muted-foreground">
                      {metric.label}
                    </span>
                    <div className="h-9 w-9 rounded-xl bg-secondary text-brand flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </div>
                  </div>
                  <div className="font-heading font-bold text-[30px] leading-tight tracking-tight text-foreground tabular-nums">
                    {metric.value}
                  </div>
                  <p className="text-[13px] text-muted-foreground">en total</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
