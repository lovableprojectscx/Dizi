/**
 * @file metrics.ts
 * @description Registro de métricas de uso del generador de imágenes en `share_events` (F46 / F52).
 * Incluye fallback resiliente si la columna `source` aún no existe en producción
 * (código PostgREST PGRST204 o mensaje de columna inexistente).
 */

import type { ShareEventSource, ShareImageFormat, ShareImageStyle } from "./types";

export interface LogShareEventParams {
  storeId: string;
  productId: string;
  style: ShareImageStyle;
  size: ShareImageFormat;
  source?: ShareEventSource;
}

/**
 * Detecta si el error devuelto por Supabase/PostgREST corresponde a la columna `source` faltante.
 */
export function isMissingSourceColumnError(error: any): boolean {
  if (!error) return false;
  if (error.code === "PGRST204") return true;

  const msg = typeof error.message === "string" ? error.message.toLowerCase() : "";
  const details = typeof error.details === "string" ? error.details.toLowerCase() : "";

  return (
    (msg.includes("source") && (msg.includes("column") || msg.includes("columna"))) ||
    (details.includes("source") && (details.includes("column") || details.includes("columna"))) ||
    (msg.includes("could not find") && msg.includes("source")) ||
    (details.includes("could not find") && details.includes("source"))
  );
}

/**
 * Registra el evento en `share_events`. Si falla por falta de columna `source`,
 * reintenta sin dicha columna para no bloquear la experiencia de usuario.
 */
export async function logShareEvent(
  supabaseClient: { from: (table: string) => any },
  params: LogShareEventParams
): Promise<{ success: boolean; retriedWithoutSource?: boolean; error?: any }> {
  const { storeId, productId, style, size, source = "productos" } = params;

  const payload: Record<string, any> = {
    store_id: storeId,
    product_id: productId,
    style,
    size,
    source,
  };

  try {
    const { error } = await supabaseClient.from("share_events").insert(payload);

    if (error) {
      if (isMissingSourceColumnError(error)) {
        // Fallback resiliente: reintentar sin 'source'
        delete payload.source;
        const retryResult = await supabaseClient.from("share_events").insert(payload);
        return {
          success: !retryResult.error,
          retriedWithoutSource: true,
          error: retryResult.error,
        };
      }
      return { success: false, retriedWithoutSource: false, error };
    }

    return { success: true, retriedWithoutSource: false };
  } catch (err) {
    return { success: false, retriedWithoutSource: false, error: err };
  }
}
