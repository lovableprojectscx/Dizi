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

// Instalar Service Worker e iniciar inmediatamente
self.addEventListener("install", (event) => {
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

        // Petición en segundo plano para actualizar caché (Stale-While-Revalidate)
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch((err) => {
            // Si falla la red (sin conexión o bloqueo ISP), responder con respuesta en caché si existe
            return cachedResponse;
          });

        // Si ya está en caché, responder INMEDIATAMENTE (0ms latencia, 0 Egress)
        // De lo contrario, esperar a la red
        return cachedResponse || fetchPromise;
      })
    );
  }
});
