/**
 * @file ShareImageDialog.tsx
 * @description Modal de creación y exportación de imágenes para estados e historias (F46).
 * Diseñado para carga diferida (lazy loading) solo al abrirse.
 * Permite seleccionar formato (Historia 9:16 o Cuadrada 1:1), 4 estilos visuales aprobados,
 * vista previa en tiempo real en canvas nativo, compartir directo vía Web Share API o descarga local.
 */

import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import QRCode from "qrcode";
import { toast } from "sonner";
import {
  Share2,
  Download,
  Loader2,
  AlertCircle,
  Tag,
  BookOpen,
  Layout,
  Percent,
  Copy,
  Check,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { toSupabaseUrl } from "@/lib/image-utils";
import { prepareShareImageData } from "@/lib/share-image/data";
import { drawShareImage, ensureShareImageFontsLoaded } from "@/lib/share-image/styles";
import {
  generateCaption,
  getSavedProductEmoji,
  saveProductEmoji,
  PRODUCT_EMOJI_LIST,
  DEFAULT_PRODUCT_EMOJI,
  type CaptionTemplate,
} from "@/lib/share-image/caption";
import type {
  ShareImageData,
  ShareImageFormat,
  ShareImageStyle,
} from "@/lib/share-image/types";
import type { Product, Store } from "@/lib/types";

export interface ShareImageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  store: Store;
}

const STYLES_CONFIG: {
  id: ShareImageStyle;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    id: "etiqueta",
    label: "Etiqueta",
    desc: "Colgante dinámico",
    icon: Tag,
  },
  {
    id: "editorial",
    label: "Editorial",
    desc: "Estilo revista",
    icon: BookOpen,
  },
  {
    id: "marco-color",
    label: "Marco de color",
    desc: "Identidad de marca",
    icon: Layout,
  },
  {
    id: "oferta",
    label: "Oferta",
    desc: "Liquidación y ahorro",
    icon: Percent,
  },
];

export function ShareImageDialog({
  open,
  onOpenChange,
  product,
  store,
}: ShareImageDialogProps) {
  const [format, setFormat] = useState<ShareImageFormat>("historia");
  const [style, setStyle] = useState<ShareImageStyle>("etiqueta");
  const [rendering, setRendering] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [canShareFiles, setCanShareFiles] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const loadedProductImgRef = useRef<HTMLImageElement | null>(null);
  const loadedLogoImgRef = useRef<HTMLImageElement | null>(null);
  const loadedQrCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const captionTextareaRef = useRef<HTMLTextAreaElement>(null);

  // 1. Preparar datos de la imagen
  const shareData: ShareImageData | null = useMemo(() => {
    if (!product || !store) return null;
    return prepareShareImageData({
      product,
      store,
      baseUrl: typeof window !== "undefined" ? window.location.origin : undefined,
    });
  }, [product, store]);

  // Si el producto no tiene oferta real ni es a consultar y estaba en estilo oferta, pasar a etiqueta
  useEffect(() => {
    if (shareData && !shareData.isOnSale && !shareData.isConsultPrice && style === "oferta") {
      setStyle("etiqueta");
    }
  }, [shareData, style]);

  // 2. Detección de soporte para compartir archivos nativamente
  useEffect(() => {
    if (typeof navigator !== "undefined" && typeof navigator.canShare === "function") {
      try {
        const dummyFile = new File(["dummy"], "check.png", { type: "image/png" });
        setCanShareFiles(navigator.canShare({ files: [dummyFile] }));
      } catch {
        setCanShareFiles(false);
      }
    } else {
      setCanShareFiles(false);
    }
  }, []);

  // F46.2: Estados y persistencia para textos formateados (captions)
  const [captionTemplate, setCaptionTemplate] = useState<CaptionTemplate>("novedad");
  const [productEmoji, setProductEmoji] = useState<string>(DEFAULT_PRODUCT_EMOJI);
  const [captionText, setCaptionText] = useState("");
  const [copiedCaption, setCopiedCaption] = useState(false);

  // Inicializar o ajustar plantilla según existencia de oferta real
  useEffect(() => {
    if (shareData?.isOnSale) {
      setCaptionTemplate("oferta");
    } else {
      setCaptionTemplate("novedad");
    }
  }, [shareData?.productId, shareData?.isOnSale]);

  useEffect(() => {
    if (shareData && !shareData.isOnSale && captionTemplate === "oferta") {
      setCaptionTemplate("novedad");
    }
  }, [shareData, captionTemplate]);

  // Recordar emoji guardado si cambia la tienda
  useEffect(() => {
    if (open && store?.id) {
      const saved = getSavedProductEmoji(store.id);
      if (saved !== null) {
        setProductEmoji(saved);
      }
    }
  }, [open, store?.id]);

  // Generar texto reactivamente al cambiar plantilla o emoji
  useEffect(() => {
    if (!shareData) return;
    const txt = generateCaption({
      storeName: shareData.storeName,
      productName: shareData.productName,
      price: shareData.price,
      originalPrice: shareData.originalPrice,
      isOnSale: shareData.isOnSale,
      productUrl: shareData.catalogProductUrl,
      template: captionTemplate,
      productEmoji,
    });
    setCaptionText(txt);
  }, [shareData, captionTemplate, productEmoji]);

  const handleSelectEmoji = (emoji: string) => {
    setProductEmoji(emoji);
    if (store?.id) {
      saveProductEmoji(store.id, emoji);
    }
  };

  const handleCopyCaption = async () => {
    if (!captionText) return;
    try {
      await navigator.clipboard.writeText(captionText);
      setCopiedCaption(true);
      toast.success("Texto copiado al portapapeles");
      setTimeout(() => setCopiedCaption(false), 2000);
    } catch {
      toast.error("No se pudo copiar el texto");
    }
  };

  // Ajuste de altura del cuadro de texto: asegura al menos 8 líneas y crece dinámicamente con el copy
  useEffect(() => {
    if (captionTextareaRef.current) {
      captionTextareaRef.current.style.height = "auto";
      const scrollH = captionTextareaRef.current.scrollHeight;
      captionTextareaRef.current.style.height = `${Math.max(165, scrollH)}px`;
    }
  }, [captionText]);

  // 3. Dibujo reactivo del canvas cuando cambia formato o estilo
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !shareData) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    try {
      drawShareImage(ctx, shareData, style, format, {
        productImage: loadedProductImgRef.current,
        storeLogoImage: loadedLogoImgRef.current,
        qrImage: loadedQrCanvasRef.current,
      });
    } catch (err) {
      console.error("Error al renderizar canvas de estado:", err);
    }
  }, [shareData, style, format]);

  // 4. Cargar imágenes de apoyo (Foto original con CORS, Logo de tienda y QR)
  useEffect(() => {
    if (!open || !shareData) return;

    let isMounted = true;
    setRendering(true);
    setImageError(null);

    const loadImages = async () => {
      try {
        // Cargar tipografías oficiales (Plus Jakarta Sans y Playfair Display) antes de medir/dibujar
        await ensureShareImageFontsLoaded();

        // Generar QR en memoria
        const qrCanvas = document.createElement("canvas");
        await QRCode.toCanvas(qrCanvas, shareData.catalogProductUrl, {
          width: 300,
          margin: 1,
          color: {
            dark: "#0F172A",
            light: "#FFFFFF",
          },
        });
        if (isMounted) loadedQrCanvasRef.current = qrCanvas;

        // Cargar logo si existe
        if (shareData.storeLogoUrl) {
          try {
            const logo = new Image();
            logo.crossOrigin = "anonymous";
            await new Promise<void>((resolve, reject) => {
              logo.onload = () => resolve();
              logo.onerror = () => reject();
              logo.src = shareData.storeLogoUrl!;
            });
            if (isMounted) loadedLogoImgRef.current = logo;
          } catch {
            if (isMounted) loadedLogoImgRef.current = null;
          }
        } else {
          if (isMounted) loadedLogoImgRef.current = null;
        }

        // Cargar foto del producto
        if (shareData.productImageUrl) {
          const loadProductImageWithFallback = async (url: string): Promise<HTMLImageElement> => {
            return new Promise((resolve, reject) => {
              const img = new Image();
              img.crossOrigin = "anonymous";
              img.onload = () => resolve(img);
              img.onerror = () => reject(new Error("Error de carga de imagen"));
              img.src = url;
            });
          };

          try {
            const pImg = await loadProductImageWithFallback(shareData.productImageUrl);
            if (isMounted) loadedProductImgRef.current = pImg;
          } catch (err) {
            // Intentar fallback a Supabase directo si Bunny falla por CORS
            const fallbackUrl = toSupabaseUrl(shareData.productImageUrl);
            if (fallbackUrl && fallbackUrl !== shareData.productImageUrl) {
              try {
                const pImg = await loadProductImageWithFallback(fallbackUrl);
                if (isMounted) loadedProductImgRef.current = pImg;
              } catch {
                if (isMounted) {
                  setImageError("No se pudo cargar la foto con permisos de exportación.");
                  loadedProductImgRef.current = null;
                }
              }
            } else {
              if (isMounted) {
                setImageError("No se pudo cargar la foto del producto.");
                loadedProductImgRef.current = null;
              }
            }
          }
        } else {
          if (isMounted) loadedProductImgRef.current = null;
        }

        if (isMounted) {
          renderCanvas();
        }
      } catch (e) {
        console.error("Error al preparar recursos de imagen:", e);
      } finally {
        if (isMounted) setRendering(false);
      }
    };

    loadImages();

    return () => {
      isMounted = false;
    };
  }, [open, shareData, renderCanvas]);

  useEffect(() => {
    if (open && shareData) {
      renderCanvas();
    }
  }, [open, shareData, style, format, renderCanvas]);

  // 5. Medición en share_events (RF-46.8)
  const logShareMetric = async () => {
    if (!store || !product) return;
    try {
      await supabase.from("share_events").insert({
        store_id: store.id,
        product_id: product.id,
        style,
        size: format,
      });
    } catch {
      // No bloqueante si la tabla o RLS no está disponible
    }
  };

  // 6. Acción principal: Compartir (Web Share API) o Descargar (Plan B)
  const handleExport = async (forceDownload: boolean = false) => {
    const canvas = canvasRef.current;
    if (!canvas || !shareData) return;

    setExporting(true);
    try {
      const fileName = `${shareData.storeSlug}-${shareData.productId}-${format}.png`;

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), "image/png", 0.95);
      });

      if (!blob) {
        throw new Error("No se pudo generar el archivo de imagen");
      }

      const file = new File([blob], fileName, { type: "image/png" });

      if (!forceDownload && canShareFiles && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: shareData.productName,
          text: captionText || `Mira ${shareData.productName} en ${shareData.storeName}: ${shareData.catalogProductUrl}`,
        });
        toast.success("¡Imagen lista para compartir!");
        logShareMetric();
      } else {
        // Plan B: Descarga directa
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 2000);

        toast.success("Imagen descargada. Súbela a tu estado o historia.");
        logShareMetric();
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        console.error("Error al compartir o descargar imagen:", err);
        toast.error("Ocurrió un inconveniente al procesar la imagen.");
      }
    } finally {
      setExporting(false);
    }
  };

  if (!product || !shareData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full p-4 sm:p-6 max-h-[95vh] flex flex-col gap-4 overflow-y-auto">
        <DialogHeader className="p-0 space-y-1">
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            Crear imagen para estados
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Comparte tu producto en WhatsApp e Instagram listo con precio y enlace.
          </DialogDescription>
        </DialogHeader>

        {imageError && (
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 rounded-lg p-2.5 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{imageError}</span>
          </div>
        )}

        {/* Contenedor de la Vista Previa del Canvas */}
        <div className="relative w-full bg-slate-950/5 dark:bg-slate-900/40 border rounded-xl p-2 flex items-center justify-center min-h-[300px] max-h-[46vh] overflow-hidden">
          {rendering && (
            <div className="absolute inset-0 z-10 bg-background/60 backdrop-blur-xs flex flex-col items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-xs font-medium text-muted-foreground">Preparando diseño...</span>
            </div>
          )}

          <canvas
            ref={canvasRef}
            className={`max-h-[42vh] max-w-full rounded-md shadow-md object-contain transition-all duration-200 ${
              format === "historia"
                ? "aspect-[9/16]"
                : format === "post-ig"
                ? "aspect-[4/5]"
                : "aspect-square"
            }`}
          />
        </div>

        {/* Controles de Formato y Estilos */}
        <div className="space-y-3">
          {/* Selector de Tamaño */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
              Tamaño
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFormat("historia")}
                className={`py-2 px-2.5 rounded-lg text-xs font-semibold border transition text-center flex flex-col sm:flex-row items-center justify-center gap-1 ${
                  format === "historia"
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : "bg-muted/40 hover:bg-muted text-foreground border-border"
                }`}
              >
                <span>Historia</span>
                <span className="opacity-75 text-[10px]">(9:16)</span>
              </button>
              <button
                type="button"
                onClick={() => setFormat("post-ig")}
                className={`py-2 px-2.5 rounded-lg text-xs font-semibold border transition text-center flex flex-col sm:flex-row items-center justify-center gap-1 ${
                  format === "post-ig"
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : "bg-muted/40 hover:bg-muted text-foreground border-border"
                }`}
              >
                <span>Post IG</span>
                <span className="opacity-75 text-[10px]">(4:5)</span>
              </button>
              <button
                type="button"
                onClick={() => setFormat("cuadrada")}
                className={`py-2 px-2.5 rounded-lg text-xs font-semibold border transition text-center flex flex-col sm:flex-row items-center justify-center gap-1 ${
                  format === "cuadrada"
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : "bg-muted/40 hover:bg-muted text-foreground border-border"
                }`}
              >
                <span>Cuadrada</span>
                <span className="opacity-75 text-[10px]">(1:1)</span>
              </button>
            </div>
          </div>

          {/* Selector de 4 Estilos */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
              Estilo
            </label>
            <div className="grid grid-cols-2 gap-2">
              {STYLES_CONFIG.map((st) => {
                const Icon = st.icon;
                const isOferta = st.id === "oferta";
                const isOfertaDisabled = isOferta && !shareData.isOnSale && !shareData.isConsultPrice;
                const isSelected = style === st.id;

                return (
                  <button
                    key={st.id}
                    type="button"
                    disabled={isOfertaDisabled}
                    onClick={() => setStyle(st.id)}
                    title={isOfertaDisabled ? "Disponible solo en productos con descuento" : st.desc}
                    className={`p-2.5 rounded-lg border text-left transition flex items-start gap-2 ${
                      isSelected
                        ? "border-primary bg-primary/10 text-primary shadow-xs"
                        : isOfertaDisabled
                        ? "opacity-40 cursor-not-allowed bg-muted/20 border-border text-muted-foreground"
                        : "bg-background hover:bg-muted/50 border-border text-foreground"
                    }`}
                  >
                    <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                    <div className="min-w-0">
                      <div className="text-xs font-bold leading-tight truncate">{st.label}</div>
                      <div className="text-[10px] text-muted-foreground leading-tight truncate mt-0.5">
                        {isOfertaDisabled ? "Requiere oferta" : st.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* F46.2: Texto para compartir con plantillas y selector de emoji */}
          <div className="space-y-2 pt-1 border-t">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Texto para compartir
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyCaption}
                className="h-7 px-2.5 text-xs font-medium gap-1 rounded-md"
              >
                {copiedCaption ? (
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

            {/* Selector de 3 Plantillas: Novedad, Oferta, Simple */}
            <div>
              <div className="text-[11px] text-muted-foreground mb-1">Plantilla:</div>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-muted/40 rounded-lg border">
                <button
                  type="button"
                  onClick={() => setCaptionTemplate("novedad")}
                  className={`py-1.5 px-2 rounded-md text-xs font-semibold transition text-center flex items-center justify-center gap-1 ${
                    captionTemplate === "novedad"
                      ? "bg-background text-foreground shadow-xs border border-border"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span>✨ Novedad</span>
                </button>
                <button
                  type="button"
                  disabled={!shareData.isOnSale}
                  onClick={() => setCaptionTemplate("oferta")}
                  title={!shareData.isOnSale ? "Disponible solo en productos con descuento" : "Plantilla de oferta"}
                  className={`py-1.5 px-2 rounded-md text-xs font-semibold transition text-center flex items-center justify-center gap-1 ${
                    captionTemplate === "oferta"
                      ? "bg-background text-foreground shadow-xs border border-border"
                      : !shareData.isOnSale
                      ? "opacity-40 cursor-not-allowed text-muted-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span>🔥 Oferta</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCaptionTemplate("simple")}
                  className={`py-1.5 px-2 rounded-md text-xs font-semibold transition text-center flex items-center justify-center gap-1 ${
                    captionTemplate === "simple"
                      ? "bg-background text-foreground shadow-xs border border-border"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span>Simple</span>
                </button>
              </div>
            </div>

            {/* Fila opcional: Emoji de tu producto */}
            <div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                <span>Emoji de tu producto (opcional):</span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                <button
                  type="button"
                  onClick={() => handleSelectEmoji("none")}
                  className={`shrink-0 px-2.5 py-1 text-xs rounded-full border transition font-medium ${
                    productEmoji === "none"
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-muted/40 hover:bg-muted text-muted-foreground border-border"
                  }`}
                >
                  Ninguno
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectEmoji(DEFAULT_PRODUCT_EMOJI)}
                  title="Emoji por defecto (bolsa)"
                  className={`shrink-0 px-2 py-1 text-xs rounded-full border transition font-medium ${
                    productEmoji === DEFAULT_PRODUCT_EMOJI
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-muted/40 hover:bg-muted text-muted-foreground border-border"
                  }`}
                >
                  {DEFAULT_PRODUCT_EMOJI}
                </button>
                {PRODUCT_EMOJI_LIST.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectEmoji(item.emoji)}
                    title={item.label}
                    className={`shrink-0 px-2 py-1 text-xs rounded-full border transition font-medium ${
                      productEmoji === item.emoji
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : "bg-muted/40 hover:bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    {item.emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Texto editable con vista previa: altura inicial de 8 líneas (~165px) y auto-grow */}
            <Textarea
              ref={captionTextareaRef}
              value={captionText}
              onChange={(e) => setCaptionText(e.target.value)}
              rows={8}
              placeholder="Escribe o edita el texto para tu estado..."
              className="text-xs resize-y bg-background font-mono leading-relaxed min-h-[165px] transition-[height] duration-150"
            />
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex items-center gap-2 pt-1 border-t">
          {canShareFiles ? (
            <>
              <Button
                type="button"
                className="flex-1 gap-2 font-bold"
                disabled={rendering || exporting}
                onClick={() => handleExport(false)}
              >
                {exporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Share2 className="h-4 w-4" />
                )}
                Compartir
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={rendering || exporting}
                onClick={() => handleExport(true)}
                title="Descargar imagen"
                className="h-10 w-10 shrink-0"
              >
                <Download className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button
              type="button"
              className="w-full gap-2 font-bold"
              disabled={rendering || exporting}
              onClick={() => handleExport(true)}
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Descargar imagen
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
