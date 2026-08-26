import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicCatalog } from "@/components/public/PublicCatalog";
import { StoreErrorComponent } from "@/components/public/StoreErrorComponent";
import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";
import type { Store } from "@/lib/types";

export const Route = createFileRoute("/t/$slug")({
  staleTime: 5 * 60 * 1000, // 5 minutos de caché en memoria TanStack Router
  gcTime: 15 * 60 * 1000, // 15 minutos antes de recolectar basura
  loader: async ({ params }) => {
    const store = await fetchStoreBySlug(params.slug);
    return { store };
  },
  head: ({ params, loaderData, search }) => {
    const store = loaderData?.store;
    const targetProductId = (search as any)?.p || (search as any)?.producto;
    const product = store?.products?.find((p) => p.id === targetProductId);

    const getValidImageUrl = (url?: string | null) => {
      if (!url || typeof url !== "string" || !url.trim()) return null;
      const clean = url.trim();
      if (clean.startsWith("http://") || clean.startsWith("https://")) return clean;
      if (clean.startsWith("/")) return `https://dizi.idenza.site${clean}`;
      return `https://dizi.idenza.site/${clean}`;
    };

    let title = store ? `${store.name} · Catálogo Digital` : `Catálogo · ${params.slug}`;
    let description = store
      ? `Explora nuestro catálogo digital y realiza tus pedidos directo por WhatsApp con ${store.name}.`
      : `Catálogo digital de ${params.slug}`;
    let image =
      getValidImageUrl(store?.bannerImage) ||
      getValidImageUrl(store?.logo) ||
      "https://dizi.idenza.site/images/og-image.png";

    if (product) {
      title = `${product.name} — ${store?.name || params.slug}`;
      if (product.price) {
        title += ` | S/ ${product.price.toFixed(2)}`;
      }
      description =
        product.description ||
        `Mira ${product.name} en el catálogo digital de ${store?.name || params.slug}. Pedidos por WhatsApp.`;
      image = getValidImageUrl(product.image) || image;
    }

    const canonicalUrl = `https://dizi.idenza.site/t/${params.slug}${targetProductId ? `?p=${targetProductId}` : ""}`;

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
    };
  },
  component: StorePublic,
  errorComponent: StoreErrorComponent,
});

// Carga la tienda directamente desde Supabase por slug (para visitantes públicos
// que no tienen el store de Zustand cargado todavía).
async function fetchStoreBySlug(slug: string, pageLimit: number = 24): Promise<Store | null> {
  // 1. Verificación en caché local inteligente por Timestamp (Zero-Egress para visitas recurrentes)
  if (typeof window !== "undefined") {
    try {
      const cachedRaw =
        localStorage.getItem(`dizi_store_cache_${slug}`) ||
        sessionStorage.getItem(`dizi_store_cache_${slug}`);
      if (cachedRaw) {
        const cached = JSON.parse(cachedRaw);
        // Si la caché se verificó hace menos de 2 minutos, entregar directo sin red (0 KB de datos)
        if (Date.now() - (cached.verifiedAt || cached.ts || 0) < 2 * 60 * 1000 && cached.store) {
          return cached.store;
        }

        // Si la tienda ya está en caché local, hacer una micro-consulta ultraligera de solo updated_at (~100 bytes)
        if (cached.store && cached.updated_at) {
          const { data: storeMeta, error: metaErr } = await supabase
            .from("stores")
            .select("updated_at")
            .eq("slug", slug)
            .maybeSingle();

          if (!metaErr && storeMeta && storeMeta.updated_at === cached.updated_at) {
            // La tienda no ha sufrido cambios: renovar el TTL local y devolver la caché existente
            const refreshedCache = {
              ...cached,
              verifiedAt: Date.now(),
            };
            localStorage.setItem(`dizi_store_cache_${slug}`, JSON.stringify(refreshedCache));
            return cached.store;
          }
        }
      }
    } catch (e) {
      console.warn("[fetchStoreBySlug] Cache check fallback:", e);
    }
  }

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(
      () =>
        reject(new Error("Timeout: La base de datos de Supabase tardó demasiado en responder.")),
      18000,
    ),
  );

  const fetchPromise = (async (): Promise<Store | null> => {
    const { data, error } = await supabase.rpc("get_public_store", {
      store_slug: slug,
      page_limit: pageLimit,
      page_offset: 0,
    });

    if (error) {
      console.error("[fetchStoreBySlug] RPC error:", error);
      // Contingencia: si la red falla pero hay caché previa en el dispositivo, usarla
      if (typeof window !== "undefined") {
        try {
          const cachedRaw = localStorage.getItem(`dizi_store_cache_${slug}`);
          if (cachedRaw) {
            const cached = JSON.parse(cachedRaw);
            if (cached?.store) return cached.store;
          }
        } catch {}
      }
      throw new Error(`DB Error: ${error.message}`);
    }
    if (!data) return null;

    // Fallback: If product images are missing due to RPC bug, fetch them directly
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
        .sort((a, b) => {
          if ((a.sortOrder ?? 0) !== (b.sortOrder ?? 0)) {
            return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
          }
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        }),
    };

    // Guardar en localStorage y sessionStorage con timestamp para visitas recurrentes Zero-Egress
    if (typeof window !== "undefined") {
      try {
        const cachePayload = {
          store: storeResult,
          updated_at: data.updated_at || storeResult.updatedAt || new Date().toISOString(),
          ts: Date.now(),
          verifiedAt: Date.now(),
        };
        localStorage.setItem(`dizi_store_cache_${slug}`, JSON.stringify(cachePayload));
        sessionStorage.setItem(`dizi_store_cache_${slug}`, JSON.stringify(cachePayload));
      } catch {}
    }

    return storeResult;
  })();

  return Promise.race([fetchPromise, timeoutPromise]);
}

function StorePublic() {
  const { slug } = Route.useParams();
  const { store } = Route.useLoaderData();

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-4">
        <div>
          <h1 className="text-2xl font-semibold">Tienda no encontrada</h1>
          <p className="text-muted-foreground mt-2">
            No existe una tienda con el enlace <code>/t/{slug}</code>.
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
            Este catálogo no está disponible temporalmente.
          </p>
        </div>
      </div>
    );
  }

  return <PublicCatalog store={store} mode="catalog" />;
}
