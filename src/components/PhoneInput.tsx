import * as React from "react";
import { useState, useEffect, useMemo, useRef } from "react";
import { ChevronDown, Check, ExternalLink, AlertCircle, CheckCircle2 } from "lucide-react";
import { AsYouType, type CountryCode } from "libphonenumber-js/mobile";

import {
  COUNTRIES,
  Country,
  DEFAULT_COUNTRY,
  getCountry,
  parsePhone,
  validatePhone,
  toWhatsAppDigits,
  formatPhoneDisplay,
} from "@/lib/phone";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export interface PhoneChangePayload {
  digits: string;
  countryIso: string;
  dial: string;
  valid: boolean;
}

export interface PhoneInputProps {
  value?: string;
  countryIso?: string;
  onChange: (payload: PhoneChangePayload) => void;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  triggerClassName?: string;
  id?: string;
  name?: string;
  placeholder?: string;
  autoFocus?: boolean;
  required?: boolean;
  showValidationMessage?: boolean;
}

export function PhoneInput({
  value = "",
  countryIso,
  onChange,
  disabled = false,
  className,
  inputClassName,
  triggerClassName,
  id,
  name,
  placeholder,
  autoFocus = false,
  required = false,
  showValidationMessage = true,
}: PhoneInputProps) {
  const [open, setOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country>(() =>
    getCountry(countryIso || DEFAULT_COUNTRY)
  );

  // Formatear valor inicial para mostrar en el input
  const formatInitialDisplay = (val: string, iso: string): string => {
    if (!val) return "";
    const parsed = parsePhone(iso, val);
    if (parsed && parsed.isValid()) {
      return parsed.formatNational();
    }
    // Si viene sin parsear pero tiene formato directo
    const ayt = new AsYouType(iso as CountryCode);
    return ayt.input(val);
  };

  const [displayValue, setDisplayValue] = useState<string>(() =>
    formatInitialDisplay(value, selectedCountry.iso)
  );

  const lastEmittedDigitsRef = useRef<string>("");

  // Sincronizar país si cambia externamente
  useEffect(() => {
    if (countryIso && countryIso !== selectedCountry.iso) {
      const nextCountry = getCountry(countryIso);
      setSelectedCountry(nextCountry);
    }
  }, [countryIso, selectedCountry.iso]);

  // Sincronizar valor si cambia externamente (no iniciado por este componente)
  useEffect(() => {
    if (value !== undefined && value !== lastEmittedDigitsRef.current) {
      const nextDisplay = formatInitialDisplay(value, selectedCountry.iso);
      setDisplayValue(nextDisplay);
      lastEmittedDigitsRef.current = value;
    }
  }, [value, selectedCountry.iso]);

  // Resultado de validación actual
  const validation = useMemo(() => {
    return validatePhone(selectedCountry.iso, displayValue);
  }, [selectedCountry.iso, displayValue]);

  // Manejo de cambio de texto con AsYouType
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawInput = e.target.value;
    const ayt = new AsYouType(selectedCountry.iso as CountryCode);
    const formatted = ayt.input(rawInput);
    const nextDisplay = formatted || rawInput;

    setDisplayValue(nextDisplay);

    const valResult = validatePhone(selectedCountry.iso, nextDisplay);
    const resolvedDigits =
      valResult.ok && valResult.e164Digits
        ? valResult.e164Digits
        : toWhatsAppDigits(selectedCountry.iso, nextDisplay);

    lastEmittedDigitsRef.current = resolvedDigits;

    onChange({
      digits: resolvedDigits,
      countryIso: selectedCountry.iso,
      dial: selectedCountry.dial,
      valid: valResult.ok,
    });
  };

  // Manejo de cambio de país
  const handleSelectCountry = (country: Country) => {
    setSelectedCountry(country);
    setOpen(false);

    // Re-formatear y revalidar con el nuevo país
    const ayt = new AsYouType(country.iso as CountryCode);
    const formatted = ayt.input(displayValue);
    const nextDisplay = formatted || displayValue;
    setDisplayValue(nextDisplay);

    const valResult = validatePhone(country.iso, nextDisplay);
    const resolvedDigits =
      valResult.ok && valResult.e164Digits
        ? valResult.e164Digits
        : toWhatsAppDigits(country.iso, nextDisplay);

    lastEmittedDigitsRef.current = resolvedDigits;

    onChange({
      digits: resolvedDigits,
      countryIso: country.iso,
      dial: country.dial,
      valid: valResult.ok,
    });
  };

  const hasInput = displayValue.trim().length > 0;
  const targetDigits = validation.e164Digits || toWhatsAppDigits(selectedCountry.iso, displayValue);
  const formattedInternational = formatPhoneDisplay(targetDigits, selectedCountry.iso);

  const errorMessage =
    validation.reason === "no_es_celular"
      ? `Debe ser un celular con WhatsApp. Ejemplo: ${selectedCountry.example}`
      : `Ingresa un celular válido de ${selectedCountry.name}. Ejemplo: ${selectedCountry.example}`;

  return (
    <div className={cn("space-y-1.5 w-full", className)}>
      <div className="flex gap-2 items-center">
        {/* Selector de país desplegable y buscable */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={disabled}
              aria-label="Seleccionar país"
              className={cn(
                "flex h-11 w-[96px] sm:w-[108px] shrink-0 items-center justify-between rounded-xl border border-slate-200 bg-white/70 px-2.5 sm:px-3 text-sm font-medium shadow-xs transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50",
                triggerClassName
              )}
            >
              <span className="text-base leading-none select-none">{selectedCountry.flag}</span>
              <span className="text-xs sm:text-sm font-semibold text-slate-700">
                +{selectedCountry.dial}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[280px] p-0 shadow-lg rounded-xl overflow-hidden z-50 bg-white border border-slate-200"
            align="start"
          >
            <Command>
              <CommandInput
                placeholder="Buscar país o código..."
                className="h-10 text-xs sm:text-sm"
              />
              <CommandList className="max-h-[260px] overflow-y-auto">
                <CommandEmpty className="py-4 text-center text-xs text-slate-500">
                  No se encontró el país.
                </CommandEmpty>
                <CommandGroup>
                  {COUNTRIES.map((c) => {
                    const isSelected = c.iso === selectedCountry.iso;
                    return (
                      <CommandItem
                        key={c.iso}
                        value={`${c.name} ${c.iso} ${c.dial}`}
                        onSelect={() => handleSelectCountry(c)}
                        className="flex items-center justify-between py-2 px-3 text-xs sm:text-sm cursor-pointer hover:bg-slate-100"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-base leading-none shrink-0">{c.flag}</span>
                          <span className="truncate font-medium text-slate-800">{c.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 pl-2">
                          <span className="text-xs font-mono text-slate-400">+{c.dial}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Campo de entrada de número con formato dinámico */}
        <input
          id={id}
          name={name}
          type="tel"
          inputMode="tel"
          disabled={disabled}
          autoFocus={autoFocus}
          required={required}
          placeholder={placeholder || selectedCountry.example}
          value={displayValue}
          onChange={handleInputChange}
          className={cn(
            "flex h-11 flex-1 min-w-0 rounded-xl border border-slate-200 bg-white/70 px-3.5 text-sm font-medium transition-all placeholder:text-slate-400 focus:bg-white focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50",
            hasInput && !validation.ok && "border-rose-300 focus:border-rose-400 focus:ring-rose-100",
            hasInput && validation.ok && "border-emerald-300 focus:border-emerald-400 focus:ring-emerald-100",
            inputClassName
          )}
        />
      </div>

      {/* Mensajes de validación y confirmación en vivo */}
      {showValidationMessage && hasInput && (
        <div className="pt-0.5">
          {validation.ok ? (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-emerald-600 font-medium">
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                Tus clientes te escribirán a{" "}
                <strong className="font-semibold text-emerald-700">
                  {formattedInternational}
                </strong>
              </span>
              <a
                href={`https://wa.me/${targetDigits}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 underline font-semibold transition-colors ml-auto sm:ml-0"
              >
                Probar en WhatsApp
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ) : (
            <div className="flex items-start gap-1.5 text-xs text-rose-500 font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
