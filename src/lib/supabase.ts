import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Faltan las credenciales de Supabase en .env");
}

export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "");

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

    const { data, error } = await supabase.storage
      .from("images")
      .upload(path, blob, {
        contentType: mime,
        upsert: true,
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage.from("images").getPublicUrl(data.path);
    return `${urlData.publicUrl}?t=${Date.now()}`;
  } catch (error) {
    console.error("[uploadBase64ToStorage] Error uploading image:", error);
    throw error;
  }
}

