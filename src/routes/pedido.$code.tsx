/**
 * @file pedido.$code.tsx
 * @description Ruta pública del Link de Pedido (/pedido/:code) en TanStack Router.
 * Permite al dueño de la tienda (y al cliente) visualizar un pedido de WhatsApp
 * con fotos, variaciones, cantidades, precios unitarios, ahorro por mayor, total
 * y checklist interactivo de empaque/revisión en un solo lugar.
 */

import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Check,
  CheckCircle2,
  ClipboardList,
  Copy,
  ExternalLink,
  PackageCheck,
  Printer,
  ShoppingBag,
  Store as StoreIcon,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StoreErrorComponent } from "@/components/public/StoreErrorComponent";
import {
  fetchPublicOrder,
  formatOrderSummaryText,
  getOrderLineKey,
  type PublicOrderDetail,
} from "@/lib/order-link";
import { formatPrice } from "@/lib/whatsapp";
import { getThumbnailUrl, handleImageError, toCdnUrl } from "@/lib/image-utils";

export const Route = createFileRoute("/pedido/$code")({
  staleTime: 60 * 1000,
  loader: async ({ params }) => {
    const order = await fetchPublicOrder(params.code);
    return { order };
  },
  head: ({ params, loaderData }: any) => {
    const order: PublicOrderDetail | null | undefined = loaderData?.order;
    const title = order
      ? `Pedido #${order.code} · ${order.storeName}`
      : `Pedido #${params.code} · Dizi`;
    return {
      meta: [
        { title },
        { name: "robots", content: "noindex, nofollow" },
      ],
    };
  },
  errorComponent: StoreErrorComponent,
  component: PublicOrderPage,
});

function loadCheckedSet(code: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(`dizi_order_checked_${code.toUpperCase()}`);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed.map(String)) : new Set();
  } catch {
    return new Set();
  }
}

function saveCheckedSet(code: string, keys: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      `dizi_order_checked_${code.toUpperCase()}`,
      JSON.stringify(Array.from(keys)),
    );
  } catch {
    // Ignorar errores de almacenamiento (modo privado / cuota llena)
  }
}

function formatOrderDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return new Intl.DateTimeFormat("es-PE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return "";
  }
}

function PublicOrderPage() {
  const { code } = Route.useParams();
  const { order } = Route.useLoaderData() as { order: PublicOrderDetail | null };

  const [checkedKeys, setCheckedKeys] = useState<Set<string>>(() => loadCheckedSet(code));
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCheckedKeys(loadCheckedSet(code));
  }, [code]);

  const totalUnits = useMemo(
    () => (order ? order.items.reduce((sum, it) => sum + it.qty, 0) : 0),
    [order],
  );

  const checkedCount = useMemo(() => {
    if (!order) return 0;
    return order.items.reduce(
      (sum, it, idx) => sum + (checkedKeys.has(getOrderLineKey(it, idx)) ? 1 : 0),
      0,
    );
  }, [order, checkedKeys]);

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 text-center">
        <div className="max-w-md w-full rounded-3xl border bg-card p-6 sm:p-8 shadow-sm space-y-4">
          <div className="mx-auto h-14 w-14 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
            <ClipboardList className="h-7 w-7" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-xl font-extrabold text-foreground">Pedido no encontrado</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              No encontramos el pedido <span className="font-mono font-bold">#{code}</span>.
              Verifica que el enlace esté completo.
            </p>
          </div>
          <Link to="/" className="inline-block w-full">
            <Button variant="outline" className="w-full h-11 rounded-xl font-bold">
              Ir al inicio
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const accentColor = order.brandColor || "#18181b";
  const allChecked = order.items.length > 0 && checkedCount === order.items.length;
  const progressPct =
    order.items.length > 0 ? Math.round((checkedCount / order.items.length) * 100) : 0;
  const formattedDate = formatOrderDate(order.createdAt);

  const toggleItem = (key: string) => {
    setCheckedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      saveCheckedSet(order.code, next);
      return next;
    });
  };

  const handleToggleAll = () => {
    const next = allChecked
      ? new Set<string>()
      : new Set(order.items.map((it, idx) => getOrderLineKey(it, idx)));
    setCheckedKeys(next);
    saveCheckedSet(order.code, next);
  };

  const handleCopySummary = async () => {
    const text = formatOrderSummaryText(order, checkedKeys);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Resumen del pedido copiado");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("No se pudo copiar el resumen");
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 text-foreground pb-12 print:bg-white print:pb-0">
      <div className="max-w-2xl mx-auto px-3 sm:px-6 pt-4 sm:pt-8 space-y-4">
        {/* Encabezado de tienda y número de pedido */}
        <header className="rounded-3xl border bg-card p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {order.storeLogo ? (
                <img
                  src={toCdnUrl(order.storeLogo)}
                  alt={order.storeName}
                  onError={(e) => handleImageError(e, [order.storeLogo, "/images/sin-foto.svg"])}
                  className="h-12 w-12 rounded-2xl object-cover border shrink-0 bg-muted"
                />
              ) : (
                <div
                  className="h-12 w-12 rounded-2xl flex items-center justify-center text-white shrink-0 font-bold"
                  style={{ backgroundColor: accentColor }}
                >
                  <StoreIcon className="h-6 w-6" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Detalle de pedido
                </p>
                <h1 className="text-lg sm:text-xl font-extrabold truncate">{order.storeName}</h1>
              </div>
            </div>

            <Badge
              data-testid="order-code-badge"
              className="font-mono text-xs sm:text-sm font-extrabold px-3 py-1 rounded-xl shrink-0 border-0 text-white"
              style={{ backgroundColor: accentColor }}
            >
              #{order.code}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-border/50 text-xs text-muted-foreground">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              {formattedDate && <span>{formattedDate}</span>}
              {order.sellerName && (
                <span className="inline-flex items-center gap-1 font-medium text-foreground">
                  <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                  Vendedor: {order.sellerName}
                </span>
              )}
            </div>
            <span className="font-semibold text-foreground">
              {totalUnits} {totalUnits === 1 ? "unidad" : "unidades"} · {order.items.length}{" "}
              {order.items.length === 1 ? "producto" : "productos"}
            </span>
          </div>
        </header>

        {/* Barra de revisión / empaque para el dueño */}
        <section
          aria-label="Progreso de revisión del pedido"
          className="rounded-2xl border bg-card px-4 py-3 shadow-xs space-y-2 print:hidden"
        >
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="font-bold flex items-center gap-1.5 text-foreground">
              <PackageCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              Revisados: {checkedCount} de {order.items.length}
            </span>
            <button
              type="button"
              onClick={handleToggleAll}
              className="text-xs font-semibold text-primary hover:underline cursor-pointer"
            >
              {allChecked ? "Desmarcar todo" : "Marcar todo"}
            </button>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300 bg-emerald-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </section>

        {/* Lista detallada de productos */}
        <section className="space-y-2.5" aria-label="Productos del pedido">
          {order.items.map((item, idx) => {
            const lineKey = getOrderLineKey(item, idx);
            const isChecked = checkedKeys.has(lineKey);
            const hasPrice = item.unitPrice !== null && item.unitPrice > 0;
            const thumbSrc = item.image
              ? getThumbnailUrl(toCdnUrl(item.image))
              : "/images/sin-foto.svg";

            return (
              <div
                key={lineKey}
                data-testid={`order-item-${idx}`}
                onClick={() => toggleItem(lineKey)}
                role="checkbox"
                aria-checked={isChecked}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleItem(lineKey);
                  }
                }}
                className={`rounded-2xl border bg-card p-3 sm:p-4 shadow-xs transition-all cursor-pointer select-none flex items-start gap-3 ${
                  isChecked
                    ? "border-emerald-500/50 bg-emerald-500/[0.04]"
                    : "border-border/70 hover:border-border"
                }`}
              >
                {/* Checkbox visual de empaque */}
                <div
                  className={`mt-1 h-5 w-5 rounded-md border flex items-center justify-center shrink-0 transition-colors print:hidden ${
                    isChecked
                      ? "bg-emerald-600 border-emerald-600 text-white"
                      : "border-muted-foreground/40 bg-background"
                  }`}
                >
                  {isChecked && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                </div>

                {/* Foto del producto */}
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl overflow-hidden border bg-muted shrink-0">
                  <img
                    src={thumbSrc}
                    alt={item.name}
                    onError={(e) =>
                      handleImageError(e, [
                        item.image ? toCdnUrl(item.image) : null,
                        item.image,
                        "/images/sin-foto.svg",
                      ])
                    }
                    className="h-full w-full object-cover"
                  />
                </div>

                {/* Detalle del producto */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <h2
                      className={`text-sm sm:text-base font-bold leading-snug ${
                        isChecked ? "line-through text-muted-foreground" : "text-foreground"
                      }`}
                    >
                      {item.name}
                    </h2>
                    <span className="shrink-0 inline-flex items-center justify-center rounded-lg bg-primary/10 text-primary font-extrabold text-xs sm:text-sm px-2 py-0.5">
                      x{item.qty}
                    </span>
                  </div>

                  {item.variationName && (
                    <p className="text-xs font-medium text-muted-foreground">
                      Opción: <span className="text-foreground">{item.variationName}</span>
                    </p>
                  )}

                  <div className="flex items-end justify-between gap-2 pt-1 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap text-xs text-muted-foreground">
                      {hasPrice ? (
                        <>
                          <span>{formatPrice(item.unitPrice)} c/u</span>
                          {item.isWholesale && item.regularPrice && (
                            <>
                              <span className="line-through opacity-70">
                                {formatPrice(item.regularPrice)}
                              </span>
                              <Badge
                                variant="secondary"
                                className="text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-0 px-1.5 py-0"
                              >
                                Por mayor
                              </Badge>
                            </>
                          )}
                        </>
                      ) : (
                        <span>Precio a consultar</span>
                      )}
                    </div>

                    <span className="text-sm sm:text-base font-black text-foreground ml-auto">
                      {hasPrice && item.lineTotal !== null
                        ? formatPrice(item.lineTotal)
                        : "A consultar"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {/* Resumen de totales */}
        <section
          aria-label="Resumen de totales"
          className="rounded-3xl border bg-card p-4 sm:p-6 shadow-xs space-y-3"
        >
          {order.wholesaleSavings > 0 && order.subtotalRegular !== null && (
            <div className="space-y-1.5 pb-3 border-b border-border/50 text-xs sm:text-sm">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Subtotal regular</span>
                <span className="line-through">{formatPrice(order.subtotalRegular)}</span>
              </div>
              <div className="flex items-center justify-between font-bold text-emerald-600 dark:text-emerald-400">
                <span>Ahorro por mayor</span>
                <span>-{formatPrice(order.wholesaleSavings)}</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm sm:text-base font-bold text-muted-foreground">
              Total del pedido
            </span>
            <span
              data-testid="order-total-amount"
              className="text-xl sm:text-2xl font-black"
              style={{ color: accentColor }}
            >
              {order.total !== null && order.total > 0
                ? `${formatPrice(order.total)}${order.hasQuoteItems ? " + por cotizar" : ""}`
                : "A consultar"}
            </span>
          </div>
        </section>

        {/* Botones de acción */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 print:hidden">
          <Button
            type="button"
            variant="outline"
            onClick={handleCopySummary}
            className="h-11 rounded-xl font-bold text-xs gap-2"
          >
            {copied ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ¡Copiado!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copiar resumen
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => window.print()}
            className="h-11 rounded-xl font-bold text-xs gap-2"
          >
            <Printer className="h-4 w-4" />
            Imprimir / PDF
          </Button>

          {order.storeSlug && (
            <Link to="/t/$slug/{-$categoria}" params={{ slug: order.storeSlug }} className="w-full">
              <Button className="w-full h-11 rounded-xl font-bold text-xs gap-2">
                <ShoppingBag className="h-4 w-4" />
                Ir al catálogo
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
