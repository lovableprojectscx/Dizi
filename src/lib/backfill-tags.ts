import { supabase } from "@/lib/supabase";
import { PRODUCT_TAGS } from "@/lib/tags";

export interface BackfillOptions {
  storeId?: string; // Si se especifica, solo procesa una tienda de prueba primero
}

export interface BackfillResult {
  storeId: string;
  processedProductsCount: number;
  updatedProductsCount: number;
  tagsAddedCount: number;
}

/**
 * Script de Backfill Idempotente para etiquetas táctiles (`tags text[]`).
 * Infiere etiquetas a partir de palabras clave estandarizadas en PRODUCT_TAGS.
 * Guarda el ID estandarizado (ej. "spicy", "vegan", "gluten", "cotton") para coincidencia 1:1 con el filtro.
 * Al usar Set, se puede ejecutar N veces de forma segura sin duplicar ninguna etiqueta.
 */
export async function backfillProductTags(options: BackfillOptions = {}): Promise<BackfillResult[]> {
  const { storeId } = options;

  let query = supabase.from("products").select("id, store_id, name, description, tags");
  if (storeId) {
    query = query.eq("store_id", storeId);
  }

  const { data: products, error } = await query;
  if (error) {
    console.error("[backfillProductTags] Error fetching products:", error);
    throw error;
  }

  if (!products || products.length === 0) {
    return [];
  }

  const resultsMap: Record<string, BackfillResult> = {};

  for (const p of products) {
    const sId = p.store_id;
    if (!resultsMap[sId]) {
      resultsMap[sId] = {
        storeId: sId,
        processedProductsCount: 0,
        updatedProductsCount: 0,
        tagsAddedCount: 0,
      };
    }

    resultsMap[sId].processedProductsCount++;

    const existingTags = new Set<string>(Array.isArray(p.tags) ? p.tags : []);
    const initialSize = existingTags.size;

    const nameLower = (p.name || "").toLowerCase();
    const descLower = (p.description || "").toLowerCase();
    const combined = `${nameLower} ${descLower}`;

    // Inferencia idempotente basada en PRODUCT_TAGS
    for (const tagDef of PRODUCT_TAGS) {
      const match = tagDef.keywords.some((kw) => combined.includes(kw.toLowerCase()));
      if (match) {
        existingTags.add(tagDef.id);
      }
    }

    const newTagsArray = Array.from(existingTags);

    if (newTagsArray.length > initialSize) {
      const added = newTagsArray.length - initialSize;
      resultsMap[sId].tagsAddedCount += added;
      resultsMap[sId].updatedProductsCount++;

      const { error: updateErr } = await supabase
        .from("products")
        .update({ tags: newTagsArray })
        .eq("id", p.id);

      if (updateErr) {
        console.error(`[backfillProductTags] Error updating product ${p.id}:`, updateErr);
      }
    }
  }

  return Object.values(resultsMap);
}
