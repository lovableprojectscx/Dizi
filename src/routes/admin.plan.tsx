import { createFileRoute } from "@tanstack/react-router";
import { useApp } from "@/lib/store";
import { PLANS, type PlanId, daysUntilExpiry, formatDate } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Star, AlertTriangle, Calendar, CheckCircle2, Clock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/plan")({
  component: PlanPage,
});

const features: Record<PlanId, string[]> = {
  semilla: [
    "Hasta 20 productos",
    "Hasta 3 enlaces rápidos (Bio)",
    "2 modelos de diseño clásicos",
    "Múltiples categorías",
    "Pedidos por WhatsApp",
    "Marca de agua Dizi visible",
  ],
  emprendedor: [
    "Hasta 50 productos",
    "5 modelos de diseño en total",
    "Configuración asistida (Cupos limitados)",
    "Buscador inteligente de productos",
    "Descarga de Catálogo en PDF",
    "Sin marca de agua (Marca propia)",
  ],
  pro: [
    "Hasta 200 productos",
    "Todos los modelos + 7 Diseños Elite",
    "Diseños Premium por Nichos (Bloom / Bite)",
    "Configuración asistida (Cupos limitados)",
    "Carrusel de Banners (hasta 3 portadas)",
    "Botonera Dual (WhatsApp + Carrito)",
    "Estadísticas básicas de visitas",
    "Descarga de Catálogo en PDF",
    "Sin marca de agua (Marca propia)",
  ],
  ilimitado: [
    "Productos ilimitados",
    "Todos los modelos + 7 Diseños Elite",
    "Diseños Premium por Nichos (Bloom / Bite)",
    "Configuración asistida (Cupos limitados)",
    "Carga rápida por fotos (Borradores masivos)",
    "Carrusel de Banners (hasta 5 portadas)",
    "Sin marca de agua (Marca propia)",
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(Object.keys(PLANS) as PlanId[]).map((p) => {
          const isCurrent = store.plan === p;
          return (
            <Card
              key={p}
              className={cn("relative", isCurrent && "border-primary ring-2 ring-primary/30")}
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
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">
                      /mes
                    </span>
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
