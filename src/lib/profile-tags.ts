/**
 * Sistema extensible de etiquetas comerciales para el diseño "Perfil" (F50.1).
 * Permite activar chips predefinidos sin migrar la base de datos al añadir nuevos presets.
 */

export type ProfileTagPresetId =
  | "delivery"
  | "recojo"
  | "yape"
  | "plin"
  | "tarjeta"
  | "contraentrega"
  | "envios_provincia"
  | "horario";

export interface ProfileTagItem {
  id: ProfileTagPresetId;
  /** Texto corto opcional (ej. horario de atención, máx. 40 caracteres) */
  value?: string;
}

export interface ProfileTagPreset {
  id: ProfileTagPresetId;
  label: string;
  category: "entrega" | "pago" | "info";
  supportsCustomValue?: boolean;
  customPlaceholder?: string;
  defaultDisplay?: string;
}

export const PROFILE_TAG_MAX_VALUE_LENGTH = 40;

export const PROFILE_TAG_PRESETS: readonly ProfileTagPreset[] = [
  { id: "delivery", label: "Delivery", category: "entrega" },
  { id: "recojo", label: "Recojo en tienda", category: "entrega" },
  { id: "envios_provincia", label: "Envíos a provincia", category: "entrega" },
  { id: "yape", label: "Yape", category: "pago" },
  { id: "plin", label: "Plin", category: "pago" },
  { id: "tarjeta", label: "Tarjeta", category: "pago" },
  { id: "contraentrega", label: "Contraentrega", category: "pago" },
  {
    id: "horario",
    label: "Horario",
    category: "info",
    supportsCustomValue: true,
    customPlaceholder: "Ej: Lun–Sáb 9am–7pm",
    defaultDisplay: "Horario de atención",
  },
] as const;

const PRESET_MAP = new Map<string, ProfileTagPreset>(
  PROFILE_TAG_PRESETS.map((preset) => [preset.id, preset])
);

export function getProfileTagPreset(id: string): ProfileTagPreset | undefined {
  return PRESET_MAP.get(id);
}

/**
 * Normaliza y valida el arreglo profile_tags recibido desde BD, RPC o formulario.
 * Nunca falla si la columna no existe (null/undefined) o contiene datos inválidos.
 */
export function resolveProfileTags(raw: unknown): ProfileTagItem[] {
  let list: unknown = raw;

  if (typeof raw === "string") {
    try {
      list = JSON.parse(raw);
    } catch {
      return [];
    }
  }

  if (!Array.isArray(list)) {
    return [];
  }

  const seen = new Set<ProfileTagPresetId>();
  const resolved: ProfileTagItem[] = [];

  for (const entry of list) {
    let rawId: unknown;
    let rawValue: unknown;

    if (typeof entry === "string") {
      rawId = entry;
    } else if (entry && typeof entry === "object") {
      rawId = (entry as Record<string, unknown>).id;
      rawValue = (entry as Record<string, unknown>).value;
    } else {
      continue;
    }

    if (typeof rawId !== "string") continue;
    const preset = PRESET_MAP.get(rawId);
    if (!preset || seen.has(preset.id)) continue;

    seen.add(preset.id);

    if (preset.supportsCustomValue && typeof rawValue === "string") {
      const cleaned = rawValue.trim().slice(0, PROFILE_TAG_MAX_VALUE_LENGTH);
      resolved.push(cleaned ? { id: preset.id, value: cleaned } : { id: preset.id });
    } else {
      resolved.push({ id: preset.id });
    }
  }

  return resolved;
}

/**
 * Devuelve el texto visible del chip para renderizado público.
 */
export function formatProfileTagLabel(item: ProfileTagItem): string {
  const preset = PRESET_MAP.get(item.id);
  if (!preset) return "";
  if (preset.supportsCustomValue) {
    const trimmed = item.value?.trim();
    if (trimmed) return trimmed.slice(0, PROFILE_TAG_MAX_VALUE_LENGTH);
    return preset.defaultDisplay || preset.label;
  }
  return preset.label;
}
