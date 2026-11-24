/**
 * @file StylePreviewStrip.tsx
 * @description Sección diferida "Así se ve tu producto" en Promociona (/admin/marketing) (RF-54.6 / RF-54.7).
 * Dibuja las 3 o 4 miniaturas reales con `drawShareImage` al entrar en viewport (`IntersectionObserver`),
 * reutilizando `loadShareImageAssets` y un único canvas offscreen reescalado a 216×384.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown } from "lucide-react";
import { toSupabaseUrl } from "@/lib/image-utils";
import { getAvailablePreviewStyles } from "@/lib/panel-home";
import { loadShareImageAssets } from "@/lib/share-image/assets";
import { prepareShareImageData } from "@/lib/share-image/data";
import { drawShareImage } from "@/lib/share-image/styles";
import { cn } from "@/lib/utils";
import type { ShareImageStyle } from "@/lib/share-image/types";
import type { Product, Store } from "@/lib/types";

const THUMB_WIDTH = 216;
const THUMB_HEIGHT = 384;

const STYLE_LABELS: Record<ShareImageStyle, string> = {
  etiqueta: "Etiqueta",
  editorial: "Editorial",
  "marco-color": "Marco de color",
  oferta: "Oferta",
  catalogo: "Catálogo",
};

export interface StylePreviewStripProps {
  product: Product;
  store: Store;
  onSelectStyle: (style: ShareImageStyle) => void;
  onPickOtherProduct: () => void;
}

export function StylePreviewStrip({
  product,
  store,
  onSelectStyle,
  onPickOtherProduct,
}: StylePreviewStripProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const canvasMapRef = useRef<Partial<Record<ShareImageStyle, HTMLCanvasElement | null>>>({});

  const [inView, setInView] = useState(() => typeof IntersectionObserver === "undefined");
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "fallback">("idle");

  const shareData = useMemo(
    () =>
      prepareShareImageData({
        product,
        store,
        baseUrl: typeof window !== "undefined" ? window.location.origin : undefined,
      }),
    [product, store],
  );

  const styles = useMemo(() => getAvailablePreviewStyles(shareData), [shareData]);

  // Observar visibilidad para cargar recursos y dibujar solo al entrar en pantalla (RF-54.7)
  useEffect(() => {
    if (inView) return;
    const node = sectionRef.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "120px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [inView]);

  // Cargar recursos compartidos una sola vez y pintar miniaturas 1 por frame
  useEffect(() => {
    if (!inView) return;

    const controller = new AbortController();
    let rafId = 0;
    setStatus("loading");

    const run = async () => {
      const assets = await loadShareImageAssets(shareData, {
        qrSize: 160,
        signal: controller.signal,
      });

      if (controller.signal.aborted) return;

      if (assets.imageError || !assets.productImage) {
        setStatus("fallback");
        return;
      }

      const offscreen = document.createElement("canvas");
      const offCtx = offscreen.getContext("2d");
      if (!offCtx) {
        setStatus("fallback");
        return;
      }

      // Pintar 1 estilo por frame para mantener fluido el hilo principal en celular
      let idx = 0;
      const drawNext = () => {
        if (controller.signal.aborted) return;
        const styleId = styles[idx];
        const target = canvasMapRef.current[styleId];
        if (target) {
          const thumbCtx = target.getContext("2d");
          if (thumbCtx) {
            try {
              drawShareImage(offCtx, shareData, styleId, "historia", {
                productImage: assets.productImage,
                storeLogoImage: assets.storeLogoImage,
                qrImage: assets.qrImage,
              });
              target.width = THUMB_WIDTH;
              target.height = THUMB_HEIGHT;
              thumbCtx.imageSmoothingEnabled = true;
              thumbCtx.imageSmoothingQuality = "high";
              thumbCtx.drawImage(offscreen, 0, 0, THUMB_WIDTH, THUMB_HEIGHT);
            } catch {
              setStatus("fallback");
              return;
            }
          }
        }

        idx += 1;
        if (idx < styles.length) {
          rafId = window.requestAnimationFrame(drawNext);
        } else {
          // Liberar memoria del canvas temporal
          offscreen.width = 0;
          offscreen.height = 0;
          setStatus("ready");
        }
      };

      rafId = window.requestAnimationFrame(drawNext);
    };

    run();

    return () => {
      controller.abort();
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [inView, shareData, styles]);

  const fallbackPhotoUrl = toSupabaseUrl(product.image) || product.image;

  return (
    <section
      ref={sectionRef}
      data-testid="style-preview-strip"
      aria-label="Así se ve tu producto"
      className="space-y-3"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="space-y-0.5 min-w-0">
          <h2 className="font-heading font-semibold text-[22px] sm:text-[24px] leading-tight text-foreground">
            Así se ve tu producto
          </h2>
          <p className="text-[13px] text-muted-foreground truncate">
            {product.name} · toca un estilo para editar y compartir
          </p>
        </div>

        <button
          type="button"
          onClick={onPickOtherProduct}
          className="inline-flex items-center gap-1 text-[14px] font-semibold text-brand hover:underline underline-offset-2 min-h-[44px] cursor-pointer"
        >
          <span>Usar otro producto</span>
          <ArrowDown className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {/* Carrusel horizontal con snap en móvil (375 px); fila de 3 o 4 en escritorio (1280 px) */}
      <div
        data-testid="style-preview-list"
        className={cn(
          "flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-1 px-1 lg:mx-0 lg:px-0 lg:pb-0 lg:grid lg:overflow-visible",
          styles.length === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3",
        )}
      >
        {styles.map((styleId) => {
          const isLoading = status === "idle" || status === "loading";
          return (
            <button
              key={styleId}
              type="button"
              data-testid={`style-preview-card-${styleId}`}
              onClick={() => onSelectStyle(styleId)}
              className="group w-[62%] sm:w-[40%] lg:w-auto shrink-0 snap-start rounded-2xl border border-border bg-card p-2.5 text-left shadow-xs hover:border-brand/50 transition-colors duration-200 motion-reduce:transition-none cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <div className="relative aspect-[9/16] w-full rounded-xl overflow-hidden bg-muted">
                {/* Recuadro 9:16 en gris de espera mientras cargan recursos */}
                {isLoading && (
                  <div
                    data-testid={`style-preview-skeleton-${styleId}`}
                    className="absolute inset-0 bg-muted animate-pulse motion-reduce:animate-none"
                  />
                )}

                {/* Respaldo con foto normal si falla CORS/carga */}
                {status === "fallback" ? (
                  <div className="relative h-full w-full">
                    <img
                      src={fallbackPhotoUrl}
                      alt={`${product.name} — estilo ${STYLE_LABELS[styleId]}`}
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute bottom-2 left-2 right-2 rounded-lg bg-dizi-indigo/90 px-2 py-1 text-center text-[12px] font-medium text-dizi-cream">
                      Vista previa simplificada
                    </span>
                  </div>
                ) : (
                  <canvas
                    ref={(el) => {
                      canvasMapRef.current[styleId] = el;
                    }}
                    width={THUMB_WIDTH}
                    height={THUMB_HEIGHT}
                    aria-label={`Vista previa de ${product.name} en estilo ${STYLE_LABELS[styleId]}`}
                    className={cn(
                      "h-full w-full object-cover transition-opacity duration-200 motion-reduce:transition-none",
                      status === "ready" ? "opacity-100" : "opacity-0",
                    )}
                  />
                )}
              </div>

              <div className="pt-2.5 px-1 flex items-center justify-between gap-2">
                <span className="text-[15px] font-semibold text-foreground group-hover:text-brand transition-colors duration-200 motion-reduce:transition-none">
                  {STYLE_LABELS[styleId]}
                </span>
                <span className="text-[13px] font-medium text-muted-foreground">Editar</span>
              </div>
            </button>
          );
        })}
      </div>

      {status === "fallback" && (
        <p className="text-[13px] text-muted-foreground">
          Mostramos tu foto directamente; al tocar un estilo podrás generar la imagen completa.
        </p>
      )}
    </section>
  );
}

export default StylePreviewStrip;
