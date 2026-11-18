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

import {
  RUBROS,
  DEFAULT_PRODUCT_NAME_EXAMPLE,
  getRubroDefaults,
  getNicheLabel,
  getProductNameExample,
} from "@/lib/rubros";
import { getDefaultTagline } from "@/lib/brand-cover";
import {
  slugifyStoreName,
  sanitizeSlugInput,
  extractSignupUtmFromSearch,
  sanitizeSignupUtm,
} from "@/lib/slug";
import { logFunnelStep, getOrCreateFunnelSessionId } from "@/lib/signup-funnel";
import { useApp, isMissingOriginColumnError } from "@/lib/store";
import {
  F49_COMPLETA_TU_TIENDA_CUTOFF,
  isStoreEligibleForCompletaTuTienda,
  getCompletaTuTiendaTasks,
} from "@/components/admin/CompletaTuTienda";
import type { Store } from "@/lib/types";

describe("F49 · Registro simple: lógica pura y persistencia", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRpc.mockResolvedValue({ data: null, error: null });
    mockInsert.mockResolvedValue({ error: null });
    mockEq.mockResolvedValue({ error: null });
    mockUpdate.mockReturnValue({ eq: mockEq });
  });

  it("E2 · slugifyStoreName convierte 'Florería María' en 'floreria-maria' y limita a 40 chars", () => {
    expect(slugifyStoreName("Florería María")).toBe("floreria-maria");
    expect(slugifyStoreName("  Café & Postres Ñandú!  ")).toBe("cafe-postres-nandu");
    const longSlug = slugifyStoreName("Tienda Muy Larga Con Muchos Caracteres Especiales Para Probar Limite");
    expect(longSlug.length).toBeLessThanOrEqual(40);
    expect(longSlug.endsWith("-")).toBe(false);
    expect(sanitizeSlugInput("Mi Tienda_123!")).toBe("mi-tienda123");
  });

  it("E4 y E5 · extractSignupUtmFromSearch lee ?origen=/utm_source= e ignora ?ref=", () => {
    expect(extractSignupUtmFromSearch("?origen=tiktok-video1")).toBe("tiktok-video1");
    expect(extractSignupUtmFromSearch("?utm_source=IG_Reels_02")).toBe("ig-reels-02");
    expect(extractSignupUtmFromSearch("?ref=codigo-referido")).toBeNull();
    expect(extractSignupUtmFromSearch("?ref=codigo123&origen=tiktok-video1")).toBe("tiktok-video1");
    expect(sanitizeSignupUtm("!!!")).toBeNull();
  });

  it("E7 · RUBROS define los 12 rubros con diseño y primera paleta sugerida según decisión de Jack", () => {
    expect(RUBROS).toHaveLength(12);

    const floreria = getRubroDefaults("floreria");
    expect(floreria.model).toBe("bloom_general");
    expect(floreria.preset.id).toBe("menta");
    expect(floreria.photoFormat).toBe("square");

    const comida = getRubroDefaults("comida");
    expect(comida.model).toBe("bite");
    expect(comida.preset.id).toBe("calido");

    const ropa = getRubroDefaults("ropa");
    expect(ropa.model).toBe("vitrina");
    expect(ropa.preset.id).toBe("claro");
    expect(ropa.photoFormat).toBe("portrait");

    const tech = getRubroDefaults("tech");
    expect(tech.model).toBe("grid");
    expect(tech.preset.id).toBe("nocturno");

    for (const id of ["calzado", "bisuteria", "belleza", "hogar", "pasteleria", "regalos", "servicios", "general"]) {
      const def = getRubroDefaults(id);
      expect(def.model).toBe("grid");
      expect(def.preset.id).toBe("claro");
    }
  });

  it("Eslogan de Belleza en brand-cover es de venta y no de citas", () => {
    const bellezaTagline = getDefaultTagline("belleza");
    expect(bellezaTagline.toLowerCase()).not.toContain("cita");
    expect(bellezaTagline.length).toBeGreaterThan(5);
  });

  it("E12 · getNicheLabel resuelve los 12 rubros nuevos y los valores históricos", () => {
    expect(getNicheLabel("floreria")).toBe("Florería");
    expect(getNicheLabel("pasteleria")).toBe("Postres y pastelería");
    expect(getNicheLabel("hamburgueseria")).toBe("Hamburguesería");
    expect(getNicheLabel("cosmetica")).toBe("Cosmética");
    expect(getNicheLabel("tecnologia")).toBe("Tecnología");
    expect(getNicheLabel("accesorios")).toBe("Accesorios");
  });

  it("E11 · logFunnelStep envía session_id, step y source sin datos personales y no bloquea si falla", async () => {
    const storageMap = new Map<string, string>();
    vi.stubGlobal("window", {
      sessionStorage: {
        getItem: (k: string) => storageMap.get(k) ?? null,
        setItem: (k: string, v: string) => storageMap.set(k, v),
      },
    });

    const sid = getOrCreateFunnelSessionId();
    expect(sid.length).toBeGreaterThanOrEqual(8);
    expect(sid.length).toBeLessThanOrEqual(64);

    const ok = await logFunnelStep("vio_registro", "tiktok-video1");
    expect(ok).toBe(true);
    expect(mockInsert).toHaveBeenCalledWith({
      session_id: sid,
      step: "vio_registro",
      source: "tiktok-video1",
    });

    const payload = mockInsert.mock.calls[0][0];
    expect(Object.keys(payload).sort()).toEqual(["session_id", "source", "step"]);

    mockInsert.mockResolvedValueOnce({ error: { message: "network down" } });
    const failedGracefully = await logFunnelStep("completo_negocio");
    expect(failedGracefully).toBe(false);
    vi.unstubAllGlobals();
  });

  it("RNF-49.5 · addStore reintenta sin signup_source ni signup_utm cuando las columnas aún no existen", async () => {
    expect(isMissingOriginColumnError({ code: "PGRST204", message: "Could not find the 'signup_source' column of 'stores'" })).toBe(true);
    expect(isMissingOriginColumnError({ code: "42703", message: 'column "signup_utm" does not exist' })).toBe(true);

    mockEq
      .mockResolvedValueOnce({
        error: { code: "PGRST204", message: "Could not find the 'signup_source' column of 'stores' in the schema cache" },
      })
      .mockResolvedValueOnce({ error: null });

    useApp.setState({ stores: [], currentStoreId: null });

    await useApp.getState().addStore({
      id: "s_retry_f49",
      slug: "floreria-retry",
      name: "Florería Retry",
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
      referredBy: "ref-abc",
      signupSource: "tiktok",
      signupUtm: "tiktok-video1",
      categories: [{ id: "cat-1", name: "Principal" }],
      products: [],
    });

    expect(mockUpdate).toHaveBeenCalledTimes(2);
    const firstPayload = mockUpdate.mock.calls[0][0];
    expect(firstPayload.signup_source).toBe("tiktok");
    expect(firstPayload.signup_utm).toBe("tiktok-video1");
    expect(firstPayload.referred_by).toBe("ref-abc");
    expect(firstPayload.onboarding_completed).toBe(true);

    const retryPayload = mockUpdate.mock.calls[1][0];
    expect(retryPayload.signup_source).toBeUndefined();
    expect(retryPayload.signup_utm).toBeUndefined();
    expect(retryPayload.niche).toBe("floreria");
    expect(retryPayload.referred_by).toBe("ref-abc");
    expect(retryPayload.onboarding_completed).toBe(true);
  });

  it("E8 y E9 · CompletaTuTienda solo aplica post-corte y calcula el estado real de las 5 tareas", () => {
    const oldStore: Store = {
      id: "s_old",
      slug: "tienda-vieja",
      name: "Tienda Vieja",
      phone: "51999888777",
      countryCode: "51",
      countryIso: "PE",
      plan: "semilla",
      active: true,
      createdAt: "2026-11-17T19:00:19.000Z",
      whatsappClicks: 0,
      categories: [],
      products: [],
    };
    expect(isStoreEligibleForCompletaTuTienda(oldStore)).toBe(false);

    const afterCutoff = new Date(new Date(F49_COMPLETA_TU_TIENDA_CUTOFF).getTime() + 60_000).toISOString();
    const newStore: Store = {
      ...oldStore,
      id: "s_new",
      slug: "floreria-nueva",
      niche: "floreria",
      model: "bloom_general",
      createdAt: afterCutoff,
    };
    expect(isStoreEligibleForCompletaTuTienda(newStore)).toBe(true);

    const initialTasks = getCompletaTuTiendaTasks(newStore, false);
    expect(initialTasks).toHaveLength(5);
    expect(initialTasks.filter((t) => t.done)).toHaveLength(0);

    const partialStore: Store = {
      ...newStore,
      logo: "https://cdn.example/logo.webp",
      bannerTagline: "Flores frescas",
      bioLinksEnabled: true,
      products: [
        { id: "p1", name: "Ramo 1", price: 50, categoryId: "c1", image: "x", visible: true },
        { id: "p2", name: "Ejemplo", price: 10, categoryId: "c1", image: "x", visible: true, isSample: true },
      ],
    };
    const partialTasks = getCompletaTuTiendaTasks(partialStore, true);
    expect(partialTasks.filter((t) => t.done)).toHaveLength(4);
    expect(partialTasks.find((t) => t.id === "productos")?.done).toBe(false);
    expect(partialTasks.find((t) => t.id === "productos")?.detail).toBe("1/3");
  });

  it("Ejemplo de nombre en primer producto: cada rubro define ejemploProducto; tiendas existentes y Otro conservan el de siempre", () => {
    for (const rubro of RUBROS) {
      expect(rubro.ejemploProducto.startsWith("Ej. ")).toBe(true);
    }
    expect(getProductNameExample("floreria", true)).toBe("Ej. Ramo de 12 rosas rojas");
    expect(getProductNameExample("comida", true)).toBe("Ej. Combo hamburguesa clásica + papas");
    expect(getProductNameExample("general", true)).toBe(DEFAULT_PRODUCT_NAME_EXAMPLE);
    expect(getProductNameExample("floreria", false)).toBe(DEFAULT_PRODUCT_NAME_EXAMPLE);
    expect(getProductNameExample("hamburgueseria", true)).toBe(DEFAULT_PRODUCT_NAME_EXAMPLE);
  });
});
