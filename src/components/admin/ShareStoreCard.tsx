/**
 * @file ShareStoreCard.tsx
 * @description Bloque único y compacto para compartir en Inicio (/admin/dashboard) — F55.1.
 * Reemplaza a CatalogImageCard y ShareCatalogCard en Inicio:
 * - Si hay >= 3 productos con foto: miniatura de catálogo (historia 9:16) y botón principal coral
 *   "Compartir" (Web Share con imagen + texto + link; en escritorio descarga imagen y copia texto).
 * - Si hay < 3 productos con foto: sin miniatura; botón principal comparte solo el link.
 * - Fila de 4 botones secundarios chicos: "Copiar link", "QR", "PDF" y "Link en Bio".
 * - Registra share_events source='catalogo' y llama claim_trial_rewards en cada compartir.
 */

import React, { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { Link } from "@tanstack/react-router";
import QRCode from "qrcode";
import { toast } from "sonner";
import {
  Share2,
  Copy,
  Check,
  QrCode,
  Link2,
  Download,
  X,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/store";
import type { Store } from "@/lib/types";
import { prepareCatalogShareData } from "@/lib/share-image/data";
import { loadCatalogImageAssets } from "@/lib/share-image/assets";
import { drawShareImage } from "@/lib/share-image/styles";
import { logShareEvent } from "@/lib/share-image/metrics";
import { claimTrialRewards } from "@/lib/trial-rewards";
import { supabase } from "@/lib/supabase";

const CatalogPdfExportButton = React.lazy(() =>
  import("@/components/public/CatalogPdfExport").then((m) => ({
    default: m.CatalogPdfExportButton,
  })),
);

export interface ShareStoreCardProps {
  store: Store;
  className?: string;
}

export function ShareStoreCard({ store, className }: ShareStoreCardProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [loadingThumb, setLoadingThumb] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const assetsRef = useRef<any>(null);

  const origin = typeof window !== "undefined" && window.location?.origin
    ? window.location.origin
    : "https://dizi.la";
  const catalogUrl = `${origin}/t/${store.slug}`;
  const shareText = `¡Ya tenemos nuestro catálogo! 🎉 Mira todos nuestros productos y pide por WhatsApp aquí: ${catalogUrl}`;

  // Productos con foto real
  const eligibleProducts = useMemo(() => {
    return (store.products || []).filter(
      (p) => !p.isSample && p.visible && p.image && p.image.trim().length > 0,
    );
  }, [store.products]);

  // Productos visibles totales (para evaluar si la tienda tiene 0 productos)
  const visibleProducts = useMemo(() => {
    return (store.products || []).filter((p) => p.visible);
  }, [store.products]);

  const has3OrMore = eligibleProducts.length >= 3;
  const hasZeroProducts = visibleProducts.length === 0;

  // Generar QR para el diálogo de QR
  useEffect(() => {
    if (!catalogUrl) return;
    QRCode.toDataURL(catalogUrl, {
      width: 400,
      margin: 1,
      color: { dark: "#0f172a", light: "#ffffff" },
    })
      .then(setQrDataUrl)
      .catch(() => {});
  }, [catalogUrl]);

  // Cargar recursos y dibujar miniatura en canvas (solo cuando hay >= 3 productos)
  useEffect(() => {
    if (!has3OrMore) return;
    let active = true;
    const abortController = new AbortController();

    async function loadThumb() {
      setLoadingThumb(true);
      try {
        const assets = await loadCatalogImageAssets(store, origin, {
          signal: abortController.signal,
          qrSize: 260,
        });

        if (active) {
          assetsRef.current = assets;
          const canvas = canvasRef.current;
          if (canvas) {
            const ctx = canvas.getContext("2d");
            if (ctx) {
              const shareData = prepareCatalogShareData(store, origin);
              drawShareImage(ctx, shareData, "catalogo", "historia", assets);
            }
          }
        }
      } catch (err) {
        console.warn("[ShareStoreCard] Error preparando miniatura:", err);
      } finally {
        if (active) setLoadingThumb(false);
      }
    }

    loadThumb();

    return () => {
      active = false;
      abortController.abort();
    };
  }, [store, origin, eligibleProducts.length, has3OrMore]);

  // Acciones posteriores a compartir: métrica en share_events y claim de logros Pro
  const triggerPostShareActions = async () => {
    try {
      await logShareEvent(supabase, {
        storeId: store.id,
        productId: null,
        style: "catalogo",
        size: "historia",
        source: "catalogo",
      });

      const result = await claimTrialRewards(store.id, supabase);
      if (result.totalDaysAdded > 0) {
        useApp.getState().applyGrantedTrialDays(store.id, result.totalDaysAdded);
        useApp.getState().fetchData(true);
      }
    } catch (err) {
      console.warn("[ShareStoreCard] Error en post-share actions:", err);
    }
  };

  // Copiar link simple
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(catalogUrl);
      setCopiedLink(true);
      toast.success("Enlace copiado");
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      toast.error("No se pudo copiar el enlace");
    }
  };

  // Descargar código QR desde el diálogo
  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `${store.slug}-qr.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("Código QR descargado");
  };

  // Botón principal "Compartir"
  const handleMainShare = async () => {
    if (sharing) return;
    setSharing(true);

    try {
      if (has3OrMore) {
        // Compartir imagen + texto + link
        const canvas = canvasRef.current;
        let blob: Blob | null = null;
        if (canvas) {
          blob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob((b) => resolve(b), "image/png"),
          );
        }

        if (blob) {
          const file = new File([blob], `catalogo-${store.slug}-historia.png`, {
            type: "image/png",
          });

          // Web Share API con archivo (celulares modernos)
          if (
            typeof navigator !== "undefined" &&
            navigator.canShare &&
            navigator.canShare({ files: [file] })
          ) {
            await navigator.share({
              files: [file],
              title: "¡Ya tenemos nuestro catálogo! 🎉",
              text: shareText,
              url: catalogUrl,
            });
            toast.success("Catálogo compartido con éxito");
            await triggerPostShareActions();
            return;
          }
        }

        // Web Share sin archivos o fallback de texto + URL
        if (typeof navigator !== "undefined" && (navigator as any).share) {
          await (navigator as any).share({
            title: "¡Ya tenemos nuestro catálogo! 🎉",
            text: shareText,
            url: catalogUrl,
          });
          toast.success("Enlace compartido con éxito");
          await triggerPostShareActions();
        } else {
          // Escritorio sin Web Share: descarga imagen y copia texto
          if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `catalogo-${store.slug}-historia.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          }
          await navigator.clipboard.writeText(shareText);
          toast.info("Imagen descargada y texto copiado para tus redes");
          await triggerPostShareActions();
        }
      } else {
        // Menos de 3 productos con foto: comparte solo el link
        if (typeof navigator !== "undefined" && (navigator as any).share) {
          await (navigator as any).share({
            title: store.name,
            text: `¡Mira nuestro catálogo digital! 🛍️ Pide por WhatsApp aquí: ${catalogUrl}`,
            url: catalogUrl,
          });
          toast.success("Enlace compartido con éxito");
          await triggerPostShareActions();
        } else {
          await navigator.clipboard.writeText(catalogUrl);
          toast.success("Enlace copiado al portapapeles");
          await triggerPostShareActions();
        }
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        console.warn("[ShareStoreCard] Compartir cancelado o error:", err);
        try {
          await navigator.clipboard.writeText(catalogUrl);
          toast.success("Enlace copiado al portapapeles");
          await triggerPostShareActions();
        } catch {
          /* noop */
        }
      }
    } finally {
      setSharing(false);
    }
  };

  return (
    <Card
      className={cn("border border-border/80 rounded-2xl bg-card shadow-xs overflow-hidden", className)}
      data-testid="share-store-card"
    >
      <div className="p-4 sm:p-5 space-y-3.5">
        {/* 1. Cabecera compacta: Icono + Título + Línea explicativa única */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0">
            <Share2 className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-[17px] sm:text-[19px] text-foreground tracking-tight leading-tight">
              Comparte tu tienda
            </h2>
            <p className="text-[13px] text-muted-foreground leading-tight mt-0.5">
              Compártelo en tus estados y redes
            </p>
          </div>
        </div>

        {/* 2. Bloque principal: Con miniatura (>= 3 prods) o sin miniatura (< 3 prods) */}
        {has3OrMore ? (
          <div className="flex items-center gap-3.5 sm:gap-4 p-2.5 sm:p-3 rounded-xl bg-muted/30 border border-border/50">
            {/* Miniatura chica formato historia (9:16) */}
            <div className="relative w-14 sm:w-16 aspect-[9/16] rounded-lg overflow-hidden border border-border/60 bg-muted shrink-0 shadow-xs">
              {loadingThumb && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                </div>
              )}
              <canvas
                ref={canvasRef}
                width={1080}
                height={1920}
                data-testid="catalog-thumb-canvas"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Texto y botón coral */}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="space-y-0.5">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-primary">
                  <Sparkles className="h-3 w-3" /> Imagen lista
                </span>
                <p className="text-[13px] font-semibold text-foreground leading-snug line-clamp-2">
                  Collage de tus productos para anunciar tu catálogo
                </p>
              </div>

              <Button
                type="button"
                onClick={handleMainShare}
                disabled={sharing}
                data-testid="main-share-button"
                className="w-full sm:w-auto min-h-[42px] px-5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-[14px] sm:text-[15px] shadow-xs gap-2 transition-all cursor-pointer"
              >
                {sharing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Share2 className="h-4 w-4" />
                )}
                <span>Compartir</span>
              </Button>
            </div>
          </div>
        ) : (
          /* Sin miniatura: botón principal comparte solo el link */
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
            <p className="text-[13px] font-medium text-muted-foreground leading-snug">
              Envía el enlace directo a tus clientes por WhatsApp o redes sociales
            </p>
            {hasZeroProducts ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleMainShare}
                disabled={sharing}
                data-testid="main-share-button"
                className="w-full sm:w-auto min-h-[42px] px-5 rounded-xl border-border/80 bg-background hover:bg-muted text-foreground font-semibold text-[14px] sm:text-[15px] shadow-none gap-2 shrink-0 transition-all cursor-pointer"
              >
                {sharing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Share2 className="h-4 w-4" />
                )}
                <span>Compartir</span>
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleMainShare}
                disabled={sharing}
                data-testid="main-share-button"
                className="w-full sm:w-auto min-h-[42px] px-5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-[14px] sm:text-[15px] shadow-xs gap-2 shrink-0 transition-all cursor-pointer"
              >
                {sharing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Share2 className="h-4 w-4" />
                )}
                <span>Compartir</span>
              </Button>
            )}
          </div>
        )}

        {/* 3. Fila de 4 botones secundarios chicos con ícono + etiqueta corta */}
        <div className="pt-2 border-t border-border/40 grid grid-cols-4 gap-1.5 sm:gap-2">
          {/* Botón 1: Link */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            data-testid="btn-copy-link"
            className="h-9 px-1.5 sm:px-3 rounded-xl gap-1 sm:gap-1.5 font-bold text-[11px] sm:text-xs shadow-none border-border/60 bg-white hover:bg-muted text-foreground cursor-pointer"
            title="Copiar enlace del catálogo"
          >
            {copiedLink ? (
              <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-primary shrink-0" />
            )}
            <span className="whitespace-nowrap">{copiedLink ? "Copiado" : "Link"}</span>
          </Button>

          {/* Botón 2: QR */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setQrOpen(true)}
            data-testid="btn-qr"
            className="h-9 px-1.5 sm:px-3 rounded-xl gap-1 sm:gap-1.5 font-bold text-[11px] sm:text-xs shadow-none border-border/60 bg-white hover:bg-muted text-foreground cursor-pointer"
            title="Ver código QR del catálogo"
          >
            <QrCode className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="whitespace-nowrap">QR</span>
          </Button>

          {/* Botón 3: PDF */}
          <Suspense fallback={<Button variant="outline" size="sm" className="h-9 rounded-xl text-[11px]">PDF</Button>}>
            <CatalogPdfExportButton
              store={store}
              variant="compact"
              label="PDF"
              className="w-full px-1.5 sm:px-3 text-[11px] sm:text-xs cursor-pointer whitespace-nowrap"
            />
          </Suspense>

          {/* Botón 4: Bio */}
          <Button
            asChild
            variant="outline"
            size="sm"
            data-testid="btn-bio-link"
            className="h-9 px-1.5 sm:px-3 rounded-xl gap-1 sm:gap-1.5 font-bold text-[11px] sm:text-xs shadow-none border-border/60 bg-white hover:bg-muted text-foreground cursor-pointer"
            title="Ir a configuración de Bio"
          >
            <Link to="/admin/link-bio">
              <Link2 className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="whitespace-nowrap">Bio</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Modal / Diálogo para QR */}
      {qrOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="qr-dialog-title"
          data-testid="qr-dialog"
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setQrOpen(false);
          }}
        >
          <div className="bg-card border border-border rounded-2xl w-full max-w-xs sm:max-w-sm p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 relative">
            <div className="flex items-center justify-between pb-2 border-b border-border/40">
              <div className="flex items-center gap-2">
                <QrCode className="h-4 w-4 text-primary" />
                <h3 id="qr-dialog-title" className="font-heading font-bold text-[16px] text-foreground">
                  Código QR de tu catálogo
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setQrOpen(false)}
                className="h-8 w-8 rounded-lg hover:bg-muted text-muted-foreground flex items-center justify-center transition-colors"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-[12px] sm:text-[13px] text-muted-foreground leading-relaxed text-center">
              Tus clientes pueden escanearlo con su celular para ver tu catálogo y pedir directo por WhatsApp.
            </p>

            <div className="flex justify-center p-4 bg-muted/40 rounded-xl border border-border/50">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Código QR del catálogo"
                  className="w-48 h-48 rounded-lg bg-white p-2 shadow-xs object-contain"
                  data-testid="qr-dialog-image"
                />
              ) : (
                <div className="w-48 h-48 rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground">
                  Generando QR...
                </div>
              )}
            </div>

            <div className="space-y-2 pt-1">
              <Button
                type="button"
                onClick={handleDownloadQr}
                data-testid="btn-download-qr"
                className="w-full min-h-[44px] rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-[14px] shadow-xs gap-2 cursor-pointer"
              >
                <Download className="h-4 w-4" />
                <span>Descargar QR</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setQrOpen(false)}
                className="w-full h-9 rounded-xl text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
