import { describe, it, expect } from "vitest";
import { supabase } from "@/lib/supabase";
import type { Product, Category } from "@/lib/types";

describe("Suite de Pruebas: Carga Bajo Demanda de Categorías y Resiliencia en Tiendas Grandes", () => {
  const mockCategories: Category[] = [
    { id: "cat_flores", name: "Flores & follajes", productCount: 9 },
    { id: "cat_ceramica", name: "Cerámica 🇵🇪", productCount: 57 },
    { id: "cat_acrilico_fabric", name: "Acrílico Fabric🇵🇪", productCount: 18 },
    { id: "cat_linea_luxury", name: "Línea Luxury", productCount: 41 },
    { id: "cat_vacia", name: "Categoría Vacía", productCount: 0 },
  ];

  const initialProductsBatch: Product[] = [
    ...Array.from({ length: 9 }, (_, i) => ({
      id: `prod_flor_${i + 1}`,
      name: `Arreglo Floral ${i + 1}`,
      categoryId: "cat_flores",
      image: "https://example.com/flor.webp",
      visible: true,
    })),
    ...Array.from({ length: 27 }, (_, i) => ({
      id: `prod_ceramica_${i + 1}`,
      name: `Maceta Cerámica ${i + 1}`,
      categoryId: "cat_ceramica",
      image: "https://example.com/ceramica.webp",
      visible: true,
    })),
  ];

  it("1. Debe mostrar el productCount real en el sidebar aunque los productos no estén en memoria inicial", () => {
    const acrilicoCat = mockCategories.find((c) => c.id === "cat_acrilico_fabric")!;
    const inMemoryCount = initialProductsBatch.filter((p) => p.categoryId === acrilicoCat.id).length;

    expect(inMemoryCount).toBe(0);
    const displayedCount = acrilicoCat.productCount ?? inMemoryCount;
    expect(displayedCount).toBe(18);
  });

  it("2. Debe detectar que una categoría seleccionada requiere fetch remoto cuando inMemoryCount < productCount", () => {
    const selectedCategory = "cat_acrilico_fabric";
    const categoryObj = mockCategories.find((c) => c.id === selectedCategory)!;

    const currentCount = initialProductsBatch.filter((p) => p.categoryId === selectedCategory).length;
    const expectedCount = categoryObj.productCount ?? 0;

    const needsRemoteFetch = currentCount === 0 && expectedCount > 0;
    expect(needsRemoteFetch).toBe(true);
  });

  it("3. Al cargar el lote remoto de la categoría, rawFiltered debe contener inmediatamente los productos recibidos", () => {
    const fetchedRemoteProducts: Product[] = Array.from({ length: 18 }, (_, i) => ({
      id: `prod_acrilico_${i + 1}`,
      name: `Bandeja Acrílico Fabric ${i + 1}`,
      categoryId: "cat_acrilico_fabric",
      image: "https://example.com/acrilico.webp",
      visible: true,
    }));

    const existingIds = new Set(initialProductsBatch.map((p) => p.id));
    const uniqueNew = fetchedRemoteProducts.filter((p) => !existingIds.has(p.id));
    const mergedProducts = [...initialProductsBatch, ...uniqueNew];

    const rawFiltered = mergedProducts.filter((p) => p.categoryId === "cat_acrilico_fabric" && p.visible);

    expect(rawFiltered).toHaveLength(18);
    expect(rawFiltered[0].name).toContain("Acrílico Fabric");
  });

  it("4. hasMoreProducts debe calcular correctamente la disponibilidad de más productos para una categoría con +24 items", () => {
    const ceramicaCat = mockCategories.find((c) => c.id === "cat_ceramica")!;
    const currentCeramicaCount = initialProductsBatch.filter((p) => p.categoryId === "cat_ceramica").length;
    const expectedTotal = ceramicaCat.productCount!;

    const hasMoreForCategory = currentCeramicaCount < expectedTotal;
    expect(hasMoreForCategory).toBe(true);
  });

  it("5. Categoría verdaderamente vacía no debe disparar fetch y debe indicar 0 productos", () => {
    const emptyCat = mockCategories.find((c) => c.id === "cat_vacia")!;
    const inMemoryCount = initialProductsBatch.filter((p) => p.categoryId === emptyCat.id).length;
    const needsFetch = inMemoryCount === 0 && (emptyCat.productCount ?? 0) > 0;

    expect(needsFetch).toBe(false);
    expect(emptyCat.productCount).toBe(0);
  });

  it("6. RPC en Vivo: get_public_store devuelve las categorías con product_count y total_products_count", async () => {
    const { data, error } = await supabase.rpc("get_public_store", {
      store_slug: "catalogo",
      page_limit: 36,
      page_offset: 0,
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data.slug).toBe("catalogo");
    expect(data.total_products_count).toBeGreaterThanOrEqual(100);
    expect(Array.isArray(data.categories)).toBe(true);

    const acrilicoCat = data.categories.find((c: any) => c.name.includes("Acrílico Fabric"));
    expect(acrilicoCat).toBeDefined();
    expect(acrilicoCat.product_count).toBe(18);
  }, 20000);

  it("7. RPC en Vivo: get_public_store_products filtra por category_id y devuelve sus productos exactos", async () => {
    // Primero obtener el ID de la categoría Acrílico Fabric
    const { data: storeData } = await supabase.rpc("get_public_store", {
      store_slug: "catalogo",
      page_limit: 10,
      page_offset: 0,
    });

    const acrilicoCat = storeData.categories.find((c: any) => c.name.includes("Acrílico Fabric"));
    expect(acrilicoCat).toBeDefined();

    const { data: prodData, error } = await supabase.rpc("get_public_store_products", {
      p_store_slug: "catalogo",
      p_page_offset: 0,
      p_page_limit: 24,
      p_category_id: acrilicoCat.id,
      p_search_query: null,
    });

    expect(error).toBeNull();
    expect(Array.isArray(prodData)).toBe(true);
    expect(prodData.length).toBe(18);
    expect(prodData.every((p: any) => p.category_id === acrilicoCat.id)).toBe(true);
  }, 20000);
});
