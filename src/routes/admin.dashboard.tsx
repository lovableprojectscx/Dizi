import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { PLANS } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, QrCode, Package, MessageCircle, ExternalLink, Check, Plus, Download, Sparkles } from "lucide-react";
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
  const url = `${typeof window !== "undefined" ? window.location.origin : "https://tudominio.com"}/t/${store.slug}`;
  const [qr, setQr] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    QRCode.toDataURL(url, { width: 400, margin: 1, color: { dark: '#0f172a', light: '#ffffff' } }).then(setQr).catch(() => {});
  }, [url]);

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Enlace copiado");
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQr = () => {
    if (!qr) return;
    const a = document.createElement("a");
    a.href = qr;
    a.download = `${store.slug}-qr.png`;
    a.click();
  };

  const activeProducts = store.products.filter((p) => p.visible).length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Inicio</h1>
        <p className="text-sm text-muted-foreground">
          Resumen general de tu tienda <strong className="text-foreground">{store.name}</strong>
        </p>
      </div>

      {store.products.length === 0 && (
        <Card className="border-primary/20 bg-primary/5 shadow-none overflow-hidden relative">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
          <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-20 h-20 bg-primary/10 rounded-full blur-xl" />
          <CardContent className="p-8 sm:p-10 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left relative z-10">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 ring-4 ring-primary/5">
              <Sparkles className="h-8 w-8" />
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="text-xl font-bold tracking-tight text-foreground">¡Tu catálogo está listo!</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Comienza agregando productos para que tus clientes puedan ver lo que ofreces.
              </p>
            </div>
            <Button asChild size="lg" className="rounded-full shadow-lg gap-2 whitespace-nowrap">
              <Link to="/admin/productos">
                <Plus className="h-5 w-5" /> Agregar primer producto
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Main Link Card */}
      <Card className="border shadow-sm overflow-hidden bg-card">
        <CardContent className="p-0">
          <div className="bg-muted/30 p-4 sm:p-6 border-b">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-3">
              <ExternalLink className="h-4 w-4 text-primary" /> Tu catálogo en línea
            </h3>
            <div className="flex items-center bg-background border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 transition-all">
              <div className="flex-1 px-4 py-3 text-sm text-muted-foreground truncate select-all">
                {url}
              </div>
              <Button 
                onClick={copy} 
                variant="ghost" 
                className={cn(
                  "h-auto py-3 px-5 rounded-none font-semibold border-l hover:bg-primary/5",
                  copied ? "text-green-600 hover:text-green-700" : "text-primary"
                )}
              >
                {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                {copied ? "Copiado" : "Copiar"}
              </Button>
            </div>
          </div>
          <div className="p-4 sm:p-6 bg-card flex flex-col sm:flex-row gap-3">
            <Button onClick={downloadQr} variant="outline" className="flex-1 h-12 rounded-xl gap-2 font-semibold">
              <QrCode className="h-4 w-4 text-muted-foreground" />
              Descargar QR
            </Button>
            <div className="flex-1 [&>button]:w-full [&>button]:h-12 [&>button]:rounded-xl [&>button]:font-semibold">
              <CatalogPdfExportButton store={store} variant="admin" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        <MetricCard
          icon={<Package className="h-4 w-4 text-blue-500" />}
          label="Productos activos"
          value={`${activeProducts}/${plan.productLimit === Infinity ? "∞" : plan.productLimit}`}
          trend="En catálogo"
        />
        <MetricCard
          icon={<MessageCircle className="h-4 w-4 text-green-500" />}
          label="Clics WhatsApp"
          value={String(store.whatsappClicks)}
          trend="Interacciones"
        />
        <MetricCard
          icon={<Sparkles className="h-4 w-4 text-amber-500" />}
          label="Plan Actual"
          value={plan.name}
          trend="Suscripción"
          className="col-span-2 md:col-span-1"
        />
      </div>

      {/* QR Display */}
      {qr && (
        <Card className="overflow-hidden border-none shadow-md bg-gradient-to-br from-card to-muted/20">
          <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-8">
            <div className="relative group shrink-0">
              <div className="absolute -inset-2 bg-gradient-to-tr from-primary/20 to-transparent rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <img src={qr} alt="Código QR de la tienda" className="h-40 w-40 sm:h-48 sm:w-48 rounded-xl border-2 border-white shadow-xl bg-white relative z-10 transition-transform duration-500 group-hover:scale-105" />
            </div>
            <div className="space-y-4 text-center sm:text-left flex-1">
              <div>
                <h3 className="text-lg font-bold text-foreground">Comparte tu código QR</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                  Imprímelo para tu mostrador, empaques o compártelo en tus historias de Instagram y Facebook.
                </p>
              </div>
              <Button onClick={downloadQr} className="rounded-full gap-2 shadow-sm">
                <Download className="h-4 w-4" /> Guardar imagen QR
              </Button>
            </div>
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
  className 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string;
  trend?: string;
  className?: string;
}) {
  return (
    <Card className={cn("border shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden relative group", className)}>
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/5 to-transparent rounded-full -mr-10 -mt-10 blur-xl group-hover:bg-primary/10 transition-colors duration-500" />
      <CardContent className="p-4 sm:p-5 relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 bg-muted rounded-lg shrink-0">
            {icon}
          </div>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{value}</span>
        </div>
        {trend && (
          <p className="text-[11px] text-muted-foreground mt-1 font-medium">{trend}</p>
        )}
      </CardContent>
    </Card>
  );
}
