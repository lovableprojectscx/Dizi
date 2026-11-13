/**
 * Sistema extensible y configurable de etiquetas comerciales para el diseño "Perfil" (F50.1).
 * Soporta presets con texto opcional personalizable y etiquetas propias con ícono curado,
 * persistidas en `stores.profile_tags` (jsonb) sin requerir migraciones SQL al ampliar opciones.
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

export type ProfileTagCustomIconId =
  | "tag"
  | "sparkles"
  | "shield"
  | "package"
  | "percent"
  | "check"
  | "clock"
  | "map_pin";

export type ProfileTagId = ProfileTagPresetId | "custom";

export interface ProfileTagItem {
  id: ProfileTagId;
  /** Texto visible configurado por el dueño (opcional en presets, requerido en custom; máx. 40 caracteres) */
  value?: string;
  /** Ícono seleccionado cuando id === "custom" */
  icon?: ProfileTagCustomIconId;
}

export interface ProfileTagPreset {
  id: ProfileTagPresetId;
  label: string;
  category: "entrega" | "pago" | "info";
  supportsCustomValue: boolean;
  customPlaceholder: string;
  defaultDisplay?: string;
}

export interface ProfileTagCustomIconOption {
  id: ProfileTagCustomIconId;
  label: string;
}

export const PROFILE_TAG_MAX_COUNT = 6;
export const PROFILE_TAG_MAX_VALUE_LENGTH = 40;

export const PROFILE_TAG_PRESETS: readonly ProfileTagPreset[] = [
  {
    id: "delivery",
    label: "Delivery",
    category: "entrega",
    supportsCustomValue: true,
    customPlaceholder: "Ej: Delivery gratis > S/ 99",
  },
  {
    id: "recojo",
    label: "Recojo en tienda",
    category: "entrega",
    supportsCustomValue: true,
    customPlaceholder: "Ej: Recojo en Gamarra Tda 242",
  },
  {
    id: "envios_provincia",
    label: "Envíos a provincia",
    category: "entrega",
    supportsCustomValue: true,
    customPlaceholder: "Ej: Envíos Olva / Shalom",
  },
  {
    id: "yape",
    label: "Yape",
    category: "pago",
    supportsCustomValue: true,
    customPlaceholder: "Ej: Yape sin recargo",
  },
  {
    id: "plin",
    label: "Plin",
    category: "pago",
    supportsCustomValue: true,
    customPlaceholder: "Ej: Plin al instante",
  },
  {
    id: "tarjeta",
    label: "Tarjeta",
    category: "pago",
    supportsCustomValue: true,
    customPlaceholder: "Ej: Visa, Mastercard y débito",
  },
  {
    id: "contraentrega",
    label: "Contraentrega",
    category: "pago",
    supportsCustomValue: true,
    customPlaceholder: "Ej: Pago al recibir en Lima",
  },
  {
    id: "horario",
    label: "Horario",
    category: "info",
    supportsCustomValue: true,
    customPlaceholder: "Ej: Lun–Sáb 9am–7pm",
    defaultDisplay: "Horario de atención",
  },
] as const;

export const PROFILE_TAG_CUSTOM_ICONS: readonly ProfileTagCustomIconOption[] = [
  { id: "tag", label: "Etiqueta" },
  { id: "package", label: "Paquete" },
  { id: "sparkles", label: "Destacado" },
  { id: "shield", label: "Garantía" },
  { id: "percent", label: "Descuento" },
  { id: "check", label: "Verificado" },
  { id: "clock", label: "Tiempo" },
  { id: "map_pin", label: "Ubicación" },
] as const;

const PRESET_MAP = new Map<string, ProfileTagPreset>(
  PROFILE_TAG_PRESETS.map((preset) => [preset.id, preset])
);

const CUSTOM_ICON_SET = new Set<string>(PROFILE_TAG_CUSTOM_ICONS.map((opt) => opt.id));

export function getProfileTagPreset(id: string): ProfileTagPreset | undefined {
  return PRESET_MAP.get(id);
}

export function resolveCustomTagIcon(raw: unknown): ProfileTagCustomIconId {
  if (typeof raw === "string" && CUSTOM_ICON_SET.has(raw)) {
    return raw as ProfileTagCustomIconId;
  }
  return "tag";
}

/**
 * Normaliza y valida el arreglo profile_tags recibido desde BD, RPC o formulario.
 * Conserva el orden configurado, deduplica presets por id y tags propios por texto,
 * y limita la salida a PROFILE_TAG_MAX_COUNT (6) etiquetas.
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

  const seenPresets = new Set<ProfileTagPresetId>();
  const seenCustomValues = new Set<string>();
  const resolved: ProfileTagItem[] = [];

  for (const entry of list) {
    if (resolved.length >= PROFILE_TAG_MAX_COUNT) break;

    let rawId: unknown;
    let rawValue: unknown;
    let rawIcon: unknown;

    if (typeof entry === "string") {
      rawId = entry;
    } else if (entry && typeof entry === "object") {
      const obj = entry as Record<string, unknown>;
      rawId = obj.id;
      rawValue = obj.value;
      rawIcon = obj.icon;
    } else {
      continue;
    }

    if (typeof rawId !== "string") continue;

    if (rawId === "custom") {
      if (typeof rawValue !== "string") continue;
      const cleaned = rawValue.trim().slice(0, PROFILE_TAG_MAX_VALUE_LENGTH);
      if (!cleaned) continue;
      const normalizedKey = cleaned.toLowerCase();
      if (seenCustomValues.has(normalizedKey)) continue;
      seenCustomValues.add(normalizedKey);
      resolved.push({
        id: "custom",
        value: cleaned,
        icon: resolveCustomTagIcon(rawIcon),
      });
      continue;
    }

    const preset = PRESET_MAP.get(rawId);
    if (!preset || seenPresets.has(preset.id)) continue;

    seenPresets.add(preset.id);

    const cleaned =
      typeof rawValue === "string" ? rawValue.trim().slice(0, PROFILE_TAG_MAX_VALUE_LENGTH) : "";
    const defaultLabel = preset.defaultDisplay || preset.label;

    if (cleaned && cleaned !== defaultLabel) {
      resolved.push({ id: preset.id, value: cleaned });
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
  if (item.id === "custom") {
    return (item.value || "").trim().slice(0, PROFILE_TAG_MAX_VALUE_LENGTH);
  }
  const preset = PRESET_MAP.get(item.id);
  if (!preset) return "";
  const trimmed = item.value?.trim();
  if (trimmed) return trimmed.slice(0, PROFILE_TAG_MAX_VALUE_LENGTH);
  return preset.defaultDisplay || preset.label;
}
