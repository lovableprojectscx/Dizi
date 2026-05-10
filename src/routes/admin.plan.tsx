import { createFileRoute } from "@tanstack/react-router";
import { useApp } from "@/lib/store";
import { PLANS, type PlanId } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/plan")({
  component: PlanPage,
});

const features: Record<PlanId, string[]> = {
  semilla: ["Hasta 7 productos", "Catálogo público", "Pedidos por WhatsApp"],
  emprendedor: [
    "Hasta 50 productos",
    "Categorías ilimitadas",
    "Soporte por correo",
    "QR personalizable",
  ],
  pro: [
    "Hasta 200 productos",
    "Soporte prioritario",
    "Métricas avanzadas",
    "Modelos premium",
  ],
  ilimitado: [
    "Productos ilimitados",
    "Carga masiva (Excel)",
    "Soporte 24/7",
    "Personalización total",
  ],
};

function PlanPage() {
  const id = useApp((s) => s.currentStoreId)!;
  const store = useApp((s) => s.stores.find((st) => st.id === id))!;
  const used = store.products.length;

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Mi Plan</h1>
        <p className="text-sm text-muted-foreground">
          Plan actual: <strong>{PLANS[store.plan].name}</strong>
        </p>
      </div>

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
                <h3 className="text-lg font-semibold">{PLANS[p].name}</h3>
                <p className="text-2xl font-bold">
                  {PLANS[p].productLimit === Infinity
                    ? "Ilimitado"
                    : `${PLANS[p].productLimit} productos`}
                </p>
                <ul className="space-y-1 text-sm">
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
