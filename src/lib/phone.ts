/**
 * @file phone.ts
 * @description Módulo centralizado para normalización, validación y formateo de números
 * de WhatsApp para los 21 países soportados en DIZI.
 * Basado en libphonenumber-js/mobile para optimizar el peso en bundles.
 */

import { parsePhoneNumberFromString, type CountryCode, type PhoneNumber } from "libphonenumber-js/mobile";

export interface Country {
  iso: string;
  name: string;
  dial: string;
  flag: string;
  example: string;
}

export type PhoneValidationReason = "incompleto" | "no_es_celular" | "formato_invalido";

export interface PhoneValidationResult {
  ok: boolean;
  e164Digits?: string;
  reason?: PhoneValidationReason;
}

export const DEFAULT_COUNTRY = "PE";

/**
 * Lista oficial de los 21 países soportados en DIZI.
 * Orden: Perú primero (por defecto del producto), y el resto en estricto orden alfabético.
 */
export const COUNTRIES: Country[] = [
  { iso: "PE", name: "Perú", dial: "51", flag: "🇵🇪", example: "987 654 321" },
  { iso: "AR", name: "Argentina", dial: "54", flag: "🇦🇷", example: "11 2345 6789" },
  { iso: "BO", name: "Bolivia", dial: "591", flag: "🇧🇴", example: "7123 4567" },
  { iso: "BR", name: "Brasil", dial: "55", flag: "🇧🇷", example: "11 96123 4567" },
  { iso: "CA", name: "Canadá", dial: "1", flag: "🇨🇦", example: "506 234 5678" },
  { iso: "CL", name: "Chile", dial: "56", flag: "🇨🇱", example: "9 6123 4567" },
  { iso: "CO", name: "Colombia", dial: "57", flag: "🇨🇴", example: "301 234 5678" },
  { iso: "CR", name: "Costa Rica", dial: "506", flag: "🇨🇷", example: "8312 3456" },
  { iso: "EC", name: "Ecuador", dial: "593", flag: "🇪🇨", example: "099 123 4567" },
  { iso: "SV", name: "El Salvador", dial: "503", flag: "🇸🇻", example: "7012 3456" },
  { iso: "ES", name: "España", dial: "34", flag: "🇪🇸", example: "612 34 56 78" },
  { iso: "US", name: "Estados Unidos", dial: "1", flag: "🇺🇸", example: "201 555 0123" },
  { iso: "GT", name: "Guatemala", dial: "502", flag: "🇬🇹", example: "5123 4567" },
  { iso: "HN", name: "Honduras", dial: "504", flag: "🇭🇳", example: "9123 4567" },
  { iso: "MX", name: "México", dial: "52", flag: "🇲🇽", example: "55 1234 5678" },
  { iso: "NI", name: "Nicaragua", dial: "505", flag: "🇳🇮", example: "8123 4567" },
  { iso: "PA", name: "Panamá", dial: "507", flag: "🇵🇦", example: "6123 4567" },
  { iso: "PY", name: "Paraguay", dial: "595", flag: "🇵🇾", example: "0981 123 456" },
  { iso: "DO", name: "República Dominicana", dial: "1", flag: "🇩🇴", example: "809 234 5678" },
  { iso: "UY", name: "Uruguay", dial: "598", flag: "🇺🇾", example: "099 123 456" },
  { iso: "VE", name: "Venezuela", dial: "58", flag: "🇻🇪", example: "0412 123 4567" }
];

/**
 * Obtiene el objeto Country correspondiente a un código ISO (por defecto PE).
 */
export function getCountry(iso?: string): Country {
  if (!iso) return COUNTRIES[0];
  const upper = iso.toUpperCase();
  return COUNTRIES.find((c) => c.iso === upper) || COUNTRIES[0];
}

/**
 * Parsea un número de teléfono telefónico de forma inteligente:
 * 1. Primero intenta interpretar lo que escribió el usuario tal cual, con el país elegido
 *    (parsePhoneNumberFromString(input, iso)).
 * 2. Si es Argentina y el usuario escribió formato local sin '9' (ej: 11 2345 6789),
 *    prueba anteponiendo '9' ya que WhatsApp y libphonenumber-js/mobile exigen el prefijo 9
 *    para celulares internacionales de Argentina.
 * 3. Si no da válido tal cual, prueba quitando el código de país repetido si el usuario
 *    ingresó el dial code en el campo de texto.
 */
export function parsePhone(iso: string, input: string): PhoneNumber | null {
  if (!input || !input.trim()) return null;
  const country = getCountry(iso);
  const trimmed = input.trim();

  // 1. Interpretar lo que escribió tal cual con el país elegido
  const parsedDirect = parsePhoneNumberFromString(trimmed, country.iso as CountryCode);
  if (parsedDirect && parsedDirect.isValid()) {
    return parsedDirect;
  }

  // Argentina: si el usuario ingresó formato nacional sin '9' (ej: 11 2345 6789)
  if (country.iso === "AR") {
    const rawDigits = trimmed.replace(/\D/g, "");
    if (!rawDigits.startsWith("9")) {
      const with9 = parsePhoneNumberFromString("9" + rawDigits, "AR");
      if (with9 && with9.isValid()) return with9;
    }
  }

  // 2. Probar quitando el código de país repetido si el usuario lo tipeó
  const digitsOnly = trimmed.replace(/\D/g, "");
  if (country.dial && digitsOnly.startsWith(country.dial)) {
    const rest = digitsOnly.slice(country.dial.length);
    if (rest.length >= 7) {
      const parsedRest = parsePhoneNumberFromString(rest, country.iso as CountryCode);
      if (parsedRest && parsedRest.isValid()) {
        return parsedRest;
      }
      if (country.iso === "AR" && !rest.startsWith("9")) {
        const arRestWith9 = parsePhoneNumberFromString("9" + rest, "AR");
        if (arRestWith9 && arRestWith9.isValid()) {
          return arRestWith9;
        }
      }
    }
  }

  return null;
}

/**
 * Normaliza la entrada de un teléfono devolviendo el número nacional limpio si es válido,
 * o los dígitos limpios sin caracteres especiales si está en proceso de escritura.
 */
export function normalizePhone(iso: string, input: string): string {
  if (!input) return "";
  const parsed = parsePhone(iso, input);
  if (parsed && parsed.isValid()) {
    return parsed.nationalNumber;
  }

  let cleaned = input.replace(/[\s\-\.\(\)\+]/g, "");
  const country = getCountry(iso);
  if (country.dial && cleaned.startsWith(country.dial)) {
    const rest = cleaned.slice(country.dial.length);
    if (rest.length >= 7) {
      cleaned = rest;
    }
  }
  return cleaned;
}

/**
 * Devuelve el número en el formato requerido por la API de WhatsApp (wa.me):
 * Solo dígitos, sin `+`, con código de país.
 * - Argentina: 54 + 9 + código de área + número local (ej. 5491123456789).
 * - Resto: código de país + número nacional (formato E.164 sin `+`).
 */
export function toWhatsAppDigits(iso: string, input: string): string {
  if (!input) return "";
  const parsed = parsePhone(iso, input);
  if (parsed && parsed.isValid()) {
    return parsed.format("E.164").replace(/^\+/, "");
  }

  const country = getCountry(iso);
  const digits = input.replace(/\D/g, "");
  if (digits.startsWith(country.dial)) {
    return digits;
  }
  return country.dial + digits;
}

/**
 * Valida si la entrada corresponde a un celular válido para el país indicado.
 * Devuelve `{ ok: true, e164Digits }` o `{ ok: false, reason }` con reason en español:
 * `"incompleto"`, `"no_es_celular"` o `"formato_invalido"`.
 */
export function validatePhone(iso: string, input: string): PhoneValidationResult {
  if (!input || !input.trim()) {
    return { ok: false, reason: "incompleto" };
  }

  const country = getCountry(iso);
  const parsed = parsePhone(iso, input);

  if (parsed && parsed.isValid()) {
    return {
      ok: true,
      e164Digits: parsed.format("E.164").replace(/^\+/, "")
    };
  }

  // Deducción precisa del motivo del error
  const rawDigits = input.replace(/\D/g, "");

  // Validación de celular para Perú: en Perú los celulares empiezan con 9 y tienen 9 dígitos
  if (country.iso === "PE") {
    const nationalDigits = rawDigits.startsWith("51") && rawDigits.length > 2
      ? rawDigits.slice(2)
      : rawDigits;

    if (nationalDigits.length > 0 && !nationalDigits.startsWith("9")) {
      return { ok: false, reason: "no_es_celular" };
    }
    if (nationalDigits.length < 9) {
      return { ok: false, reason: "incompleto" };
    }
    return { ok: false, reason: "formato_invalido" };
  }

  // Para otros países:
  const exampleDigits = country.example.replace(/\D/g, "");
  if (rawDigits.length < exampleDigits.length) {
    return { ok: false, reason: "incompleto" };
  }

  return { ok: false, reason: "formato_invalido" };
}

/**
 * Formatea un número de teléfono guardado o recibido (ej. 51987654321, 593991234567)
 * en un formato internacional legible para el usuario (ej. "+51 987 654 321", "+593 99 123 4567").
 */
export function formatPhoneDisplay(digits: string, iso?: string): string {
  if (!digits) return "";
  const cleaned = digits.replace(/\D/g, "");
  if (!cleaned) return digits;

  // Intento 1: Parsear con + directo (ej: +51987654321 o +5491123456789)
  const parsedDirect = parsePhoneNumberFromString("+" + cleaned);
  if (parsedDirect && parsedDirect.isValid()) {
    return parsedDirect.formatInternational();
  }

  // Intento 2: Si se proveyó ISO y no tenía el código de país
  if (iso) {
    const parsedWithCountry = parsePhone(iso, cleaned);
    if (parsedWithCountry && parsedWithCountry.isValid()) {
      return parsedWithCountry.formatInternational();
    }
  }

  return "+" + cleaned;
}
