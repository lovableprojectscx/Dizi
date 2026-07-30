import { supabase } from "@/lib/supabase";
import { resolveStructureId } from "@/lib/design-catalog";

export interface MigrationOptions {
  storeId?: string; // Si se pasa, migra solo una tienda de prueba
}

export interface StoreMigrationResult {
  storeId: string;
  previousModel: string;
  newStructureId: string;
  bannersConvertedCount: number;
}

/**
 * Script de Migración del Módulo 5 (Idempotente y Reversible).
 * Utiliza exactamente `resolveStructureId()` de design-catalog.ts para garantizar una única fuente de verdad.
 * - Respalda `model` y `niche` en `legacy_model` y `legacy_niche`.
 * - Convierte el modelo heredado a una de las 15 estructuras unificadas.
 * - Convierte `banner_image` con separadores `|||` en arreglo de banners.
 */
export async function runStoreDataMigration(options: MigrationOptions = {}): Promise<StoreMigrationResult[]> {
  const { storeId } = options;

  let query = supabase.from("stores").select("*");
  if (storeId) {
    query = query.eq("id", storeId);
  }

  const { data: stores, error } = await query;
  if (error) {
    console.error("[runStoreDataMigration] Error fetching stores:", error);
    throw error;
  }

  if (!stores || stores.length === 0) {
    return [];
  }

  const results: StoreMigrationResult[] = [];

  for (const store of stores) {
    const legacyModel = store.legacy_model || store.model || "clasico";
    const legacyNiche = store.legacy_niche || store.niche || "gastronomia";

    // Resolver la estructura unificada correspondiente (Única fuente de verdad)
    const targetStructureId = resolveStructureId(legacyModel, legacyNiche);

    // Banners: si banner_image contiene |||, convertir a array
    let bannersArray: string[] = [];
    let convertedCount = 0;
    if (typeof store.banner_image === "string" && store.banner_image.includes("|||")) {
      bannersArray = store.banner_image.split("|||").map((b: string) => b.trim()).filter(Boolean);
      convertedCount = bannersArray.length;
    }

    const payload: Record<string, any> = {
      legacy_model: legacyModel,
      legacy_niche: legacyNiche,
      model: targetStructureId,
    };

    if (bannersArray.length > 0) {
      payload.banner_image = bannersArray[0]; // Guardar el primero como principal
      payload.banners = bannersArray;
    }

    const { error: updateErr } = await supabase
      .from("stores")
      .update(payload)
      .eq("id", store.id);

    if (updateErr) {
      console.error(`[runStoreDataMigration] Error updating store ${store.id}:`, updateErr);
    } else {
      results.push({
        storeId: store.id,
        previousModel: legacyModel,
        newStructureId: targetStructureId,
        bannersConvertedCount: convertedCount,
      });
    }
  }

  return results;
}
