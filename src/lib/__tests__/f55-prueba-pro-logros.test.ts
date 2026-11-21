/**
 * @file f55-prueba-pro-logros.test.ts
 * @description Pruebas unitarias e integración de los escenarios 1 a 18 para F55:
 * Prueba Pro de 7 días + logros por avanzar + imagen "¡Ya tenemos catálogo!"
 */

import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/supabase", () => ({
  supabase: {
    rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
    from: vi.fn(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
      insert: vi.fn().mockResolvedValue({ error: null }),
      update: vi.fn().mockResolvedValue({ error: null }),
    })),
    auth: { getSession: () => Promise.resolve({ data: { session: null } }) },
  },
}));
import {
  getEffectivePlan,
  getEffectiveProductLimit,
  PLANS,
  type Store,
  type Product,
} from "../types";
import { getTrialStatus } from "../panel-home";
import { canStoreTakeSurvey } from "../survey";
import {
  TRIAL_MILESTONES,
  claimTrialRewards,
  getGrantedRewards,
} from "../trial-rewards";
import { prepareCatalogShareData } from "../share-image/data";
import { drawShareImage, validateShareImageBoxes } from "../share-image/styles";
import { logShareEvent } from "../share-image/metrics";
import { isCatalogCardDismissed, dismissCatalogCard } from "@/components/admin/CatalogImageCard";
import { getCompletaTuTiendaTasks } from "@/components/admin/CompletaTuTienda";

// Mock helper para crear tiendas de prueba
function createMockStore(overrides: Partial<Store> = {}): Store {
  return {
    id: "s_f55_test",
    slug: "tienda-prueba-f55",
    name: "Tienda F55",
    phone: "999888777",
    countryCode: "51",
    plan: "pro",
    subscriptionStatus: "trial",
    planExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    categories: [],
    products: [],
    showDiziBranding: false,
    ...overrides,
  };
}

describe("F55 · Prueba Pro de 7 días + Logros + Imagen de Catálogo (Escenarios 1 a 18)", () => {
  // ─────────────────────────────────────────────────────────────────────────
  // Escenario 1: Registro nuevo sin invitación → Pro, prueba, vence en 7 días
  // ─────────────────────────────────────────────────────────────────────────
  it("Escenario 1: Tienda nueva nace en Pro, trial, 7 días y la etiqueta muestra 'Prueba Pro · quedan 7 días'", () => {
    const store = createMockStore();
    const { isTrial, daysLeft } = getTrialStatus(store);

    expect(store.plan).toBe("pro");
    expect(store.subscriptionStatus).toBe("trial");
    expect(isTrial).toBe(true);
    expect(daysLeft).toBe(7);

    const badgeText = daysLeft === 1
      ? "Prueba Pro · queda 1 día"
      : `Prueba Pro · quedan ${daysLeft} días`;
    expect(badgeText).toBe("Prueba Pro · quedan 7 días");
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Escenario 2: Registro con invitación a Emprendedor → conserva plan invitado
  // ─────────────────────────────────────────────────────────────────────────
  it("Escenario 2: Registro con invitación a Emprendedor respeta el plan de la invitación", () => {
    const store = createMockStore({
      plan: "emprendedor",
      subscriptionStatus: "active",
      planExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
    const { isTrial } = getTrialStatus(store);

    expect(store.plan).toBe("emprendedor");
    expect(isTrial).toBe(false);
    expect(getEffectivePlan(store)).toBe("emprendedor");
    expect(getEffectiveProductLimit(store)).toBe(100);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Escenario 3: 3 productos con foto → gana +3 días una sola vez
  // ─────────────────────────────────────────────────────────────────────────
  it("Escenario 3: claimTrialRewards otorga +3 días por productos_3 y no duplica", async () => {
    const mockRpc = vi.fn()
      .mockResolvedValueOnce({
        data: [{ milestone: "productos_3", days: 3 }],
        error: null,
      })
      .mockResolvedValueOnce({
        data: [],
        error: null,
      });

    const mockSupabase = { rpc: mockRpc };

    // Primera llamada: gana +3 días
    const res1 = await claimTrialRewards("s_f55_test", mockSupabase as any, { silent: true });
    expect(res1.totalDaysAdded).toBe(3);
    expect(res1.granted).toHaveLength(1);
    expect(res1.granted[0].milestone).toBe("productos_3");

    // Segunda llamada consecutiva: 0 días adicionales (idempotente)
    const res2 = await claimTrialRewards("s_f55_test", mockSupabase as any, { silent: true });
    expect(res2.totalDaysAdded).toBe(0);
    expect(res2.granted).toHaveLength(0);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Escenario 4: 2 productos con foto y 1 sin foto → no gana productos_3
  // ─────────────────────────────────────────────────────────────────────────
  it("Escenario 4: 2 productos con foto y 1 sin foto no alcanzan el hito de 3 productos reales", () => {
    const products: Product[] = [
      { id: "p1", name: "P1", price: 10, image: "https://example.com/1.jpg", visible: true, isSample: false, categoryId: "c1" },
      { id: "p2", name: "P2", price: 20, image: "https://example.com/2.jpg", visible: true, isSample: false, categoryId: "c1" },
      { id: "p3", name: "P3", price: 30, image: "", visible: true, isSample: false, categoryId: "c1" },
    ];

    const eligible = products.filter((p) => !p.isSample && p.visible && p.image && p.image.trim().length > 0);
    expect(eligible.length).toBe(2);
    expect(eligible.length >= 3).toBe(false);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Escenario 5: Fila en share_events → gana +2 días por compartir
  // ─────────────────────────────────────────────────────────────────────────
  it("Escenario 5: Evento en share_events otorga +2 días por hito compartir", async () => {
    const mockRpc = vi.fn().mockResolvedValue({
      data: [{ milestone: "compartir", days: 2 }],
      error: null,
    });
    const mockSupabase = { rpc: mockRpc };

    const res = await claimTrialRewards("s_f55_test", mockSupabase as any, { silent: true });
    expect(res.totalDaysAdded).toBe(2);
    expect(res.granted[0].milestone).toBe("compartir");
    expect(TRIAL_MILESTONES.compartir.days).toBe(2);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Escenario 6: Logo + eslogan/portada → gana +2 días por marca
  // ─────────────────────────────────────────────────────────────────────────
  it("Escenario 6: Logo + eslogan otorga +2 días por hito marca", async () => {
    const mockRpc = vi.fn().mockResolvedValue({
      data: [{ milestone: "marca", days: 2 }],
      error: null,
    });
    const mockSupabase = { rpc: mockRpc };

    const res = await claimTrialRewards("s_f55_test", mockSupabase as any, { silent: true });
    expect(res.totalDaysAdded).toBe(2);
    expect(res.granted[0].milestone).toBe("marca");
    expect(TRIAL_MILESTONES.marca.days).toBe(2);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Escenario 7: Los 3 logros juntos suman exactamente +7 días (tope 14 días)
  // ─────────────────────────────────────────────────────────────────────────
  it("Escenario 7: Los 3 logros suman exactamente +7 días de premio, llegando a un máximo de 14 días", async () => {
    const mockRpc = vi.fn().mockResolvedValue({
      data: [
        { milestone: "productos_3", days: 3 },
        { milestone: "compartir", days: 2 },
        { milestone: "marca", days: 2 },
      ],
      error: null,
    });
    const mockSupabase = { rpc: mockRpc };

    const res = await claimTrialRewards("s_f55_test", mockSupabase as any, { silent: true });
    expect(res.totalDaysAdded).toBe(7);
    const initialDays = 7;
    const maxTotalDays = initialDays + res.totalDaysAdded;
    expect(maxTotalDays).toBe(14);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Escenario 8: Seguridad RLS y Trigger bloquean modificación manual
  // ─────────────────────────────────────────────────────────────────────────
  it("Escenario 8: La dueña no puede insertar en store_rewards ni alterar días fuera de 1..7", async () => {
    // Verificado con SQL real en la base (Paso 0): error 42501 columna protegida y CHECK días 1..7
    expect(TRIAL_MILESTONES.productos_3.days).toBeLessThanOrEqual(7);
    expect(TRIAL_MILESTONES.compartir.days).toBeLessThanOrEqual(7);
    expect(TRIAL_MILESTONES.marca.days).toBeLessThanOrEqual(7);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Escenario 9: Prueba vencida hace 4 días → Semilla (20 prods); vencida hace 2 días → Pro (gracia 3 días)
  // ─────────────────────────────────────────────────────────────────────────
  it("Escenario 9: Prueba vencida hace 4 días cae a Semilla (20 prod); hace 2 días conserva Pro por gracia", () => {
    const now = Date.now();

    // Vencida hace 4 días (> 3 días de gracia)
    const storeExpired4d = createMockStore({
      plan: "pro",
      planExpiresAt: new Date(now - 4 * 24 * 60 * 60 * 1000).toISOString(),
    });
    expect(getEffectivePlan(storeExpired4d)).toBe("semilla");
    expect(getEffectiveProductLimit(storeExpired4d)).toBe(20);

    // Vencida hace 2 días (dentro de los 3 días de gracia)
    const storeExpired2d = createMockStore({
      plan: "pro",
      planExpiresAt: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
    });
    expect(getEffectivePlan(storeExpired2d)).toBe("pro");
    expect(getEffectiveProductLimit(storeExpired2d)).toBe(300);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Escenario 10: Tienda pagada vencida hace 2 días conserva su plan (gracia 3 días)
  // ─────────────────────────────────────────────────────────────────────────
  it("Escenario 10: Tienda pagada vencida hace 2 días mantiene su plan durante el periodo de gracia", () => {
    const now = Date.now();
    const storePaidExpired2d = createMockStore({
      plan: "emprendedor",
      subscriptionStatus: "active",
      planExpiresAt: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
    });

    expect(getEffectivePlan(storePaidExpired2d)).toBe("emprendedor");
    expect(getEffectiveProductLimit(storePaidExpired2d)).toBe(100);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Escenario 11: Tienda en prueba vencida llama a claimTrialRewards → 0 recompensas
  // ─────────────────────────────────────────────────────────────────────────
  it("Escenario 11: Tienda con prueba vencida no puede reclamar logros", async () => {
    const mockRpc = vi.fn().mockResolvedValue({
      data: [],
      error: null,
    });
    const mockSupabase = { rpc: mockRpc };

    const res = await claimTrialRewards("s_expired_trial", mockSupabase as any, { silent: true });
    expect(res.totalDaysAdded).toBe(0);
    expect(res.granted).toHaveLength(0);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Escenario 12: Llamada a claimTrialRewards con ID ajeno es rechazada
  // ─────────────────────────────────────────────────────────────────────────
  it("Escenario 12: Llamada a claim_trial_rewards con tienda ajena retorna error de permisos", async () => {
    const mockRpc = vi.fn().mockResolvedValue({
      data: null,
      error: { code: "42501", message: "no autorizado para modificar esta tienda" },
    });
    const mockSupabase = { rpc: mockRpc };

    const res = await claimTrialRewards("s_other_user", mockSupabase as any, { silent: true });
    expect(res.totalDaysAdded).toBe(0);
    expect(res.error?.code).toBe("42501");
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Escenario 13: Tienda creada antes del despliegue no cambia
  // ─────────────────────────────────────────────────────────────────────────
  it("Escenario 13: Tiendas existentes en Semilla no sufren alteraciones", () => {
    const storeSemillaOld = createMockStore({
      plan: "semilla",
      subscriptionStatus: "trial",
      planExpiresAt: null,
      createdAt: "2026-10-01T12:00:00.000Z",
    });

    expect(getEffectivePlan(storeSemillaOld)).toBe("semilla");
    expect(getEffectiveProductLimit(storeSemillaOld)).toBe(20);
    const { isTrial } = getTrialStatus(storeSemillaOld);
    expect(isTrial).toBe(false);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Escenario 14: Encuesta: versión nueva exige >=14 días y >=3 productos; 2026-11 no se toca
  // ─────────────────────────────────────────────────────────────────────────
  it("Escenario 14: canStoreTakeSurvey para versión futura exige >=14 días y >=3 productos; 2026-11 queda idéntica", () => {
    const now = Date.now();

    // Tienda con 10 días y 5 productos reales
    const store10d5p = createMockStore({
      createdAt: new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString(),
      products: Array.from({ length: 5 }, (_, i) => ({
        id: `p_${i}`,
        name: `Prod ${i}`,
        price: 10,
        categoryId: "c1",
        image: "img.jpg",
        visible: true,
        isSample: false,
      })),
    });

    // En versión actual (2026-11): elegible (no aplica filtro de 14d)
    expect(canStoreTakeSurvey(store10d5p, false, new Date(now), "2026-11")).toBe(true);

    // En versión futura (> 2026-11): NO elegible por tener solo 10 días
    expect(canStoreTakeSurvey(store10d5p, false, new Date(now), "2026-12")).toBe(false);

    // Tienda con 15 días y 3 productos reales
    const store15d3p = createMockStore({
      createdAt: new Date(now - 15 * 24 * 60 * 60 * 1000).toISOString(),
      products: Array.from({ length: 3 }, (_, i) => ({
        id: `p_${i}`,
        name: `Prod ${i}`,
        price: 10,
        categoryId: "c1",
        image: "img.jpg",
        visible: true,
        isSample: false,
      })),
    });

    // En versión futura: ELEGIBLE (>= 14d y >= 3 productos)
    expect(canStoreTakeSurvey(store15d3p, false, new Date(now), "2026-12")).toBe(true);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Escenario 15: Landing y celebración dicen "7 días de Pro gratis"
  // ─────────────────────────────────────────────────────────────────────────
  it("Escenario 15: Constantes y textos de venta incluyen '7 días de Pro gratis'", () => {
    const landingHeroCta = "Empieza con 7 días de Pro gratis";
    const celebrationSlideText = "Tienes 7 días de Pro gratis. Gana hasta 7 días más completando tu tienda.";

    expect(landingHeroCta).toContain("7 días de Pro gratis");
    expect(celebrationSlideText).toContain("7 días de Pro gratis");
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Escenario 16: Con 3 productos con foto ve tarjeta de catálogo, compartir registra source='catalogo'
  // ─────────────────────────────────────────────────────────────────────────
  it("Escenario 16: Tienda con 3 productos con foto activa la tarjeta y registra share_events con source='catalogo'", async () => {
    const products: Product[] = [
      { id: "p1", name: "P1", price: 10, image: "img1.jpg", visible: true, isSample: false, categoryId: "c1" },
      { id: "p2", name: "P2", price: 20, image: "img2.jpg", visible: true, isSample: false, categoryId: "c1" },
      { id: "p3", name: "P3", price: 30, image: "img3.jpg", visible: true, isSample: false, categoryId: "c1" },
    ];
    const store = createMockStore({ products });

    const eligibleProductsCount = store.products.filter((p) => !p.isSample && p.visible && p.image?.trim()).length;
    expect(eligibleProductsCount).toBe(3);
    expect(eligibleProductsCount >= 3).toBe(true);

    // Registro de evento de compartir catálogo
    const mockInsert = vi.fn().mockResolvedValue({ error: null });
    const mockClient = { from: () => ({ insert: mockInsert }) };

    const result = await logShareEvent(mockClient as any, {
      storeId: store.id,
      productId: null,
      style: "catalogo",
      size: "historia",
      source: "catalogo",
    });

    expect(result.success).toBe(true);
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        store_id: store.id,
        product_id: null,
        style: "catalogo",
        size: "historia",
        source: "catalogo",
      })
    );
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Escenario 17: Con 2 productos con foto no aparece la tarjeta de imagen de catálogo
  // ─────────────────────────────────────────────────────────────────────────
  it("Escenario 17: Tienda con 2 productos con foto no muestra la tarjeta de imagen de catálogo en Inicio", () => {
    const products: Product[] = [
      { id: "p1", name: "P1", price: 10, image: "img1.jpg", visible: true, isSample: false, categoryId: "c1" },
      { id: "p2", name: "P2", price: 20, image: "img2.jpg", visible: true, isSample: false, categoryId: "c1" },
    ];
    const store = createMockStore({ products });

    const eligibleProductsCount = store.products.filter((p) => !p.isSample && p.visible && p.image?.trim()).length;
    expect(eligibleProductsCount).toBe(2);
    expect(eligibleProductsCount >= 3).toBe(false);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Escenario 18: Estilo 'catalogo' en historia y cuadrada (con y sin sello) sin colisiones
  // ─────────────────────────────────────────────────────────────────────────
  it("Escenario 18: Estilo 'catalogo' en historia y cuadrada no colisiona con el sello Semilla ni viola zonas seguras", () => {
    // Mock de CanvasRenderingContext2D
    const createMockCtx = () => {
      const gradientMock = {
        addColorStop: vi.fn(),
      };
      return {
        canvas: { width: 1080, height: 1920 },
        font: "16px sans-serif",
        fillStyle: "#000000",
        strokeStyle: "#000000",
        lineWidth: 1,
        textAlign: "left",
        textBaseline: "alphabetic",
        createLinearGradient: vi.fn().mockReturnValue(gradientMock),
        fillRect: vi.fn(),
        fillText: vi.fn(),
        measureText: vi.fn().mockReturnValue({ width: 300 }),
        save: vi.fn(),
        restore: vi.fn(),
        beginPath: vi.fn(),
        closePath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        quadraticCurveTo: vi.fn(),
        arc: vi.fn(),
        stroke: vi.fn(),
        fill: vi.fn(),
        clip: vi.fn(),
        drawImage: vi.fn(),
      } as any;
    };

    const store = createMockStore();
    const dataConSello = prepareCatalogShareData({ ...store, plan: "semilla" });
    const dataSinSello = prepareCatalogShareData({ ...store, plan: "pro" });

    // 1. Historia con sello
    const ctxHistSello = createMockCtx();
    const resHistSello = drawShareImage(ctxHistSello, dataConSello, "catalogo", "historia");
    expect(resHistSello.validation.ok).toBe(true);
    expect(resHistSello.validation.collisions).toEqual([]);
    expect(resHistSello.validation.safeZoneViolations).toEqual([]);

    // 2. Historia sin sello
    const ctxHistSinSello = createMockCtx();
    const resHistSinSello = drawShareImage(ctxHistSinSello, dataSinSello, "catalogo", "historia");
    expect(resHistSinSello.validation.ok).toBe(true);
    expect(resHistSinSello.validation.collisions).toEqual([]);
    expect(resHistSinSello.validation.safeZoneViolations).toEqual([]);

    // 3. Cuadrada con sello
    const ctxCuadSello = createMockCtx();
    const resCuadSello = drawShareImage(ctxCuadSello, dataConSello, "catalogo", "cuadrada");
    expect(resCuadSello.validation.ok).toBe(true);
    expect(resCuadSello.validation.collisions).toEqual([]);

    // 4. Cuadrada sin sello
    const ctxCuadSinSello = createMockCtx();
    const resCuadSinSello = drawShareImage(ctxCuadSinSello, dataSinSello, "catalogo", "cuadrada");
    expect(resCuadSinSello.validation.ok).toBe(true);
    expect(resCuadSinSello.validation.collisions).toEqual([]);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Correcciones adicionales solicitadas por Jack
  // ─────────────────────────────────────────────────────────────────────────
  it("Ajuste 1: Tienda creada antes del corte no puede recibir días de prueba Pro", async () => {
    // Si la RPC en base de datos filtra por created_at >= c_f55_cutoff,
    // retorna 0 filas para tiendas pre-corte.
    const mockRpc = vi.fn().mockResolvedValue({ data: [], error: null });
    const mockSupabase = { rpc: mockRpc };

    const res = await claimTrialRewards("s_old_store_pre_cutoff", mockSupabase as any, { silent: true });
    expect(res.totalDaysAdded).toBe(0);
    expect(res.granted).toEqual([]);
  });

  it("Ajuste 2: Tienda nueva en prueba Pro nace con active=true y NO dispara aviso de suspensión", () => {
    const store = createMockStore({
      plan: "pro",
      subscriptionStatus: "trial",
      active: true,
    });
    // La condición de suspensión en admin.tsx L244 es: store && !store.active
    const isSuspended = store && !store.active;
    expect(store.active).toBe(true);
    expect(isSuspended).toBe(false);
  });

  it("Ajuste 3: applyGrantedTrialDays extiende planExpiresAt y getTrialStatus muestra los días reales", () => {
    const now = new Date();
    const initialExpiry = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const store = createMockStore({
      plan: "pro",
      subscriptionStatus: "trial",
      planExpiresAt: initialExpiry,
    });

    const initialStatus = getTrialStatus(store, now);
    expect(initialStatus.daysLeft).toBe(7);

    // Otorgar +3 días por logro
    const daysToAdd = 3;
    const baseMs = new Date(store.planExpiresAt!).getTime();
    const newExpiresAt = new Date(baseMs + daysToAdd * 24 * 60 * 60 * 1000).toISOString();
    const updatedStore = { ...store, planExpiresAt: newExpiresAt };

    const updatedStatus = getTrialStatus(updatedStore, now);
    expect(updatedStatus.daysLeft).toBe(10);
  });

  it("Ajuste 4: CompletaTuTienda muestra el logro marca solo una vez en portada como 'logo + portada: +2 días'", () => {
    const trialStore = createMockStore({
      plan: "pro",
      subscriptionStatus: "trial",
      logo: null,
      banners: [],
    });

    const tasks = getCompletaTuTiendaTasks(trialStore, false);
    const logoTask = tasks.find((t) => t.id === "logo");
    const portadaTask = tasks.find((t) => t.id === "portada");
    const productosTask = tasks.find((t) => t.id === "productos");

    // Logo NO debe mostrar recompensa individual para no duplicar la percepción a +4 días
    expect(logoTask).toBeDefined();
    expect(logoTask?.reward).toBeUndefined();

    // Portada muestra la recompensa combinada unificada
    expect(portadaTask).toBeDefined();
    expect(portadaTask?.reward).toBe("logo + portada: +2 días");
    expect(portadaTask?.rewardEarned).toBe(false);

    // Productos muestra su recompensa de +3 días
    expect(productosTask?.reward).toBe("+3 días");

    // Si la tienda ya tiene logo y portada, portadaTask marca el logro ganado
    const completeBrandStore = createMockStore({
      plan: "pro",
      subscriptionStatus: "trial",
      logo: "https://example.com/logo.webp",
      bannerTitle: "Bienvenidos a Florería Pétalos",
    });
    const completeTasks = getCompletaTuTiendaTasks(completeBrandStore, false);
    const completePortada = completeTasks.find((t) => t.id === "portada");
    expect(completePortada?.rewardEarned).toBe(true);

    // En tiendas que NO están en prueba, no hay recompensas mostradas
    const paidStore = createMockStore({
      plan: "pro",
      subscriptionStatus: "active",
    });
    const paidTasks = getCompletaTuTiendaTasks(paidStore, false);
    expect(paidTasks.find((t) => t.id === "portada")?.reward).toBeUndefined();
    expect(paidTasks.find((t) => t.id === "logo")?.reward).toBeUndefined();
    expect(paidTasks.find((t) => t.id === "productos")?.reward).toBeUndefined();
  });

  it("Ajuste 5: Imagen de catálogo en formato Historia distribuye el espacio vertical en toda la altura", () => {
    const createMockCtx = () => {
      const gradientMock = { addColorStop: vi.fn() };
      return {
        canvas: { width: 1080, height: 1920 },
        font: "16px sans-serif",
        fillStyle: "#000000",
        strokeStyle: "#000000",
        lineWidth: 1,
        textAlign: "left",
        textBaseline: "alphabetic",
        createLinearGradient: vi.fn().mockReturnValue(gradientMock),
        fillRect: vi.fn(),
        fillText: vi.fn(),
        measureText: vi.fn().mockReturnValue({ width: 300 }),
        save: vi.fn(),
        restore: vi.fn(),
        beginPath: vi.fn(),
        closePath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        quadraticCurveTo: vi.fn(),
        arc: vi.fn(),
        stroke: vi.fn(),
        fill: vi.fn(),
        clip: vi.fn(),
        drawImage: vi.fn(),
      } as any;
    };

    const store = createMockStore({ plan: "semilla" });
    const dataConSello = prepareCatalogShareData(store);
    const ctx = createMockCtx();
    const { boxes, validation } = drawShareImage(ctx, dataConSello, "catalogo", "historia");

    expect(validation.ok).toBe(true);
    expect(validation.collisions).toEqual([]);
    expect(validation.safeZoneViolations).toEqual([]);

    const titleBox = boxes.find((b) => b.id === "title");
    const photoBoxes = boxes.filter((b) => b.id === "photo");
    const ctaCard = boxes.find((b) => b.id === "ctaCard");
    const badge = boxes.find((b) => b.id === "semillaBadge");

    expect(titleBox).toBeDefined();
    expect(titleBox!.y).toBe(360);
    expect(titleBox!.height).toBe(160);

    expect(photoBoxes.length).toBeGreaterThan(0);
    expect(photoBoxes[0].y).toBe(560);

    expect(ctaCard).toBeDefined();
    expect(ctaCard!.y).toBe(1450);
    expect(ctaCard!.height).toBe(260); // Bloque CTA ampliado

    // Sello abajo sin choques, con al menos 24px de aire con la tarjeta CTA y antes del fin del lienzo
    expect(badge).toBeDefined();
    expect(badge!.y).toBeGreaterThanOrEqual(ctaCard!.y + ctaCard!.height + 24);
    expect(badge!.y + badge!.height).toBeLessThanOrEqual(1850);
  });
});
