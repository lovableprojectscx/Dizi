import React, { useEffect, useMemo } from "react";
import { PublicCatalog } from "@/components/public/PublicCatalog";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import {
  buildPreviewStore,
  buildRubroIconCardSvg,
  getAllPreviewImageUrls,
} from "@/lib/register-preview";
import { getThumbnailUrl } from "@/lib/image-utils";

const preloadedUrls = new Set<string>();

function preloadPreviewAssets(niche: string) {
  if (typeof window === "undefined" || typeof Image === "undefined") return;
  const urls = getAllPreviewImageUrls(niche);
  for (const rawUrl of urls) {
    const thumb = getThumbnailUrl(rawUrl) || rawUrl;
    for (const candidate of [thumb, rawUrl]) {
      if (candidate && !preloadedUrls.has(candidate)) {
        preloadedUrls.add(candidate);
        const img = new Image();
        img.decoding = "async";
        img.src = candidate;
      }
    }
  }
}

export interface LivePreviewProps {
  storeName: string;
  niche: string;
  phone: string;
  countryCode: string;
  countryIso: string;
  slug: string;
  /** Muestra el botón "Pedir por WhatsApp" sobre el catálogo al tener WhatsApp válido */
  showWhatsappButton: boolean;
  /** En celular (375 px) renderiza versión compacta a escala (encabezado + 2 productos) */
  compact?: boolean;
}

/**
 * Vista previa en vivo del catálogo durante el registro F53.
 * Reutiliza `<PublicCatalog isMockup={true} />` con una tienda en memoria,
 * precarga las fotos de los rubros mostrando tarjeta crema con ícono mientras llegan,
 * y superpone la capa visual "Pedir por WhatsApp" sin modificar `PublicCatalog`.
 */
export default function LivePreview({
  storeName,
  niche,
  phone,
  countryCode,
  countryIso,
  slug,
  showWhatsappButton,
  compact = false,
}: LivePreviewProps) {
  useEffect(() => {
    preloadPreviewAssets(niche);
  }, [niche]);

  const placeholderCardUrl = useMemo(() => buildRubroIconCardSvg(niche), [niche]);

  const previewStore = useMemo(
    () =>
      buildPreviewStore({
        storeName,
        niche,
        phone,
        countryCode,
        countryIso,
        slug,
      }),
    [storeName, niche, phone, countryCode, countryIso, slug],
  );

  const placeholderCss = `.f53-live-preview article img { background-color: #FAF7F2; background-image: url("${placeholderCardUrl}"); background-size: cover; background-position: center; }`;

  if (compact) {
    return (
      <div
        data-testid="live-preview-compact"
        className="f53-live-preview f53-compact-preview relative w-full h-[238px] rounded-2xl border border-[#312E81]/18 bg-white overflow-hidden shadow-sm pointer-events-none select-none"
      >
        <style>{`
          ${placeholderCss}
          .f53-compact-preview header[data-testid="catalog-header"] { display: none !important; }
          .f53-compact-preview div.flex.gap-2:has(input),
          .f53-compact-preview div.relative:has(> input),
          .f53-compact-preview div.space-y-3:has(> .overflow-x-auto) { display: none !important; }
        `}</style>
        <div
          className="origin-top-left"
          style={{
            width: "490px",
            transform: "scale(0.696)",
          }}
        >
          <PublicCatalog store={previewStore} mode="catalog" isMockup={true} />
        </div>

        {showWhatsappButton && (
          <div
            data-testid="live-preview-whatsapp-btn"
            className="absolute bottom-2.5 right-2.5 z-20 inline-flex items-center gap-1.5 rounded-full bg-[#075E54] text-white px-3.5 py-1.5 text-xs font-bold shadow-md"
          >
            <WhatsAppIcon className="w-3.5 h-3.5" />
            <span>Pedir por WhatsApp</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      data-testid="live-preview-desktop"
      className="f53-live-preview relative w-full h-full flex flex-col overflow-hidden pointer-events-none select-none"
    >
      <style>{placeholderCss}</style>
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <PublicCatalog store={previewStore} mode="catalog" isMockup={true} />
      </div>

      {showWhatsappButton && (
        <div className="shrink-0 border-t border-[#312E81]/10 bg-white/95 px-3 py-2 flex justify-center">
          <div
            data-testid="live-preview-whatsapp-btn"
            className="inline-flex items-center gap-2 rounded-full bg-[#075E54] text-white px-5 py-2 text-sm font-bold shadow-sm"
          >
            <WhatsAppIcon className="w-4 h-4" />
            <span>Pedir por WhatsApp</span>
          </div>
        </div>
      )}
    </div>
  );
}
