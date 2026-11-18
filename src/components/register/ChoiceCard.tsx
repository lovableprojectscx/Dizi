import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ChoiceCardProps {
  label: string;
  description?: string;
  icon: React.ReactNode;
  selected: boolean;
  onSelect: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLButtonElement>) => void;
  testId?: string;
  dataAttrs?: Record<string, string>;
  role?: "radio" | "button";
  compact?: boolean;
}

/**
 * Tarjeta seleccionable con ícono de línea en índigo (#312E81), título en Inter >= 16 px,
 * alto mínimo >= 48 px y soporte de foco/teclado (RF-53.2, RNF-53.2, RNF-53.4).
 */
export const ChoiceCard = React.forwardRef<HTMLButtonElement, ChoiceCardProps>(
  function ChoiceCard(
    {
      label,
      description,
      icon,
      selected,
      onSelect,
      onKeyDown,
      testId,
      dataAttrs,
      role = "radio",
      compact = false,
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type="button"
        role={role}
        aria-checked={role === "radio" ? selected : undefined}
        aria-pressed={role === "button" ? selected : undefined}
        data-testid={testId}
        {...dataAttrs}
        onClick={onSelect}
        onKeyDown={onKeyDown}
        className={cn(
          "w-full min-h-[52px] rounded-2xl text-left flex items-center justify-between gap-3 transition-all duration-200 motion-reduce:transition-none cursor-pointer",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#312E81]",
          compact ? "px-3.5 py-2.5" : "px-4 py-3",
          selected
            ? "border-2 border-[#312E81] bg-[#312E81]/[0.06] shadow-xs"
            : "border border-[#312E81]/18 bg-white hover:border-[#312E81]/45",
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span
            aria-hidden="true"
            className={cn(
              "h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition-colors motion-reduce:transition-none",
              selected ? "bg-[#312E81] text-[#FAF7F2]" : "bg-[#FAF7F2] text-[#312E81]",
            )}
          >
            {icon}
          </span>
          <div className="min-w-0">
            <div className="text-[16px] font-semibold leading-snug text-[#1E1B4B] truncate">
              {label}
            </div>
            {description && (
              <div className="text-[13px] leading-snug text-[#312E81]/75 line-clamp-1">
                {description}
              </div>
            )}
          </div>
        </div>

        <span
          aria-hidden="true"
          className={cn(
            "h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors motion-reduce:transition-none",
            selected
              ? "border-[#312E81] bg-[#312E81] text-[#FAF7F2]"
              : "border-[#312E81]/30 bg-white",
          )}
        >
          {selected && <Check className="w-3 h-3 stroke-[3]" />}
        </span>
      </button>
    );
  },
);
