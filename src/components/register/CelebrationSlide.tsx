import React, { useState } from "react";
import { Check, Copy, ExternalLink, PackagePlus, Share2, Sparkles } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { DIZI_SUPPORT_PHONE, buildWaUrl } from "@/lib/whatsapp";
import { PLANS, type PlanId } from "@/lib/types";
import { toast } from "sonner";

export interface CelebrationSlideProps {
  storeName: string;
  slug: string;
  requestedPlan: PlanId | null;
  isPreviewTestMode: boolean;
  onGoToFirstProduct: () => void;
  onGoToAdmin?: () => void;
}

/**
 * Pantalla 6 (RF-53.5): Celebración tras crear el catálogo con acciones directas
 * para subir el primer producto y compartir el link.
 */
export function CelebrationSlide({
  storeName,
  slug,
  requestedPlan,
  isPreviewTestMode,
  onGoToFirstProduct,
  onGoToAdmin,
}: CelebrationSlideProps) {
  const [copied, setCopied] = useState(false);

  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://dizi.idenza.site";
  const publicUrl = `${origin}/t/${slug}`;
  const canonicalDisplayUrl = `dizi.idenza.site/t/${slug}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast.success("Link copiado al portapapeles");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("No se pudo copiar automáticamente");
    }
  };

  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(
    `¡Ya tengo mi catálogo digital de ${storeName}! Míralo aquí: ${publicUrl}`,
  )}`;

  const cleanName = storeName.trim() || "Tu negocio";

  return (
    <div
      data-testid="register-celebration-slide"
      className="w-full space-y-6 py-2"
    >
      <div className="space-y-3">
        {isPreviewTestMode ? (
          <div
            data-testid="celebration-preview-notice"
            className="inline-flex items-center gap-2 rounded-full bg-[#312E81] px-4 py-1.5 text-[13px] font-semibold text-[#FAF7F2]"
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Modo prueba: no se crea ninguna cuenta</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 rounded-full bg-[#FF5C39]/20 border border-[#FF5C39]/40 px-3.5 py-1 text-[13px] font-semibold text-[#1E1B4B]">
            <span>Catálogo publicado</span>
          </div>
        )}

        <h1 className="font-heading font-bold text-[28px] lg:text-[36px] leading-[1.15] tracking-tight text-[#312E81]">
          <span>¡{cleanName} ya está </span>
          <span className="text-[#312E81]/60 whitespace-nowrap">en línea! 🎉</span>
        </h1>

        <p className="text-[16px] text-[#1E1B4B]/85 leading-relaxed">
          Tu negocio ya se ve como lo que es. Ahora sube tu primer producto o comparte tu link con tus clientes.
        </p>
      </div>

      {/* Aviso de prueba Pro y logros (RF-55.10) */}
      <div
        data-testid="celebration-trial-notice"
        className="rounded-2xl border border-[#312E81]/20 bg-gradient-to-br from-[#312E81]/[0.06] to-[#312E81]/[0.02] p-4 flex items-center gap-3.5"
      >
        <div className="h-10 w-10 rounded-xl bg-[#312E81]/15 text-[#312E81] flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5" aria-hidden="true" />
        </div>
        <p className="text-[14px] sm:text-[15px] text-[#1E1B4B] font-semibold leading-snug">
          Tienes 7 días de Pro gratis. Gana hasta 7 días más completando tu tienda.
        </p>
      </div>

      {/* Link automático generado */}
      <div className="rounded-2xl border border-[#312E81]/18 bg-white p-4 space-y-1.5">
        <div
          data-testid="celebration-store-link"
          className="text-[16px] text-[#1E1B4B] flex items-center gap-1.5 flex-wrap"
        >
          <span className="font-medium text-[#312E81]/80">Tu link:</span>
          <a
            href={`/t/${slug}`}
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-[#312E81] underline underline-offset-2 inline-flex items-center gap-1.5 break-all"
          >
            <span>{canonicalDisplayUrl}</span>
            <ExternalLink className="w-4 h-4 shrink-0" aria-hidden="true" />
          </a>
        </div>
        <p className="text-[13px] text-[#312E81]/75">
          Puedes cambiarlo cuando quieras en Configuración
        </p>
      </div>

      {/* Aviso si eligió un plan de pago vía ?plan= */}
      {requestedPlan && requestedPlan !== "semilla" && (
        <div className="rounded-2xl border border-[#312E81]/20 bg-white p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[13px] font-semibold text-[#312E81]/75">Plan elegido</span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#312E81] text-[#FAF7F2] text-[13px] font-semibold">
              {PLANS[requestedPlan]?.name || requestedPlan} · S/ {PLANS[requestedPlan]?.price.toFixed(2)}/mes
            </span>
          </div>
          <p className="text-[13px] text-[#1E1B4B]/80 leading-relaxed">
            Tu catálogo inició con 7 días de Pro gratis. Cuando quieras quedarte con el Plan {requestedPlan === "pro" ? "Pro" : (PLANS[requestedPlan]?.name || requestedPlan)}, lo activas desde Mi Plan o por WhatsApp:
          </p>
          <a
            href={buildWaUrl(
              DIZI_SUPPORT_PHONE,
              `Hola, acabo de crear mi tienda ${slug} y quiero activar el plan ${PLANS[requestedPlan]?.name || requestedPlan} (S/ ${PLANS[requestedPlan]?.price.toFixed(2)}/mes)`,
            )}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 w-full min-h-[48px] rounded-2xl bg-[#075E54] text-white text-[16px] font-semibold hover:opacity-95 transition-opacity motion-reduce:transition-none"
          >
            <WhatsAppIcon className="w-5 h-5" />
            <span>Activar plan por WhatsApp</span>
          </a>
        </div>
      )}

      {/* Acciones principales */}
      <div className="space-y-3 pt-1">
        <button
          type="button"
          onClick={onGoToFirstProduct}
          className="w-full min-h-[52px] rounded-2xl bg-[#FF5C39] hover:bg-[#ff4b24] active:scale-[0.99] text-[#1E1B4B] text-[16px] font-bold flex items-center justify-center gap-2 shadow-sm transition-all motion-reduce:transition-none cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#312E81]"
        >
          <PackagePlus className="w-5 h-5 shrink-0" aria-hidden="true" />
          <span>Sube tu primer producto</span>
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={handleCopy}
            className="min-h-[48px] px-4 rounded-2xl border-2 border-[#312E81] bg-white text-[#312E81] hover:bg-[#312E81]/5 text-[16px] font-semibold flex items-center justify-center gap-2 transition-colors motion-reduce:transition-none cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#312E81]"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Link copiado</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Compartir mi link</span>
              </>
            )}
          </button>

          <a
            href={whatsappShareUrl}
            target="_blank"
            rel="noreferrer"
            className="min-h-[48px] px-4 rounded-2xl border border-[#312E81]/25 bg-white text-[#312E81] hover:bg-[#312E81]/5 text-[16px] font-semibold flex items-center justify-center gap-2 transition-colors motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#312E81]"
          >
            <Share2 className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Enviar por WhatsApp</span>
          </a>
        </div>

        {requestedPlan && requestedPlan !== "semilla" && onGoToAdmin && !isPreviewTestMode && (
          <button
            type="button"
            onClick={onGoToAdmin}
            className="w-full min-h-[44px] text-[14px] font-semibold text-[#312E81] underline underline-offset-2 cursor-pointer"
          >
            Ir al panel de administración
          </button>
        )}
      </div>
    </div>
  );
}
