/**
 * @file sellers.ts
 * @description Lógica central y reglas de negocio para el módulo de Vendedores (F39 y F39b).
 * Centraliza la validación de límites, activación/desactivación de turnos,
 * resolución de destinos de WhatsApp y degradación por plan vencido o Semilla.
 */

import { getMaxSellers, getEffectivePlan, type Store, type Seller } from "./types";
import { buildSellerMessage, buildWaUrl } from "./whatsapp";

export interface SellerOption {
  id: string;
  name: string;
  phone: string;
  countryIso?: string;
  isMain?: boolean;
}

/**
 * Resuelve la lista de vendedores activos para el catálogo público o bio (F39b).
 * - Si el vendedor principal está activo (por defecto true), se incluye como primera opción.
 * - Incluye los vendedores secundarios que estén marcados como activos y tengan teléfono.
 */
export function resolveActiveSellers(store: Partial<Store> & { name: string; phone: string }): SellerOption[] {
  const isMainActive = store.mainSellerActive !== false;
  const mainOption: SellerOption = {
    id: "main",
    name: store.mainSellerName?.trim() || store.name,
    phone: store.phone,
    countryIso: store.countryIso,
    isMain: true,
  };

  const extras: SellerOption[] = (store.sellers || [])
    .filter((s) => s.active && s.phone)
    .map((s) => ({
      id: s.id,
      name: s.name,
      phone: s.phone,
      countryIso: s.countryIso,
      isMain: false,
    }));

  const list: SellerOption[] = [];
  if (isMainActive) {
    list.push(mainOption);
  }
  list.push(...extras);
  return list;
}

/**
 * Normaliza el nombre del vendedor principal para su guardado en base de datos.
 * Bug fix F39b: Si el usuario borra el texto, devuelve `null` para limpiar la columna en PostgreSQL.
 */
export function normalizeMainSellerName(name?: string | null): string | null {
  if (!name) return null;
  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Valida si se puede cambiar el estado de activación (Switch) de un vendedor.
 *
 * Reglas de negocio F39b:
 * 1. Debe quedar siempre al menos 1 vendedor activo (>= 1). Nunca se permite apagar el último activo.
 * 2. Prender el vendedor principal siempre está permitido, incluso si la tienda queda por encima del límite
 *    (ej: tras bajar de plan de Pro a Semilla con 2 extras activos).
 * 3. Prender un vendedor secundario está sujeto al límite máximo del plan efectivo (getMaxSellers).
 */
export function canToggleSeller(
  store: Store | (Partial<Store> & { plan: any; sellers?: Seller[] }),
  sellerId: string | "main",
  nextActive: boolean,
): { ok: boolean; error?: string } {
  const sellers = store.sellers || [];
  const isMainActive = store.mainSellerActive !== false;
  const maxTotalSellers = getMaxSellers(store as Store);

  // Intentando apagar un vendedor
  if (!nextActive) {
    let remainingActive = 0;
    if (sellerId === "main") {
      remainingActive = sellers.filter((s) => s.active && s.phone).length;
    } else {
      const activeExtrasExceptThis = sellers.filter((s) => s.id !== sellerId && s.active && s.phone).length;
      remainingActive = (isMainActive ? 1 : 0) + activeExtrasExceptThis;
    }

    if (remainingActive < 1) {
      return { ok: false, error: "Debe quedar al menos un vendedor activo." };
    }
    return { ok: true };
  }

  // Intentando encender un vendedor
  if (sellerId === "main") {
    // Regla especial F39b: Prender el principal SIEMPRE está permitido
    return { ok: true };
  }

  // Encender un vendedor secundario
  const currentActiveCount = (isMainActive ? 1 : 0) + sellers.filter((s) => s.active && s.phone).length;
  if (currentActiveCount >= maxTotalSellers) {
    return {
      ok: false,
      error: `El plan solo permite hasta ${maxTotalSellers} vendedor(es) activo(s) en total.`,
    };
  }

  return { ok: true };
}

/**
 * Simula la resolución de `get_public_store` en base de datos para tiendas con plan degradado o vencido.
 * Regla F39b: Si el plan es Semilla, Emprendedor o vencido > 3 días, fuerza el uso del vendedor principal
 * aunque estuviese apagado, y retorna sellers = []. La tienda nunca se queda sin WhatsApp.
 */
export function resolvePublicStoreSellers(store: Store): {
  mainSellerActive: boolean;
  sellers: Seller[];
} {
  const effectivePlan = getEffectivePlan(store);

  if (effectivePlan === "semilla" || effectivePlan === "emprendedor") {
    return {
      mainSellerActive: true,
      sellers: [],
    };
  }

  const isMainActive = store.mainSellerActive !== false;
  const maxExtra = effectivePlan === "ilimitado" ? (isMainActive ? 4 : 5) : (isMainActive ? 2 : 3);
  const activeExtras = (store.sellers || [])
    .filter((s) => s.active && s.phone)
    .slice(0, maxExtra);

  return {
    mainSellerActive: isMainActive,
    sellers: activeExtras,
  };
}

/**
 * Resuelve el destino de WhatsApp según la cantidad de vendedores activos (F39b):
 * - Si hay 2 o más activos: requiere selector (`requiresPicker: true`).
 * - Si hay 1 solo activo:
 *   - Si es el principal: va directo al teléfono oficial sin saludar por nombre de vendedor.
 *   - Si es un extra: va directo al teléfono del extra saludando por su nombre ("Hola {nombre}, ...").
 */
export function resolveWhatsAppDispatch(
  store: Partial<Store> & { name: string; phone: string },
  baseMessage: string,
): {
  requiresPicker: boolean;
  targetPhone: string;
  finalMessage: string;
  selectedSeller: SellerOption | null;
} {
  const activeSellers = resolveActiveSellers(store);

  if (activeSellers.length > 1) {
    return {
      requiresPicker: true,
      targetPhone: store.phone,
      finalMessage: baseMessage,
      selectedSeller: null,
    };
  }

  const single = activeSellers.length === 1 ? activeSellers[0] : null;
  const isSingleExtra = single && !single.isMain;
  const targetPhone = (isSingleExtra && single.phone) ? single.phone : store.phone;
  const finalMessage = isSingleExtra ? buildSellerMessage(single.name, baseMessage) : baseMessage;

  return {
    requiresPicker: false,
    targetPhone,
    finalMessage,
    selectedSeller: single,
  };
}
