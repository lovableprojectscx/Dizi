import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { PLANS } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, QrCode, Package, MessageCircle, ExternalLink, Check, Plus, Download, Sparkles, Link2, Settings, Store, HelpCircle } from "lucide-react";
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
  const catalogUrl = `${typeof window !== "undefined" ? window.location.origin : "https://tudominio.com"}/t/${store.slug}`;
  const bioUrl = `${typeof window !== "undefined" ? window.location.origin : "https://tudominio.com"}/bio/${store.slug}`;

  const [catalogQr, setCatalogQr] = useState<string>("");
  const [bioQr, setBioQr] = useState<string>("");
  const [copiedCatalog, setCopiedCatalog] = useState(false);
  const [copiedBio, setCopiedBio] = useState(false);
  const [qrType, setQrType] = useState<"catalog" | "bio">("catalog");

  useEffect(() => {
    QRCode.toDataURL(catalogUrl, { width: 400, margin: 1, color: { dark: '#0f172a', light: '#ffffff' } }).then(setCatalogQr).catch(() => {});
    QRCode.toDataURL(bioUrl, { width: 400, margin: 1, color: { dark: '#0f172a', light: '#ffffff' } }).then(setBioQr).catch(() => {});
  }, [catalogUrl, bioUrl]);

  const copyText = async (text: string, type: "catalog" | "bio") => {
    await navigator.clipboard.writeText(text);
    if (type === "catalog") {
      setCopiedCatalog(true);
      setTimeout(() => setCopiedCatalog(false), 2000);
    } else {
      setCopiedBio(true);
      setTimeout(() => setCopiedBio(false), 2000);
    }
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

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-10">
      {/* Header Minimalista */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
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

      {/* Grid de Enlaces e Información Principal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tarjeta de Catálogo */}
        <Card className="border border-border/50 rounded-xl bg-card shadow-sm hover:shadow-md/5 transition-all duration-300 flex flex-col justify-between overflow-hidden">
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Store className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">Catálogo de Productos</h3>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="text-muted-foreground/40 hover:text-muted-foreground transition-colors cursor-help">
                      <HelpCircle className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    Esta es la dirección pública de tu tienda en línea. Los clientes ingresan aquí para explorar tu catálogo y hacer sus pedidos.
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Fila del enlace compacta */}
            <div className="flex items-center gap-1 bg-muted/30 rounded-lg p-1 border border-border/10">
              <span className="text-xs text-muted-foreground truncate select-all px-2 flex-1 font-medium">
                {catalogUrl}
              </span>
              <Button 
                onClick={() => copyText(catalogUrl, "catalog")} 
                variant="ghost" 
                size="icon"
                className="h-8 w-8 rounded-md text-muted-foreground hover:text-primary transition-colors shrink-0"
              >
                {copiedCatalog ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
              <Link 
                to="/t/$slug"
                params={{ slug: store.slug }}
                target="_blank"
                className="h-8 w-8 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-primary transition-colors shrink-0"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          <div className="px-5 py-3.5 bg-muted/[0.08] border-t border-border/30 flex items-center gap-3 justify-end">
            <Button onClick={() => downloadQrCode("catalog")} variant="outline" size="sm" className="h-8 rounded-lg gap-1.5 font-bold text-xs border-border/50 hover:bg-muted shadow-none">
              <QrCode className="h-3.5 w-3.5" />
              QR
            </Button>
            <div className="[&>button]:h-8 [&>button]:rounded-lg [&>button]:font-bold [&>button]:text-xs [&>button]:shadow-none [&>button]:border-border/50 [&>button]:bg-transparent [&>button]:hover:bg-muted">
              <CatalogPdfExportButton store={store} variant="admin" />
            </div>
          </div>
        </Card>

        {/* Tarjeta de Bio-Link */}
        <Card className="border border-border/50 rounded-xl bg-card shadow-sm hover:shadow-md/5 transition-all duration-300 flex flex-col justify-between overflow-hidden">
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Link2 className="h-4 w-4 text-purple-600" />
                <h3 className="text-sm font-bold text-foreground">Link en Bio / Redes</h3>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="text-muted-foreground/40 hover:text-muted-foreground transition-colors cursor-help">
                      <HelpCircle className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    Página unificada y adaptada para móvil ideal para poner en la bio de Instagram/TikTok, que reúne tu catálogo, redes y ubicación comercial.
                  </TooltipContent>
                </Tooltip>
              </div>
              <span className={cn(
                "text-[9px] px-2 py-0.5 rounded-full font-bold tracking-wider uppercase border",
                store.bioLinksEnabled 
                  ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200/50" 
                  : "text-muted-foreground bg-muted border-border/40"
              )}>
                {store.bioLinksEnabled ? "Activo" : "Inactivo"}
              </span>
            </div>

            {/* Fila del enlace compacta */}
            <div className={cn(
              "flex items-center gap-1 bg-muted/30 rounded-lg p-1 border border-border/10",
              !store.bioLinksEnabled && "opacity-40 pointer-events-none"
            )}>
              <span className="text-xs text-muted-foreground truncate select-all px-2 flex-1 font-medium">
                {bioUrl}
              </span>
              <Button 
                onClick={() => copyText(bioUrl, "bio")} 
                disabled={!store.bioLinksEnabled}
                variant="ghost" 
                size="icon"
                className="h-8 w-8 rounded-md text-muted-foreground hover:text-primary transition-colors shrink-0"
              >
                {copiedBio ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
              <Link 
                to="/bio/$slug"
                params={{ slug: store.slug }}
                target="_blank"
                className={cn(
                  "h-8 w-8 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-primary transition-colors shrink-0",
                  !store.bioLinksEnabled && "pointer-events-none opacity-40"
                )}
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          <div className="px-5 py-3.5 bg-muted/[0.08] border-t border-border/30 flex items-center gap-3 justify-end">
            <Button 
              onClick={() => downloadQrCode("bio")} 
              disabled={!store.bioLinksEnabled}
              variant="outline" 
              size="sm" 
              className="h-8 rounded-lg gap-1.5 font-bold text-xs border-border/50 hover:bg-muted shadow-none disabled:opacity-40"
            >
              <QrCode className="h-3.5 w-3.5" />
              QR
            </Button>
            <Button asChild size="sm" variant="default" className="h-8 rounded-lg gap-1.5 font-bold text-xs shadow-none cursor-pointer">
              <Link to="/admin/link-bio">
                <Settings className="h-3.5 w-3.5" />
                Configurar
              </Link>
            </Button>
          </div>
        </Card>
      </div>

      {/* Grid de Métricas Ultra-Minimalista */}
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
        <Link to="/admin/link-bio" className="block transition-all hover:scale-[1.01] active:scale-[0.99] h-full">
          <MetricCard
            icon={<Link2 className="h-4 w-4 text-purple-500" />}
            label="Link en Bio"
            value={store.bioLinksEnabled ? "Activo" : "Inactivo"}
            trend={store.bioLinksEnabled ? "Ver configuración" : "Activar ahora"}
            tooltipText="Indica si tienes habilitada la página web para tus redes sociales (Instagram, TikTok). Haz clic para configurarla."
            className="h-full border-purple-100 hover:border-purple-200 dark:border-purple-950 dark:hover:border-purple-900 bg-purple-500/[0.02]"
          />
        </Link>
        <MetricCard
          icon={<Sparkles className="h-4 w-4 text-amber-500" />}
          label="Plan Actual"
          value={plan.name}
          trend="Suscripción activa"
          tooltipText="El tipo de plan que tienes contratado. Si necesitas más capacidad o funciones, puedes cambiar de plan."
        />
      </div>

      {/* Sección del Código QR Oficial */}
      {(catalogQr || (bioQr && store.bioLinksEnabled)) && (
        <Card className="overflow-hidden border border-border/50 shadow-sm bg-gradient-to-br from-card to-muted/[0.04] rounded-xl max-w-lg mx-auto w-full">
          <CardContent className="p-6 flex flex-col items-center text-center gap-6">
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1.5">
                <h3 className="text-base font-bold text-foreground">Código QR del Negocio</h3>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="text-muted-foreground/40 hover:text-muted-foreground transition-colors cursor-help">
                      <HelpCircle className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    Código QR descargable para imprimir. Colócalo en tu local físico o empaques para que tus clientes lo escaneen y accedan directamente.
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Selector de tipo de QR minimalista si el Bio-Link está habilitado */}
            {store.bioLinksEnabled && (
              <div className="inline-flex p-0.5 bg-muted rounded-lg border border-border/10">
                <button 
                  onClick={() => setQrType("catalog")}
                  className={cn(
                    "px-3 py-1 text-xs font-bold rounded-md transition-colors",
                    qrType === "catalog" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Catálogo
                </button>
                <button 
                  onClick={() => setQrType("bio")}
                  className={cn(
                    "px-3 py-1 text-xs font-bold rounded-md transition-colors",
                    qrType === "bio" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Bio-Link
                </button>
              </div>
            )}

            {/* Imagen del QR con marco minimalista */}
            <div className="p-2 bg-white rounded-lg border border-border/10 shadow-sm">
              <img 
                src={qrType === "catalog" ? catalogQr : bioQr} 
                alt={`Código QR del ${qrType === "catalog" ? "catálogo" : "Bio-Link"}`} 
                className="h-36 w-36 sm:h-40 sm:w-40 rounded-md" 
              />
            </div>

            <Button onClick={() => downloadQrCode(qrType)} size="sm" className="rounded-lg gap-1.5 font-bold h-9 px-5 shadow-sm cursor-pointer">
              <Download className="h-3.5 w-3.5" /> Guardar imagen QR
            </Button>
          </CardContent>
        </Card>
      )}
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

