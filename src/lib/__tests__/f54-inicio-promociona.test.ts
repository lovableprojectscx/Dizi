import { describe, expect, it } from "vitest";
import {
  PANEL_BRAND_CONTRAST_PAIRS,
  getAvailablePreviewStyles,
  getHeroProduct,
  getHexContrastRatio,
  getMosaicProducts,
  getNextStep,
  getTrialStatus,
} from "@/lib/panel-home";
import {
  PERMANENT_PROMO_IDEA,
  getPeruPromoDatesForYear,
  getUpcomingIdeas,
  resolveIdeaStyle,
} from "@/lib/promo-ideas";
import { prepareShareImageData } from "@/lib/share-image/data";
import { drawStoreHeader } from "@/lib/share-image/styles";
import type { Product, Store } from "@/lib/types";

function makeProduct(overrides: Partial<Product> & { id: string }): Product {
  return {
    name: `Producto ${overrides.id}`,
    price: 59,
    categoryId: "cat-1",
    image: "/images/demos/regalos-demo/prod_01_box_cumpleanos.webp",
    visible: true,
    isSample: false,
    ...overrides,
  };
}

function makeStore(overrides: Partial<Store> = {}): Store {
  return {
    id: "s_zz_audit_f54",
    slug: "zz-audit-f54-unit",
    name: "Tienda Prueba F54",
    phone: "51987654321",
    countryCode: "51",
    countryIso: "PE",
    plan: "semilla",
    active: true,
    isPublished: true,
    createdAt: "2026-10-01T12:00:00.000Z",
    whatsappClicks: 12,
    views: 84,
    model: "grid",
    categories: [{ id: "cat-1", name: "Principal" }],
    products: [makeProduct({ id: "p1", sortOrder: 1 })],
    ...overrides,
  };
}

describe("F54 · Lógica pura de Inicio y Promociona (Escenarios 1–8, 10, 13)", () => {
  it("E1 · getMosaicProducts devuelve las 4 primeras fotos visibles sin isSample según sortOrder", () => {
    const store = makeStore({
      products: [
        makeProduct({ id: "p6", sortOrder: 60 }),
        makeProduct({ id: "p_hidden", visible: false, sortOrder: 1 }),
        makeProduct({ id: "p_sample", isSample: true, sortOrder: 2 }),
        makeProduct({ id: "p_noimg", image: "", sortOrder: 3 }),
        makeProduct({ id: "p3", sortOrder: 30 }),
        makeProduct({ id: "p1", sortOrder: 10 }),
        makeProduct({ id: "p5", sortOrder: 50 }),
        makeProduct({ id: "p2", sortOrder: 20 }),
        makeProduct({ id: "p4", sortOrder: 40 }),
      ],
    });

    const mosaic = getMosaicProducts(store, 4);
    expect(mosaic.map((p) => p.id)).toEqual(["p1", "p2", "p3", "p4"]);
    expect(getHeroProduct(store)?.id).toBe("p1");
  });

  it("E2 · getNextStep sin productos prioriza 'Agrega tu primer producto' y mosaico vacío", () => {
    const store = makeStore({ products: [] });
    const res = getNextStep(store, {
      surveyEligible: true,
      completaTuTiendaEligible: true,
      completaTuTiendaDismissed: false,
      completaTuTiendaCompletedAll: false,
    });

    expect(res.principal.id).toBe("no-products");
    expect(res.principal.title).toBe("Agrega tu primer producto");
    expect(res.principal.to).toBe("/admin/productos");
    expect(getMosaicProducts(store, 4)).toHaveLength(0);
  });

  it("E3 · getNextStep para tienda elegible de CompletaTuTienda muestra esa tarjeta sin otra de paso", () => {
    const store = makeStore({
      createdAt: "2026-11-18T12:00:00.000Z",
      products: [makeProduct({ id: "p1", name: "IMG 1234" })],
    });
    const res = getNextStep(store, {
      surveyEligible: true,
      completaTuTiendaEligible: true,
      completaTuTiendaDismissed: false,
      completaTuTiendaCompletedAll: false,
    });

    expect(res.principal.id).toBe("completa-tu-tienda");
    expect(res.tambien).toHaveLength(0);
  });

  it("E4 · getNextStep con 3 productos incompletos y encuesta disponible muestra ambos en orden", () => {
    const store = makeStore({
      products: [
        makeProduct({ id: "p1", name: "IMG 8090" }),
        makeProduct({ id: "p2", name: "WhatsApp Image 2026-11-01" }),
        makeProduct({ id: "p3", price: undefined as unknown as number }),
        makeProduct({ id: "p4", name: "Ramo Clásico", price: 85 }),
      ],
    });

    const res = getNextStep(store, { surveyEligible: true });
    expect(res.principal.id).toBe("incomplete-products");
    expect(res.principal.title).toBe("Completa 3 productos");
    expect(res.principal.tone).toBe("warning");
    expect(res.tambien).toHaveLength(1);
    expect(res.tambien[0].id).toBe("survey");
    expect(res.tambien[0].to).toBe("/admin/encuesta");
  });

  it("E5 · getNextStep en prueba con 2 días restantes y sin otros pendientes muestra 'Elige tu plan'", () => {
    const now = new Date("2026-11-20T12:00:00-05:00");
    const expires = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString();
    const store = makeStore({
      plan: "emprendedor",
      subscriptionStatus: "trial",
      planExpiresAt: expires,
    });

    const trial = getTrialStatus(store, now);
    expect(trial).toEqual({ isTrial: true, daysLeft: 2 });

    const res = getNextStep(store, { surveyEligible: false, now });
    expect(res.principal.id).toBe("trial-ending");
    expect(res.principal.title).toBe("Elige tu plan");
    expect(res.principal.to).toBe("/admin/plan");
  });

  it("E6 · getNextStep sin nada pendiente lleva a Promociona", () => {
    const store = makeStore();
    const res = getNextStep(store, { surveyEligible: false });

    expect(res.principal.id).toBe("promote");
    expect(res.principal.title).toBe("Crea una imagen para tus estados");
    expect(res.principal.to).toBe("/admin/marketing");
    expect(res.tambien).toHaveLength(0);
  });

  it("E8 · getAvailablePreviewStyles muestra 3 estilos sin oferta, 4 con oferta real, y 3 en precio a consultar", () => {
    const store = makeStore();

    const regularData = prepareShareImageData({
      product: makeProduct({ id: "p_reg", price: 80, isOnSale: false }),
      store,
    });
    expect(getAvailablePreviewStyles(regularData)).toEqual([
      "etiqueta",
      "editorial",
      "marco-color",
    ]);

    const offerData = prepareShareImageData({
      product: makeProduct({ id: "p_off", price: 80, originalPrice: 120, isOnSale: true }),
      store,
    });
    expect(getAvailablePreviewStyles(offerData)).toEqual([
      "etiqueta",
      "editorial",
      "marco-color",
      "oferta",
    ]);

    // Ajuste #1 del Paso 1: precio "A consultar" NO habilita "Oferta" en miniaturas
    const consultData = prepareShareImageData({
      product: makeProduct({ id: "p_cons", price: 0, isOnSale: false }),
      store,
    });
    expect(consultData.isConsultPrice).toBe(true);
    expect(consultData.isOnSale).toBe(false);
    expect(getAvailablePreviewStyles(consultData)).toEqual([
      "etiqueta",
      "editorial",
      "marco-color",
    ]);
  });

  it("E10 · getUpcomingIdeas calcula fechas próximas en hora de Lima, móviles 2026/2027 e idea permanente", () => {
    // 19 nov 2026 (hora de Lima) -> Black Friday (27 nov) y Navidad (25 dic)
    const nov19 = new Date("2026-11-19T12:00:00-05:00");
    const novIdeas = getUpcomingIdeas(nov19, 45, 2);
    expect(novIdeas.map((i) => i.title)).toEqual(["Black Friday", "Navidad"]);
    expect(novIdeas[0].dateIso).toBe("2026-11-27");
    expect(novIdeas[0].daysUntil).toBe(8);
    expect(novIdeas[1].dateIso).toBe("2026-12-25");
    expect(novIdeas[1].daysUntil).toBe(36);
    expect(resolveIdeaStyle(novIdeas[0], false)).toBe("etiqueta");
    expect(resolveIdeaStyle(novIdeas[0], true)).toBe("oferta");

    // 10 ago 2026 (sin fechas en 45 días) -> Producto de la semana
    const aug10 = new Date("2026-08-10T12:00:00-05:00");
    const augIdeas = getUpcomingIdeas(aug10, 45, 2);
    expect(augIdeas).toEqual([PERMANENT_PROMO_IDEA]);

    // Borde UTC vs Lima: 2026-11-28T03:00:00Z = 2026-11-27 22:00 en Lima (sigue siendo Black Friday)
    const lateLimaNight = new Date("2026-11-28T03:00:00Z");
    const limaIdeas = getUpcomingIdeas(lateLimaNight, 45, 2);
    expect(limaIdeas[0].title).toBe("Black Friday");
    expect(limaIdeas[0].daysUntil).toBe(0);

    // Fechas móviles verificadas en 2026 y 2027
    const d2026 = Object.fromEntries(getPeruPromoDatesForYear(2026).map((d) => [d.title, d.date]));
    expect(d2026["Día de la Madre"]).toEqual({ year: 2026, month: 5, day: 10 });
    expect(d2026["Día del Padre"]).toEqual({ year: 2026, month: 6, day: 21 });
    expect(d2026["Black Friday"]).toEqual({ year: 2026, month: 11, day: 27 });

    const d2027 = Object.fromEntries(getPeruPromoDatesForYear(2027).map((d) => [d.title, d.date]));
    expect(d2027["Día de la Madre"]).toEqual({ year: 2027, month: 5, day: 9 });
    expect(d2027["Día del Padre"]).toEqual({ year: 2027, month: 6, day: 20 });
    expect(d2027["Black Friday"]).toEqual({ year: 2027, month: 11, day: 26 });
  });

  it("E13 · Contraste WCAG 2.1 pasa >= 4.5:1 en todos los pares de franja, botones y tarjetas (claro y oscuro)", () => {
    for (const [name, pair] of Object.entries(PANEL_BRAND_CONTRAST_PAIRS)) {
      const ratio = getHexContrastRatio(pair.fg, pair.bg);
      expect(ratio, `Par ${name} (${pair.fg} sobre ${pair.bg})`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("Corrección 1 · getNextStep sin productos + prueba con 2 días incluye 'Elige tu plan' en tambien", () => {
    const now = new Date("2026-11-20T12:00:00-05:00");
    const expires = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString();
    const store = makeStore({
      products: [],
      plan: "emprendedor",
      subscriptionStatus: "trial",
      planExpiresAt: expires,
    });

    const res = getNextStep(store, { surveyEligible: true, now });
    expect(res.principal.id).toBe("no-products");
    expect(res.principal.title).toBe("Agrega tu primer producto");
    expect(res.tambien.map((t) => t.id)).toEqual(["trial-ending", "survey"]);
    expect(res.tambien[0].label).toContain("Elige tu plan");
  });

  it("Corrección 2 · drawStoreHeader sin logo ubica el texto después del ícono (x >= iconX + iconSize)", () => {
    const store = makeStore({ logo: null, name: "Regalos Fiorella" });
    const data = prepareShareImageData({
      product: makeProduct({ id: "p1" }),
      store,
    });

    const fillTextCalls: Array<{ text: string; x: number; y: number }> = [];
    const mockCtx = {
      save: () => {},
      restore: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      quadraticCurveTo: () => {},
      closePath: () => {},
      fill: () => {},
      stroke: () => {},
      measureText: (text: string) => ({ width: text.length * 18 }),
      fillText: (text: string, x: number, y: number) => {
        fillTextCalls.push({ text, x, y });
      },
      font: "",
      fillStyle: "",
      strokeStyle: "",
      lineWidth: 1,
      textAlign: "left",
      textBaseline: "middle",
    } as unknown as CanvasRenderingContext2D;

    const boxes: Array<{ id: string; x: number; y: number; width: number; height: number }> = [];
    drawStoreHeader(mockCtx, data, "historia", false, boxes, null);

    const pillX = 60;
    const iconX = pillX + 16;
    const iconSize = 36;
    const nameCall = fillTextCalls.find((c) => c.text === "Regalos Fiorella");
    expect(nameCall).toBeDefined();
    expect(nameCall!.x).toBeGreaterThanOrEqual(iconX + iconSize);
    expect(boxes[0]?.width).toBe(Math.round("Regalos Fiorella".length * 18 + 80));
  });
});
