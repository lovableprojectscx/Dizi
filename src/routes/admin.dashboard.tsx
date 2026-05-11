import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { PLANS } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, QrCode, Package, MessageCircle, ExternalLink, Check } from "lucide-react";
import QRCode from "qrcode";
import { toast } from "sonner";
import { CatalogPdfExportButton } from "@/components/public/CatalogPdfExport";

export const Route = createFileRoute("/admin/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const id = useApp((s) => s.currentStoreId)!;
  const store = useApp((s) => s.stores.find((st) => st.id === id))!;
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
            <Button onClick={copy} variant="outline">
              {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
              {copied ? "Copiado" : "Copiar enlace"}
            </Button>
            <Button onClick={downloadQr} variant="outline">
              <QrCode className="h-4 w-4 mr-1" /> Descargar QR
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
            <CardTitle>Tu código QR</CardTitle>
          </CardHeader>
          <CardContent>
            <img src={qr} alt="QR del catálogo" className="h-48 w-48 rounded-lg border" />
            <p className="mt-2 text-sm text-muted-foreground">
              Imprime este QR y compártelo en tu local o redes.
            </p>
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
