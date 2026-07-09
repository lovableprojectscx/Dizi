import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicCatalog } from "@/components/public/PublicCatalog";
import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";
import type { Store } from "@/lib/types";
import { StoreErrorComponent } from "./t.$slug";

export const Route = createFileRoute("/bio/$slug")({
  loader: async ({ params }) => {
    const store = await fetchStoreBySlug(params.slug);
    return { store };
  },
  head: ({ params, loaderData }) => {
    const store = loaderData?.store;
    const title = store ? `${store.name} · Enlaces & Contacto` : `Bio-Link · ${params.slug}`;
    const description = store
      ? `Enlaces y ubicación de ${store.name}. Síguenos y contáctanos.`
      : `Enlaces y ubicación de ${params.slug}`;
    const image =
      store?.bioBanner ||
      store?.bannerImage ||
      store?.bioLogo ||
      store?.logo ||
      "https://dizi.idenza.site/images/og-image.png";
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
  component: BioPublic,
  errorComponent: StoreErrorComponent,
});

async function fetchStoreBySlug(slug: string): Promise<Store | null> {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(
      () =>
        reject(new Error("Timeout: La base de datos de Supabase tardó demasiado en responder.")),
      6000,
    ),
  );

  const fetchPromise = (async (): Promise<Store | null> => {
    const { data, error } = await supabase.rpc("get_public_store", { store_slug: slug });

    if (error) {
      console.error("[fetchStoreBySlug] RPC error:", error);
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
      bioShowCatalogButton: data.bio_show_catalog_button ?? null,
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
      categories: (data.categories || []).map((c: any) => ({ id: c.id, name: c.name })),
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
  })();

  return Promise.race([fetchPromise, timeoutPromise]);
}

function BioPublic() {
  const { slug } = Route.useParams();
  const { store } = Route.useLoaderData();

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

  return <PublicCatalog store={store} mode="bio" />;
}
