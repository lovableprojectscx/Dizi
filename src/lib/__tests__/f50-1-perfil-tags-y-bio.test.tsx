import { describe, it, expect, vi } from "vitest";
import React from "react";

// Mock Supabase para pruebas sin .env
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

// Mock liviano de Link para renderizar bioLinksEnabled=true sin montar RouterProvider completo
vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    params,
    children,
    ...rest
  }: {
    to?: string;
    params?: Record<string, string>;
    children?: React.ReactNode;
    [key: string]: unknown;
  }) => {
    const slug = params?.slug || "";
    const href = to === "/bio/$slug" ? `/bio/${slug}` : to || "#";
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  },
}));

import { renderToStaticMarkup } from "react-dom/server";
import { ProfileHeader } from "@/components/public/ProfileHeader";
import { PublicCatalog } from "@/components/public/PublicCatalog";
import { DESIGN_SPECS, type OfficialDesignId } from "../design-catalog";
import type { Category, Product, Store } from "@/lib/types";

const MOCK_CATEGORY: Category = {
  id: "cat-f501",
  storeId: "store-f501",
  name: "Importados",
  order: 0,
  createdAt: "2026-01-01T00:00:00Z",
};

const MOCK_PRODUCT: Product = {
  id: "prod-f501",
  storeId: "store-f501",
  categoryId: "cat-f501",
  name: "Cartera Crossbody",
  price: 189,
  images: ["https://example.com/cartera.jpg"],
  active: true,
  visible: true,
  createdAt: "2026-01-01T00:00:00Z",
};

const BASE_PERFIL_STORE: Store = {
  id: "store-f501",
  slug: "keyla-import",
  name: "KEYLA IMPORT",
  phone: "51987654321",
  countryCode: "51",
  countryIso: "PE",
  logo: "https://example.com/logo-keyla.webp",
  brandColor: "#ec4899",
  plan: "pro",
  active: true,
  createdAt: "2026-01-01T00:00:00Z",
  whatsappClicks: 0,
  categories: [MOCK_CATEGORY],
  products: [MOCK_PRODUCT],
  model: "perfil",
  bannerImage: "https://example.com/banner-keyla.webp",
  bannerTagline: "Elige tus productos y haz tu pedido por WhatsApp.",
};

describe("F50.1 · Evolución nativa de Perfil (tags, redes e integración Link en Bio)", () => {
  it("Escenario 9: Dada Perfil con profileTags, locationAddress y quickLinks, renderiza tags elegidos, dirección e íconos redondos debajo", () => {
    const storeConExtras: Store = {
      ...BASE_PERFIL_STORE,
      locationAddress: "Galería Bauzate - Tienda 242 - Gamarra",
      profileTags: [
        { id: "delivery" },
        { id: "recojo" },
        { id: "plin" },
        { id: "horario", value: "Lun-Sáb 9am-7pm" },
      ],
      quickLinks: [
        { label: "TikTok", url: "https://tiktok.com/@keylaimport" },
        { label: "Instagram", url: "https://instagram.com/keylaimport" },
      ],
    };

    const html = renderToStaticMarkup(
      <ProfileHeader
        store={storeConExtras}
        activeBanners={["https://example.com/banner-keyla.webp"]}
        supportClick={() => {}}
      />
    );

    expect(html).toContain('data-testid="profile-badges"');
    expect(html).toContain('data-testid="profile-tag-delivery"');
    expect(html).toContain("Delivery");
    expect(html).toContain('data-testid="profile-tag-recojo"');
    expect(html).toContain("Recojo en tienda");
    expect(html).toContain('data-testid="profile-tag-plin"');
    expect(html).toContain("Plin");
    expect(html).toContain('data-testid="profile-tag-horario"');
    expect(html).toContain("Lun-Sáb 9am-7pm");
    expect(html).toContain("Galería Bauzate - Tienda 242 - Gamarra");

    // Fila de redes debajo de los tags usando branding compartido
    expect(html).toContain('data-testid="profile-social-links"');
    expect(html).toContain('data-testid="profile-social-tiktok"');
    expect(html).toContain("https://tiktok.com/@keylaimport");
    expect(html).toContain('data-testid="profile-social-instagram"');
    expect(html).toContain("https://instagram.com/keylaimport");

    // No debe aparecer un preset que la tienda no marcó
    expect(html).not.toContain('data-testid="profile-tag-yape"');
    expect(html).not.toContain('data-testid="profile-tag-tarjeta"');
  });

  it("Escenario 10: Dada Perfil con bioLinksEnabled=true, muestra botón Info en tarjeta y barra flotante con WhatsApp + Info sin tapar WhatsApp", () => {
    const storeConBio: Store = {
      ...BASE_PERFIL_STORE,
      bioLinksEnabled: true,
    };

    const html = renderToStaticMarkup(
      <PublicCatalog store={storeConBio} mode="catalog" isMockup={true} />
    );

    // En la tarjeta Perfil debe existir Pedir por WhatsApp + botón Info hacia /bio/:slug
    expect(html).toContain("Pedir por WhatsApp");
    expect(html).toContain('data-testid="profile-info-button"');
    expect(html).toContain('data-testid="profile-info-mobile-button"');
    expect(html).toContain('href="/bio/keyla-import"');

    // En la barra superior de Perfil con bioLinksEnabled=true debe mantener WhatsApp junto a Info
    expect(html).toContain('data-testid="catalog-header-whatsapp"');
    expect(html).toContain('data-testid="catalog-header-info"');
  });

  it("Escenario 11: Dada Perfil en carga inicial, la barra superior permanece fija oculta sin ocupar espacio antes de salir del viewport", () => {
    const storeConPromo: Store = {
      ...BASE_PERFIL_STORE,
      promoBarEnabled: true,
      promoBarText: "Información +51 963 284 389",
      bioLinksEnabled: true,
    };

    const html = renderToStaticMarkup(
      <PublicCatalog store={storeConPromo} mode="catalog" isMockup={true} />
    );

    expect(html).toContain('data-testid="profile-header"');
    expect(html).toContain("fixed top-0 inset-x-0");
    expect(html).toContain("-translate-y-full opacity-0");
    expect(html).toContain("Información +51 963 284 389");
  });

  it("Escenario 12: Dada Perfil sin tags, sin dirección, sin redes y sin Link en Bio, omite filas vacías y botón Info sin inventar datos", () => {
    const storeMinima: Store = {
      ...BASE_PERFIL_STORE,
      locationAddress: null,
      profileTags: [],
      quickLinks: [],
      bioLinksEnabled: false,
    };

    const html = renderToStaticMarkup(
      <PublicCatalog store={storeMinima} mode="catalog" isMockup={true} />
    );

    expect(html).toContain('data-testid="profile-header"');
    expect(html).not.toContain('data-testid="profile-badges"');
    expect(html).not.toContain('data-testid="profile-social-links"');
    expect(html).not.toContain('data-testid="profile-info-button"');
    expect(html).not.toContain('data-testid="profile-info-mobile-button"');
    expect(html).not.toContain('data-testid="catalog-header-info"');
    // Solo botón WhatsApp en barra
    expect(html).toContain('data-testid="catalog-header-whatsapp"');
  });

  it("Escenario 14: Ninguno de los otros 8 diseños oficiales se altera aunque tengan profileTags, quickLinks o bioLinksEnabled", () => {
    const LOS_OTROS_8_DISENOS: OfficialDesignId[] = [
      "grid",
      "overlay",
      "arch",
      "nature",
      "vitrina",
      "bloom_general",
      "bite",
      "diagonal",
    ];

    expect(DESIGN_SPECS).toBeDefined();

    for (const modelId of LOS_OTROS_8_DISENOS) {
      const storeOtroDiseno: Store = {
        ...BASE_PERFIL_STORE,
        model: modelId,
        bioLinksEnabled: true,
        locationAddress: "Av. Larco 123",
        profileTags: [{ id: "delivery" }, { id: "yape" }],
        quickLinks: [{ label: "TikTok", url: "https://tiktok.com/@test" }],
      };

      const html = renderToStaticMarkup(
        <PublicCatalog store={storeOtroDiseno} mode="catalog" isMockup={true} />
      );

      expect(html, `${modelId} no debe mostrar profile-header`).not.toContain('data-testid="profile-header"');
      expect(html, `${modelId} no debe mostrar profile-badges`).not.toContain('data-testid="profile-badges"');
      expect(html, `${modelId} no debe mostrar profile-social-links`).not.toContain('data-testid="profile-social-links"');
      // En los 8 diseños anteriores, con bioLinksEnabled=true el header conserva su único botón Info y no agrega catalog-header-whatsapp
      expect(html, `${modelId} conserva su header original`).not.toContain('data-testid="catalog-header-whatsapp"');
    }
  });
});
