import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import fs from "fs";
import path from "path";
import { renderToStaticMarkup } from "react-dom/server";
import { PLANS, planAllowsOrderLink, type Store } from "@/lib/types";
import { DESIGN_SPECS } from "@/lib/design-catalog";
import { LANDING_SHOWCASE_DESIGNS } from "@/lib/landing-disenos";
import { useApp } from "@/lib/store";
import { Route as IndexRoute } from "../index";
import { Route as PlanRoute } from "../admin.plan";

vi.mock("@tanstack/react-router", async () => {
  const actual: Record<string, unknown> = await vi.importActual("@tanstack/react-router");
  return {
    ...actual,
    Link: ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
      <a {...props}>{children}</a>
    ),
  };
});

const LandingPage = IndexRoute.options.component!;
const PlanPage = PlanRoute.options.component!;

function makeStore(plan: Store["plan"], slug: string): Store {
  return {
    id: `store-${plan}`,
    name: `Tienda ${plan}`,
    slug,
    description: "",
    whatsapp: "51999999999",
    countryIso: "PE",
    plan,
    products: [],
    categories: [],
    views: 0,
    waClicks: 0,
    niche: "general",
    theme: {
      brandColor: "#ff6b4a",
      bgColor: "#ffffff",
      textColor: "#111827",
      cardBg: "#ffffff",
      accentColor: "#ff6b4a",
      borderRadius: "16px",
      imgShape: "rounded",
      isDark: false,
      layout: "grid",
    },
  } as unknown as Store;
}

describe("Textos de planes (landing + Mi Plan + Ayuda)", () => {
  let initialAppState: ReturnType<typeof useApp.getState>;
  let syncExternalStoreSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    initialAppState = useApp.getState();
    syncExternalStoreSpy = vi
      .spyOn(React, "useSyncExternalStore")
      .mockImplementation((_subscribe, getSnapshot) => getSnapshot());
  });

  afterEach(() => {
    syncExternalStoreSpy.mockRestore();
    useApp.setState(initialAppState, true);
  });

  it("1. Landing menú superior muestra Diseños (N) acorde al conteo real de enSelector: true", () => {
    const enSelectorCount = Object.values(DESIGN_SPECS).filter((s) => s.enSelector).length;
    expect(LANDING_SHOWCASE_DESIGNS).toHaveLength(enSelectorCount);
    expect(enSelectorCount).toBe(9);

    const html = renderToStaticMarkup(<LandingPage />);
    expect(html).toContain(`Diseños (${enSelectorCount})`);
    expect(html).not.toContain("Diseños (8)");
  });

  it("2. Landing bloque Catálogo Web + Link en Bio + Libro de Reclamaciones indica desde el plan gratuito", () => {
    const html = renderToStaticMarkup(<LandingPage />);
    expect(html).toContain(
      "Todo lo que tu negocio necesita para vender y cumplir con la normativa del Perú, desde el plan gratuito.",
    );
    expect(html).not.toContain("cumplir con la normativa del Perú desde S/");
  });

  it("3. Features de planes en PLANS coinciden con lo pedido y planAllowsOrderLink sigue siendo solo pro/ilimitado", () => {
    expect(PLANS.semilla.features).toContain("Con el sello «Hecho con Dizi»");
    expect(PLANS.semilla.features).not.toContain("Incluye publicidad de Dizi");
    expect(PLANS.semilla.features).toContain("Libro de Reclamaciones");
    expect(PLANS.semilla.features).toContain("Imágenes para estados e historias");

    expect(PLANS.emprendedor.features[0]).toBe("Catálogo activo sin interrupciones");

    expect(PLANS.pro.features[1]).toBe("Link de pedido para tus clientes");
    expect(planAllowsOrderLink({ plan: "semilla" })).toBe(false);
    expect(planAllowsOrderLink({ plan: "emprendedor" })).toBe(false);
    expect(planAllowsOrderLink({ plan: "pro" })).toBe(true);
    expect(planAllowsOrderLink({ plan: "ilimitado" })).toBe(true);

    expect(PLANS.ilimitado.features).toContain("Soporte prioritario por WhatsApp");
    expect(PLANS.ilimitado.features).not.toContain("Soporte prioritario 24/7");

    // Verificar que precios y límites no cambiaron
    expect(PLANS.semilla.price).toBe(0);
    expect(PLANS.emprendedor.price).toBe(19.9);
    expect(PLANS.pro.price).toBe(39.9);
    expect(PLANS.ilimitado.price).toBe(69.9);
  });

  it("4. Programa de Referidos en Mi Plan y /ayuda sin 'de forma automática' y texto alineado", () => {
    const store = makeStore("semilla", "zz-audit-semilla");
    useApp.setState({ stores: [store], currentStoreId: store.id });

    const planHtml = renderToStaticMarkup(<PlanPage />);
    expect(planHtml).toContain("Por cada tienda que recomiendes y contrate un plan de pago,");
    expect(planHtml).toContain("ambos reciben 1 mes gratis");
    expect(planHtml).not.toContain("de forma automática");

    const ayudaSource = fs.readFileSync(path.resolve(__dirname, "../ayuda.tsx"), "utf-8");
    const ayudaNormalized = ayudaSource.replace(/\s+/g, " ");
    expect(ayudaNormalized).toContain("Por cada tienda que recomiendes y contrate un plan de pago,");
    expect(ayudaNormalized).toContain("ambos reciben 1 mes gratis");
    expect(ayudaNormalized).not.toContain("30 días premium gratis");
    expect(ayudaNormalized).not.toContain("de forma automática");
  });

  it("5. Mi Plan: planes inferiores usan enlace discreto 'Cambiar a <plan>' (sin bg-primary), actual 'Plan Actual' y superiores coral 'Solicitar <plan>' (F57: sin Semilla)", () => {
    const semillaStore = makeStore("semilla", "zz-audit-semilla");
    useApp.setState({ stores: [semillaStore], currentStoreId: semillaStore.id });
    const semillaHtml = renderToStaticMarkup(<PlanPage />);
    expect(semillaHtml).toContain("Plan actual: <strong>Semilla</strong>");
    expect(semillaHtml).toContain("Solicitar Emprendedor");
    expect(semillaHtml).toContain("Solicitar Catálogo Pro");
    expect(semillaHtml).toContain("Solicitar Ilimitado");
    expect(semillaHtml).not.toContain("Cambiar a ");

    const proStore = makeStore("pro", "zz-audit-pro");
    useApp.setState({ stores: [proStore], currentStoreId: proStore.id });
    const proHtml = renderToStaticMarkup(<PlanPage />);
    expect(proHtml).toContain("Plan Actual");
    expect(proHtml).not.toContain("Cambiar a Semilla");
    expect(proHtml).toContain("Cambiar a Emprendedor");
    expect(proHtml).not.toContain("Solicitar Semilla");
    expect(proHtml).not.toContain("Solicitar Emprendedor");
    expect(proHtml).toContain("Solicitar Ilimitado");

    // En F57 Semilla no está en PLAN_ORDER, por lo que solo Emprendedor es plan inferior para Pro
    const lowerLinks = proHtml.match(/<a[^>]*>Cambiar a [^<]+<\/a>/g) ?? [];
    expect(lowerLinks).toHaveLength(1);
    for (const linkHtml of lowerLinks) {
      expect(linkHtml).not.toContain("bg-primary");
    }

    // Verificar que el botón 'Solicitar Ilimitado' sí lleva bg-primary
    const upgradeLinks = proHtml.match(/<a[^>]*>Solicitar Ilimitado<\/a>/g) ?? [];
    expect(upgradeLinks).toHaveLength(1);
    expect(upgradeLinks[0]).toContain("bg-primary");
  });
});
