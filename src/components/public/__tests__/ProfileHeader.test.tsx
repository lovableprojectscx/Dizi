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
import { ProfileHeader } from "../ProfileHeader";
import { PublicCatalog } from "../PublicCatalog";
import { Store } from "@/lib/types";

const BASE_STORE: Store = {
  id: "store-test-f50",
  slug: "tienda-prueba",
  name: "Boutique Aurora",
  phone: "51987654321",
  countryCode: "51",
  countryIso: "PE",
  logo: "https://example.com/logo.png",
  brandColor: "#e11d48",
  plan: "pro",
  active: true,
  createdAt: "2026-01-01T00:00:00Z",
  whatsappClicks: 0,
  categories: [],
  products: [],
  bannerImage: "https://example.com/banner.png",
  bannerTitle: "HASTA 50% DSCTO",
  bannerTagline: "Moda urbana contemporánea",
  locationAddress: "Av. Conquistadores 410, San Isidro",
  headerBadges: ["Delivery Lima y provincias", "Recojo en tienda gratis", "Yape · Plin · Tarjetas"],
};

describe("F50 - Encabezado 'Perfil' para el catálogo", () => {
  describe("Regla de Oro: compatibilidad hacia atrás y tiendas existentes", () => {
    it("E1: Una tienda existente sin headerStyle (o null/undefined) NO muestra el encabezado Perfil", () => {
      const storeWithoutF50: Store = {
        ...BASE_STORE,
        headerStyle: undefined,
        header_style: undefined,
      };

      const html = renderToStaticMarkup(
        <PublicCatalog
          store={storeWithoutF50}
          mode="catalog"
          isMockup={true}
        />
      );

      // El encabezado Perfil no debe existir en el HTML
      expect(html).not.toContain('data-testid="profile-header"');
    });

    it("E2: Una tienda con headerStyle 'standard' explícito NO muestra el encabezado Perfil", () => {
      const storeStandard: Store = {
        ...BASE_STORE,
        headerStyle: "standard",
      };

      const html = renderToStaticMarkup(
        <PublicCatalog
          store={storeStandard}
          mode="catalog"
          isMockup={true}
        />
      );

      expect(html).not.toContain('data-testid="profile-header"');
    });

    it("E3: El encabezado Perfil SOLO aparece cuando la tienda activa headerStyle 'profile'", () => {
      const storeProfile: Store = {
        ...BASE_STORE,
        headerStyle: "profile",
      };

      const html = renderToStaticMarkup(
        <PublicCatalog
          store={storeProfile}
          mode="catalog"
          isMockup={true}
        />
      );

      // Debe aparecer el componente ProfileHeader
      expect(html).toContain('data-testid="profile-header"');
      // Y no debe haber duplicación de PortadaEstandar ni BrandCover
      expect(html).not.toContain('data-testid="portada-estandar"');
      expect(html).not.toContain('data-testid="brand-cover"');
    });

    it("E4: Soporta compatibilidad con header_style (snake_case) directo de base de datos", () => {
      const storeSnake: any = {
        ...BASE_STORE,
        headerStyle: undefined,
        header_style: "profile",
      };

      const html = renderToStaticMarkup(
        <PublicCatalog
          store={storeSnake}
          mode="catalog"
          isMockup={true}
        />
      );

      expect(html).toContain('data-testid="profile-header"');
    });
  });

  describe("Estructura visual del ProfileHeader (3 casos y requisitos)", () => {
    it("Caso 1: Banner con texto grande (safe-area evita que el logo tape el texto)", () => {
      const html = renderToStaticMarkup(
        <ProfileHeader
          store={BASE_STORE}
          activeBanners={["https://example.com/banner.png"]}
          supportClick={() => {}}
        />
      );

      expect(html).toContain('data-testid="profile-banner-text"');
      expect(html).toContain("HASTA 50% DSCTO");
      expect(html).toContain("Moda urbana contemporánea");
      // La clase garantiza el safe-area para no ser tapado por el logo a la izquierda
      expect(html).toContain("pl-24");

      // El logo está montado en su contenedor
      expect(html).toContain('data-testid="profile-logo"');
    });

    it("Caso 2: Banner con foto (muestra la imagen sin texto superpuesto si no se define)", () => {
      const storePhotoOnly: Store = {
        ...BASE_STORE,
        bannerTitle: undefined,
        bannerTagline: undefined,
      };

      const html = renderToStaticMarkup(
        <ProfileHeader
          store={storePhotoOnly}
          activeBanners={["https://example.com/foto-moda.jpg"]}
          supportClick={() => {}}
        />
      );

      expect(html).toContain('foto-moda.jpg');
      expect(html).not.toContain('data-testid="profile-banner-text"');
    });

    it("Caso 3: Sin banner (solo color de marca con gradiente y destello)", () => {
      const storeNoBanner: Store = {
        ...BASE_STORE,
        bannerImage: null,
      };

      const html = renderToStaticMarkup(
        <ProfileHeader
          store={storeNoBanner}
          activeBanners={[]}
          supportClick={() => {}}
        />
      );

      expect(html).toContain('data-testid="profile-banner-brand-color"');
      // Utiliza el color de marca configurado
      expect(html).toContain(BASE_STORE.brandColor);
    });

    it("Etiquetas (Badges): Si no hay datos, no se inventan ni muestran campos vacíos", () => {
      const storeSinDatosParaBadges: Store = {
        ...BASE_STORE,
        locationAddress: null,
        headerBadges: null,
      };

      const html = renderToStaticMarkup(
        <ProfileHeader
          store={storeSinDatosParaBadges}
          activeBanners={["https://example.com/banner.png"]}
          supportClick={() => {}}
        />
      );

      // No debe renderizar el bloque de badges si no hay datos reales
      expect(html).not.toContain('data-testid="profile-badges"');
    });

    it("Etiquetas (Badges): Muestra dirección y badges cuando existen datos", () => {
      const html = renderToStaticMarkup(
        <ProfileHeader
          store={BASE_STORE}
          activeBanners={["https://example.com/banner.png"]}
          supportClick={() => {}}
        />
      );

      expect(html).toContain('data-testid="profile-badges"');
      expect(html).toContain("Av. Conquistadores 410, San Isidro");
      expect(html).toContain("Delivery Lima y provincias");
      expect(html).toContain("Recojo en tienda gratis");
      expect(html).toContain("Yape · Plin · Tarjetas");
    });
  });
});
