/**
 * @file CatalogImageCard.tsx
 * @description Tarjeta de imagen de catálogo completa (F55 / RF-55.12 / RF-55.13).
 * Muestra el collage automático de hasta 4 productos con titular "¡Ya tenemos nuestro catálogo! 🎉",
 * QR, enlace y sello si aplica. Permite compartir (Web Share), descargar y copiar texto promocional.
 * Reutilizable en Inicio (descartable) y en Promociona (fija arriba).
 */

import React, { useEffect, useRef, useState, useMemo } from "react";
import {
  Check,
  Copy,
  Download,
  Share2,
  Sparkles,
  X,
  Smartphone,
  Square,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useApp } from "@/lib/store";
import type { Store } from "@/lib/types";
import type { ShareImageFormat } from "@/lib/share-image/types";
import { prepareCatalogShareData } from "@/lib/share-image/data";
import { loadCatalogImageAssets } from "@/lib/share-image/assets";
import { drawShareImage } from "@/lib/share-image/styles";
import { logShareEvent } from "@/lib/share-image/metrics";
import { claimTrialRewards } from "@/lib/trial-rewards";
import { supabase } from "@/lib/supabase";

export const CATALOG_CARD_DISMISSED_KEY_PREFIX = "dizi_catalog_image_card_dismissed_";

export function isCatalogCardDismissed(storeId: string): boolean {
  if (typeof window === "undefined" || !storeId) return false;
  try {
    return window.localStorage.getItem(`${CATALOG_CARD_DISMISSED_KEY_PREFIX}${storeId}`) === "1";
  } catch {
    return false;
  }
}

export function dismissCatalogCard(storeId: string): void {
  if (typeof window === "undefined" || !storeId) return;
  try {
    window.localStorage.setItem(`${CATALOG_CARD_DISMISSED_KEY_PREFIX}${storeId}`, "1");
  } catch {
    // Silencioso
  }
}

export interface CatalogImageCardProps {
  store: Store;
  dismissible?: boolean;
  onDismiss?: () => void;
  title?: string;
  subtitle?: string;
}

export function CatalogImageCard({
  store,
  dismissible = false,
  onDismiss,
  title = "Tu imagen de catálogo está lista",
  subtitle = "Comparte un collage con tus productos en redes y WhatsApp para anunciar tu catálogo",
}: CatalogImageCardProps) {
  const [format, setFormat] = useState<ShareImageFormat>("historia");
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const assetsRef = useRef<any>(null);

  const origin = typeof window !== "undefined" ? window.location.origin : "https://dizi.la";
  const catalogUrl = `${origin}/t/${store.slug}`;
  const shareText = `¡Ya tenemos nuestro catálogo! 🎉 Mira todos nuestros productos y pide por WhatsApp aquí: ${catalogUrl}`;

  const eligibleProducts = useMemo(() => {
    return (store.products || []).filter(
      (p) => !p.isSample && p.visible && p.image && p.image.trim().length > 0
    );
  }, [store.products]);

  // Re-renderizado al cambiar formato
  const renderToCanvas = (fmt: ShareImageFormat, assets: any) => {
    const canvas = canvasRef.current;
    if (!canvas || !assets) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const shareData = prepareCatalogShareData(store, origin);
    drawShareImage(ctx, shareData, "catalogo", fmt, {
      productImages: assets.productImages,
      storeLogoImage: assets.storeLogoImage,
      qrImage: assets.qrImage,
    });
  };

  // Carga de recursos (imágenes, fuentes, QR)
  useEffect(() => {
    let active = true;
    const abortController = new AbortController();

    async function loadAssets() {
      setLoading(true);
      try {
        const assets = await loadCatalogImageAssets(store, origin, {
          signal: abortController.signal,
          qrSize: 260,
        });

        if (active) {
          assetsRef.current = assets;
          renderToCanvas(format, assets);
        }
      } catch (err) {
        console.warn("[CatalogImageCard] Error cargando recursos:", err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadAssets();

    return () => {
      active = false;
      abortController.abort();
    };
  }, [store.id, store.slug, store.logo, eligibleProducts.length]);

  const handleFormatChange = (newFormat: ShareImageFormat) => {
    if (newFormat === format) return;
    setFormat(newFormat);
    if (assetsRef.current) {
      renderToCanvas(newFormat, assetsRef.current);
    }
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopiedText(true);
      toast.success("Texto copiado al portapapeles");
      setTimeout(() => setCopiedText(false), 2500);
    } catch {
      toast.error("No se pudo copiar automáticamente");
    }
  };

  const triggerPostShareActions = async () => {
    // 1. Registrar en share_events (source='catalogo')
    await logShareEvent(supabase, {
      storeId: store.id,
      productId: null,
      style: "catalogo",
      size: format,
      source: "catalogo",
    });

    // 2. Evaluar y otorgar logros de prueba Pro
    const result = await claimTrialRewards(store.id, supabase);
    if (result.totalDaysAdded > 0) {
      useApp.getState().applyGrantedTrialDays(store.id, result.totalDaysAdded);
      useApp.getState().fetchData(true);
    }
  };

  const handleDownload = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setDownloading(true);
    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/png")
      );
      if (!blob) throw new Error("No se pudo generar imagen");

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `catalogo-${store.slug}-${format}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Imagen descargada con éxito");
      await triggerPostShareActions();
    } catch (err) {
      console.error("[CatalogImageCard] Error al descargar:", err);
      toast.error("Error al descargar la imagen");
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setSharing(true);
    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/png")
      );
      if (!blob) throw new Error("No se pudo exportar la imagen");

      const file = new File([blob], `catalogo-${store.slug}-${format}.png`, {
        type: "image/png",
      });

      // Intentar Web Share API con archivo
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
      } else if (typeof navigator !== "undefined" && (navigator as any).share) {
        // Web share sin archivos (texto y URL)
        await (navigator as any).share({
          title: "¡Ya tenemos nuestro catálogo! 🎉",
          text: shareText,
          url: catalogUrl,
        });
        toast.success("Enlace compartido con éxito");
        await triggerPostShareActions();
      } else {
        // Fallback en escritorio o navegador sin Web Share: descarga + copia texto
        await handleDownload();
        await handleCopyText();
        toast.info("Imagen descargada y texto copiado para pegar en tus redes.");
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        console.warn("[CatalogImageCard] Web Share falló, aplicando fallback:", err);
        await handleDownload();
      }
    } finally {
      setSharing(false);
    }
  };

  if (eligibleProducts.length === 0) {
    return null;
  }

  return (
    <Card
      data-testid="catalog-image-card"
      className="border border-primary/25 bg-gradient-to-br from-primary/[0.04] via-card to-card shadow-xs rounded-2xl overflow-hidden"
    >
      <CardContent className="p-4 sm:p-6 space-y-5">
        {/* Cabecera de la tarjeta */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="min-w-0 space-y-0.5">
              <h2 className="text-base sm:text-lg font-heading font-extrabold text-foreground leading-snug">
                {title}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {subtitle}
              </p>
            </div>
          </div>

          {dismissible && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onDismiss}
              aria-label="Cerrar tarjeta de imagen de catálogo"
              className="h-10 w-10 -mr-2 -mt-2 rounded-xl text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Selector de formato + Vista previa + Acciones */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          {/* Columna Izquierda: Vista previa de Canvas */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            {/* Selector de formato */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/70 mb-3 text-xs font-semibold">
              <button
                type="button"
                onClick={() => handleFormatChange("historia")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer",
                  format === "historia"
                    ? "bg-background text-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Smartphone className="h-3.5 w-3.5" />
                <span>Historia (9:16)</span>
              </button>
              <button
                type="button"
                onClick={() => handleFormatChange("cuadrada")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer",
                  format === "cuadrada"
                    ? "bg-background text-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Square className="h-3.5 w-3.5" />
                <span>Cuadrada (1:1)</span>
              </button>
            </div>

            {/* Canvas contenedor con sombra y proporción */}
            <div
              className={cn(
                "relative rounded-2xl overflow-hidden border border-border shadow-md bg-muted/40 max-h-[360px] flex items-center justify-center",
                format === "historia" ? "aspect-[9/16] w-[202px]" : "aspect-square w-[280px]"
              )}
            >
              <canvas
                ref={canvasRef}
                data-testid="catalog-image-canvas"
                className="w-full h-full object-contain"
              />
              {loading && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-xs flex items-center justify-center gap-2 text-xs font-semibold text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span>Preparando imagen...</span>
                </div>
              )}
            </div>
          </div>

          {/* Columna Derecha: Texto listo para copiar y Botones de acción */}
          <div className="lg:col-span-7 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground uppercase tracking-wide">
                Texto listo para acompañar tu publicación:
              </label>
              <div className="relative rounded-xl border border-border bg-background p-3 text-xs text-foreground/90 leading-relaxed font-mono">
                {shareText}
                <div className="mt-2.5 flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopyText}
                    className="h-8 px-2.5 text-xs font-semibold gap-1.5 rounded-lg cursor-pointer"
                  >
                    {copiedText ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copiar texto</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Botones principales de Compartir y Descargar */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <Button
                type="button"
                onClick={handleShare}
                disabled={loading || sharing}
                className="flex-1 rounded-xl bg-primary hover:bg-primary/90 text-dizi-ink font-bold text-sm min-h-[44px] gap-2 shadow-xs cursor-pointer"
              >
                {sharing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Share2 className="h-4 w-4" />
                )}
                <span>Compartir catálogo</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleDownload}
                disabled={loading || downloading}
                className="rounded-xl border-border hover:bg-accent font-semibold text-sm min-h-[44px] gap-2 px-4 cursor-pointer"
              >
                {downloading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                <span>Descargar imagen</span>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
