import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicCatalog } from "@/components/public/PublicCatalog";
import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";
import type { Store } from "@/lib/types";

export const Route = createFileRoute("/bio/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `Bio-Link · ${params.slug}` },
      { name: "description", content: `Enlaces y ubicación de ${params.slug}` },
    ],
  }),
  component: BioPublic,
});

async function fetchStoreBySlug(slug: string): Promise<Store | null> {
  const { data, error } = await supabase
    .rpc("get_public_store", { store_slug: slug });

  if (error || !data) return null;

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
    bannerImage: data.banner_image,
    bannerTitle: data.banner_title,
    ownerId: data.owner_id,
    active: data.active,
    isPublished: data.is_published,
    createdAt: data.created_at,
    whatsappClicks: data.whatsapp_clicks || 0,
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
    quickLinks: data.quick_links ?? [],
    bioLinksEnabled: data.bio_links_enabled ?? false,
    bioLogo: data.bio_logo ?? undefined,
    bioBanner: data.bio_banner ?? undefined,
    bioTheme: data.bio_theme ?? "default",
    bioButtonStyle: data.bio_button_style === "rounded-full" ? "pill-solid" : (data.bio_button_style ?? "pill-solid"),
    bioButtonColor: data.bio_button_color ?? undefined,
    bioButtonTextColor: data.bio_button_text_color ?? undefined,
    bioBgImage: data.bio_bg_image ?? undefined,
    bioBgColor: data.bio_bg_color ?? undefined,
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
}

function BioPublic() {
  const { slug } = Route.useParams();
  const [store, setStore] = useState<Store | null | "loading">("loading");

  useEffect(() => {
    setStore("loading");
    fetchStoreBySlug(slug).then((s) => setStore(s));
  }, [slug]);

  if (store === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Cargando enlaces...</p>
        </div>
      </div>
    );
  }

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
