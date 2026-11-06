import React from "react";
import { Store } from "@/lib/types";
import { getOptimizedImageUrl } from "@/lib/image-utils";
import { shouldShowBrandCover, getEffectiveTagline, getBrandCoverStyles } from "@/lib/brand-cover";
import { cn } from "@/lib/utils";

interface BrandCoverProps {
  store: Store;
  model?: string;
  isDark?: boolean;
  className?: string;
}

export const BrandCover: React.FC<BrandCoverProps> = ({
  store,
  model = "grid",
  isDark = false,
  className,
}) => {
  if (!shouldShowBrandCover(store)) {
    return null;
  }

  const tagline = getEffectiveTagline(store);
  const styles = getBrandCoverStyles(store.brandColor, model, isDark);
  const initial = (store.name || "D").trim().charAt(0).toUpperCase();

  // Adaptaciones formales según el diseño oficial (RF-45.1)
  const isArch = model === "arch";
  const isNature = model === "nature" || model === "nature_mint";

  return (
    <div
      className={cn(
        "relative mx-3.5 sm:mx-4 my-2.5 overflow-hidden transition-all duration-300",
        "flex items-center gap-3.5 sm:gap-4 p-3.5 sm:p-5",
        "min-h-[96px] max-h-[140px] sm:max-h-[160px]",
        isArch && "rounded-t-[38px] rounded-b-2xl shadow-md",
        isNature && "rounded-tl-[32px] rounded-br-[32px] rounded-tr-[14px] rounded-bl-[14px] shadow-sm",
        !isArch && !isNature && "rounded-2xl shadow-sm",
        className
      )}
      style={{
        background: styles.gradient,
        border: `1px solid ${styles.borderColor}`,
      }}
      data-testid="brand-cover"
    >
      {/* Decoración superior sutil para Arch */}
      {isArch && (
        <div
          className="absolute top-0 left-[15%] right-[15%] h-[2.5px] pointer-events-none"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)",
          }}
        />
      )}

      {/* Decoración botánica SVG sutil para Nature */}
      {isNature && (
        <svg
          className="absolute -right-3 -bottom-3 w-20 h-20 opacity-15 pointer-events-none"
          viewBox="0 0 100 100"
          style={{ fill: styles.decorColor }}
          aria-hidden="true"
        >
          <path d="M50 0C55 25 80 45 100 50C80 55 55 80 50 100C45 80 20 55 0 50C20 45 45 25 50 0Z" />
        </svg>
      )}

      {/* Destello geométrico sutil para Grilla y otros */}
      {!isArch && !isNature && (
        <div
          className="absolute -top-6 -right-6 w-24 h-24 rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${styles.decorColor} 0%, transparent 70%)`,
          }}
        />
      )}

      {/* Logo o Inicial (grande y destacado) */}
      {store.logo ? (
        <img
          src={getOptimizedImageUrl(store.logo, 200)}
          alt={store.name}
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover shrink-0 shadow-md bg-white border-2 border-white/90"
        />
      ) : (
        <div
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shrink-0 font-extrabold text-2xl sm:text-3xl shadow-md border-2 border-white/90"
          style={{
            backgroundColor: styles.avatarBg,
            color: styles.avatarTextColor,
          }}
        >
          {initial}
        </div>
      )}

      {/* Textos de la marca (Nombre y Eslogan) */}
      <div className="flex flex-col justify-center min-w-0 pr-1 z-10">
        <h1
          className={cn(
            "font-extrabold tracking-tight leading-tight line-clamp-2 text-base sm:text-xl",
            isArch ? "font-serif" : "font-sans"
          )}
          style={{ color: styles.textColor }}
        >
          {store.name}
        </h1>
        {tagline && (
          <p
            className="text-xs sm:text-sm mt-0.5 line-clamp-2 leading-snug font-medium"
            style={{ color: styles.taglineColor }}
          >
            {tagline}
          </p>
        )}
      </div>
    </div>
  );
};
