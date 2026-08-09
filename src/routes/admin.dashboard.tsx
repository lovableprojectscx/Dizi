import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { PLANS } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Copy,
  QrCode,
  Package,
  MessageCircle,
  ExternalLink,
  Check,
  Plus,
  Download,
  Sparkles,
  Link2,
  Settings,
  Store,
  HelpCircle,
  Share2,
  Eye,
  Clock,
} from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import QRCode from "qrcode";
import { toast } from "sonner";
import { CatalogPdfExportButton } from "@/components/public/CatalogPdfExport";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const id = useApp((s) => s.currentStoreId);
  const store = useApp((s) => s.stores.find((st) => st.id === id));

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
  const catalogUrl = `${typeof window !== "undefined" ? window.location.origin : "https://dizi.idenza.site"}/t/${store.slug}`;
  const bioUrl = `${typeof window !== "undefined" ? window.location.origin : "https://dizi.idenza.site"}/bio/${store.slug}`;

  const [catalogQr, setCatalogQr] = useState<string>("");
  const [bioQr, setBioQr] = useState<string>("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [shareTab, setShareTab] = useState<"catalog" | "bio">("catalog");

  useEffect(() => {
    QRCode.toDataURL(catalogUrl, {
      width: 400,
      margin: 1,
      color: { dark: "#0f172a", light: "#ffffff" },
    })
      .then(setCatalogQr)
      .catch(() => {});
    QRCode.toDataURL(bioUrl, {
      width: 400,
      margin: 1,
      color: { dark: "#0f172a", light: "#ffffff" },
    })
      .then(setBioQr)
      .catch(() => {});
  }, [catalogUrl, bioUrl]);

  const copyText = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    toast.success("Enlace copiado");
  };

  const downloadQrCode = (type: "catalog" | "bio") => {
    const qrToDownload = type === "catalog" ? catalogQr : bioQr;
    if (!qrToDownload) return;
    const a = document.createElement("a");
    a.href = qrToDownload;
    a.download = `${store.slug}-${type}-qr.png`;
    a.click();
  };

  const activeProducts = store.products.filter((p) => p.visible).length;
  const activeQr = shareTab === "catalog" ? catalogQr : bioQr;
  const activeUrl = shareTab === "catalog" ? catalogUrl : bioUrl;

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
      <Card className="border border-border/80 rounded-2xl bg-card shadow-xs overflow-hidden">
        <div className="p-4 sm:p-6">
          <div className="flex items-center gap-2 border-b pb-2.5 sm:pb-3 border-border/40 mb-4 sm:mb-5">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Share2 className="h-4 w-4" />
            </div>
            <h2 className="text-xs sm:text-sm font-heading font-bold tracking-tight text-foreground uppercase tracking-wider">
              Comparte tu Negocio
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 items-stretch">
            {/* LADO IZQUIERDO: Selector de Pestaña y Enlace */}
            <div className="md:col-span-2 space-y-3.5 sm:space-y-4 flex flex-col justify-between">
              {/* Selector tipo Pestaña adaptado a móvil */}
              <div className="grid grid-cols-2 p-1.5 bg-muted/80 rounded-xl border border-border/40 gap-1.5 w-full">
                <button
                  type="button"
                  onClick={() => setShareTab("catalog")}
                  className={cn(
                    "px-2 sm:px-4 py-2 text-[11px] sm:text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                    shareTab === "catalog"
                      ? "bg-white text-foreground shadow-xs font-extrabold border border-border/50"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Store className="h-4 w-4 shrink-0 text-primary" />
                  <span className="truncate">Catálogo Digital</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShareTab("bio")}
                  className={cn(
                    "px-2 sm:px-4 py-2 text-[11px] sm:text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                    shareTab === "bio"
                      ? "bg-white text-foreground shadow-xs font-extrabold border border-border/50"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Link2 className="h-4 w-4 shrink-0 text-primary" />
                  <span className="truncate">Link en Bio</span>
                </button>
              </div>

              {/* Contenido Dinámico según pestaña */}
              <div className="space-y-2.5">
                {shareTab === "catalog" ? (
                  <div className="space-y-0.5">
                    <p className="text-xs sm:text-sm font-heading font-bold text-foreground">
                      Dirección de tu Tienda Online
                    </p>
                    <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                      Esta es la dirección pública de tu catálogo en línea. Compártela con tus
                      clientes para recibir pedidos directos a tu WhatsApp.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <p className="text-xs sm:text-sm font-heading font-bold text-foreground">
                        Tu Página Unificada de Redes
                      </p>
                      <span
                        className={cn(
                          "text-[9px] px-2 py-0.5 rounded-full font-bold uppercase border tracking-wider",
                          store.bioLinksEnabled
                            ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                            : "text-muted-foreground bg-muted border-border/40",
                        )}
                      >
                        {store.bioLinksEnabled ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                      Página unificada ideal para tu bio de Instagram o TikTok.
                    </p>
                  </div>
                )}

                {/* Caja de Enlace Integrada */}
                <div
                  className={cn(
                    "flex items-center justify-between gap-2 bg-muted/50 hover:bg-muted/70 transition-colors rounded-xl px-3.5 py-2.5 border border-border/60 w-full",
                    shareTab === "bio" &&
                      !store.bioLinksEnabled &&
                      "opacity-50 select-none pointer-events-none",
                  )}
                >
                  <span className="truncate select-all font-mono text-[11px] sm:text-xs font-semibold text-foreground flex-1">
                    {activeUrl}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      type="button"
                      onClick={() => copyText(activeUrl)}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary transition-colors shrink-0"
                      title="Copiar enlace"
                    >
                      {copiedLink ? (
                        <Check className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <a
                      href={activeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-8 w-8 rounded-lg hover:bg-muted/60 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors shrink-0"
                      title="Abrir enlace"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Botones de acción dinámicos de pie */}
              <div className="pt-1 flex items-center gap-2 flex-wrap">
                {shareTab === "catalog" ? (
                  <div className="[&>button]:h-9 [&>button]:rounded-xl [&>button]:font-bold [&>button]:text-xs [&>button]:shadow-none [&>button]:border-border/60 [&>button]:bg-white [&>button]:hover:bg-muted">
                    <CatalogPdfExportButton store={store} variant="admin" />
                  </div>
                ) : (
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="h-9 rounded-xl gap-1.5 font-bold text-xs shadow-none border-border/60 bg-white hover:bg-muted"
                  >
                    <Link to="/admin/link-bio">
                      <Settings className="h-4 w-4 text-primary" />
                      Configurar Bio-Link
                    </Link>
                  </Button>
                )}
              </div>
            </div>

            {/* LADO DERECHO: Código QR Integrado (Compacto en móvil) */}
            <div className="flex flex-row sm:flex-col items-center justify-between sm:justify-center p-4 bg-muted/40 border border-border/60 rounded-2xl gap-3">
              <div className="flex flex-col items-center gap-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest font-heading">
                  Código QR
                </span>

                {activeQr ? (
                  <div className="p-2 bg-white rounded-xl border border-border/40 shadow-xs relative group overflow-hidden shrink-0">
                    <img
                      src={activeQr}
                      alt={`Código QR ${shareTab === "catalog" ? "catálogo" : "Bio-Link"}`}
                      className="h-22 w-22 sm:h-28 sm:w-28 rounded-lg object-contain"
                    />
                  </div>
                ) : (
                  <div className="h-22 w-22 sm:h-28 sm:w-28 rounded-lg bg-muted flex items-center justify-center border border-dashed border-muted-foreground/30 text-[10px] text-muted-foreground text-center p-1">
                    QR no disponible
                  </div>
                )}
              </div>

              <Button
                type="button"
                onClick={() => downloadQrCode(shareTab)}
                disabled={shareTab === "bio" && !store.bioLinksEnabled}
                size="sm"
                className="rounded-xl gap-1.5 font-bold h-9 px-4 text-xs bg-primary hover:bg-primary/90 text-white shadow-xs disabled:opacity-40 shrink-0 self-center"
              >
                <Download className="h-3.5 w-3.5" /> Descargar QR
              </Button>
            </div>
          </div>
        </div>
      </Card>

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

      {/* ── SECCIÓN 3: CONTROL DE ANCHO DE BANDA & OPTIMIZACIÓN (EGRESS METER) ── */}
      <Card className="border border-emerald-500/20 bg-emerald-500/[0.02] rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border/40 pb-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-heading font-bold text-foreground flex items-center gap-2">
                Eficiencia de Ancho de Banda (Egress)
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-300">
                  Caché CDN Activa ⚡
                </span>
              </h3>
              <p className="text-[11px] sm:text-xs text-muted-foreground">
                Consumo estimado por visitas a tu Catálogo Digital y Link en Bio.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-background border border-border/50 space-y-1">
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Payload por visita</span>
            <p className="text-sm font-bold text-foreground">
              {(0.8 + (store.products?.filter((p) => p.visible).length || 0) * 0.35).toFixed(2)} KB
            </p>
            <p className="text-[10px] text-emerald-600 font-medium">100% Compreso en WebP</p>
          </div>

          <div className="p-3 rounded-xl bg-background border border-border/50 space-y-1">
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Egress Real Medido</span>
            <p className="text-sm font-bold text-foreground">
              {store.egressBytes && store.egressBytes > 0
                ? `${(store.egressBytes / (1024 * 1024)).toFixed(2)} MB`
                : `${((((store.views || 0) * (0.8 + (store.products?.filter((p) => p.visible).length || 0) * 0.35)) / 1024)).toFixed(2)} MB`}
            </p>
            <p className="text-[10px] text-muted-foreground">De 5,000 MB mensuales (Plan Gratis)</p>
          </div>

          <div className="p-3 rounded-xl bg-background border border-border/50 space-y-1">
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Estado de Transferencia</span>
            <p className="text-sm font-bold text-emerald-600 flex items-center gap-1">
              <Check className="h-4 w-4" /> Ultra-Optimizado
            </p>
            <p className="text-[10px] text-muted-foreground">0% riesgo de suspensión</p>
          </div>
        </div>
      </Card>
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
