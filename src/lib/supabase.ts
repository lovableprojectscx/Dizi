import { createClient } from "@supabase/supabase-js";

const DEFAULT_SUPABASE_URL = "https://wxpizbnuuaiculzfuhof.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4cGl6Ym51dWFpY3VsemZ1aG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzMjM3MzMsImV4cCI6MjA5Mzg5OTczM30.azLkp485_RtvtgkUAOesk9BOwgqJiO7QLrM1sxI5-5A";

const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Si envUrl contiene la referencia antigua 'zkqz', forzar el uso del proyecto activo de producción 'wxpizbnuuaiculzfuhof'
const supabaseUrl = (envUrl && !envUrl.includes("zkqz")) ? envUrl : DEFAULT_SUPABASE_URL;
const supabaseAnonKey = (envKey && !envKey.includes("zkqz")) ? envKey : DEFAULT_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Faltan las credenciales de Supabase en .env");
}

// Timeout de 30 segundos para peticiones a Supabase (permite subida de imágenes en conexiones móviles)
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

export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "", {
  global: {
    fetch: customFetch,
  },
});

/**
 * Sube una imagen en formato base64 Data URL a un bucket de Supabase Storage.
 * Retorna la URL pública de la imagen subida.
 */
export async function uploadBase64ToStorage(base64Data: string, path: string): Promise<string> {
  // Si no es un base64 data url, devolver el string tal cual (por si ya es una URL HTTP)
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

    // Determinar la extensión correcta según el tipo MIME de la imagen
    let ext = "webp";
    if (mime === "image/jpeg") ext = "jpg";
    else if (mime === "image/png") ext = "png";
    else if (mime === "image/gif") ext = "gif";

    // Reemplazar la extensión en la ruta por la correspondiente al formato real
    const cleanPath = path.replace(/\.[a-zA-Z0-9]+$/, `.${ext}`);

    let res = await supabase.storage.from("images").upload(cleanPath, blob, {
      contentType: mime,
      upsert: true,
      cacheControl: "31536000",
    });

    // Reintento automático en caso de micro-corte de red móvil
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
    return `${urlData.publicUrl}?t=${Date.now()}`;
  } catch (error) {
    console.error("[uploadBase64ToStorage] Error uploading image:", error);
    throw error;
  }
}
