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
  id: "store-test-f50v2",
  slug: "atelier-lua",
  name: "Atelier Lúa",
  phone: "51987654321",
  countryCode: "51",
  countryIso: "PE",
  logo: "https://example.com/logo.png",
  brandColor: "#b45309",
  plan: "pro",
  active: true,
  createdAt: "2026-01-01T00:00:00Z",
  whatsappClicks: 0,
  categories: [],
  products: [],
  bannerImage: "https://example.com/banner.png",
  bannerTitle: "NUEVA COLECCIÓN",
  bannerTagline: "Moda femenina y estilo contemporáneo",
  locationAddress: "Av. Conquistadores 410, San Isidro",
};

describe("F50 v2 - Componente ProfileHeader (Diseño Perfil)", () => {
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
      expect(html).toContain("NUEVA COLECCIÓN");
      // Safe-area para no tapar el texto con el logo montado a la izquierda
      expect(html).toContain("pl-24");
      expect(html).toContain('data-testid="profile-logo"');
      // Eslogan único en la tarjeta
      expect(html).toContain("Moda femenina y estilo contemporáneo");
    });

    it("Caso 2: Banner con foto (muestra la imagen sin texto superpuesto si bannerTitle está ausente)", () => {
      const storePhotoOnly: Store = {
        ...BASE_STORE,
        bannerTitle: undefined,
      };

      const html = renderToStaticMarkup(
        <ProfileHeader
          store={storePhotoOnly}
          activeBanners={["https://example.com/foto-moda.jpg"]}
          supportClick={() => {}}
        />
      );

      expect(html).toContain("foto-moda.jpg");
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
      expect(html).toContain(BASE_STORE.brandColor);
    });

    it("Etiquetas (Badges): Muestra exclusivamente la dirección en v1 si existe", () => {
      const html = renderToStaticMarkup(
        <ProfileHeader
          store={BASE_STORE}
          activeBanners={["https://example.com/banner.png"]}
          supportClick={() => {}}
        />
      );

      expect(html).toContain('data-testid="profile-badges"');
      expect(html).toContain("Av. Conquistadores 410, San Isidro");
      expect(html).not.toContain("Delivery");
      expect(html).not.toContain("Yape");
    });

    it("Etiquetas (Badges): Si locationAddress es null, no muestra contenedor de badges", () => {
      const storeSinDireccion: Store = {
        ...BASE_STORE,
        locationAddress: null,
      };

      const html = renderToStaticMarkup(
        <ProfileHeader
          store={storeSinDireccion}
          activeBanners={["https://example.com/banner.png"]}
          supportClick={() => {}}
        />
      );

      expect(html).not.toContain('data-testid="profile-badges"');
    });
  });
});
