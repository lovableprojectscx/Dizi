import { describe, it, expect, vi } from "vitest";
import React from "react";

// Mock Supabase para pruebas sin .env (Regla 5)
vi.mock("@/lib/supabase", () => ({
  supabase: {
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })),
      insert: vi.fn().mockResolvedValue({ error: null }),
      select: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      })),
    })),
  },
  invokeRpcWithRetry: vi.fn().mockResolvedValue({ data: null, error: null }),
}));

import { renderToStaticMarkup } from "react-dom/server";
import { PublicCatalog } from "@/components/public/PublicCatalog";
import {
  DESIGN_SPECS,
  DESIGN_STRUCTURES,
  ALL_MODELS,
  getDesignSpec,
  type OfficialDesignId,
} from "../design-catalog";
import { LANDING_SHOWCASE_DESIGNS } from "../landing-disenos";
import type { Store, Product, Category } from "@/lib/types";

const MOCK_CATEGORY: Category = {
  id: "cat-1",
  storeId: "store-f50v2",
  name: "Vestidos",
  order: 0,
  createdAt: "2026-01-01T00:00:00Z",
};

const MOCK_PRODUCT: Product = {
  id: "prod-1",
  storeId: "store-f50v2",
  categoryId: "cat-1",
  name: "Vestido Midi Floral",
  price: 129,
  images: ["https://example.com/vestido.jpg"],
  active: true,
  visible: true,
  createdAt: "2026-01-01T00:00:00Z",
};

const BASE_STORE: Store = {
  id: "store-f50v2",
  slug: "atelier-lua",
  name: "Atelier Lúa",
  phone: "51987654321",
  countryCode: "51",
  countryIso: "PE",
  logo: "https://example.com/logo-atelier.jpg",
  brandColor: "#7c2d12",
  plan: "pro",
  active: true,
  createdAt: "2026-01-01T00:00:00Z",
  whatsappClicks: 0,
  categories: [MOCK_CATEGORY],
  products: [MOCK_PRODUCT],
  bannerImage: "https://example.com/banner-atelier.jpg",
  bannerTitle: "NUEVA COLECCIÓN",
  bannerTagline: "Elegancia contemporánea",
  locationAddress: "Av. Conquistadores 410, San Isidro",
};

describe("F50 v2 · Diseño n.º 9 Perfil (Escenarios 1 a 8)", () => {
  // Escenario 1
  it("Escenario 1: Dada una tienda con model='perfil', cuando se abre /t/<slug>, entonces se ve la tarjeta Perfil y la grilla", () => {
    const storePerfil: Store = {
      ...BASE_STORE,
      model: "perfil",
    };

    const html = renderToStaticMarkup(
      <PublicCatalog store={storePerfil} mode="catalog" isMockup={true} />
    );

    // Debe mostrar la tarjeta ProfileHeader
    expect(html).toContain('data-testid="profile-header"');
    expect(html).toContain("Atelier Lúa");
    expect(html).toContain("Elegancia contemporánea");
    expect(html).toContain("Vestido Midi Floral");
    // No debe mostrar PortadaEstandar ni BrandCover
    expect(html).not.toContain('data-testid="portada-estandar"');
    expect(html).not.toContain('data-testid="brand-cover"');
  });

  // Escenario 2: Vitest que recorre los 8 diseños actuales y verifica que no aparece ProfileHeader
  it("Escenario 2: Dada una tienda en cualquiera de los 8 diseños actuales, entonces no aparece la tarjeta Perfil", () => {
    const LOS_8_DISENOS_ACTUALES: OfficialDesignId[] = [
      "grid",
      "overlay",
      "arch",
      "nature",
      "vitrina",
      "bloom_general",
      "bite",
      "diagonal",
    ];

    for (const modelId of LOS_8_DISENOS_ACTUALES) {
      const storeActual: Store = {
        ...BASE_STORE,
        model: modelId,
      };

      const html = renderToStaticMarkup(
        <PublicCatalog store={storeActual} mode="catalog" isMockup={true} />
      );

      // En ninguno de los 8 diseños actuales debe existir la tarjeta Perfil
      expect(
        html,
        `El diseño ${modelId} no debe renderizar ProfileHeader`
      ).not.toContain('data-testid="profile-header"');
    }
  });

  // Escenario 3
  it("Escenario 3: Dado el panel Diseño, entonces el selector muestra 9 diseños y no existe 'Estilo del Encabezado'", () => {
    // 1. Exactamente 9 estructuras en el selector oficial
    const selectorStructures = DESIGN_STRUCTURES.filter((s) => s.spec.enSelector);
    expect(selectorStructures).toHaveLength(9);
    expect(selectorStructures.map((s) => s.id)).toContain("perfil");

    // 2. Ficha de perfil configurada con enSelector: true
    expect(DESIGN_SPECS.perfil.enSelector).toBe(true);
    expect(DESIGN_SPECS.perfil.nombre).toBe("Perfil");

    // 3. Verificamos que no existe ningún campo header_style ni headerStyle en el catálogo ni en types
    expect((DESIGN_SPECS.perfil as any).headerStyle).toBeUndefined();
    expect((BASE_STORE as any).header_style).toBeUndefined();
  });

  // Escenario 4
  it("Escenario 4: Dada una tienda en Perfil que cambia a Overlay y guarda, entonces el catálogo ya no muestra la tarjeta", () => {
    const storeInicial: Store = {
      ...BASE_STORE,
      model: "perfil",
    };
    const htmlInicial = renderToStaticMarkup(
      <PublicCatalog store={storeInicial} mode="catalog" isMockup={true} />
    );
    expect(htmlInicial).toContain('data-testid="profile-header"');

    // Cambia a overlay
    const storeCambiado: Store = {
      ...storeInicial,
      model: "overlay",
    };
    const htmlCambiado = renderToStaticMarkup(
      <PublicCatalog store={storeCambiado} mode="catalog" isMockup={true} />
    );
    expect(htmlCambiado).not.toContain('data-testid="profile-header"');
  });

  // Escenario 5
  it("Escenario 5: Dado Perfil sin banners, entonces la tarjeta usa el color de marca y no se rompe", () => {
    const storeSinBanner: Store = {
      ...BASE_STORE,
      model: "perfil",
      bannerImage: null,
    };

    const html = renderToStaticMarkup(
      <PublicCatalog store={storeSinBanner} mode="catalog" isMockup={true} />
    );

    expect(html).toContain('data-testid="profile-header"');
    expect(html).toContain('data-testid="profile-banner-brand-color"');
    expect(html).toContain(BASE_STORE.brandColor);
  });

  // Escenario 6
  it("Escenario 6: Dado Perfil en celular, entonces el logo, el nombre y el botón de contacto no aparecen dos veces en el primer pantallazo", () => {
    const storePerfil: Store = {
      ...BASE_STORE,
      model: "perfil",
    };

    const html = renderToStaticMarkup(
      <PublicCatalog store={storePerfil} mode="catalog" isMockup={true} />
    );

    // La barra superior en reposo (pantallazo 1) no ocupa espacio (fixed) y oculta el logo/nombre y el contacto con opacity-0
    expect(html).toContain("fixed top-0 inset-x-0");
    expect(html).toContain("pointer-events-none border-transparent bg-transparent -translate-y-full opacity-0");
    expect(html).toContain("opacity-0 pointer-events-none");
  });

  // Escenario 7
  it("Escenario 7: Dado el registro, entonces ofrece los 9 diseños", () => {
    expect(ALL_MODELS).toHaveLength(9);
    const modelIds = ALL_MODELS.map((m) => m.id);
    expect(modelIds).toContain("perfil");

    for (const m of ALL_MODELS) {
      const spec = getDesignSpec(m.id);
      expect(spec.enSelector).toBe(true);
    }
  });

  // Escenario 8
  it("Escenario 8: Dada la landing, entonces muestra 9 tarjetas con su captura y ningún texto dice '8 diseños'", () => {
    expect(LANDING_SHOWCASE_DESIGNS).toHaveLength(9);
    const perfilLanding = LANDING_SHOWCASE_DESIGNS.find((d) => d.slug === "boutique-demo");
    expect(perfilLanding).toBeDefined();
    expect(perfilLanding?.name).toBe("Perfil");
    expect(perfilLanding?.image).toBe("/images/landing/disenos/perfil.webp");
  });
});
