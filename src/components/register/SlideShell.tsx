import React, { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";

function useIsDesktopSplit() {
  const [isDesktop, setIsDesktop] = useState<boolean>(() =>
    typeof window !== "undefined" ? window.innerWidth >= 1024 : true,
  );

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mql = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  return isDesktop;
}

export interface SlideShellProps {
  /** Paso visible en la barra de progreso (1..5; en pantalla 6 se oculta la barra) */
  step: 1 | 2 | 3 | 4 | 5 | 6;
  totalSteps?: number;
  titleLead: string;
  titleMuted?: string;
  hintText?: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  renderPreview: (compact: boolean) => React.ReactNode;
  isPreviewTestMode?: boolean;
  showTrialBanner?: boolean;
  onDismissTrialBanner?: () => void;
  inviteLoading?: boolean;
  inviteBannerText?: string | null;
  invalidInviteBanner?: boolean;
  children: React.ReactNode;
}

/**
 * Marco común de las pantallas de registro F53 (375 px móvil + 1280 px escritorio partido).
 * Respeta paleta de marca (#FAF7F2 crema, #312E81 índigo, #1E1B4B índigo oscuro, #FF5C39 coral)
 * y `prefers-reduced-motion`.
 */
export function SlideShell({
  step,
  totalSteps = 5,
  titleLead,
  titleMuted,
  hintText,
  onBack,
  rightAction,
  renderPreview,
  isPreviewTestMode = false,
  showTrialBanner = false,
  onDismissTrialBanner,
  inviteLoading = false,
  inviteBannerText = null,
  invalidInviteBanner = false,
  children,
}: SlideShellProps) {
  const isDesktopSplit = useIsDesktopSplit();
  const isCelebration = step === 6;
  const progressPct = Math.min(100, Math.max(0, (step / totalSteps) * 100));

  return (
    <div
      className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#1E1B4B] font-sans"
      translate="no"
    >
      {/* Banner superior de prueba gratis por invitación (si aplica) */}
      {showTrialBanner && (
        <div className="w-full bg-[#312E81] text-[#FAF7F2] text-xs py-2 px-10 flex items-center justify-center gap-2 relative z-40 text-center">
          <span className="inline-flex items-center gap-1.5 flex-wrap justify-center">
            <span className="px-2 py-0.5 rounded bg-[#FF5C39] text-[#1E1B4B] text-[11px] font-bold uppercase tracking-wider">
              Prueba Gratis
            </span>
            <strong className="font-bold">15 días de Plan Emprendedor Gratis</strong>
            <span className="text-[#FAF7F2]/85">activado con tu invitación.</span>
          </span>
          {onDismissTrialBanner && (
            <button
              type="button"
              onClick={onDismissTrialBanner}
              aria-label="Cerrar aviso"
              className="absolute right-2 top-1/2 -translate-y-1/2 min-h-[36px] min-w-[36px] flex items-center justify-center text-[#FAF7F2]/80 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Cabecera móvil y escritorio */}
      <header className="w-full border-b border-[#312E81]/10 bg-[#FAF7F2] lg:sticky lg:top-0 z-30">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="h-14 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-[84px]">
              {!isCelebration && step > 1 && onBack ? (
                <button
                  type="button"
                  onClick={onBack}
                  aria-label="Volver al paso anterior"
                  className="inline-flex items-center gap-1.5 min-h-[44px] min-w-[44px] -ml-2 px-2 rounded-xl text-[#312E81] hover:bg-[#312E81]/8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#312E81] transition-colors motion-reduce:transition-none cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5 shrink-0" />
                  <span className="text-sm font-semibold hidden sm:inline">Volver</span>
                </button>
              ) : (
                <Link
                  to="/"
                  className="inline-flex items-center gap-1.5 min-h-[44px] -ml-2 px-2 rounded-xl text-[#312E81] hover:bg-[#312E81]/8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#312E81] transition-colors motion-reduce:transition-none"
                >
                  <ArrowLeft className="w-4 h-4 shrink-0" />
                  <span className="text-sm font-semibold">Inicio</span>
                </Link>
              )}
            </div>

            <div className="flex items-center gap-2">
              <img
                src="/images/icono-96.webp"
                alt="Dizi"
                width="28"
                height="28"
                className="h-7 w-7 object-contain"
              />
              {!isCelebration && (
                <span
                  data-testid="register-step-counter"
                  className="text-[13px] font-semibold text-[#312E81]/80 tabular-nums"
                >
                  Paso {step} de {totalSteps}
                </span>
              )}
            </div>

            <div className="flex items-center justify-end min-w-[84px]">
              {rightAction}
            </div>
          </div>

          {/* Barra de progreso */}
          {!isCelebration && (
            <div
              role="progressbar"
              aria-valuemin={1}
              aria-valuemax={totalSteps}
              aria-valuenow={step}
              aria-label={`Paso ${step} de ${totalSteps}`}
              className="h-1.5 w-full rounded-full bg-[#312E81]/15 overflow-hidden mb-2"
            >
              <div
                className="h-full rounded-full bg-[#FF5C39] transition-all duration-300 ease-out motion-reduce:transition-none motion-reduce:duration-0"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          )}
        </div>
      </header>

      {/* Cuerpo principal: partido en escritorio (lg+), apilado en celular */}
      <main className="flex-1 w-full mx-auto max-w-6xl px-4 sm:px-6 py-4 sm:py-8 flex flex-col">
        {/* Banners informativos (modo prueba / invitación) */}
        <div className="space-y-2 mb-4 empty:hidden">
          {isPreviewTestMode && (
            <div
              data-testid="preview-test-mode-banner"
              role="status"
              className="mx-auto lg:mx-0 w-fit inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#312E81]/25 bg-white text-[#1E1B4B] text-[13px] font-medium"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#312E81] shrink-0" aria-hidden="true" />
              <span>Modo prueba: no se crea ninguna cuenta</span>
            </div>
          )}

          {inviteLoading && (
            <div className="rounded-xl border border-[#312E81]/20 bg-white px-4 py-2.5 text-[13px] font-medium text-[#312E81]">
              Verificando invitación...
            </div>
          )}

          {!inviteLoading && inviteBannerText && (
            <div
              data-testid="active-invite-banner"
              className="rounded-xl bg-[#312E81] text-[#FAF7F2] px-4 py-2.5 text-[13px] font-semibold"
            >
              {inviteBannerText}
            </div>
          )}

          {!inviteLoading && invalidInviteBanner && (
            <div
              data-testid="invalid-invite-banner"
              className="rounded-xl border border-red-300 bg-red-50 text-red-900 px-4 py-2.5 text-[13px] font-semibold"
            >
              Esta invitación ya no es válida. Puedes crear tu tienda gratis igual.
            </div>
          )}
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-10 items-start lg:items-center">
          {/* Columna izquierda escritorio: vista previa en vivo dentro de marco de celular */}
          {isDesktopSplit && (
            <aside
              aria-label="Vista previa en vivo de tu tienda"
              className="lg:col-span-5 flex justify-center sticky top-24"
            >
              <div className="w-[348px] rounded-[34px] border-2 border-[#312E81]/15 bg-white p-2.5 shadow-xl shadow-[#312E81]/10">
                <div className="mx-auto mb-2 h-1.5 w-16 rounded-full bg-[#312E81]/15" />
                <div className="h-[600px] w-full rounded-[24px] overflow-hidden border border-[#312E81]/10 bg-[#FAF7F2] relative">
                  {renderPreview(false)}
                </div>
              </div>
            </aside>
          )}

          {/* Columna derecha escritorio / única en móvil */}
          <section className="lg:col-span-7 w-full max-w-xl mx-auto flex flex-col gap-4">
            {/* Vista previa compacta en celular */}
            {!isDesktopSplit && (
              <div className="w-full" aria-label="Vista previa compacta de tu tienda">
                {renderPreview(true)}
              </div>
            )}

            {/* Título en dos tonos (Sora 28–36 px) */}
            {!isCelebration && (
              <div className="space-y-1">
                <h1 className="font-heading font-bold text-[28px] lg:text-[36px] leading-[1.15] tracking-tight text-[#312E81]">
                  <span>{titleLead}</span>
                  {titleMuted ? (
                    <span className="text-[#312E81]/55"> {titleMuted}</span>
                  ) : null}
                </h1>
              </div>
            )}

            {/* Contenido de la pregunta */}
              <div
                key={step}
                className={cn(
                  "w-full",
                  step < 6 && "animate-in fade-in duration-150 motion-reduce:animate-none motion-reduce:duration-0",
                )}
              >
              {children}
            </div>

            {/* Leyenda explicativa inferior (13 px Inter) */}
            {hintText && !isCelebration && (
              <p className="text-[13px] leading-snug text-[#312E81]/75 pt-1">
                {hintText}
              </p>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

/**
 * Vista previa ultraligera usada en Pantalla 1 para no montar ni descargar
 * el árbol pesado de `PublicCatalog` mientras la persona escribe el nombre.
 */
export function PreviewHeaderStub({ storeName }: { storeName: string }) {
  const display = storeName.trim() || "Tu negocio";
  const initial = display.charAt(0).toUpperCase() || "T";

  return (
    <div
      data-testid="live-preview-stub"
      className="w-full lg:h-full flex flex-col bg-white rounded-2xl border border-[#312E81]/15 overflow-hidden shadow-xs"
    >
      <div className="bg-[#312E81] px-4 py-3.5 flex items-center gap-3 shrink-0">
        <div
          data-testid="preview-store-initial"
          className="h-11 w-11 rounded-full bg-[#FAF7F2] text-[#312E81] font-heading font-bold text-lg flex items-center justify-center shrink-0"
        >
          {initial}
        </div>
        <div className="min-w-0">
          <div
            data-testid="preview-store-name"
            className="text-base font-heading font-semibold text-[#FAF7F2] truncate"
          >
            {display}
          </div>
          <div className="text-[12px] text-[#FAF7F2]/80 truncate">
            Mira nuestro catálogo y pide por WhatsApp
          </div>
        </div>
      </div>
      <div className="hidden lg:grid grid-cols-2 gap-3 p-4 bg-[#FAF7F2] flex-1 content-start">
        {[1, 2, 3, 4].map((idx) => (
          <div
            key={idx}
            className="rounded-xl border border-[#312E81]/10 bg-white p-2.5 space-y-2"
          >
            <div className="aspect-[4/3] rounded-lg bg-[#312E81]/8" />
            <div className="h-3 w-4/5 rounded bg-[#312E81]/12" />
            <div className="h-3 w-2/5 rounded bg-[#FF5C39]/35" />
          </div>
        ))}
      </div>
    </div>
  );
}
