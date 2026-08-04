import { createFileRoute } from "@tanstack/react-router";
import { useApp } from "@/lib/store";
import { PLANS, type PlanId, daysUntilExpiry, formatDate } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Star, AlertTriangle, Calendar, CheckCircle2, Clock, Sparkles, Zap } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/plan")({
  component: PlanPage,
});

const features: Record<PlanId, string[]> = {
  semilla: [
    "Hasta 20 productos",
    "Todas las 15 estructuras de diseño",
    "Carrito a WhatsApp",
    "Marca de agua Dizi visible",
  ],
  emprendedor: [
    "Hasta 100 productos",
    "Sin marca de agua (Marca propia)",
    "Exportación de Catálogo a PDF",
    "Todas las 15 estructuras de diseño",
    "Página Link en Bio",
  ],
  pro: [
    "Hasta 300 productos",
    "Sin marca de agua (Marca propia)",
    "Carrusel de 3 Banners en portada",
    "Página Link en Bio",
    "Estadísticas de clics y tráfico",
    "Exportación de Catálogo a PDF",
  ],
  ilimitado: [
    "Hasta 1,000 productos",
    "Sin marca de agua (Marca propia)",
    "Carrusel de 5 Banners en portada",
    "Página Link en Bio",
    "Estadísticas avanzadas",
    "Soporte prioritario 24/7",
  ],
};

function PlanPage() {
  const id = useApp((s) => s.currentStoreId);
  const store = useApp((s) => s.stores.find((st) => st.id === id));
  const [isAnnual, setIsAnnual] = useState(false);

  if (!store) return null;

  const used = store.products.length;
  const days = daysUntilExpiry(store);
  const isPaid = store.plan !== "semilla";
  const isExpiringSoon = days !== null && days >= 0 && days <= 7;
  const isExpired = days !== null && days < 0;

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Mi Plan</h1>
        <p className="text-sm text-muted-foreground">
          Plan actual: <strong>{PLANS[store.plan].name}</strong>
        </p>
      </div>

      {/* ── Banner de vencimiento ── */}
      {isPaid && isExpired && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-destructive text-sm">Tu suscripcion ha vencido</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Tu plan vencio el {store.planExpiresAt ? formatDate(store.planExpiresAt) : ""}. Ahora
              tienes las funciones del plan Semilla. Para renovar, contacta con soporte.
            </p>
            <a
              href={`https://wa.me/51925176472?text=${encodeURIComponent(`Hola Dizi, quiero renovar mi plan de la tienda "${store.name}".`)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex mt-2 h-8 items-center justify-center rounded-md bg-destructive px-4 text-xs font-medium text-white shadow hover:bg-destructive/90 transition-colors"
            >
              Renovar ahora por WhatsApp
            </a>
          </div>
        </div>
      )}

      {isPaid && isExpiringSoon && !isExpired && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800 text-sm">
              Tu suscripcion vence en {days === 0 ? "hoy" : `${days} dia${days !== 1 ? "s" : ""}`}
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Vence el {store.planExpiresAt ? formatDate(store.planExpiresAt) : ""}. Contacta con
              soporte para renovar.
            </p>
            <a
              href={`https://wa.me/51925176472?text=${encodeURIComponent(`Hola Dizi, quiero renovar mi plan de la tienda "${store.name}".`)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex mt-2 h-8 items-center justify-center rounded-md bg-amber-600 px-4 text-xs font-medium text-white shadow hover:bg-amber-700 transition-colors"
            >
              Renovar ahora por WhatsApp
            </a>
          </div>
        </div>
      )}

      {isPaid &&
        !isExpired &&
        !isExpiringSoon &&
        store.planExpiresAt &&
        (store.subscriptionStatus === "trial" ? (
          <div className="rounded-xl border bg-amber-50/60 border-amber-200 p-3.5 flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-600 shrink-0 animate-pulse" />
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-800">
                Período de prueba activo hasta <strong>{formatDate(store.planExpiresAt)}</strong>
                <span className="text-amber-600 font-normal"> ({days} días restantes)</span>
              </span>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border bg-emerald-50/60 border-emerald-200 p-3.5 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-800">
                Plan activo hasta <strong>{formatDate(store.planExpiresAt)}</strong>
                <span className="text-emerald-600 font-normal"> ({days} dias restantes)</span>
              </span>
            </div>
          </div>
        ))}

      <Card>
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span>Uso de productos</span>
            <span className="font-semibold">
              {used} /{" "}
              {PLANS[store.plan].productLimit === Infinity ? "∞" : PLANS[store.plan].productLimit}
            </span>
          </div>
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{
                width: `${
                  PLANS[store.plan].productLimit === Infinity
                    ? 25
                    : Math.min(100, (used / PLANS[store.plan].productLimit) * 100)
                }%`,
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Toggle Mensual / Anual ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div>
          <h2 className="text-lg font-bold text-foreground">Planes y Tarifas Disponibles</h2>
          <p className="text-xs text-muted-foreground">Elige el plan que mejor se adapte al volumen de tu catálogo</p>
        </div>
        <div className="inline-flex items-center gap-1.5 p-1 bg-muted rounded-full border self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setIsAnnual(false)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-bold transition-all",
              !isAnnual ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            Facturación Mensual
          </button>
          <button
            type="button"
            onClick={() => setIsAnnual(true)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1",
              isAnnual ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span>Facturación Anual</span>
            <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-wider", isAnnual ? "bg-white/20 text-white" : "bg-emerald-500/10 text-emerald-600")}>
              -25%
            </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(Object.keys(PLANS) as PlanId[]).map((p) => {
          const isCurrent = store.plan === p;
          const planInfo = PLANS[p];
          const displayPrice = isAnnual && planInfo.annualPrice > 0 ? planInfo.annualPrice : planInfo.price;
          const periodLabel = isAnnual && planInfo.annualPrice > 0 ? "/año" : "/mes";

          return (
            <Card
              key={p}
              className={cn("relative flex flex-col justify-between", isCurrent && "border-primary ring-2 ring-primary/30")}
            >
              {isCurrent && (
                <span className="absolute -top-2 left-4 bg-primary text-primary-foreground text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full inline-flex items-center gap-1 z-10">
                  <Star className="h-3 w-3" /> Plan Actual
                </span>
              )}
              <CardContent className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex flex-col">
                    <h3 className="text-base font-bold">{planInfo.name}</h3>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-black">S/ {displayPrice > 0 ? displayPrice.toFixed(2) : "0"}</span>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold">
                        {periodLabel}
                      </span>
                    </div>
                    {isAnnual && planInfo.annualPrice > 0 && (
                      <span className="text-[10px] text-emerald-600 font-bold mt-0.5">
                        Equivalente a S/ {(planInfo.annualPrice / 12).toFixed(2)}/mes
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-primary">
                    Hasta {planInfo.productLimit} productos
                  </p>
                  <ul className="space-y-1.5 text-xs pt-1">
                    {features[p].map((f) => (
                      <li key={f} className="flex items-start gap-1.5">
                        <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="leading-tight">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-3">
                  {!isCurrent ? (
                    <a
                      href={`https://wa.me/51925176472?text=${encodeURIComponent(`Hola Dizi, me gustaría contratar el plan ${planInfo.name} (${isAnnual ? "Anual" : "Mensual"}) para mi tienda "${store.name}".`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-9 w-full items-center justify-center rounded-lg bg-primary px-3 text-xs font-bold text-primary-foreground shadow hover:bg-primary/90 transition-colors"
                    >
                      Solicitar {planInfo.name}
                    </a>
                  ) : (
                    <div className="h-9 w-full flex items-center justify-center text-xs font-bold text-muted-foreground bg-muted/60 rounded-lg">
                      Plan Activo
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Servicio Opcional: Configuración Asistida S/ 79 ── */}
      <Card className="border border-blue-500/20 bg-blue-500/5 overflow-hidden rounded-2xl">
        <CardContent className="p-5">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest bg-blue-500/10 px-2.5 py-0.5 rounded-full">
                <Zap className="h-3 w-3" /> Servicio Opcional Llave en Mano
              </div>
              <h3 className="text-base font-bold text-foreground">Configuración Asistida Dizi — S/ 79 (Pago Único)</h3>
              <p className="text-xs text-muted-foreground">
                ¿Prefieres que dejemos tu tienda lista por ti? Carga de hasta 30 productos, diseño de banner, categorías, perfil Link en Bio y capacitación de 20 min.
              </p>
            </div>
            <a
              href={`https://wa.me/51925176472?text=${encodeURIComponent(`Hola Dizi, me interesa contratar el servicio opcional de Configuración Asistida (S/ 79) para mi tienda "${store.name}".`)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 text-xs font-bold shadow-md transition-colors"
            >
              Solicitar Configuración (S/ 79)
            </a>
          </div>
        </CardContent>
      </Card>

      {/* ── Sección de Referidos / Recompensas ── */}
      <Card className="border border-primary/20 bg-primary/5 dark:bg-primary/10 overflow-hidden rounded-2xl">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-8 space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-xs shrink-0">
                  🎉
                </span>
                <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100">
                  Gana meses gratis con nuestro Programa de Referidos
                </h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Comparte Dizi con otros negocios y emprendedores. Por cada tienda recomendada que
                adquiera cualquier plan de pago,{" "}
                <strong>ambos recibirán 1 mes gratis adicional</strong> de suscripción de forma
                automática.
              </p>
              <div className="pt-2 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                <div className="bg-background border rounded-xl px-3.5 h-10 flex items-center text-xs font-mono text-muted-foreground select-all truncate flex-1 min-w-0">
                  https://dizi.idenza.site/register?ref={store.slug}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-10 text-xs font-semibold px-4 cursor-pointer hover:bg-slate-100"
                    onClick={async () => {
                      const url = `https://dizi.idenza.site/register?ref=${store.slug}`;
                      try {
                        await navigator.clipboard.writeText(url);
                        toast.success("¡Enlace copiado al portapapeles!");
                      } catch {
                        // Fallback
                        const el = document.createElement("textarea");
                        el.value = url;
                        document.body.appendChild(el);
                        el.select();
                        document.execCommand("copy");
                        document.body.removeChild(el);
                        toast.success("¡Enlace copiado!");
                      }
                    }}
                  >
                    Copiar enlace
                  </Button>
                  <Button
                    size="sm"
                    className="h-10 text-xs font-bold px-4 bg-primary text-white hover:opacity-95 shadow-sm"
                    onClick={() => {
                      const text = `Hola, te recomiendo Dizi para crear el catálogo digital de tu tienda. Es super rápido, profesional y te permite recibir pedidos por WhatsApp. Regístrate gratis usando mi enlace y si te suscribes, ¡ambos ganamos 1 mes gratis adicional! 🚀\n\nhttps://dizi.idenza.site/register?ref=${store.slug}`;
                      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
                    }}
                  >
                    Compartir por WhatsApp
                  </Button>
                </div>
              </div>
            </div>
            <div className="hidden md:flex md:col-span-4 justify-center items-center">
              <div className="h-24 w-24 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-5xl select-none animate-bounce">
                🎁
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
