import React, { useState } from "react";
import { Store } from "@/lib/types";
import { getOptimizedImageUrl } from "@/lib/image-utils";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { cn } from "@/lib/utils";
import { MapPin, Truck, Store as StoreIcon, CreditCard, Clock, Share2, ChevronLeft, ChevronRight } from "lucide-react";

export interface ProfileHeaderProps {
  store: Store;
  activeBanners?: string[];
  supportClick: () => void;
  className?: string;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  store,
  activeBanners = [],
  supportClick,
  className,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const banners = activeBanners.filter((b): b is string => typeof b === "string" && b.trim().length > 0);
  const hasBanners = banners.length > 0;
  const brandColor = store.brandColor || "#4f46e5";
  const initial = (store.name || "D").trim().charAt(0).toUpperCase();

  // Badges: extraer datos reales disponibles
  const badges: Array<{ id: string; label: string; icon: React.ReactNode }> = [];

  // Si tiene badges explícitos configurados
  if (Array.isArray(store.headerBadges) && store.headerBadges.length > 0) {
    store.headerBadges.forEach((b, idx) => {
      const lower = b.toLowerCase();
      let icon = <Truck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />;
      if (lower.includes("recojo") || lower.includes("tienda") || lower.includes("showroom")) {
        icon = <StoreIcon className="h-3.5 w-3.5 text-blue-600 shrink-0" />;
      } else if (lower.includes("pago") || lower.includes("yape") || lower.includes("plin") || lower.includes("tarjeta")) {
        icon = <CreditCard className="h-3.5 w-3.5 text-purple-600 shrink-0" />;
      } else if (lower.includes("horario") || lower.includes("lun") || lower.includes("am") || lower.includes("pm")) {
        icon = <Clock className="h-3.5 w-3.5 text-amber-600 shrink-0" />;
      }
      badges.push({ id: `custom-${idx}`, label: b, icon });
    });
  }

  // Si tiene dirección física registrada en location_address
  if (store.locationAddress && store.locationAddress.trim().length > 0) {
    badges.push({
      id: "address",
      label: store.locationAddress.trim(),
      icon: <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0" />,
    });
  }

  const handleShare = async () => {
    const shareData = {
      title: store.name,
      text: store.bannerTagline || `Catálogo de ${store.name}`,
      url: window.location.href,
    };
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch {
        // Cancelado por el usuario
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
      } catch {
        // Error de portapapeles
      }
    }
  };

  const hasBannerTexts = Boolean(store.bannerTitle || store.bannerTagline);

  return (
    <div className={cn("w-full max-w-7xl mx-auto px-2 sm:px-4 mb-4 select-none", className)} data-testid="profile-header">
      <div className="bg-card rounded-2xl sm:rounded-3xl border border-border overflow-hidden shadow-xs">
        
        {/* 1. BANNER ANCHO ARRIBA */}
        <div className="relative w-full aspect-[21/9] sm:aspect-[21/7] md:aspect-[3.6/1] min-h-[140px] max-h-[260px] overflow-hidden bg-muted">
          {hasBanners ? (
            <>
              {banners.map((b, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out",
                    idx === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                  )}
                >
                  <img
                    src={getOptimizedImageUrl(b, 1200)}
                    alt={`${store.name} banner ${idx + 1}`}
                    className="w-full h-full object-cover object-center"
                    loading="eager"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
                </div>
              ))}

              {/* Controles de banner múltiple */}
              {banners.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-20 h-7 w-7 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition"
                    aria-label="Banner anterior"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentSlide((prev) => (prev + 1) % banners.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-20 h-7 w-7 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition"
                    aria-label="Siguiente banner"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              )}

              {/* TEXTO DEL BANNER: Con safe-area izquierda/inferior para que el logo NO lo tape */}
              {hasBannerTexts && (
                <div
                  data-testid="profile-banner-text"
                  className="absolute inset-0 z-20 flex flex-col justify-center px-4 sm:px-8 pl-24 sm:pl-36 md:pl-44 pb-2 sm:pb-0 text-left pointer-events-none"
                >
                  <div className="max-w-xl space-y-0.5 sm:space-y-1">
                    {store.bannerTagline && (
                      <span className="inline-block text-[9px] sm:text-xs font-black tracking-widest uppercase text-amber-300 drop-shadow-md">
                        {store.bannerTagline}
                      </span>
                    )}
                    {store.bannerTitle && (
                      <h2 className="text-lg sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight uppercase leading-tight drop-shadow-lg line-clamp-2">
                        {store.bannerTitle}
                      </h2>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Fallback sin banner (solo color de marca) */
            <div
              data-testid="profile-banner-brand-color"
              className="w-full h-full relative flex items-center justify-end px-8 overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${brandColor} 0%, color-mix(in srgb, ${brandColor} 60%, #09090b) 100%)`,
              }}
            >
              {/* Brillo geométrico sutil */}
              <div
                className="absolute -top-12 -right-12 w-48 h-48 rounded-full pointer-events-none opacity-20"
                style={{ background: "radial-gradient(circle, #ffffff 0%, transparent 70%)" }}
              />
              <div
                className="absolute -bottom-8 right-1/4 w-36 h-36 rounded-full pointer-events-none opacity-15"
                style={{ background: "radial-gradient(circle, #ffffff 0%, transparent 70%)" }}
              />
              {hasBannerTexts && (
                <div
                  data-testid="profile-banner-text"
                  className="absolute inset-0 z-10 flex flex-col justify-center px-4 sm:px-8 pl-24 sm:pl-36 md:pl-44 text-left pointer-events-none"
                >
                  {store.bannerTagline && (
                    <span className="text-[10px] sm:text-xs font-bold tracking-widest uppercase text-white/80">
                      {store.bannerTagline}
                    </span>
                  )}
                  {store.bannerTitle && (
                    <h2 className="text-lg sm:text-2xl font-extrabold text-white tracking-tight leading-tight">
                      {store.bannerTitle}
                    </h2>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 2. ZONA DE PERFIL SOLAPADA (Logo cuadrado redondeado + Nombre + Acciones) */}
        <div className="relative px-4 sm:px-6 pb-5 pt-1">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 -mt-9 sm:-mt-12 md:-mt-14 mb-3">
            
            {/* LOGO CUADRADO CON BORDES REDONDEADOS (Montado en el borde inferior izquierdo) */}
            <div className="relative z-20 shrink-0" data-testid="profile-logo">
              <div className="w-18 h-18 sm:w-22 sm:h-22 md:w-26 md:h-26 w-[76px] h-[76px] sm:w-[92px] sm:h-[92px] md:w-[104px] md:h-[104px] rounded-2xl bg-card p-1 shadow-lg border-2 border-background">
                {store.logo ? (
                  <img
                    src={getOptimizedImageUrl(store.logo, 250)}
                    alt={store.name}
                    className="w-full h-full rounded-xl object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full rounded-xl flex items-center justify-center font-black text-2xl sm:text-3xl text-white shadow-inner"
                    style={{ backgroundColor: brandColor }}
                  >
                    {initial}
                  </div>
                )}
              </div>
            </div>

            {/* BOTONES DE ACCIÓN (Desktop) */}
            <div className="hidden sm:flex items-center gap-2 pb-1">
              <button
                type="button"
                onClick={supportClick}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:opacity-90 active:scale-95 transition"
              >
                <WhatsAppIcon className="h-4 w-4" />
                <span>Pedir por WhatsApp</span>
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="p-2 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground transition"
                title="Compartir catálogo"
              >
                <Share2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* NOMBRE Y ESCLOGAN */}
          <div className="space-y-1 max-w-2xl">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-foreground tracking-tight leading-tight">
              {store.name}
            </h1>
            {store.bannerTagline && (
              <p className="text-xs sm:text-sm text-muted-foreground font-medium leading-relaxed">
                {store.bannerTagline}
              </p>
            )}
          </div>

          {/* 3. FILA DE ETIQUETAS (Delivery, Recojo, Pagos, Dirección, Horario) */}
          {badges.length > 0 && (
            <div data-testid="profile-badges" className="mt-3.5 pt-3 border-t border-border/60 flex flex-wrap items-center gap-2">
              {badges.map((b) => (
                <div
                  key={b.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-muted/70 text-foreground border border-border/50 shadow-2xs"
                >
                  {b.icon}
                  <span>{b.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* ACCIONES MÓVIL (Full width) */}
          <div className="flex sm:hidden items-center gap-2 mt-3.5 pt-1">
            <button
              type="button"
              onClick={supportClick}
              className="flex-1 inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs active:scale-98"
            >
              <WhatsAppIcon className="h-4 w-4" />
              <span>Pedir por WhatsApp</span>
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="p-2 rounded-xl border border-border bg-card text-muted-foreground hover:bg-muted transition"
              title="Compartir catálogo"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
