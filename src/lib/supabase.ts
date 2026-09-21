/**
 * @file supabase.ts
 * @description Configuración del cliente Supabase, control de timeout para conexiones móviles
 * y utilidad para subida y conversión de imágenes en formato WebP a Supabase Storage.
 */

import { createClient } from "@supabase/supabase-js";

/**
 * URL de respaldo predeterminada del proyecto oficial de DIZI en Supabase.
 */
const DEFAULT_SUPABASE_URL = "https://zkqzdwxjthjdjchimmds.supabase.co";

/**
 * URL de Supabase resuelta desde variables de entorno de Vite o respaldo predeterminado.
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;

/**
 * Clave anónima pública de Supabase resuelta desde variables de entorno de Vite.
 */
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("[Supabase] Verifica las variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu archivo .env");
}

/**
 * Wrapper de `fetch` con un tiempo de espera (timeout) extendido de 30 segundos.
 * Diseñado especialmente para evitar caídas de conexión durante la subida de imágenes
 * o sincronización de catálogos en redes móviles 3G/4G con alta latencia.
 *
 * @param url Destino de la petición HTTP.
 * @param options Opciones de configuración de fetch (cabeceras, método, cuerpo).
 * @returns Promesa con la respuesta de la petición.
 */
const customFetch = (url: RequestInfo | URL, options?: RequestInit): Promise<Response> => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 30000);
  return fetch(url, { ...options, signal: controller.signal })
    .then((res) => {
      clearTimeout(id);
      return res;
    })
    .catch((err) => {
      clearTimeout(id);
      throw err;
    });
};

/**
 * Instancia global singleton del cliente Supabase configurada para DIZI.
 * Utiliza `customFetch` para garantizar resiliencia en conexiones inestables.
 */
export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "", {
  global: {
    fetch: customFetch,
  },
});

/**
 * Convierte y sube una imagen en formato Data URL Base64 hacia el bucket `images` de Supabase Storage.
 *
 * Características principales:
 * - Detecta el tipo MIME de la imagen y normaliza la extensión a `.webp`, `.jpg`, `.png` o `.gif`.
 * - Convierte la cadena base64 en un array binario (`Uint8Array`) y genera un `Blob`.
 * - Aplica cabeceras de cache prolongado (`cacheControl: 31536000` = 1 año) para acelerar cargas en CDN.
 * - Implementa un reintento automático en caso de micro-cortes o parpadeos de red.
 * - Retorna la URL pública final limpia (sin parámetros de consulta).
 *
 * @param base64Data Cadena Data URL en formato base64 (ej: "data:image/webp;base64,...").
 *                   Si ya es una URL HTTP, se retorna inmediatamente sin procesar.
 * @param path Ruta de destino dentro del bucket (ej: "{storeId}/products/{productId}.webp").
 * @returns Promesa con la URL pública permanente de la imagen alojada.
 * @throws Error si el formato base64 es inválido o la subida a Storage falla definitivamente.
 */
export async function uploadBase64ToStorage(base64Data: string, path: string): Promise<string> {
  if (!base64Data.startsWith("data:")) {
    return base64Data;
  }

  try {
    const arr = base64Data.split(",");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) throw new Error("Formato base64 inválido");
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    const blob = new Blob([u8arr], { type: mime });

    let ext = "webp";
    if (mime === "image/jpeg") ext = "jpg";
    else if (mime === "image/png") ext = "png";
    else if (mime === "image/gif") ext = "gif";

    const cleanPath = path.replace(/\.[a-zA-Z0-9]+$/, `.${ext}`);

    let res = await supabase.storage.from("images").upload(cleanPath, blob, {
      contentType: mime,
      upsert: true,
      cacheControl: "31536000",
    });

    if (res.error) {
      console.warn("[uploadBase64ToStorage] Reintentando subida de imagen por parpadeo de red...", res.error);
      res = await supabase.storage.from("images").upload(cleanPath, blob, {
        contentType: mime,
        upsert: true,
        cacheControl: "31536000",
      });
    }

    if (res.error) throw res.error;

    const { data: urlData } = supabase.storage.from("images").getPublicUrl(res.data.path);
    return urlData.publicUrl.split("?")[0];
  } catch (error) {
    console.error("[uploadBase64ToStorage] Error uploading image:", error);
    throw error;
  }
}
