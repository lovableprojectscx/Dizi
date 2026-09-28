/**
 * @file phone.ts
 * @description Módulo centralizado para normalización, validación y formateo de números
 * de WhatsApp para los 21 países soportados en DIZI.
 * Basado en libphonenumber-js/mobile para optimizar el peso en bundles.
 */

import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js/mobile";

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
 * Normaliza la entrada de un teléfono:
 * - Quita espacios, guiones, puntos, paréntesis y signo `+`.
 * - Elimina el código de marcado de país si el usuario lo repitió.
 * - Elimina el prefijo `0` local de países como Ecuador, Uruguay, Venezuela, Paraguay y Argentina.
 * - Elimina el prefijo `15` local de celulares en Argentina.
 * - Normaliza el formato de 10 dígitos en México (remueve el antiguo prefijo internacional `1`).
 */
export function normalizePhone(iso: string, input: string): string {
  if (!input) return "";
  const country = getCountry(iso);
  let cleaned = input.trim();

  // Si empieza con +, remover el +
  if (cleaned.startsWith("+")) {
    cleaned = cleaned.slice(1).trim();
  }

  // Quitar caracteres no numéricos
  cleaned = cleaned.replace(/[\s\-\.\(\)]/g, "");

  // Si el usuario repitió el código de país (ej: +51 987... o 51987...)
  if (country.dial && cleaned.startsWith(country.dial)) {
    const rest = cleaned.slice(country.dial.length);
    // Solo se remueve si lo restante tiene al menos 7 dígitos (longitud razonable de número local)
    if (rest.length >= 7) {
      cleaned = rest;
    }
  }

  // Reglas particulares por país
  if (country.iso === "AR") {
    // En Argentina: quitar prefijo nacional '0'
    if (cleaned.startsWith("0")) {
      cleaned = cleaned.slice(1);
    }
    // Quitar prefijo móvil local '15' (ej: 011 15 ... o 11 15 ... o 351 15 ...)
    if (cleaned.startsWith("1115")) {
      cleaned = "11" + cleaned.slice(4);
    } else if (/^\d{3}15\d+/.test(cleaned)) {
      cleaned = cleaned.slice(0, 3) + cleaned.slice(5);
    } else if (/^\d{4}15\d+/.test(cleaned)) {
      cleaned = cleaned.slice(0, 4) + cleaned.slice(6);
    } else if (cleaned.startsWith("15") && cleaned.length === 10) {
      cleaned = cleaned.slice(2);
    }
    // Si el usuario ingresó el '9' prefijo móvil internacional (11 dígitos), dejar los 10 dígitos nacionales
    if (cleaned.startsWith("9") && cleaned.length === 11) {
      cleaned = cleaned.slice(1);
    }
  } else if (country.iso === "EC" || country.iso === "UY" || country.iso === "VE" || country.iso === "PY") {
    // Países donde se antepone '0' al discar a nivel nacional (ej: Ecuador 099...)
    if (cleaned.startsWith("0")) {
      cleaned = cleaned.slice(1);
    }
  } else if (country.iso === "MX") {
    // Si incluye el antiguo prefijo móvil '1' posterior al código de país (11 dígitos empezando con 1)
    if (cleaned.startsWith("1") && cleaned.length === 11) {
      cleaned = cleaned.slice(1);
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
  const country = getCountry(iso);
  const norm = normalizePhone(iso, input);
  if (!norm) return "";

  if (country.iso === "AR") {
    return "549" + norm;
  }
  return country.dial + norm;
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
  const norm = normalizePhone(iso, input);

  // Validación de longitud base y no celular para Perú
  if (country.iso === "PE") {
    if (!norm.startsWith("9")) {
      return { ok: false, reason: "no_es_celular" };
    }
    if (norm.length < 9) {
      return { ok: false, reason: "incompleto" };
    }
    if (norm.length > 9) {
      return { ok: false, reason: "formato_invalido" };
    }
  }

  // Validación con libphonenumber-js
  let toParse = "+" + country.dial + norm;
  if (country.iso === "AR") {
    toParse = "+549" + norm;
  }

  const parsed = parsePhoneNumberFromString(toParse, country.iso as CountryCode);
  if (parsed && parsed.isValid()) {
    return {
      ok: true,
      e164Digits: toWhatsAppDigits(iso, input)
    };
  }

  // Deducción precisa del motivo del error
  const exNorm = normalizePhone(iso, country.example);
  const expectedLen = exNorm.length;

  if (norm.length < expectedLen) {
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
    const country = getCountry(iso);
    let toTry = "+" + country.dial + cleaned;
    if (country.iso === "AR" && !cleaned.startsWith("54")) {
      toTry = "+549" + cleaned;
    }
    const parsedWithCountry = parsePhoneNumberFromString(toTry, country.iso as CountryCode);
    if (parsedWithCountry && parsedWithCountry.isValid()) {
      return parsedWithCountry.formatInternational();
    }
  }

  return "+" + cleaned;
}
