import React, { useState, useEffect, useRef } from "react";
import { getOptimizedImageUrl } from "@/lib/image-utils";
import { cn } from "@/lib/utils";

export interface PortadaEstandarProps {
  activeBanners?: string[] | null;
  bannerTitle?: string | null;
  bannerTagline?: string | null;
  bannerBottomTag?: string | null;
  isNarrowing?: boolean;
  className?: string;
}

/**
 * PortadaEstandar: Portada unificada para layouts basados en cuadrícula (grid).
 * - Proporción 3:1 (1200x400 recomendado), centrado con object-fit cover.
 * - 0 banners o isNarrowing: retorna null (sin espacio residual).
 * - 1 banner: imagen fija optimizada.
 * - 2 o más banners: carrusel automático con swipe móvil, puntos e indicadores,
 *   respetando prefers-reduced-motion y pausas por interacción.
 * - Textos encima: SOLO renderiza los textos que realmente existan (etiqueta arriba, título y subtítulo),
 *   sin textos inventados por defecto.
 */
export function PortadaEstandar({
  activeBanners,
  bannerTitle,
  bannerTagline,
  bannerBottomTag,
  isNarrowing = false,
  className,
}: PortadaEstandarProps) {
  const banners = (activeBanners || []).filter(
    (b): b is string => typeof b === "string" && b.trim().length > 0
  );

  const hasMultiple = banners.length > 1;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Swipe en celular
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Avance automático respetando prefers-reduced-motion
  useEffect(() => {
    if (!hasMultiple) return;

    if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      if (mediaQuery.matches) return;
    }

    if (isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [hasMultiple, banners.length, isPaused]);

  // 0 banners o en modo búsqueda/resultados: no pinta nada
  if (isNarrowing || banners.length === 0) {
    return null;
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const diff = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 45; // píxeles mínimos para considerar swipe

    if (diff > minSwipeDistance) {
      // Deslizar izquierda -> siguiente banner
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    } else if (diff < -minSwipeDistance) {
      // Deslizar derecha -> banner anterior
      setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  const cleanBottomTag = bannerBottomTag?.trim() || null;
  const cleanTitle = bannerTitle?.trim() || null;
  const cleanTagline = bannerTagline?.trim() || null;

  const hasTexts = Boolean(cleanBottomTag || cleanTitle || cleanTagline);

  return (
    <section
      aria-label="Portada del catálogo"
      data-testid="portada-estandar"
      className={cn(
        "relative w-full aspect-[3/1] overflow-hidden bg-zinc-950 select-none",
        className
      )}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Imágenes del carrusel */}
      {banners.map((bannerUrl, idx) => {
        const isCurrent = idx === currentIndex;
        return (
          <div
            key={idx}
            data-testid={`portada-slide-${idx}`}
            className={cn(
              "absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out",
              isCurrent ? "opacity-100 z-0 pointer-events-auto" : "opacity-0 -z-10 pointer-events-none"
            )}
            aria-hidden={!isCurrent}
          >
            <img
              src={getOptimizedImageUrl(bannerUrl, 1200)}
              alt={cleanTitle || `Banner ${idx + 1}`}
              className="w-full h-full object-cover object-center"
              loading={idx === 0 ? "eager" : "lazy"}
              fetchPriority={idx === 0 ? "high" : "auto"}
              decoding={idx === 0 ? "sync" : "async"}
            />
          </div>
        );
      })}

      {/* Degradado sutil para asegurar contraste solo cuando hay textos */}
      {hasTexts && (
        <div
          data-testid="portada-gradient-overlay"
          className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/15 pointer-events-none z-10"
        />
      )}

      {/* Degradado inferior para visibilidad de los puntos de paginación */}
      {hasMultiple && (
        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/40 to-transparent pointer-events-none z-10" />
      )}

      {/* Textos: solo los campos que existan */}
      {hasTexts && (
        <div
          data-testid="portada-texts"
          className="absolute inset-0 z-20 flex flex-col justify-end p-3 sm:p-5 md:p-7 max-w-4xl"
        >
          <div className="space-y-1 sm:space-y-1.5 md:space-y-2">
            {cleanBottomTag && (
              <div>
                <span
                  data-testid="portada-tag"
                  className="inline-block text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-black/40 backdrop-blur-xs text-white border border-white/20 drop-shadow-xs"
                >
                  {cleanBottomTag}
                </span>
              </div>
            )}
            {cleanTitle && (
              <h2
                data-testid="portada-title"
                className="text-sm sm:text-xl md:text-3xl font-extrabold text-white tracking-tight leading-tight drop-shadow-md line-clamp-2"
              >
                {cleanTitle}
              </h2>
            )}
            {cleanTagline && (
              <p
                data-testid="portada-tagline"
                className="text-[11px] sm:text-xs md:text-sm font-medium text-white/90 drop-shadow-xs line-clamp-2"
              >
                {cleanTagline}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Puntos de paginación (dots) */}
      {hasMultiple && (
        <div
          data-testid="portada-dots"
          className="absolute bottom-2 sm:bottom-3 right-3 sm:right-5 z-30 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/20"
        >
          {banners.map((_, idx) => {
            const isSelected = idx === currentIndex;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Ver banner ${idx + 1} de ${banners.length}`}
                aria-current={isSelected ? "true" : undefined}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300 cursor-pointer focus:outline-hidden",
                  isSelected ? "w-4 sm:w-5 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"
                )}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
