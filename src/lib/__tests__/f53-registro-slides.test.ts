import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockRpc, mockInsert, mockUpdate, mockEq } = vi.hoisted(() => ({
  mockRpc: vi.fn(),
  mockInsert: vi.fn(),
  mockUpdate: vi.fn(),
  mockEq: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    rpc: mockRpc,
    from: vi.fn((table: string) => {
      if (table === "signup_funnel_events") {
        return { insert: mockInsert };
      }
      return {
        update: mockUpdate,
        insert: mockInsert,
        select: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }),
      };
    }),
    storage: { from: () => ({ remove: () => Promise.resolve({ error: null }) }) },
    auth: { getSession: () => Promise.resolve({ data: { session: null } }) },
  },
  uploadBase64ToStorage: vi.fn(),
  invokeRpcWithRetry: vi.fn(async () => ({ data: null, error: null })),
}));

import { CIUDADES, CITY_ID_REGEX, getCityLabel, isValidSignupCity } from "@/lib/ciudades";
import { RUBROS } from "@/lib/rubros";
import {
  PREVIEW_PRODUCTS_BY_RUBRO,
  REGISTER_BRAND_TOKENS,
  buildPreviewStore,
  getContrastRatioHex,
  isPreviewTestMode,
  isProductionRegisterHost,
} from "@/lib/register-preview";
import { logFunnelStep } from "@/lib/signup-funnel";
import { isMissingOriginColumnError, useApp } from "@/lib/store";

describe("F53 · Registro en slides: lógica pura, modo prueba, ciudades y contraste", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRpc.mockResolvedValue({ data: null, error: null });
    mockInsert.mockResolvedValue({ error: null });
    mockEq.mockResolvedValue({ error: null });
    mockUpdate.mockReturnValue({ eq: mockEq });
  });

  it("Modo prueba por dominio: solo dizi.idenza.site, dizicatalogo.com y sus www crean cuentas reales", () => {
    for (const prodHost of [
      "dizi.idenza.site",
      "www.dizi.idenza.site",
      "dizicatalogo.com",
      "www.dizicatalogo.com",
      "DIZI.IDENZA.SITE",
    ]) {
      expect(isProductionRegisterHost(prodHost)).toBe(true);
      expect(isPreviewTestMode(prodHost)).toBe(false);
    }

    for (const nonProdHost of [
      "dizi-git-f53-registro-slides-lovable.vercel.app",
      "dizi-preview.vercel.app",
      "localhost",
      "127.0.0.1",
      "staging.idenza.site",
      "",
    ]) {
      expect(isProductionRegisterHost(nonProdHost)).toBe(false);
      expect(isPreviewTestMode(nonProdHost)).toBe(true);
    }
  });

  it("RF-53.4 · CIUDADES define las 10 ciudades de Perú válidas para stores.signup_city", () => {
    expect(CIUDADES).toHaveLength(10);
    for (const city of CIUDADES) {
      expect(CITY_ID_REGEX.test(city.id)).toBe(true);
      expect(isValidSignupCity(city.id)).toBe(true);
      expect(city.label.length).toBeGreaterThan(2);
    }
    expect(getCityLabel("la-libertad")).toBe("La Libertad");
    expect(isValidSignupCity("bogota")).toBe(false);
  });

  it("E2 y E3 · buildPreviewStore construye la tienda en memoria con productos por rubro sin usar stock externo", () => {
    for (const rubro of RUBROS) {
      const items = PREVIEW_PRODUCTS_BY_RUBRO[rubro.id];
      expect(items).toBeDefined();
      expect(items).toHaveLength(3);
    }

    const floreria = buildPreviewStore({
      storeName: "Florería María",
      niche: "floreria",
      phone: "51987654321",
    });
    expect(floreria.name).toBe("Florería María");
    expect(floreria.slug).toBe("floreria-maria");
    expect(floreria.model).toBe("bloom_general");
    expect(floreria.brandColor).toBe("#0d9488");
    expect(floreria.products[0].image).toContain("s_floreriademo/products/");

    const comida = buildPreviewStore({ storeName: "Sabor Limeño", niche: "comida" });
    expect(comida.model).toBe("bite");
    expect(comida.products[0].image).toContain("s_restaurantedemo/products/");

    const calzado = buildPreviewStore({ storeName: "Pasos Urbanos", niche: "calzado" });
    expect(calzado.products[0].image).toContain("s_zapatillasdemo/products/");

    for (const iconRubro of ["servicios", "pasteleria", "hogar"]) {
      const store = buildPreviewStore({ storeName: "Mi Marca", niche: iconRubro });
      const decoded = decodeURIComponent(store.products[0].image);
      expect(store.products[0].image.startsWith("data:image/svg+xml")).toBe(true);
      expect(decoded).toContain("#FAF7F2");
      expect(decoded).toContain("#312E81");
    }
  });

  it("E10 · logFunnelStep registra los pasos nuevos de F53 sin datos personales", async () => {
    const storageMap = new Map<string, string>();
    vi.stubGlobal("window", {
      sessionStorage: {
        getItem: (k: string) => storageMap.get(k) ?? null,
        setItem: (k: string, v: string) => storageMap.set(k, v),
      },
    });

    for (const step of [
      "vio_registro",
      "completo_nombre",
      "completo_rubro",
      "completo_whatsapp",
      "completo_datos",
      "creo_cuenta",
    ] as const) {
      const ok = await logFunnelStep(step, "tiktok");
      expect(ok).toBe(true);
    }
    expect(mockInsert).toHaveBeenCalledTimes(6);
    vi.unstubAllGlobals();
  });

  it("RF-53.7 · addStore guarda signup_city y reintenta si la columna aún no existe en la BD", async () => {
    expect(
      isMissingOriginColumnError({
        code: "PGRST204",
        message: "Could not find the 'signup_city' column of 'stores'",
      }),
    ).toBe(true);

    mockEq
      .mockResolvedValueOnce({
        error: { code: "PGRST204", message: "Could not find the 'signup_city' column of 'stores'" },
      })
      .mockResolvedValueOnce({ error: null });

    useApp.setState({ stores: [], currentStoreId: null });

    await useApp.getState().addStore({
      id: "s_retry_f53",
      slug: "floreria-f53",
      name: "Florería F53",
      phone: "51987654321",
      countryCode: "51",
      countryIso: "PE",
      plan: "semilla",
      active: true,
      isPublished: true,
      createdAt: new Date().toISOString(),
      whatsappClicks: 0,
      model: "bloom_general",
      niche: "floreria",
      ownerId: "user-1",
      onboardingCompleted: true,
      signupCity: "lima",
      signupSource: "tiktok",
      signupUtm: "tiktok-f53",
      categories: [{ id: "cat-1", name: "Principal" }],
      products: [],
    });

    expect(mockUpdate).toHaveBeenCalledTimes(2);
    expect(mockUpdate.mock.calls[0][0].signup_city).toBe("lima");
    expect(mockUpdate.mock.calls[1][0].signup_city).toBeUndefined();
    expect(mockUpdate.mock.calls[1][0].niche).toBe("floreria");
  });

  it("E12 · Contraste de colores del registro cumple el manual de marca y WCAG AA", () => {
    const { creamBg, indigo, indigoDark, coral, white } = REGISTER_BRAND_TOKENS;

    // Botones sobre coral usan índigo oscuro (#1E1B4B): pasa AA normal >= 4.5:1
    expect(getContrastRatioHex(indigoDark, coral)).toBeGreaterThanOrEqual(4.5);

    // Títulos e interfaz índigo (#312E81) sobre crema (#FAF7F2): pasa AAA >= 7:1
    expect(getContrastRatioHex(indigo, creamBg)).toBeGreaterThanOrEqual(7.0);

    // Banners índigo (#312E81) con texto blanco o crema: pasa AAA >= 7:1
    expect(getContrastRatioHex(white, indigo)).toBeGreaterThanOrEqual(7.0);

    // Blanco sobre coral solo >= 3.0 (texto grande >= 18px negrita) y < 4.5 (prohibido en chico)
    const whiteOnCoral = getContrastRatioHex(white, coral);
    expect(whiteOnCoral).toBeGreaterThanOrEqual(3.0);
    expect(whiteOnCoral).toBeLessThan(4.5);
  });
});
