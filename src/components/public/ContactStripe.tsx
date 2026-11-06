import React from "react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { cn } from "@/lib/utils";

interface ContactStripeProps {
  phone?: string | null;
  countryCode?: string | null;
  storeName?: string;
  isDark?: boolean;
  className?: string;
}

export const ContactStripe: React.FC<ContactStripeProps> = ({
  phone,
  countryCode = "51",
  storeName = "",
  isDark = false,
  className,
}) => {
  if (!phone) return null;

  const cleanPhone = phone.replace(/\D/g, "");
  const fullPhone = cleanPhone.startsWith(countryCode || "")
    ? cleanPhone
    : `${countryCode || "51"}${cleanPhone}`;

  const message = encodeURIComponent(
    `¡Hola ${storeName}! Estuve viendo su catálogo en Dizi y me gustaría hacer una consulta.`
  );
  const waUrl = `https://wa.me/${fullPhone}?text=${message}`;

  return (
    <div
      className={cn(
        "my-8 mx-auto max-w-md p-5 rounded-2xl text-center flex flex-col items-center gap-3 transition-all",
        isDark
          ? "bg-emerald-950/30 border border-emerald-800/40 text-emerald-100 shadow-sm"
          : "bg-emerald-50/70 border border-emerald-200/80 text-emerald-950 shadow-sm",
        className
      )}
      data-testid="contact-stripe"
    >
      <div>
        <h3
          className={cn(
            "text-sm sm:text-base font-extrabold tracking-tight",
            isDark ? "text-emerald-200" : "text-emerald-900"
          )}
        >
          ¿Buscas algo más? Escríbenos
        </h3>
        <p
          className={cn(
            "text-xs mt-1 max-w-xs mx-auto leading-relaxed",
            isDark ? "text-emerald-400/90" : "text-emerald-800/80"
          )}
        >
          ¿No encontraste lo que buscas o necesitas un pedido especial? Escríbenos directamente a WhatsApp.
        </p>
      </div>

      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "inline-flex items-center gap-2 px-5 py-2.5 rounded-full",
          "bg-[#25D366] hover:bg-[#1ebd5b] text-white text-xs sm:text-sm font-bold",
          "shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
        )}
      >
        <WhatsAppIcon className="w-4 h-4 fill-current" />
        <span>Pregúntanos por WhatsApp</span>
      </a>
    </div>
  );
};
