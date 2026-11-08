import React, { useEffect, useRef } from "react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { cn } from "@/lib/utils";
import { getContactStripeStyles } from "@/lib/brand-cover";

interface ContactStripeProps {
  phone?: string | null;
  countryCode?: string | null;
  storeName?: string;
  brandColor?: string | null;
  isDark?: boolean;
  className?: string;
  onVisibilityChange?: (visible: boolean) => void;
}

export const ContactStripe: React.FC<ContactStripeProps> = ({
  phone,
  countryCode = "51",
  storeName = "",
  brandColor,
  isDark = false,
  className,
  onVisibilityChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !onVisibilityChange) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) {
          onVisibilityChange(entry.isIntersecting);
        }
      },
      { threshold: 0.05 }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      onVisibilityChange(false);
    };
  }, [onVisibilityChange]);

  if (!phone) return null;

  const cleanPhone = phone.replace(/\D/g, "");
  const fullPhone = cleanPhone.startsWith(countryCode || "")
    ? cleanPhone
    : `${countryCode || "51"}${cleanPhone}`;

  const message = encodeURIComponent(
    `¡Hola ${storeName}! Estuve viendo su catálogo en Dizi y me gustaría hacer una consulta.`
  );
  const waUrl = `https://wa.me/${fullPhone}?text=${message}`;

  const styles = getContactStripeStyles(brandColor, isDark);

  return (
    <div
      ref={containerRef}
      className={cn(
        "my-8 mx-auto max-w-md p-5 rounded-2xl text-center flex flex-col items-center gap-3 transition-all border shadow-sm",
        className
      )}
      style={{
        backgroundColor: styles.containerBg,
        borderColor: styles.containerBorder,
      }}
      data-testid="contact-stripe"
    >
      <div>
        <h3
          className="text-sm sm:text-base font-extrabold tracking-tight"
          style={{ color: styles.titleColor }}
        >
          ¿Buscas algo más? Escríbenos
        </h3>
        <p
          className="text-xs mt-1 max-w-xs mx-auto leading-relaxed"
          style={{ color: styles.descColor }}
        >
          ¿No encontraste lo que buscas o necesitas un pedido especial? Escríbenos directamente a WhatsApp.
        </p>
      </div>

      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold",
          "shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
        )}
        style={{
          backgroundColor: styles.buttonBg,
          color: styles.buttonTextColor,
        }}
      >
        <WhatsAppIcon className="w-4 h-4 fill-current shrink-0" />
        <span>Pregúntanos por WhatsApp</span>
      </a>
    </div>
  );
};
