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
          <p className="text-sm text-muted-foreground animate-pulse font-medium">Cargando tu espacio...</p>
        </div>
      </div>
    );
  }

  const plan = PLANS[store.plan];
  const isTrial = store.subscriptionStatus === "trial";
  const daysLeft = store.planExpiresAt
    ? Math.max(0, Math.ceil((new Date(store.planExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;
  const catalogUrl = `${typeof window !== "undefined" ? window.location.origin : "https://dizi.idenza.site"}/t/${store.slug}`;
  const bioUrl = `${typeof window !== "undefined" ? window.location.origin : "https://dizi.idenza.site"}/bio/${store.slug}`;

  const [catalogQr, setCatalogQr] = useState<string>("");
  const [bioQr, setBioQr] = useState<string>("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [shareTab, setShareTab] = useState<"catalog" | "bio">("catalog");

  useEffect(() => {
    QRCode.toDataURL(catalogUrl, { width: 400, margin: 1, color: { dark: '#0f172a', light: '#ffffff' } }).then(setCatalogQr).catch(() => {});
    QRCode.toDataURL(bioUrl, { width: 400, margin: 1, color: { dark: '#0f172a', light: '#ffffff' } }).then(setBioQr).catch(() => {});
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
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      
      {/* Header Minimalista */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{store.name}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Panel de administración de tu catálogo</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center">
          <span className="text-[10px] font-bold bg-primary/5 text-primary px-3 py-1 rounded-full border border-primary/10 tracking-wider uppercase">
            Plan {plan.name}
          </span>
        </div>
      </div>

      {/* Banner de estado inicial minimalista */}
      {store.products.length === 0 && (
        <Card className="border border-primary/20 bg-primary/[0.02] shadow-none rounded-xl">
          <CardContent className="p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-semibold text-foreground">Tu catálogo está listo</h3>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" className="text-muted-foreground/40 hover:text-muted-foreground transition-colors cursor-help">
                        <HelpCircle className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      Comienza agregando productos para que tus clientes puedan ver lo que ofreces y enviarte pedidos directos por WhatsApp.
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className="text-xs text-muted-foreground">Comienza agregando tus primeros productos.</p>
              </div>
            </div>
            <Button asChild size="sm" className="rounded-lg font-bold text-xs h-9">
              <Link to="/admin/productos">
                <Plus className="h-4 w-4 mr-1.5" /> Agregar primer producto
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── SECCIÓN 1: GRID DE MÉTRICAS (Ahora al inicio) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={<Package className="h-4 w-4 text-blue-500" />}
          label="Productos activos"
          value={`${activeProducts}/${plan.productLimit === Infinity ? "∞" : plan.productLimit}`}
          trend="En catálogo público"
          tooltipText="Número de productos visibles en tu catálogo actual frente al límite de productos que admite tu plan."
        />
        <MetricCard
          icon={<MessageCircle className="h-4 w-4 text-emerald-500" />}
          label="Clics WhatsApp"
          value={String(store.whatsappClicks)}
          trend="Interacciones"
          tooltipText="Número total de veces que tus clientes han hecho clic para iniciar un chat o enviar un pedido por WhatsApp."
        />
        <MetricCard
          icon={<Eye className="h-4 w-4 text-purple-500" />}
          label="Visitas al catálogo"
          value={String(store.views || 0)}
          trend="Visualizaciones"
          tooltipText="Número total de veces que tus clientes han ingresado a ver tu catálogo."
        />
        <MetricCard
          icon={isTrial ? <Clock className="h-4 w-4 text-amber-500 animate-pulse" /> : <Sparkles className="h-4 w-4 text-amber-500" />}
          label="Plan Actual"
          value={isTrial ? `${plan.name} (Prueba)` : plan.name}
          trend={isTrial ? `Prueba: quedan ${daysLeft} días` : "Suscripción activa"}
          tooltipText={isTrial ? "Estás disfrutando de un período de prueba gratuito de 15 días con acceso a todas las funciones premium del Plan Emprendedor." : "El tipo de plan que tienes contratado. Si necesitas más capacidad o funciones, puedes cambiar de plan."}
        />
      </div>

      {/* ── SECCIÓN 2: COMPARTE TU TIENDA (Widget Integrado con QR) ── */}
      <Card className="border border-border/50 rounded-xl bg-card shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6">
          
          <div className="flex items-center gap-2 border-b pb-3 border-border/30 mb-5">
            <Share2 className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold tracking-tight text-foreground uppercase tracking-wider">Comparte tu Negocio</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            
            {/* LADO IZQUIERDO: Selector de Pestaña y Enlace */}
            <div className="md:col-span-2 space-y-4">
              
              {/* Selector tipo Pestaña */}
              <div className="inline-flex p-0.5 bg-muted rounded-lg border border-border/10">
                <button
                  onClick={() => setShareTab("catalog")}
                  className={cn(
                    "px-4 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5",
                    shareTab === "catalog"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Store className="h-3.5 w-3.5" />
                  Catálogo de Productos
                </button>
                <button
                  onClick={() => setShareTab("bio")}
                  className={cn(
                    "px-4 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5",
                    shareTab === "bio"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Link2 className="h-3.5 w-3.5" />
                  Link en Bio (Redes)
                </button>
              </div>

              {/* Contenido Dinámico según pestaña */}
              <div className="space-y-3">
                {shareTab === "catalog" ? (
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">Dirección de tu Tienda Online</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Esta es la dirección pública de tu catálogo en línea. Compártela con tus clientes para que puedan explorar productos y enviarte pedidos directamente a tu WhatsApp.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">Tu Página Unificada de Redes</p>
                      <span className={cn(
                        "text-[9px] px-2 py-0.5 rounded-full font-bold uppercase border tracking-wider",
                        store.bioLinksEnabled 
                          ? "text-emerald-600 bg-emerald-50 border-emerald-200/50" 
                          : "text-muted-foreground bg-muted border-border/40"
                      )}>
                        {store.bioLinksEnabled ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Una página optimizada para móvil ideal para colocar en la bio de tu Instagram, TikTok o Facebook, que reúne tu catálogo, tus redes sociales y ubicación física.
                    </p>
                  </div>
                )}

                {/* Caja de Enlace Integrada */}
                <div className={cn(
                  "flex items-center justify-between gap-3 bg-muted/20 hover:bg-muted/30 transition-colors rounded-xl px-3 py-2.5 border border-border/40 max-w-lg",
                  shareTab === "bio" && !store.bioLinksEnabled && "opacity-50 select-none pointer-events-none"
                )}>
                  <span className="truncate select-all font-mono text-xs font-semibold text-foreground/80 flex-1">{activeUrl}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      type="button"
                      onClick={() => copyText(activeUrl)}
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-md text-muted-foreground hover:text-primary transition-colors shrink-0"
                    >
                      {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                    <a href={activeUrl} target="_blank" rel="noopener noreferrer" className="h-7 w-7 rounded-md hover:bg-muted/40 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors shrink-0">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Botones de acción dinámicos de pie */}
              <div className="pt-2 flex items-center gap-2 flex-wrap">
                {shareTab === "catalog" ? (
                  <div className="[&>button]:h-9 [&>button]:rounded-lg [&>button]:font-bold [&>button]:text-xs [&>button]:shadow-none [&>button]:border-border/60 [&>button]:bg-transparent [&>button]:hover:bg-muted">
                    <CatalogPdfExportButton store={store} variant="admin" />
                  </div>
                ) : (
                  <Button asChild size="sm" variant="outline" className="h-9 rounded-lg gap-1.5 font-bold text-xs shadow-none border-border/60">
                    <Link to="/admin/link-bio">
                      <Settings className="h-3.5 w-3.5 text-primary" />
                      Configurar Bio-Link
                    </Link>
                  </Button>
                )}
              </div>

            </div>

            {/* LADO DERECHO: Código QR Integrado */}
            <div className="flex flex-col items-center justify-center p-4 bg-muted/10 border border-border/30 rounded-xl space-y-3.5">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Código QR del Negocio</span>
              
              {activeQr ? (
                <div className="p-2 bg-white rounded-lg border border-border/10 shadow-sm relative group overflow-hidden">
                  <img
                    src={activeQr}
                    alt={`Código QR ${shareTab === "catalog" ? "catálogo" : "Bio-Link"}`}
                    className="h-28 w-28 sm:h-32 sm:w-32 rounded-md object-contain"
                  />
                </div>
              ) : (
                <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-md bg-muted flex items-center justify-center border-2 border-dashed border-muted-foreground/10 text-xs text-muted-foreground text-center p-2">
                  QR no disponible
                </div>
              )}

              <Button
                onClick={() => downloadQrCode(shareTab)}
                disabled={shareTab === "bio" && !store.bioLinksEnabled}
                size="sm"
                variant="default"
                className="rounded-lg gap-1.5 font-bold h-8 px-4 text-xs shadow-none disabled:opacity-40"
              >
                <Download className="h-3 w-3" /> Descargar QR
              </Button>
            </div>

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
  className 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string;
  trend?: string;
  tooltipText?: string;
  className?: string;
}) {
  return (
    <Card className={cn("border border-border/50 shadow-sm hover:shadow-md/5 transition-all duration-300 rounded-xl overflow-hidden relative group bg-card", className)}>
      <CardContent className="p-4 flex flex-col justify-between h-full min-h-[110px]">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</span>
              {tooltipText && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="text-muted-foreground/30 hover:text-muted-foreground transition-colors cursor-help">
                      <HelpCircle className="h-3 w-3" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-left">
                    {tooltipText}
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            <div className="text-muted-foreground shrink-0 opacity-80 group-hover:scale-105 transition-transform">
              {icon}
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-light tracking-tight text-foreground">{value}</div>
        </div>
        {trend && (
          <p className="text-[10px] text-muted-foreground font-medium pt-1">
            {trend}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
