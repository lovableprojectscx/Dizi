import { describe, it, expect } from "vitest";
import { Route as CatalogRoute } from "@/routes/t.$slug";

describe("Pruebas Unitarias del Catálogo Demo Creado: Valeria Boutique (Moda Mujer)", () => {
  const mockValeriaStore = {
    id: "s_valeria",
    slug: "valeria-boutique",
    name: "Valeria Boutique · Moda Mujer",
    phone: "51924624139",
    logo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&h=500&q=85",
    bannerImage: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1400&h=500&q=85",
    plan: "ilimitado",
    model: "editorial",
    products: [
      {
        id: "p_val1",
        name: "Vestido Satinado Noche Rose Gold",
        price: 129.9,
        image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=85",
        description: "Elegante vestido satinado midi en tono rose gold con escote drapeado.",
      },
    ],
  };

  it("debe retornar la configuración completa de Valeria Boutique con dirección de pedidos a WhatsApp de Dizi", () => {
    const head = (CatalogRoute.options as any).head({
      params: { slug: "valeria" },
      loaderData: { store: mockValeriaStore },
      search: {},
    });

    const ogTitle = head.meta.find((m: any) => m.property === "og:title")?.content;
    const ogImage = head.meta.find((m: any) => m.property === "og:image")?.content;

    expect(ogTitle).toBe("Valeria Boutique · Moda Mujer · Catálogo Digital");
    expect(ogImage).toBe("https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1400&h=500&q=85");
    expect(mockValeriaStore.phone).toBe("51924624139");
  });

  it("debe soportar previsualizaciones de productos de moda para WhatsApp con sus imágenes individuales", () => {
    const head = (CatalogRoute.options as any).head({
      params: { slug: "valeria-boutique" },
      loaderData: { store: mockValeriaStore },
      search: { p: "p_val1" },
    });

    const ogTitle = head.meta.find((m: any) => m.property === "og:title")?.content;
    const ogImage = head.meta.find((m: any) => m.property === "og:image")?.content;

    expect(ogTitle).toContain("Vestido Satinado Noche Rose Gold — Valeria Boutique · Moda Mujer | S/ 129.90");
    expect(ogImage).toBe("https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=85");
  });
});
