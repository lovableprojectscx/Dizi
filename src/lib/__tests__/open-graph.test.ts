import { describe, it, expect } from "vitest";
import { Route as CatalogRoute } from "@/routes/t.$slug";
import { Route as BioRoute } from "@/routes/bio.$slug";

describe("Pruebas Unitarias de Meta Etiquetas Open Graph para Previsualizaciones de WhatsApp y Redes", () => {
  const mockStore = {
    id: "store_123",
    slug: "rosabella",
    name: "Rosabella Trujillo",
    bannerImage: "https://images.unsplash.com/photo-banner.jpg",
    logo: "https://images.unsplash.com/photo-logo.jpg",
    products: [
      {
        id: "w3b64w96",
        name: "Ramo Dulce Encanto Rosa",
        price: 55,
        image: "https://images.unsplash.com/photo-product.jpg",
        description: "Delicado ramo floral compuesto por gerberas rosadas.",
      },
    ],
  };

  it("debe generar previsualización de Open Graph con el banner de la tienda para la ruta del catálogo", () => {
    const head = (CatalogRoute.options as any).head({
      params: { slug: "rosabella" },
      loaderData: { store: mockStore },
      search: {},
    });

    const ogTitle = head.meta.find((m: any) => m.property === "og:title")?.content;
    const ogImage = head.meta.find((m: any) => m.property === "og:image")?.content;
    const twitterCard = head.meta.find((m: any) => m.name === "twitter:card")?.content;

    expect(ogTitle).toBe("Rosabella Trujillo · Catálogo Digital");
    expect(ogImage).toBe("https://images.unsplash.com/photo-banner.jpg");
    expect(twitterCard).toBe("summary_large_image");
  });

  it("debe generar previsualización de Open Graph con la foto del producto cuando se incluye ?p=PRODUCT_ID", () => {
    const head = (CatalogRoute.options as any).head({
      params: { slug: "rosabella" },
      loaderData: { store: mockStore },
      search: { p: "w3b64w96" },
    });

    const ogTitle = head.meta.find((m: any) => m.property === "og:title")?.content;
    const ogImage = head.meta.find((m: any) => m.property === "og:image")?.content;
    const ogDesc = head.meta.find((m: any) => m.property === "og:description")?.content;

    expect(ogTitle).toContain("Ramo Dulce Encanto Rosa — Rosabella Trujillo | S/ 55.00");
    expect(ogImage).toBe("https://images.unsplash.com/photo-product.jpg");
    expect(ogDesc).toContain("Delicado ramo floral compuesto por gerberas rosadas.");
  });

  it("debe generar la previsualización de la ruta Bio-link con el banner o logo de la tienda", () => {
    const head = (BioRoute.options as any).head({
      params: { slug: "rosabella" },
      loaderData: { store: mockStore },
    });

    const ogTitle = head.meta.find((m: any) => m.property === "og:title")?.content;
    const ogImage = head.meta.find((m: any) => m.property === "og:image")?.content;

    expect(ogTitle).toBe("Rosabella Trujillo · Enlaces & Contacto");
    expect(ogImage).toBe("https://images.unsplash.com/photo-banner.jpg");
  });
});
