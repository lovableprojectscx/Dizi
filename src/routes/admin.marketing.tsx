/**
 * @file admin.marketing.tsx
 * @description Área "Promociona" en el panel (/admin/marketing).
 * Provee herramientas para que la comerciante promocione su catálogo en redes sociales:
 * 1. Generador de imágenes para historias y estados (reutilizando ShareImageDialog con source='marketing').
 * 2. Comparte tu catálogo (reutilizando ShareCatalogCard con QR dinámico y enlace).
 * 3. Estado amigable para tiendas sin productos.
 */

import React, { useState, useMemo, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useApp } from "@/lib/store";
import { formatPrice } from "@/lib/whatsapp";
import { toSupabaseUrl } from "@/lib/image-utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ShareCatalogCard } from "@/components/admin/ShareCatalogCard";
import {
  Sparkles,
  Search,
  Package,
  Plus,
  ImageIcon,
  ArrowRight,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/types";

// Carga perezosa (lazy) de ShareImageDialog para optimizar bundle
const ShareImageDialog = React.lazy(() =>
  import("@/components/admin/ShareImageDialog").then((m) => ({
    default: m.ShareImageDialog,
  }))
);

export const Route = createFileRoute("/admin/marketing")({
  component: AdminMarketingPage,
});

function AdminMarketingPage() {
  const currentStoreId = useApp((s) => s.currentStoreId);
  const store = useApp((s) => s.stores.find((st) => st.id === currentStoreId) ?? s.stores[0]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    document.title = "Promociona · Panel de Administración";
  }, []);

  // Productos visibles de la tienda
  const visibleProducts = useMemo(() => {
    if (!store?.products) return [];
    return store.products.filter((p) => p.visible);
  }, [store?.products]);

  // Filtrado por buscador
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return visibleProducts;
    return visibleProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
    );
  }, [visibleProducts, searchQuery]);

  if (!store) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const categoryMap = new Map(store.categories.map((c) => [c.id, c.name]));

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Cabecera de Página */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-heading font-black tracking-tight text-foreground">
              Promociona
            </h1>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              Marketing
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Crea contenido visual para tus historias y estados de WhatsApp y comparte tu catálogo digital.
          </p>
        </div>
      </div>

      {/* BLOQUE 1: CREA UNA IMAGEN PARA TUS ESTADOS E HISTORIAS */}
      <Card className="border border-border/80 rounded-2xl bg-card shadow-xs overflow-hidden">
        <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4 border-b border-border/40">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm sm:text-base font-heading font-bold text-foreground uppercase tracking-wider">
                Crea una imagen para tus estados e historias
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Elige un producto para abrir el creador con 4 estilos, formato vertical o cuadrado y texto automático para copiar.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-4">
          {visibleProducts.length === 0 ? (
            /* Estado Sin Productos (RF-52.4 / Escenario 3) */
            <div className="flex flex-col items-center justify-center p-6 sm:p-10 text-center space-y-3 bg-muted/20 border border-dashed border-border/80 rounded-2xl">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
                <Package className="h-6 w-6" />
              </div>
              <div className="space-y-1 max-w-md">
                <h3 className="text-sm sm:text-base font-bold text-foreground font-heading">
                  Aún no tienes productos en tu catálogo
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Para crear imágenes promocionales y compartirlas con tus clientes en redes sociales, primero agrega tus productos a tu catálogo.
                </p>
              </div>
              <Button asChild size="sm" className="rounded-xl font-bold text-xs h-9 sm:h-10 mt-2 bg-primary hover:bg-primary/90 text-white shadow-xs">
                <Link to="/admin/productos">
                  <Plus className="h-4 w-4 mr-1.5" /> Agregar mi primer producto
                </Link>
              </Button>
            </div>
          ) : (
            /* Lista con buscador y productos disponibles */
            <div className="space-y-4">
              {/* Buscador */}
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Buscar producto por nombre..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-xs rounded-xl bg-muted/30 border-border/80 focus-visible:ring-primary/20"
                />
              </div>

              {filteredProducts.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  No se encontraron productos que coincidan con "{searchQuery}".
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredProducts.map((product) => {
                    const categoryName = product.categoryId
                      ? categoryMap.get(product.categoryId)
                      : null;
                    const imageUrl = product.image
                      ? toSupabaseUrl(product.image)
                      : null;

                    return (
                      <div
                        key={product.id}
                        onClick={() => setSelectedProduct(product)}
                        className="group flex items-center justify-between p-3 rounded-xl border border-border/70 bg-card hover:border-primary/40 hover:bg-muted/30 transition-all cursor-pointer shadow-xs gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {/* Miniatura de imagen */}
                          <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-lg bg-muted/60 border border-border/40 shrink-0 overflow-hidden flex items-center justify-center">
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={product.name}
                                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
                                loading="lazy"
                              />
                            ) : (
                              <ImageIcon className="h-5 w-5 text-muted-foreground/60" />
                            )}
                          </div>

                          {/* Info del producto */}
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs sm:text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                              {product.name}
                            </h4>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              <span className="text-xs font-bold text-primary">
                                {formatPrice(product.price)}
                              </span>
                              {categoryName && (
                                <Badge
                                  variant="secondary"
                                  className="text-[9px] px-1.5 py-0 font-medium truncate max-w-[110px]"
                                >
                                  {categoryName}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Botón de acción Crear Imagen */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProduct(product);
                          }}
                          className="rounded-lg h-8 px-2.5 text-xs font-bold shrink-0 bg-primary/5 hover:bg-primary text-primary hover:text-white border-primary/30 transition-all"
                        >
                          <span>Crear</span>
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* BLOQUE 2: COMPARTE TU CATÁLOGO (QR Y ENLACE REUTILIZADO) */}
      <ShareCatalogCard store={store} title="Comparte tu catálogo" />

      {/* Modal Reutilizado: ShareImageDialog con source='marketing' */}
      {selectedProduct && (
        <React.Suspense fallback={null}>
          <ShareImageDialog
            open={selectedProduct !== null}
            onOpenChange={(open) => {
              if (!open) setSelectedProduct(null);
            }}
            product={selectedProduct}
            store={store}
            source="marketing"
          />
        </React.Suspense>
      )}
    </div>
  );
}
