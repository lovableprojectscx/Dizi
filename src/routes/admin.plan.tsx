import { createFileRoute } from "@tanstack/react-router";
import { useApp } from "@/lib/store";
import { PLANS, type PlanId, daysUntilExpiry, formatDate } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Star, AlertTriangle, Calendar, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/plan")({
  component: PlanPage,
});

const features: Record<PlanId, string[]> = {
  semilla: [
    "Hasta 7 productos",
    "Catálogo público",
    "Pedidos por WhatsApp",
    "Link en Bio básico",
    "Código QR descargable",
  ],
  emprendedor: [
    "Hasta 50 productos",
    "Categorías ilimitadas",
    "Bio-Link personalizado",
    "Modelos de diseño nivel 1",
    "Soporte por WhatsApp",
  ],
  pro: [
    "Hasta 200 productos",
    "Modelos premium desbloqueados",
    "Personalización de colores y fondos",
    "Export PDF del catálogo",
    "Soporte prioritario por WhatsApp",
  ],
  ilimitado: [
    "Productos ilimitados",
    "Todos los modelos Elite",
    "Personalización total",
    "Atención personalizada directa",
  ],
};

function PlanPage() {
  const id = useApp((s) => s.currentStoreId);
  const store = useApp((s) => s.stores.find((st) => st.id === id));
  
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
              Tu plan vencio el {store.planExpiresAt ? formatDate(store.planExpiresAt) : ""}. Ahora tienes las funciones del plan Semilla.
              Para renovar, contacta con soporte.
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
              Vence el {store.planExpiresAt ? formatDate(store.planExpiresAt) : ""}. Contacta con soporte para renovar.
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

      {isPaid && !isExpired && !isExpiringSoon && store.planExpiresAt && (
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
      )}

      <Card>
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span>Uso de productos</span>
            <span className="font-semibold">
              {used} /{" "}
              {PLANS[store.plan].productLimit === Infinity
                ? "∞"
                : PLANS[store.plan].productLimit}
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(Object.keys(PLANS) as PlanId[]).map((p) => {
          const isCurrent = store.plan === p;
          return (
            <Card
              key={p}
              className={cn(
                "relative",
                isCurrent && "border-primary ring-2 ring-primary/30"
              )}
            >
              {isCurrent && (
                <span className="absolute -top-2 left-4 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                  <Star className="h-3 w-3" /> Actual
                </span>
              )}
              <CardContent className="p-5 space-y-3">
                <div className="flex flex-col">
                  <h3 className="text-lg font-bold">{PLANS[p].name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black">S/ {PLANS[p].price.toFixed(2)}</span>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">/mes</span>
                  </div>
                </div>
                <p className="text-xs font-medium text-muted-foreground">
                  {PLANS[p].productLimit === Infinity
                    ? "Productos ilimitados"
                    : `Hasta ${PLANS[p].productLimit} productos`}
                </p>
                <ul className="space-y-1 text-sm pt-2">
                  {features[p].map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" /> {f}
                    </li>
                  ))}
                </ul>
                <div className="pt-2">
                  {!isCurrent && (
                    <a
                      href={`https://wa.me/51925176472?text=${encodeURIComponent(`Hola Dizi, me gustaría actualizar mi tienda "${store.name}" al plan ${PLANS[p].name}.`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-9 w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
                    >
                      Actualizar Plan
                    </a>
                  )}
                  {isCurrent && (
                    <div className="h-9 w-full flex items-center justify-center text-sm font-medium text-muted-foreground bg-muted/50 rounded-md">
                      Plan Activo
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
