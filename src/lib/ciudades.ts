/**
 * @file ciudades.ts
 * @description Única fuente de verdad para la lista opcional de ciudades de Perú en F53 (RF-53.4, RNF-53.5).
 */

export interface CityDefinition {
  id: string;
  label: string;
}

export const CITY_ID_REGEX = /^[a-z-]{2,30}$/;

export const CIUDADES: readonly CityDefinition[] = [
  { id: "lima", label: "Lima" },
  { id: "arequipa", label: "Arequipa" },
  { id: "la-libertad", label: "La Libertad" },
  { id: "piura", label: "Piura" },
  { id: "cusco", label: "Cusco" },
  { id: "lambayeque", label: "Lambayeque" },
  { id: "junin", label: "Junín" },
  { id: "ayacucho", label: "Ayacucho" },
  { id: "ica", label: "Ica" },
  { id: "otra", label: "Otra ciudad" },
] as const;

export function isValidSignupCity(city?: string | null): boolean {
  if (!city) return false;
  const clean = city.trim();
  return CITY_ID_REGEX.test(clean) && CIUDADES.some((c) => c.id === clean);
}

export function getCityLabel(city?: string | null): string {
  if (!city) return "";
  const clean = city.trim().toLowerCase();
  return CIUDADES.find((c) => c.id === clean)?.label ?? city;
}
