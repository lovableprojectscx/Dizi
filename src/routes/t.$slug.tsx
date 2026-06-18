import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { PublicCatalog } from "@/components/public/PublicCatalog";
import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";
import type { Store } from "@/lib/types";
import { Button } from "@/components/ui/button";

export function StoreErrorComponent({ error, reset }: { error: any; reset: () => void }) {
  const router = useRouter();
  const errorMsg = error?.message || (typeof error === "string" ? error : "") || "";
  const isTimeoutOrNetwork = 
    errorMsg.includes("Timeout") || 
    errorMsg.toLowerCase().includes("fetch") || 
    errorMsg.toLowerCase().includes("network") ||
    !navigator.onLine;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 text-center">
      <div className="max-w-md p-6 rounded-2xl border bg-card shadow-sm space-y-4">
        <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <div className="space-y-2">
          <h1 className="text-lg font-bold text-foreground">
            {isTimeoutOrNetwork ? "Error de Conexión" : "No se pudo cargar la página"}
          </h1>
          <p className="text-xs text-muted-foreground leading-normal">
            {isTimeoutOrNetwork 
              ? "Estamos teniendo problemas para conectarnos a la base de datos. Si estás usando Wi-Fi de Movistar o Claro, intenta desactivándolo y navegando con tus datos móviles (4G/5G)."
              : "Ocurrió un error inesperado al cargar la tienda. Por favor, intenta de nuevo."}
          </p>
        </div>
        <div className="flex flex-col gap-2 pt-2">
          <Button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="w-full h-10 font-bold"
          >
            Reintentar
          </Button>
          <a
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-input bg-background text-xs font-bold text-foreground hover:bg-accent transition-colors"
          >
            Ir al Inicio
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/t/$slug")({
  loader: async ({ params }) => {
    const store = await fetchStoreBySlug(params.slug);
    return { store };
  },
  head: ({ params, loaderData }) => {
    const store = loaderData?.store;
    const title = store ? `${store.name} · Catálogo Digital` : `Catálogo · ${params.slug}`;
    const description = store ? `Mira nuestro catálogo: ${store.name}. Vende por WhatsApp.` : `Catálogo digital de ${params.slug}`;
    const image = store?.bannerImage || store?.logo || "https://dizi.idenza.site/images/og-image.png";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:image", content: image },
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
async function fetchStoreBySlug(slug: string): Promise<Store | null> {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Timeout: La base de datos de Supabase tardó demasiado en responder.")), 6000)
  );

  const fetchPromise = (async (): Promise<Store | null> => {
    const { data, error } = await supabase
      .rpc("get_public_store", { store_slug: slug });

    if (error) {
      console.error("[fetchStoreBySlug] RPC error:", error);
      throw new Error(`DB Error: ${error.message}`);
    }
    if (!data) return null;

    // Fallback: If product images are missing due to RPC bug, fetch them directly
    let productsWithImages = data.products || [];
    if (productsWithImages.length > 0 && productsWithImages.every((p: any) => p.image === undefined || p.image === "")) {
      const productIds = productsWithImages.map((p: any) => p.id);
      const { data: realProducts, error: pError } = await supabase
        .from("products")
        .select("id, image")
        .in("id", productIds);
        
      if (!pError && realProducts) {
        const imageMap = new Map(realProducts.map((p: any) => [p.id, p.image]));
        productsWithImages = productsWithImages.map((p: any) => ({
          ...p,
          image: imageMap.get(p.id) || ""
        }));
      }
    }

    return {
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
      bioButtonStyle: data.bio_button_style === "rounded-full" ? "pill-solid" : (data.bio_button_style ?? "pill-solid"),
      bioButtonColor: data.bio_button_color ?? undefined,
      bioButtonTextColor: data.bio_button_text_color ?? undefined,
      bioBgImage: data.bio_bg_image ?? undefined,
      bioBgColor: data.bio_bg_color ?? undefined,
      bannerTagline: data.banner_tagline,
      bannerBottomTag: data.banner_bottom_tag,
      categories: (data.categories || []).map((c: any) => ({ id: c.id, name: c.name })),
      products: (productsWithImages || []).map((p: any) => ({
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
      })),
    };
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
