import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { PLANS } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, QrCode, Package, MessageCircle, ExternalLink, Check, Plus, Download } from "lucide-react";
import QRCode from "qrcode";
import { toast } from "sonner";
import { CatalogPdfExportButton } from "@/components/public/CatalogPdfExport";

export const Route = createFileRoute("/admin/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const id = useApp((s) => s.currentStoreId);
  const store = useApp((s) => s.stores.find((st) => st.id === id));
  
  if (!store) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground animate-pulse">Cargando tu tienda...</p>
        </div>
      </div>
    );
  }

  const plan = PLANS[store.plan];
  const url = `${typeof window !== "undefined" ? window.location.origin : "https://tudominio.com"}/t/${store.slug}`;
  const [qr, setQr] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    QRCode.toDataURL(url, { width: 320, margin: 1 }).then(setQr).catch(() => {});
  }, [url]);

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Enlace copiado");
    setTimeout(() => setCopied(false), 1500);
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
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Inicio</h1>
        <p className="text-sm text-muted-foreground">
          Resumen de tu tienda <strong>{store.name}</strong>.
        </p>
      </div>

      {store.products.length === 0 && (
        <Card className="border-primary border-2 border-dashed bg-primary/5 shadow-xl shadow-primary/10 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <CardContent className="p-8 sm:p-12 flex flex-col items-center text-center space-y-5">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-primary ring-8 ring-primary/5">
              <Package className="h-10 w-10" />
            </div>
            <div className="space-y-2 max-w-md">
              <h3 className="text-2xl font-bold tracking-tight">¡Catálogo listo para despegar! 🚀</h3>
              <p className="text-muted-foreground">
                Tu tienda ya está en línea, pero aún no tiene productos. Comienza agregando tu primer producto para que tus clientes puedan verlo y comprarte.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Button asChild size="lg" className="font-bold gap-2 rounded-full px-8 shadow-lg shadow-primary/25">
                <Link to="/admin/productos">
                  <Plus className="h-5 w-5" /> Agregar mi primer producto
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-5 flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground">
              Tu catálogo está en línea:
            </p>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="text-primary font-semibold break-all hover:underline inline-flex items-center gap-1"
            >
              {url}
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={copy} variant="outline" className="rounded-full">
              {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
              {copied ? "Copiado" : "Copiar enlace"}
            </Button>
            <Button onClick={downloadQr} variant="outline" className="rounded-full">
              <QrCode className="h-4 w-4 mr-1" /> QR
            </Button>
            <CatalogPdfExportButton store={store} />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          icon={<Package className="h-5 w-5" />}
          label="Productos activos"
          value={`${activeProducts}/${plan.productLimit === Infinity ? "∞" : plan.productLimit}`}
        />
        <MetricCard
          icon={<MessageCircle className="h-5 w-5" />}
          label="Clics a WhatsApp"
          value={String(store.whatsappClicks)}
        />
        <MetricCard
          icon={<QrCode className="h-5 w-5" />}
          label="Plan actual"
          value={plan.name}
        />
      </div>

      {qr && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <QrCode className="h-4 w-4 text-primary" />
              Tu código QR
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative group">
              <img src={qr} alt="QR" className="h-40 w-40 rounded-xl border shadow-inner transition-transform group-hover:scale-105" />
              <div className="absolute inset-0 bg-black/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="space-y-3 text-center sm:text-left">
              <p className="text-sm text-muted-foreground max-w-xs">
                Imprime este código y colócalo en tu local físico o compártelo en tus historias de Instagram para que tus clientes accedan directo a tu catálogo.
              </p>
              <Button onClick={downloadQr} variant="outline" size="sm" className="rounded-full gap-2">
                <Download className="h-4 w-4" /> Descargar imagen QR
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
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          {icon}
          {label}
        </div>
        <div className="mt-2 text-3xl font-bold tracking-tight">{value}</div>
      </CardContent>
    </Card>
  );
}
