import { describe, it, expect } from "vitest";
import { Route as CatalogRoute } from "@/routes/t.$slug";
import { Route as BioRoute } from "@/routes/bio.$slug";

describe("Pruebas Unitarias del Nuevo Catálogo MODX · Urban & Streetwear", () => {
  const mockModxStore = {
    id: "s_modx",
    slug: "modx",
    name: "MODX · Urban & Streetwear",
    phone: "51924624139",
    logo: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=500&h=500&q=85",
    bannerImage: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1400&h=500&q=85",
    bioLinksEnabled: true,
    quickLinks: [
      {
        id: "link_1",
        title: "📱 Pedidos Directos por WhatsApp",
        url: "https://wa.me/51924624139?text=Hola%20MODX",
      },
      {
        id: "link_3",
        title: "📘 Síguenos en Facebook (Dizi Catálogos)",
        url: "https://www.facebook.com/dizicatalogos/",
      },
    ],
    products: [
      {
        id: "p_m1",
        name: "Hoodie MODX Heavyweight Acid Wash",
        price: 139.9,
        image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=85",
      },
    ],
  };

  it("debe configurar correctamente el catálogo y la previsualización Open Graph de MODX", () => {
    const head = (CatalogRoute.options as any).head({
      params: { slug: "modx" },
      loaderData: { store: mockModxStore },
      search: {},
    });

    const ogTitle = head.meta.find((m: any) => m.property === "og:title")?.content;
    const ogImage = head.meta.find((m: any) => m.property === "og:image")?.content;

    expect(ogTitle).toBe("MODX · Urban & Streetwear · Catálogo Digital");
    expect(ogImage).toBe("https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1400&h=500&q=85");
  });

  it("debe configurar el Bio-Link activado con los enlaces directos a WhatsApp y Facebook", () => {
    const head = (BioRoute.options as any).head({
      params: { slug: "modx" },
      loaderData: { store: mockModxStore },
    });

    const ogTitle = head.meta.find((m: any) => m.property === "og:title")?.content;
    expect(ogTitle).toBe("MODX · Urban & Streetwear · Enlaces & Contacto");
    expect(mockModxStore.bioLinksEnabled).toBe(true);
    expect(mockModxStore.quickLinks.some((l) => l.url.includes("facebook.com/dizicatalogos"))).toBe(true);
  });
});
