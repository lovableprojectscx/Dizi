/**
 * @file PausedStorePage.tsx
 * @description Pantalla pública mostrada cuando una tienda se encuentra en 'pausa' comercial (F57).
 * No muestra productos ni carrito. Protege SEO con 'noindex, nofollow'.
 * Ofrece canal directo de contacto hacia el WhatsApp del comercio y marca sutil de Dizi.
 */

import React, { useEffect } from "react";
import type { Store } from "@/lib/types";
import { MessageCircle, PauseCircle } from "lucide-react";

interface PausedStorePageProps {
  store: Pick<Store, "name" | "slug" | "phone" | "countryCode" | "logo" | "brandColor"> & {
    paused?: boolean;
  };
}

export function PausedStorePage({ store }: PausedStorePageProps) {
  useEffect(() => {
    // Asegurar meta robots noindex, nofollow en el DOM para SEO
    let meta = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    let created = false;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "robots";
      document.head.appendChild(meta);
      created = true;
    }
    const previousContent = meta.content;
    meta.content = "noindex, nofollow";

    return () => {
      if (created && meta && meta.parentNode) {
        meta.parentNode.removeChild(meta);
      } else if (meta) {
        meta.content = previousContent;
      }
    };
  }, []);

  const rawPhone = (store.phone || "").replace(/\D/g, "");
  const country = (store.countryCode || "51").replace(/\D/g, "");
  const fullPhone = rawPhone ? `${country}${rawPhone}` : "";
  const whatsappUrl = fullPhone
    ? `https://wa.me/${fullPhone}?text=${encodeURIComponent(
        `¡Hola ${store.name}! Vi tu catálogo en pausa y quería hacerles una consulta.`,
      )}`
    : null;

  const brandColor = store.brandColor || "#10B981";

  return (
    <div
      data-testid="paused-store-page"
      className="min-h-screen bg-slate-50 flex flex-col items-center justify-between px-4 py-8 text-slate-800"
    >
      {/* Top spacer */}
      <div className="w-full max-w-sm flex justify-center pt-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200 shadow-sm">
          <PauseCircle className="w-3.5 h-3.5 text-amber-600" />
          Catálogo en pausa
        </span>
      </div>

      {/* Main card */}
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 flex flex-col items-center text-center my-auto space-y-5">
        {/* Store Logo */}
        {store.logo ? (
          <img
            src={store.logo}
            alt={store.name}
            className="w-20 h-20 rounded-2xl object-cover shadow-sm border border-slate-100"
          />
        ) : (
          <div
            style={{ backgroundColor: brandColor }}
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-sm"
          >
            {store.name ? store.name.slice(0, 2).toUpperCase() : "DI"}
          </div>
        )}

        {/* Store name & message */}
        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {store.name}
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            Este catálogo está en pausa temporalmente. Puedes comunicarte directamente con la tienda por WhatsApp para consultar pedidos o disponibilidad.
          </p>
        </div>

        {/* WhatsApp CTA */}
        {whatsappUrl ? (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="paused-whatsapp-btn"
            className="w-full inline-flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all"
          >
            <MessageCircle className="w-5 h-5 fill-current" />
            Escribir por WhatsApp
          </a>
        ) : (
          <div className="text-xs text-slate-400 italic">
            Canal de contacto directo no configurado
          </div>
        )}
      </div>

      {/* Footer Dizi badge */}
      <footer className="pt-6 pb-2 text-center text-xs text-slate-400">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-slate-600 transition-colors inline-flex items-center gap-1.5 font-medium"
        >
          <span>Catálogo digital con</span>
          <span className="font-bold tracking-tight text-slate-700">Dizi</span>
        </a>
      </footer>
    </div>
  );
}
