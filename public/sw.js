/**
 * Service Worker de Caché de Imágenes para Dizi (sw.js)
 * Estrategia: Cache-First con Stale-While-Revalidate para imágenes de Supabase Storage.
 * Garantiza 0 bytes de Egress en visitas recurrentes e inmunidad a bloqueos ISP.
 */

const CACHE_NAME = "dizi-images-v1";
const IMAGE_DOMAINS = [
  "zkqzdwxjthjdjchimmds.supabase.co",
  "supabase.co",
];

const PRECACHE_ASSETS = [
  "/images/Icono.png",
  "/images/Logo.png",
  "/images/dizi_ad_brand_3d.webp",
  "/images/og-image.png",
];

// Instalar Service Worker y precachear assets estáticos esenciales
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

// Activar Service Worker y tomar control de los clientes
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Interceptar peticiones HTTP de imágenes
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Interceptar peticiones GET de imágenes de Supabase Storage, API del catálogo o imágenes estáticas locales
  const isSupabaseImage =
    IMAGE_DOMAINS.some((domain) => url.hostname.endsWith(domain)) &&
    url.pathname.includes("/storage/v1/object/public/images/");

  const isSupabaseApi =
    IMAGE_DOMAINS.some((domain) => url.hostname.endsWith(domain)) &&
    url.pathname.includes("/rest/v1/rpc/get_public_store");

  const isLocalImage =
    url.pathname.endsWith(".webp") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".jpg") ||
    url.pathname.endsWith(".jpeg") ||
    url.pathname.endsWith(".svg");

  if (event.request.method === "GET" && (isSupabaseImage || isSupabaseApi || isLocalImage)) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(event.request);

        // 1. Estrategia Cache-First pura para imágenes:
        // Si la imagen ya existe en la caché local del dispositivo, responder directamente sin enviar peticiones de red de fondo (0 bytes Egress).
        if (isSupabaseImage || isLocalImage) {
          if (cachedResponse) {
            return cachedResponse;
          }
          try {
            const networkResponse = await fetch(event.request);
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          } catch (err) {
            return cachedResponse || Response.error();
          }
        }

        // 2. Estrategia Stale-While-Revalidate para el RPC de datos (get_public_store):
        // Responde de inmediato desde caché y sincroniza en segundo plano si hay cambios de precios o stock.
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
  }
});
