/**
 * @file bio.$slug.tsx
 * @description Ruta pública del Bio-Link (/bio/:slug) en TanStack Router.
 * Renderiza la tarjeta de presentación digital de la tienda: enlaces de redes sociales,
 * mapa interactivo con OpenStreetMap / Leaflet, y vitrina de productos destacados.
 */

import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock } from "lucide-react";
import { PublicCatalog } from "@/components/public/PublicCatalog";
import { supabase, invokeRpcWithRetry } from "@/lib/supabase";
import { toCdnUrl } from "@/lib/image-utils";
import type { Store } from "@/lib/types";
import { StoreErrorComponent } from "@/components/public/StoreErrorComponent";

/**
 * Obtiene la copia en caché local del Bio-Link si existe.
 */
export function getLocalBioCache(slug: string): Store | null {
  if (typeof window !== "undefined") {
    try {
      const raw =
        localStorage.getItem(`dizi_bio_cache_${slug}`) ||
        sessionStorage.getItem(`dizi_bio_cache_${slug}`);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed?.store || null;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Definición de la ruta de TanStack Router para `/bio/$slug`.
 * Configura caché en memoria (`staleTime: 5 min`, `gcTime: 15 min`),
 * cargador de datos optimizado para bio-link, metadatos Open Graph y componente de error.
 */
export const Route = createFileRoute("/bio/$slug")({
  staleTime: 5 * 60 * 1000, // 5 minutos de caché en memoria TanStack Router
  gcTime: 15 * 60 * 1000, // 15 minutos antes de recolectar basura
  loader: async ({ params }) => {
    // Si existe copia guardada en caché local, devolverla de inmediato para renderizado instantáneo
    const cachedStore = getLocalBioCache(params.slug);
    if (cachedStore) {
      return { store: cachedStore, isFromCache: true };
    }

    // Sin copia en caché: realizar carga directa con reintentos automáticos
    const store = await fetchStoreBySlug(params.slug);
    return { store, isFromCache: false };
  },
  head: ({ params, loaderData }: any) => {
    const store = loaderData?.store;

    const getValidImageUrl = (url?: string | null) => {
      if (!url || typeof url !== "string" || !url.trim()) return null;
      const clean = url.trim();
      if (clean.startsWith("http://") || clean.startsWith("https://")) return clean;
      if (clean.startsWith("/")) return `https://dizi.idenza.site${clean}`;
      return `https://dizi.idenza.site/${clean}`;
    };

    const title = store ? `${store.name} · Enlaces & Contacto` : `Bio-Link · ${params.slug}`;
    const description = store
      ? `Encuentra nuestras redes sociales, catálogo digital y ubicación de ${store.name}.`
      : `Enlaces y ubicación de ${params.slug}`;
    const image =
      getValidImageUrl(store?.bioBanner) ||
      getValidImageUrl(store?.bannerImage) ||
      getValidImageUrl(store?.bioLogo) ||
      getValidImageUrl(store?.logo) ||
      "https://dizi.idenza.site/images/og-image.png";
    const canonicalUrl = `https://dizi.idenza.site/bio/${params.slug}`;

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:site_name", content: "Dizi" },
        { property: "og:url", content: canonicalUrl },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:image", content: image },
        { property: "og:image:secure_url", content: image },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: image },
      ],
      links: image && !image.includes("og-image.png")
        ? [
            {
              rel: "preload",
              as: "image",
              href: toCdnUrl(image),
              fetchPriority: "high",
            },
          ]
        : [],
    };
  },
  component: BioPublic,
  errorComponent: StoreErrorComponent,
});

/**
 * Carga los datos de la tienda optimizados para la página Link-in-Bio.
 *
 * A diferencia del catálogo completo, solicita únicamente hasta 6 productos
 * para alimentar la vitrina rápida de productos del bio-link, ahorrando transferencia.
 * Implementa la misma verificación en dos pasos de `updated_at` (Zero-Egress).
 *
 * @param slug Identificador URL de la tienda.
 * @returns Promesa con el objeto `Store` o null.
 */
async function fetchStoreBySlug(slug: string): Promise<Store | null> {
  const { data, error } = await invokeRpcWithRetry("get_public_store", {
    store_slug: slug,
    page_limit: 6,
    page_offset: 0,
  });

  if (error) {
    console.error("[fetchStoreBySlug Bio] RPC error final:", error);
    throw new Error(error.message || `DB Error: ${error.status || error.code || "Conexión fallida"}`);
  }
  if (!data) return null;

    let productsWithImages = data.products || [];
    if (
      productsWithImages.length > 0 &&
      productsWithImages.every((p: any) => p.image === undefined || p.image === "")
    ) {
      const productIds = productsWithImages.map((p: any) => p.id);
      const { data: realProducts, error: pError } = await supabase
        .from("products")
        .select("id, image")
        .in("id", productIds);

      if (!pError && realProducts) {
        const imageMap = new Map(realProducts.map((p: any) => [p.id, p.image]));
        productsWithImages = productsWithImages.map((p: any) => ({
          ...p,
          image: imageMap.get(p.id) || "",
        }));
      }
    }

    const storeResult: Store = {
      id: data.id,
      slug: data.slug,
      name: data.name,
      phone: data.phone || "",
      countryCode: data.country_code || "51",
      countryIso: data.country_iso || "PE",
      logo: data.logo,
      plan: data.plan,
      model: data.model,
      brandColor: data.brand_color,
      bgColor: data.bg_color,
      textColor: data.text_color,
      bannerImage: data.banner_image,
      bannerTitle: data.banner_title,
      bannerStyle: data.banner_style ?? "direct",
      niche: data.niche ?? "general",
      catalogTypography: data.catalog_typography ?? "sans",
      cardStyle: data.card_style ?? "standard",
      ownerId: data.owner_id,
      active: data.active,
      isPublished: data.is_published,
      createdAt: data.created_at,
      whatsappClicks: data.whatsapp_clicks || 0,
      views: data.views || 0,
      priceFilterEnabled: data.price_filter_enabled ?? false,
      libroReclamacionesActivo: data.libro_reclamaciones_activo ?? false,
      empresaRuc: data.empresa_ruc ?? undefined,
      empresaRazonSocial: data.empresa_razon_social ?? undefined,
      empresaDireccion: data.empresa_direccion ?? undefined,
      planExpiresAt: data.plan_expires_at ?? undefined,
      subscriptionStatus: data.subscription_status ?? "trial",
      cancelledAt: data.cancelled_at ?? undefined,
      cancelReason: data.cancel_reason ?? undefined,
      planDurationMonths: data.plan_duration_months ?? undefined,
      bioDescription: data.bio_description ?? undefined,
      locationLat: data.location_lat ? Number(data.location_lat) : undefined,
      locationLng: data.location_lng ? Number(data.location_lng) : undefined,
      locationAddress: data.location_address ?? undefined,
      showMap: data.show_map ?? true,
      quickLinks: data.quick_links ?? [],
      bioLinksEnabled: data.bio_links_enabled ?? false,
      bioLogo: data.bio_logo ?? undefined,
      bioBanner: data.bio_banner ?? undefined,
      bioTheme: data.bio_theme ?? "default",
      bioTypography: data.bio_typography ?? "sans",
      bioButtonStyle:
        data.bio_button_style === "rounded-full"
          ? "pill-solid"
          : (data.bio_button_style ?? "pill-solid"),
      bioButtonColor: data.bio_button_color ?? undefined,
      bioButtonTextColor: data.bio_button_text_color ?? undefined,
      bioBgImage: data.bio_bg_image ?? undefined,
      bioBgColor: data.bio_bg_color ?? undefined,
      bannerTagline: data.banner_tagline,
      bannerBottomTag: data.banner_bottom_tag,
      showDiziBranding: data.show_dizi_branding ?? true,
      promoBarEnabled: data.promo_bar_enabled ?? false,
      promoBarText: data.promo_bar_text ?? "",
      promoBarActionType: data.promo_bar_action_type ?? "none",
      promoBarActionValue: data.promo_bar_action_value ?? "",
      promoBarBgColor: data.promo_bar_bg_color ?? undefined,
      promoBarTextColor: data.promo_bar_text_color ?? undefined,
      promoBarIsMarquee: data.promo_bar_is_marquee ?? false,
      showFeatured: data.show_featured ?? true,
      totalProductsCount: data.total_products_count !== undefined ? Number(data.total_products_count) : (productsWithImages?.length || 0),
      categories: (data.categories || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        productCount: c.product_count !== undefined ? Number(c.product_count) : undefined,
      })),
      products: (productsWithImages || [])
        .map((p: any) => ({
          id: p.id,
          name: p.name,
          price: Number(p.price),
          categoryId: p.category_id,
          image: p.image || "",
          description: p.description,
          isOnSale: p.is_on_sale,
          originalPrice: p.original_price ? Number(p.original_price) : undefined,
          visible: p.visible,
          isSample: p.is_sample,
          sortOrder: p.sort_order !== null && p.sort_order !== undefined ? Number(p.sort_order) : 0,
          variations: Array.isArray(p.variations) ? p.variations : [],
          createdAt: p.created_at,
        }))
        .sort((a: any, b: any) => {
          if ((a.sortOrder ?? 0) !== (b.sortOrder ?? 0)) {
            return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
          }
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        }),
    };

    if (typeof window !== "undefined") {
      try {
        const cachePayload = {
          store: storeResult,
          updated_at: data.updated_at || (storeResult as any).updatedAt || new Date().toISOString(),
          ts: Date.now(),
          verifiedAt: Date.now(),
        };
        localStorage.setItem(`dizi_bio_cache_${slug}`, JSON.stringify(cachePayload));
        sessionStorage.setItem(`dizi_bio_cache_${slug}`, JSON.stringify(cachePayload));
      } catch {}
    }

    return storeResult;
}

/**
 * Componente principal renderizado para la ruta `/bio/$slug`.
 * Valida la existencia y estado activo de la tienda antes de delegar a `PublicCatalog` en modo "bio".
 */
function BioPublic() {
  const { slug } = Route.useParams();
  const loaderData = Route.useLoaderData();
  const [store, setStore] = useState<Store | null>(loaderData.store);
  const [showCachedNotice, setShowCachedNotice] = useState<boolean>(false);

  useEffect(() => {
    setStore(loaderData.store);

    if (loaderData.isFromCache) {
      let isMounted = true;
      fetchStoreBySlug(slug)
        .then((freshStore) => {
          if (!isMounted) return;
          if (freshStore) {
            setStore(freshStore);
            setShowCachedNotice(false);
          }
        })
        .catch((err) => {
          if (!isMounted) return;
          console.warn("[BioPublic] Falló refresco en segundo plano; mostrando versión guardada:", err);
          setShowCachedNotice(true);
        });

      return () => {
        isMounted = false;
      };
    }
  }, [slug, loaderData.isFromCache, loaderData.store]);

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-4">
        <div>
          <h1 className="text-2xl font-semibold">Tienda no encontrada</h1>
          <p className="text-muted-foreground mt-2">
            No existe una tienda con el enlace <code>/bio/{slug}</code>.
          </p>
          <Link to="/" className="mt-4 inline-block text-primary hover:underline">
            Ir al inicio
          </Link>
        </div>
      </div>
    );
  }

  if (!store.active) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-center">
        <div>
          <h1 className="text-2xl font-semibold">Tienda suspendida</h1>
          <p className="text-muted-foreground mt-2">
            Este enlace no está disponible temporalmente.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {showCachedNotice && (
        <div
          data-testid="cached-version-banner"
          className="sticky top-0 z-50 bg-amber-500/10 border-b border-amber-500/20 backdrop-blur-md px-3 py-1.5 text-center text-xs text-amber-800 dark:text-amber-200 flex items-center justify-center gap-1.5 font-medium transition-all"
        >
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span>Mostrando la última versión guardada</span>
        </div>
      )}
      <PublicCatalog store={store} mode="bio" />
    </>
  );
}
