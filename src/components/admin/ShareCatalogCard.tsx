/**
 * @file ShareCatalogCard.tsx
 * @description Tarjeta reutilizable con código QR y enlaces para compartir el catálogo digital
 * y la página unificada de Link en Bio (F52 / reutilizado de admin.dashboard.tsx).
 * Genera el QR y los enlaces de forma reactiva y dinámica según el dominio del entorno.
 */

import React, { useState, useEffect, Suspense } from "react";
import { Link } from "@tanstack/react-router";
import QRCode from "qrcode";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Share2,
  Store,
  Link2,
  Copy,
  Check,
  ExternalLink,
  Settings,
  Download,
} from "lucide-react";
import type { Store as StoreType } from "@/lib/types";

const CatalogPdfExportButton = React.lazy(() =>
  import("@/components/public/CatalogPdfExport").then((m) => ({
    default: m.CatalogPdfExportButton,
  }))
);

export interface ShareCatalogCardProps {
  store: StoreType;
  title?: string;
  className?: string;
}

export function ShareCatalogCard({
  store,
  title = "Comparte tu Negocio",
  className,
}: ShareCatalogCardProps) {
  const [catalogQr, setCatalogQr] = useState<string>("");
  const [bioQr, setBioQr] = useState<string>("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [shareTab, setShareTab] = useState<"catalog" | "bio">("catalog");

  const catalogUrl = store
    ? `${typeof window !== "undefined" ? window.location.origin : "https://dizi.idenza.site"}/t/${store.slug}`
    : "";
  const bioUrl = store
    ? `${typeof window !== "undefined" ? window.location.origin : "https://dizi.idenza.site"}/bio/${store.slug}`
    : "";

  useEffect(() => {
    if (!catalogUrl || !bioUrl) return;
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

  const activeQr = shareTab === "catalog" ? catalogQr : bioQr;
  const activeUrl = shareTab === "catalog" ? catalogUrl : bioUrl;

  return (
    <Card className={cn("border border-border/80 rounded-2xl bg-card shadow-xs overflow-hidden", className)}>
      <div className="p-4 sm:p-6">
        <div className="flex items-center gap-2 border-b pb-2.5 sm:pb-3 border-border/40 mb-4 sm:mb-5">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
            <Share2 className="h-4 w-4" />
          </div>
          <h2 className="text-xs sm:text-sm font-heading font-bold tracking-tight text-foreground uppercase tracking-wider">
            {title}
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
                  <Suspense fallback={null}>
                    <CatalogPdfExportButton store={store} variant="admin" />
                  </Suspense>
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
  );
}
