/**
 * @file SellerPicker.tsx
 * @description Selector interactivo de vendedores (F39): ventana inferior en celular y modal en PC.
 * Permite a la clienta elegir con qué vendedor comunicarse antes de abrir WhatsApp.
 */

import React from "react";
import { X, ChevronRight } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";

export interface SellerOption {
  id: string;
  name: string;
  phone: string;
  countryIso?: string;
  isMain?: boolean;
}

interface SellerPickerProps {
  open: boolean;
  onClose: () => void;
  sellers: SellerOption[];
  onSelectSeller: (seller: SellerOption) => void;
  title?: string;
  subtitle?: string;
}

export function SellerPicker({
  open,
  onClose,
  sellers,
  onSelectSeller,
  title = "¿Con quién quieres hablar?",
  subtitle,
}: SellerPickerProps) {
  if (!open) return null;

  return (
    <div
      onClick={onClose}
      data-testid="seller-picker-backdrop"
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        data-testid="seller-picker-modal"
        style={{
          backgroundColor: "var(--card)",
          borderColor: "var(--border)",
          color: "var(--foreground)",
        }}
        className="border-t sm:border rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4 relative animate-in slide-in-from-bottom sm:zoom-in-95 duration-200"
      >
        {/* Barra superior de arrastre en móvil */}
        <div className="w-12 h-1 bg-muted rounded-full mx-auto sm:hidden -mt-1 mb-2" />

        {/* Botón cerrar */}
        <button
          onClick={onClose}
          aria-label="Cerrar selector"
          style={{
            backgroundColor: "color-mix(in srgb, var(--foreground) 8%, transparent)",
            color: "var(--foreground)",
          }}
          className="absolute top-4 right-4 h-8 w-8 rounded-full flex items-center justify-center transition hover:opacity-80 cursor-pointer z-10"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Encabezado */}
        <div className="pr-8">
          <h3
            style={{ color: "var(--card-foreground)" }}
            className="font-extrabold text-base sm:text-lg tracking-tight"
          >
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>

        {/* Lista de vendedores */}
        <div className="flex flex-col gap-2 pt-1 max-h-[60vh] overflow-y-auto">
          {sellers.map((seller) => (
            <button
              key={seller.id}
              onClick={() => onSelectSeller(seller)}
              data-testid={`seller-option-${seller.id}`}
              style={{
                borderColor: "var(--border)",
                backgroundColor: "color-mix(in srgb, var(--card) 92%, var(--foreground) 8%)",
              }}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all hover:scale-[1.01] active:scale-[0.99] hover:border-[#25D366]/60 group text-left cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-full bg-[#25D366]/15 flex items-center justify-center shrink-0 text-[#25D366] group-hover:bg-[#25D366] group-hover:text-white transition-colors duration-200">
                  <WhatsAppIcon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-sm truncate flex items-center gap-1.5 text-foreground">
                    <span>{seller.name}</span>
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    Chatear por WhatsApp
                  </div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
