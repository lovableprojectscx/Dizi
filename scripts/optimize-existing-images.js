import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://zkqzdwxjthjdjchimmds.supabase.co";
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprcXpkd3hqdGhqZGpjaGltbWRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1NTQ0MDYsImV4cCI6MjEwMDEzMDQwNn0.sEtzdqZPdCFMHHsPAxGEqJylCloV6s14Mh0fT75pQGU";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function getStoragePath(url) {
  if (!url || typeof url !== "string") return null;
  const cleanUrl = url.split("?")[0].trim();
  const match = cleanUrl.match(/\/storage\/v1\/object\/public\/images\/(.+)$/);
  return match ? decodeURIComponent(match[1]) : null;
}

async function main() {
  console.log("=== INICIANDO OPTIMIZACIÓN MASIVA DE IMÁGENES EXISTENTES EN SUPABASE STORAGE ===");
  console.log(`URL Supabase: ${SUPABASE_URL}`);

  // 1. Obtener todas las imágenes de productos
  const { data: products, error: prodErr } = await supabase
    .from("products")
    .select("id, name, image");

  if (prodErr) {
    console.error("Error al obtener productos:", prodErr);
    process.exit(1);
  }

  // 2. Obtener imágenes de tiendas (logo, banners)
  const { data: stores, error: storeErr } = await supabase
    .from("stores")
    .select("id, name, logo, banner_image, banners, bio_logo, bio_banner");

  if (storeErr) {
    console.error("Error al obtener tiendas:", storeErr);
    process.exit(1);
  }

  const urlMap = new Map(); // path -> original full URL

  // Recolectar de productos
  for (const p of products || []) {
    if (p.image) {
      const path = getStoragePath(p.image);
      if (path) urlMap.set(path, p.image);
    }
  }

  // Recolectar de tiendas
  for (const s of stores || []) {
    for (const key of ["logo", "banner_image", "bio_logo", "bio_banner"]) {
      if (s[key]) {
        const path = getStoragePath(s[key]);
        if (path) urlMap.set(path, s[key]);
      }
    }
    if (Array.isArray(s.banners)) {
      for (const bUrl of s.banners) {
        const path = getStoragePath(bUrl);
        if (path) urlMap.set(path, bUrl);
      }
    }
  }

  const uniquePaths = Array.from(urlMap.keys());
  console.log(`Encontradas ${uniquePaths.length} imágenes únicas en Supabase Storage para optimizar.\n`);

  let totalOrigBytes = 0;
  let totalOptBytes = 0;
  let successCount = 0;
  let skipCount = 0;
  let failCount = 0;

  for (let i = 0; i < uniquePaths.length; i++) {
    const path = uniquePaths[i];
    const originalUrl = urlMap.get(path);
    const progress = `[${i + 1}/${uniquePaths.length}]`;

    try {
      // Descargar imagen actual
      const res = await fetch(originalUrl);
      if (!res.ok) {
        console.warn(`${progress} ⚠️ Falló descarga (HTTP ${res.status}): ${path}`);
        failCount++;
        continue;
      }

      const origArrayBuf = await res.arrayBuffer();
      const origBuffer = Buffer.from(origArrayBuf);
      const origSize = origBuffer.length;
      totalOrigBytes += origSize;

      // Si la imagen ya es pequeña (menos de 30KB), omitir
      if (origSize <= 30 * 1024) {
        console.log(`${progress} ⏭️ Omitida (ya es ultraligera ${(origSize / 1024).toFixed(1)} KB): ${path}`);
        totalOptBytes += origSize;
        skipCount++;
        continue;
      }

      // Optimizar imagen con sharp (máx 800px width/height, WebP calidad 75)
      const optBuffer = await sharp(origBuffer)
        .resize({ width: 800, height: 800, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 75 })
        .toBuffer();

      const optSize = optBuffer.length;

      // Si la versión optimizada es más pequeña, subirla reemplazando la anterior
      if (optSize < origSize) {
        const { error: uploadErr } = await supabase.storage.from("images").upload(path, optBuffer, {
          contentType: "image/webp",
          upsert: true,
          cacheControl: "31536000",
        });

        if (uploadErr) {
          console.error(`${progress} ❌ Error al subir a Storage (${path}):`, uploadErr.message);
          totalOptBytes += origSize;
          failCount++;
        } else {
          const savedKB = ((origSize - optSize) / 1024).toFixed(1);
          const percent = (((origSize - optSize) / origSize) * 100).toFixed(1);
          console.log(
            `${progress} ✅ Optimizada: ${(origSize / 1024).toFixed(1)} KB ➔ ${(optSize / 1024).toFixed(1)} KB (Ahorro: -${savedKB} KB / -${percent}%) | ${path}`
          );
          totalOptBytes += optSize;
          successCount++;
        }
      } else {
        console.log(`${progress} ⏭️ Conservada original (${(origSize / 1024).toFixed(1)} KB): ${path}`);
        totalOptBytes += origSize;
        skipCount++;
      }
    } catch (err) {
      console.error(`${progress} ❌ Error inesperado procesando ${path}:`, err.message);
      failCount++;
    }
  }

  const savedMB = ((totalOrigBytes - totalOptBytes) / (1024 * 1024)).toFixed(2);
  const origMB = (totalOrigBytes / (1024 * 1024)).toFixed(2);
  const optMB = (totalOptBytes / (1024 * 1024)).toFixed(2);

  console.log("\n================ Resumen de Optimización ================");
  console.log(`Procesadas exitosamente : ${successCount}`);
  console.log(`Omitidas (ya livianas)  : ${skipCount}`);
  console.log(`Errores                : ${failCount}`);
  console.log(`Peso total anterior    : ${origMB} MB`);
  console.log(`Peso total optimizado  : ${optMB} MB`);
  console.log(`AHORRO TOTAL LOGRADO   : ${savedMB} MB (-${(((totalOrigBytes - totalOptBytes) / totalOrigBytes) * 100).toFixed(1)}%)`);
  console.log("=========================================================");
}

main().catch(console.error);
