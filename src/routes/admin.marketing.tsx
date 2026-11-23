/**
 * @file admin.marketing.tsx
 * @description Área "Promociona" (/admin/marketing) renovada en F54:
 * 1. Franja índigo de cabecera ("Promociona").
 * 2. "Así se ve tu producto" (StylePreviewStrip diferido con 3 o 4 miniaturas reales en canvas).
 * 3. "Ideas para vender" (PromoIdeas con fechas próximas de Perú en hora de Lima).
 * 4. Cuadrícula de fotos grandes con buscador ("Elige un producto").
 * 5. Sin ShareCatalogCard (queda solo en Inicio).
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ImageIcon, Package, Plus, Search } from "lucide-react";
import { useApp } from "@/lib/store";
import { formatPrice } from "@/lib/whatsapp";
import { toSupabaseUrl } from "@/lib/image-utils";
import { getHeroProduct } from "@/lib/panel-home";
import { getUpcomingIdeas, resolveIdeaStyle, type PromoIdea } from "@/lib/promo-ideas";
import { prepareShareImageData } from "@/lib/share-image/data";
import { PanelHero } from "@/components/admin/PanelHero";
import { PromoIdeas } from "@/components/admin/PromoIdeas";
import { CatalogImageCard } from "@/components/admin/CatalogImageCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CaptionTemplate } from "@/lib/share-image/caption";
import type { ShareImageStyle } from "@/lib/share-image/types";
import type { Product } from "@/lib/types";

const ShareImageDialog = React.lazy(() =>
  import("@/components/admin/ShareImageDialog").then((m) => ({
    default: m.ShareImageDialog,
  })),
);

const StylePreviewStrip = React.lazy(() =>
  import("@/components/admin/StylePreviewStrip").then((m) => ({
    default: m.StylePreviewStrip,
  })),
);

export const Route = createFileRoute("/admin/marketing")({
  component: AdminMarketingPage,
});

interface DialogSelection {
  product: Product;
  initialStyle?: ShareImageStyle;
  initialCaptionTemplate?: CaptionTemplate;
}

function StylePreviewFallback() {
  return (
    <section aria-label="Cargando vistas previas" className="space-y-3">
      <div className="h-7 w-56 rounded-lg bg-muted animate-pulse motion-reduce:animate-none" />
      <div className="flex gap-3 overflow-hidden lg:grid lg:grid-cols-3">
        {[1, 2, 3].map((idx) => (
          <div
            key={idx}
            className="w-[62%] sm:w-[40%] lg:w-auto shrink-0 rounded-2xl border border-border bg-card p-2.5"
          >
            <div className="aspect-[9/16] w-full rounded-xl bg-muted animate-pulse motion-reduce:animate-none" />
            <div className="mt-2.5 h-5 w-24 rounded bg-muted animate-pulse motion-reduce:animate-none" />
          </div>
        ))}
      </div>
    </section>
  );
}

function AdminMarketingPage() {
  const currentStoreId = useApp((s) => s.currentStoreId);
  const store = useApp((s) => s.stores.find((st) => st.id === currentStoreId) ?? s.stores[0]);

  const [searchQuery, setSearchQuery] = useState("");
  const [dialogSelection, setDialogSelection] = useState<DialogSelection | null>(null);
  const productsSectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    document.title = "Promociona · Panel de Administración";
  }, []);

  const visibleProducts = useMemo(() => {
    if (!store?.products) return [];
    return store.products.filter((p) => p.visible);
  }, [store?.products]);

  const heroProduct = useMemo(() => (store ? getHeroProduct(store) : null), [store]);

  const upcomingIdeas = useMemo(() => getUpcomingIdeas(new Date(), 45, 2), []);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return visibleProducts;
    return visibleProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)),
    );
  }, [visibleProducts, searchQuery]);

  if (!store) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleScrollToProducts = () => {
    productsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleCreateForIdea = (idea: PromoIdea) => {
    const targetProduct = heroProduct ?? visibleProducts[0];
    if (!targetProduct) return;
    const data = prepareShareImageData({
      product: targetProduct,
      store,
      baseUrl: typeof window !== "undefined" ? window.location.origin : undefined,
    });
    const style = resolveIdeaStyle(idea, data.isOnSale);
    setDialogSelection({
      product: targetProduct,
      initialStyle: style,
      initialCaptionTemplate: idea.captionTemplate,
    });
  };

  return (
    <div className="space-y-7 max-w-5xl mx-auto pb-12">
      {/* 1. Franja índigo de cabecera */}
      <PanelHero
        title="Promociona"
        subtitle="Convierte tus productos en historias y estados que venden"
      />

      {visibleProducts.length === 0 ? (
        /* Estado sin productos (RF-52.4 / RF-54.12) */
        <div
          data-testid="marketing-empty-state"
          className="flex flex-col items-center justify-center p-6 sm:p-10 text-center space-y-3 bg-card border border-dashed border-border rounded-2xl"
        >
          <div className="h-12 w-12 rounded-2xl bg-secondary text-brand flex items-center justify-center">
            <Package className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="space-y-1 max-w-md">
            <h2 className="font-heading font-semibold text-[20px] text-foreground">
              Aún no tienes productos en tu catálogo
            </h2>
            <p className="text-[16px] text-muted-foreground leading-relaxed">
              Para crear imágenes promocionales y compartirlas con tus clientes en redes sociales, primero agrega tus productos a tu catálogo.
            </p>
          </div>
          <Button
            asChild
            className="rounded-xl bg-primary hover:bg-primary/90 text-dizi-ink font-bold text-[16px] min-h-[48px] px-5 mt-2 shadow-xs"
          >
            <Link to="/admin/productos">
              <Plus className="h-4 w-4 mr-1.5" aria-hidden="true" />
              <span>Agregar mi primer producto</span>
            </Link>
          </Button>
        </div>
      ) : (
        <>
          {/* 1.5 "Comparte tu catálogo completo" (RF-55.12 / RF-55.13) */}
          <CatalogImageCard
            store={store}
            dismissible={false}
            title="Comparte tu catálogo completo"
            subtitle="Descarga o comparte una imagen promocional con tus productos para publicar en tus estados"
          />

          {/* 2. "Así se ve tu producto" (miniaturas en canvas cargadas en diferido) */}
          {heroProduct && (
            <React.Suspense fallback={<StylePreviewFallback />}>
              <StylePreviewStrip
                product={heroProduct}
                store={store}
                onSelectStyle={(style) =>
                  setDialogSelection({
                    product: heroProduct,
                    initialStyle: style,
                  })
                }
                onPickOtherProduct={handleScrollToProducts}
              />
            </React.Suspense>
          )}

          {/* 3. "Ideas para vender" */}
          <PromoIdeas ideas={upcomingIdeas} onCreateForIdea={handleCreateForIdea} />

          {/* 4. "Elige un producto" (cuadrícula de fotos grandes + buscador) */}
          <section
            ref={productsSectionRef}
            id="promociona-productos"
            data-testid="marketing-product-grid"
            aria-label="Elige un producto"
            className="space-y-4 scroll-mt-20"
          >
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div className="space-y-0.5">
                <h2 className="font-heading font-semibold text-[22px] sm:text-[24px] leading-tight text-foreground">
                  Elige un producto
                </h2>
                <p className="text-[13px] text-muted-foreground">
                  Toca cualquier producto para crear su imagen en historia, post o cuadrado
                </p>
              </div>

              <div className="relative w-full sm:max-w-xs">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
                  aria-hidden="true"
                />
                <Input
                  type="text"
                  placeholder="Buscar producto por nombre..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 min-h-[44px] text-[16px] rounded-xl bg-card border-border"
                />
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="rounded-2xl border border-border bg-card py-10 px-4 text-center text-[16px] text-muted-foreground">
                No se encontraron productos que coincidan con "{searchQuery}".
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {filteredProducts.map((product) => {
                  const imageUrl = product.image ? toSupabaseUrl(product.image) || product.image : null;
                  return (
                    <button
                      key={product.id}
                      type="button"
                      data-testid="marketing-product-card"
                      onClick={() => setDialogSelection({ product })}
                      className="group rounded-2xl border border-border bg-card overflow-hidden text-left shadow-xs hover:border-brand/50 transition-colors duration-200 motion-reduce:transition-none cursor-pointer flex flex-col focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                    >
                      <div className="aspect-square w-full bg-muted overflow-hidden flex items-center justify-center">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={product.name}
                            loading="lazy"
                            className="h-full w-full object-cover group-hover:scale-[1.03] transition-transform duration-200 motion-reduce:transition-none"
                          />
                        ) : (
                          <ImageIcon
                            className="h-8 w-8 text-muted-foreground/60"
                            aria-hidden="true"
                          />
                        )}
                      </div>

                      <div className="p-3 sm:p-3.5 flex flex-col gap-1 flex-1 justify-between">
                        <h3 className="text-[15px] sm:text-[16px] font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-brand transition-colors duration-200 motion-reduce:transition-none">
                          {product.name}
                        </h3>
                        <span className="text-[16px] font-bold text-brand">
                          {formatPrice(product.price)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}

      {/* Modal reutilizado: ShareImageDialog con source="marketing" */}
      {dialogSelection && (
        <React.Suspense fallback={null}>
          <ShareImageDialog
            open={true}
            onOpenChange={(open) => {
              if (!open) setDialogSelection(null);
            }}
            product={dialogSelection.product}
            store={store}
            source="marketing"
            initialStyle={dialogSelection.initialStyle}
            initialCaptionTemplate={dialogSelection.initialCaptionTemplate}
          />
        </React.Suspense>
      )}
    </div>
  );
}
