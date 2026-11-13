/**
 * @file admin.dashboard.tsx
 * @description Panel de control principal y resumen de métricas del comercio (/admin/dashboard).
 * Provee visualización de visitas y clics a WhatsApp, enlaces rápidos de difusión con códigos QR
 * generados dinámicamente, atajos para gestión de inventario y monitor del estado de suscripción.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { PLANS } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Package,
  MessageCircle,
  Plus,
  Sparkles,
  HelpCircle,
  Eye,
  Clock,
  AlertCircle,
  Gift,
} from "lucide-react";
import { canStoreTakeSurvey, SURVEY_VERSION, getRewardDescription } from "@/lib/survey";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { isProductIncomplete } from "@/lib/products";
import { ShareCatalogCard } from "@/components/admin/ShareCatalogCard";

/**
 * Definición de la ruta de TanStack Router para `/admin/dashboard`.
 */
export const Route = createFileRoute("/admin/dashboard")({
  component: Dashboard,
});

/**
 * Componente principal del Dashboard del comercio.
 */
function Dashboard() {
  const id = useApp((s) => s.currentStoreId);
  const store = useApp((s) => s.stores.find((st) => st.id === id) ?? s.stores[0]);

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

  if (!store) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground animate-pulse font-medium">
            Cargando tu espacio...
          </p>
        </div>
      </div>
    );
  }

  const plan = PLANS[store.plan];
  const isTrial = store.subscriptionStatus === "trial" && store.plan !== "semilla";
  const daysLeft = store.planExpiresAt
    ? Math.max(
        0,
        Math.ceil((new Date(store.planExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      )
    : 0;

  const activeProducts = store.products.filter((p) => p.visible).length;
  const incompleteProductsCount = store.products.filter(isProductIncomplete).length;

  return (
    <div className="space-y-4 sm:space-y-6 max-w-5xl mx-auto pb-10">
      {/* Header Responsive */}
      <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-3 sm:pb-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-heading font-extrabold tracking-tight text-foreground line-clamp-1">
            {store.name}
          </h1>
          <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 font-medium">
            Panel de administración de tu catálogo digital
          </p>
        </div>
        <div className="shrink-0">
          <span className="text-[10px] sm:text-xs font-extrabold bg-primary/10 text-primary px-3 py-1.5 rounded-full border border-primary/20 tracking-wider uppercase">
            Plan {plan.name}
          </span>
        </div>
      </div>

      {/* Alerta de productos incompletos (sin precio o con nombre de foto) */}
      {incompleteProductsCount > 0 && (
        <Card className="border border-amber-300 dark:border-amber-800/80 bg-amber-50/70 dark:bg-amber-950/20 shadow-xs rounded-2xl">
          <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-700 dark:text-amber-400 shrink-0 shadow-xs">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div className="space-y-0.5 text-center sm:text-left">
                <h3 className="text-xs sm:text-sm font-heading font-bold text-amber-950 dark:text-amber-200">
                  {incompleteProductsCount}{" "}
                  {incompleteProductsCount === 1
                    ? "producto incompleto (sin precio o con nombre de archivo)"
                    : "productos incompletos (sin precio o con nombre de archivo)"}
                </h3>
                <p className="text-[11px] sm:text-xs text-amber-800/80 dark:text-amber-300/80">
                  Completa sus nombres y precios para que tus clientes puedan comprar sin dudas.
                </p>
              </div>
            </div>
            <Button
              asChild
              size="sm"
              className="rounded-xl font-bold text-xs h-9 sm:h-10 w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white shadow-sm shrink-0 cursor-pointer"
            >
              <Link to="/admin/productos">
                Completar productos
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Tarjeta de Encuesta de Calidad (RF-43.1) */}
      {surveyEligible && (
        <Card className="border border-emerald-300 dark:border-emerald-800/80 bg-gradient-to-r from-emerald-50/90 via-teal-50/50 to-emerald-50/90 dark:from-emerald-950/25 dark:via-teal-950/20 dark:to-emerald-950/25 shadow-xs rounded-2xl overflow-hidden">
          <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-700 dark:text-emerald-400 shrink-0 shadow-xs">
                <Gift className="h-5 w-5" />
              </div>
              <div className="space-y-0.5 text-center sm:text-left">
                <h3 className="text-xs sm:text-sm font-heading font-bold text-emerald-950 dark:text-emerald-200">
                  Responde 7 preguntas y gana 15 días
                </h3>
                <p className="text-[11px] sm:text-xs text-emerald-800/80 dark:text-emerald-300/80">
                  {store.plan === "semilla"
                    ? "Completa la breve encuesta y recibe 15 días de prueba de Emprendedor."
                    : "Completa la breve encuesta y suma 15 días más a tu plan actual."}
                </p>
              </div>
            </div>
            <Button
              asChild
              size="sm"
              className="rounded-xl font-bold text-xs h-9 sm:h-10 w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shrink-0 cursor-pointer"
            >
              <Link to="/admin/encuesta">
                Responder encuesta
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Banner de estado inicial minimalista */}
      {store.products.length === 0 && (
        <Card className="border border-primary/25 bg-primary/[0.03] shadow-xs rounded-2xl">
          <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center text-primary shrink-0 shadow-xs">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="space-y-0.5 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-1.5">
                  <h3 className="text-xs sm:text-sm font-heading font-bold text-foreground">Tu catálogo está listo</h3>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="text-muted-foreground/40 hover:text-muted-foreground transition-colors cursor-help"
                      >
                        <HelpCircle className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      Comienza agregando productos para que tus clientes puedan ver lo que ofreces y
                      enviarte pedidos directos por WhatsApp.
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className="text-[11px] sm:text-xs text-muted-foreground">
                  Comienza agregando tus primeros productos.
                </p>
              </div>
            </div>
            <Button asChild size="sm" className="rounded-xl font-bold text-xs h-9 sm:h-10 w-full sm:w-auto bg-primary hover:bg-primary/90 text-white shadow-sm">
              <Link to="/admin/productos">
                <Plus className="h-4 w-4 mr-1.5" /> Agregar primer producto
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── SECCIÓN 1: COMPARTE TU TIENDA (Widget Integrado con QR) ── */}
      <ShareCatalogCard store={store} />

      {/* ── SECCIÓN 2: GRID DE MÉTRICAS & DASHBOARD ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          icon={<Package className="h-5 w-5 text-blue-600" />}
          label="Productos activos"
          value={`${activeProducts}/${plan.productLimit === Infinity ? "∞" : plan.productLimit}`}
          trend="En catálogo público"
          tooltipText="Número de productos visibles en tu catálogo actual frente al límite de productos que admite tu plan."
        />
        <MetricCard
          icon={<MessageCircle className="h-5 w-5 text-emerald-600" />}
          label="Clics WhatsApp"
          value={String(store.whatsappClicks)}
          trend="Interacciones"
          tooltipText="Número total de veces que tus clientes han hecho clic para iniciar un chat o enviar un pedido por WhatsApp."
        />
        <MetricCard
          icon={<Eye className="h-5 w-5 text-purple-600" />}
          label="Visitas catálogo"
          value={String(store.views || 0)}
          trend="Visualizaciones"
          tooltipText="Número total de veces que tus clientes han ingresado a ver tu catálogo."
        />
        <MetricCard
          icon={
            isTrial ? (
              <Clock className="h-5 w-5 text-amber-500 animate-pulse" />
            ) : (
              <Sparkles className="h-5 w-5 text-amber-500" />
            )
          }
          label="Plan Actual"
          value={isTrial ? `${plan.name} (Prueba)` : plan.name}
          trend={isTrial ? `Prueba: quedan ${daysLeft} días` : "Suscripción activa"}
          tooltipText={
            isTrial
              ? "Estás disfrutando de un período de prueba gratuito de 15 días con acceso a todas las funciones premium del Plan Emprendedor."
              : "El tipo de plan que tienes contratado. Si necesitas más capacidad o funciones, puedes cambiar de plan."
          }
        />
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  trend,
  tooltipText,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend?: string;
  tooltipText?: string;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "border border-border/60 shadow-xs hover:shadow-sm transition-all duration-300 rounded-2xl overflow-hidden relative group bg-card",
        className,
      )}
    >
      <CardContent className="p-3.5 sm:p-4 flex flex-col justify-between h-full min-h-[100px] sm:min-h-[115px]">
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1 min-w-0">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate font-heading">
                {label}
              </span>
              {tooltipText && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="text-muted-foreground/30 hover:text-muted-foreground transition-colors cursor-help shrink-0"
                    >
                      <HelpCircle className="h-3 w-3" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-left">{tooltipText}</TooltipContent>
                </Tooltip>
              )}
            </div>
            <div className="text-muted-foreground shrink-0 group-hover:scale-110 transition-transform">
              {icon}
            </div>
          </div>
          <div className="text-xl sm:text-3xl font-heading font-extrabold tracking-tight text-foreground truncate">
            {value}
          </div>
        </div>
        {trend && <p className="text-[10px] text-muted-foreground font-medium pt-0.5 truncate">{trend}</p>}
      </CardContent>
    </Card>
  );
}
