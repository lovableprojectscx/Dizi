/**
 * @file rubros.ts
 * @description Única fuente de verdad para los 12 rubros de DIZI (F49, RNF-49.3).
 * Define etiqueta, ícono, valor guardado en `stores.niche`, diseño por defecto,
 * paleta sugerida por defecto y formato de foto sugerido, además de etiquetas
 * para valores históricos en el panel de superadmin.
 */

import { THEME_PRESETS, getSuggestedPresetsForNiche, type ThemePreset } from "./theme-presets";
import { suggestPhotoFormat, type PhotoFormat } from "./photo-format";

export interface RubroDefinition {
  id: string;
  label: string;
  emoji: string;
  defaultModel: string;
  defaultPresetId: string;
  photoFormat: PhotoFormat;
}

/**
 * Los 12 rubros oficiales en el registro (RF-49.2).
 * Decisiones tras el Paso 0:
 * - Florería -> bloom_general
 * - Comida -> bite
 * - Ropa y moda -> vitrina
 * - Resto -> grid
 * - Paleta por defecto -> primera paleta sugerida del rubro
 */
export const RUBROS: readonly RubroDefinition[] = [
  {
    id: "floreria",
    label: "Florería",
    emoji: "💐",
    defaultModel: "bloom_general",
    defaultPresetId: "menta",
    photoFormat: "square",
  },
  {
    id: "ropa",
    label: "Ropa y moda",
    emoji: "👗",
    defaultModel: "vitrina",
    defaultPresetId: "claro",
    photoFormat: "portrait",
  },
  {
    id: "calzado",
    label: "Calzado",
    emoji: "👟",
    defaultModel: "grid",
    defaultPresetId: "claro",
    photoFormat: "square",
  },
  {
    id: "bisuteria",
    label: "Accesorios y joyería",
    emoji: "💍",
    defaultModel: "grid",
    defaultPresetId: "claro",
    photoFormat: "square",
  },
  {
    id: "belleza",
    label: "Belleza",
    emoji: "✨",
    defaultModel: "grid",
    defaultPresetId: "claro",
    photoFormat: "square",
  },
  {
    id: "hogar",
    label: "Hogar y decoración",
    emoji: "🪴",
    defaultModel: "grid",
    defaultPresetId: "claro",
    photoFormat: "square",
  },
  {
    id: "comida",
    label: "Comida",
    emoji: "🍔",
    defaultModel: "bite",
    defaultPresetId: "calido",
    photoFormat: "square",
  },
  {
    id: "pasteleria",
    label: "Postres y pastelería",
    emoji: "🎂",
    defaultModel: "grid",
    defaultPresetId: "claro",
    photoFormat: "square",
  },
  {
    id: "tech",
    label: "Tecnología",
    emoji: "📱",
    defaultModel: "grid",
    defaultPresetId: "nocturno",
    photoFormat: "square",
  },
  {
    id: "regalos",
    label: "Regalos",
    emoji: "🎁",
    defaultModel: "grid",
    defaultPresetId: "claro",
    photoFormat: "square",
  },
  {
    id: "servicios",
    label: "Servicios",
    emoji: "🛠️",
    defaultModel: "grid",
    defaultPresetId: "claro",
    photoFormat: "square",
  },
  {
    id: "general",
    label: "Otro",
    emoji: "🛍️",
    defaultModel: "grid",
    defaultPresetId: "claro",
    photoFormat: "square",
  },
] as const;

export const LEGACY_NICHE_LABELS: Record<string, string> = {
  hamburgueseria: "Hamburguesería",
  cosmetica: "Cosmética",
  tecnologia: "Tecnología",
  electronica: "Electrónica",
  accesorios: "Accesorios",
  joyeria: "Joyería",
  moda: "Moda",
  boutique: "Boutique",
  gastronomia: "Gastronomía",
  restaurante: "Restaurante",
  cafeteria: "Cafetería",
  cafe: "Café",
  panaderia: "Panadería",
  dulces: "Dulces",
  estetica: "Estética",
  salon: "Salón de belleza",
  spa: "Spa",
  salud: "Salud",
  flores: "Flores",
  botanica: "Botánica",
  boutique_botanica: "Boutique botánica",
  jugueteria: "Juguetería",
  juguetes: "Juguetes",
  peluches: "Peluches",
  infantil: "Infantil",
};

export const RUBRO_CHART_COLORS: Record<string, string> = {
  general: "#64748b",
  comida: "#f97316",
  bisuteria: "#ec4899",
  ropa: "#a855f7",
  tech: "#06b6d4",
  servicios: "#3b82f6",
  floreria: "#f43f5e",
  calzado: "#8b5cf6",
  belleza: "#d946ef",
  hogar: "#10b981",
  pasteleria: "#f59e0b",
  regalos: "#ef4444",
};

export interface RubroDefaults {
  rubro: RubroDefinition;
  model: string;
  preset: ThemePreset;
  photoFormat: "portrait" | "square";
}

/**
 * Obtiene el rubro oficial o hace fallback a "general" (Otro).
 */
export function getRubroById(niche?: string | null): RubroDefinition {
  const clean = (niche || "").trim().toLowerCase();
  return RUBROS.find((r) => r.id === clean) ?? RUBROS[RUBROS.length - 1];
}

/**
 * Resuelve diseño, paleta y formato de foto por defecto para un rubro.
 */
export function getRubroDefaults(niche?: string | null): RubroDefaults {
  const rubro = getRubroById(niche);
  const suggested = getSuggestedPresetsForNiche(rubro.id);
  const preset =
    THEME_PRESETS.find((p) => p.id === rubro.defaultPresetId) ??
    suggested[0] ??
    THEME_PRESETS[0];

  return {
    rubro,
    model: rubro.defaultModel,
    preset,
    photoFormat: suggestPhotoFormat(rubro.id),
  };
}

/**
 * Devuelve la etiqueta legible de un rubro (soporta los 12 actuales y valores históricos).
 */
export function getNicheLabel(niche?: string | null): string {
  const clean = (niche || "").trim().toLowerCase();
  if (!clean) return getRubroById("general").label;
  const official = RUBROS.find((r) => r.id === clean);
  if (official) return official.label;
  return LEGACY_NICHE_LABELS[clean] || niche || "Otro";
}

/**
 * Color de gráfico para un rubro en superadmin.
 */
export function getNicheColor(niche?: string | null): string {
  const clean = (niche || "").trim().toLowerCase();
  return RUBRO_CHART_COLORS[clean] || "#64748b";
}
