import { describe, it, expect, vi } from "vitest";

// Mock leaflet para entorno Node
vi.mock("leaflet", () => ({ default: {} }));
vi.mock("leaflet/dist/leaflet.css", () => ({}));

import { hexLuminance } from "@/lib/utils";
import { getRouter } from "@/router";
import type { Store } from "@/lib/types";

// Lógica pura de mapStoreFromDB probada en aislamiento
const mapStoreFromDB = (row: any): Store => {
  const isDarkVal = row.is_dark ?? (row.bg_color ? hexLuminance(row.bg_color) < 0.35 : false);

  let cleanTextColor = row.text_color ?? null;
  if (cleanTextColor) {
    const lumText = hexLuminance(cleanTextColor);
    if (isDarkVal && lumText < 0.45) {
      cleanTextColor = null;
    } else if (!isDarkVal && lumText > 0.65) {
      cleanTextColor = null;
    }
  }

  let cleanCardBg = row.card_bg ?? null;
  if (cleanCardBg) {
    const lumCard = hexLuminance(cleanCardBg);
    if (isDarkVal && lumCard > 0.65) {
      cleanCardBg = null;
    } else if (!isDarkVal && lumCard < 0.35) {
      cleanCardBg = null;
    }
  }

  const banners =
    Array.isArray(row.banners) && row.banners.length > 0
      ? row.banners
      : typeof row.banner_image === "string" && row.banner_image.includes("|||")
        ? row.banner_image.split("|||").map((b: string) => b.trim()).filter(Boolean)
        : row.banner_image
          ? [row.banner_image]
          : [];

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    phone: row.phone || "",
    countryCode: row.country_code || "51",
    logo: row.logo,
    plan: row.plan,
    model: row.model,
    brandColor: row.brand_color,
    bgColor: row.bg_color,
    textColor: cleanTextColor,
    banners,
    bannerImage: row.banner_image,
    cardBg: cleanCardBg,
    isDark: isDarkVal,
    ownerId: row.owner_id,
    active: row.active,
    createdAt: row.created_at,
    whatsappClicks: row.whatsapp_clicks || 0,
    views: row.views || 0,
    egressBytes: Number(row.egress_bytes || 0),
    products: (row.products || [])
      .map((p: any) => ({
        id: p.id,
        name: p.name,
        price: p.price !== null && p.price !== undefined ? Number(p.price) : null,
        categoryId: p.category_id,
        image: p.image,
        visible: p.visible,
        sortOrder: p.sort_order !== null && p.sort_order !== undefined ? Number(p.sort_order) : 0,
        createdAt: p.created_at,
      }))
      .sort((a: any, b: any) => {
        if ((a.sortOrder ?? 0) !== (b.sortOrder ?? 0)) {
          return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
        }
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      }),
  } as unknown as Store;
};

describe("Parte 6: Arquitectura Global, Store Zustand, Base de Datos y Caché", () => {
  describe("1. Mapeo Seguro de Filas de Base de Datos (mapStoreFromDB)", () => {
    it("sanitiza textos de bajo contraste en modo oscuro o claro", () => {
      const darkRow = {
        id: "s1",
        slug: "dark-store",
        name: "Dark Store",
        plan: "pro",
        bg_color: "#0f172a", // Oscuro
        is_dark: true,
        text_color: "#111111", // Muy oscuro para un fondo negro (debe limpiarse a null)
      };

      const mapped = mapStoreFromDB(darkRow);
      expect(mapped.textColor).toBeNull();
    });

    it("deserializa banners múltiples delimitados con |||", () => {
      const row = {
        id: "s2",
        slug: "banner-store",
        name: "Banner Store",
        plan: "ilimitado",
        banner_image: "https://img1.webp ||| https://img2.webp",
      };

      const mapped = mapStoreFromDB(row);
      expect(mapped.banners).toEqual(["https://img1.webp", "https://img2.webp"]);
    });
  });

  describe("2. Ordenamiento Determinista de Productos", () => {
    it("ordena por sortOrder ascendente y por createdAt descendente como desempate", () => {
      const row = {
        id: "s3",
        slug: "order-store",
        name: "Order Store",
        plan: "pro",
        products: [
          { id: "p1", name: "P1", sort_order: 2, created_at: "2026-01-01T00:00:00Z" },
          { id: "p2", name: "P2 (nuevo)", sort_order: 1, created_at: "2026-01-02T00:00:00Z" },
          { id: "p3", name: "P3 (viejo)", sort_order: 1, created_at: "2026-01-01T00:00:00Z" },
        ],
      };

      const mapped = mapStoreFromDB(row);
      expect(mapped.products.map((p) => p.id)).toEqual(["p2", "p3", "p1"]);
    });
  });

  describe("3. Configuración de Router y Control de Preload", () => {
    it("mantiene el preload global desactivado para evitar sobrecarga del event loop", () => {
      const router = getRouter();
      expect(router.options.defaultPreload).toBe(false);
      expect(router.options.defaultPreloadDelay).toBe(200);
    });
  });
});
