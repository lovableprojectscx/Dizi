import { describe, it, expect, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";

vi.mock("../supabase", () => ({
  supabase: {},
}));
import {
  getStoreAccessState,
  isStoreInactiveCandidate,
  getDaysInPause,
  type AppConfigState,
} from "../access-state";
import { isSemillaAssignable } from "../semilla-notice";

const repoRoot = path.resolve(__dirname, "../../..");
const infoNecesariaDir = path.resolve(
  repoRoot,
  "../../INFORMACIÓN NECESARIA",
);

describe("F57.2 · Coherencia (Escenarios 1, 2, 3, 4, 5, 6, 7, 8, 12, 13, 15, 16)", () => {
  // --------------------------------------------------------------------------
  // Escenario 1: index.html no contiene "gratis para siempre" ni oferta "Plan Semilla"
  // --------------------------------------------------------------------------
  it("Escenario 1: index.html no contiene 'gratis para siempre' ni oferta 'Plan Semilla'", () => {
    const indexHtmlPath = path.join(repoRoot, "index.html");
    const content = fs.readFileSync(indexHtmlPath, "utf-8");

    expect(content.toLowerCase()).not.toContain("gratis para siempre");
    expect(content).not.toContain('"name": "Plan Semilla"');
    expect(content).not.toContain("Plan Semilla gratuito");
    // Oferta Google actualizada
    expect(content).toContain("Prueba 7 días de Pro gratis");
  });

  // --------------------------------------------------------------------------
  // Escenario 2: Landing sin "plan gratuito" (prueba sobre index.tsx)
  // --------------------------------------------------------------------------
  it("Escenario 2: Landing sin 'plan gratuito' (src/routes/index.tsx)", () => {
    const indexTsxPath = path.join(repoRoot, "src/routes/index.tsx");
    const content = fs.readFileSync(indexTsxPath, "utf-8");

    expect(content.toLowerCase()).not.toContain("desde el plan gratuito");
    expect(content.toLowerCase()).not.toContain("plan gratuito");
    expect(content).toContain("desde tu prueba gratis");
  });

  // --------------------------------------------------------------------------
  // Escenario 3: Mi Plan, interruptor apagado, vencido 5 días → activa ("muestra hasta 20 productos")
  // --------------------------------------------------------------------------
  it("Escenario 3: Mi Plan, interruptor apagado, vencido 5 días → activa", () => {
    const fixedNow = new Date("2026-11-24T12:00:00.000Z");
    const configOff: AppConfigState = {
      pausaActiva: false,
      pausaDesde: null,
      semillaFin: "2026-12-25",
    };
    // Vencida hace 5 días (Nov 19)
    const store = {
      slug: "tienda-vencida-switch-off",
      plan: "pro" as const,
      planExpiresAt: "2026-11-19T12:00:00.000Z",
      subscriptionStatus: "active",
      active: true,
    };

    const state = getStoreAccessState(store, configOff, fixedNow);
    expect(state).toBe("activa");
  });

  // --------------------------------------------------------------------------
  // Escenario 4: Mi Plan, interruptor encendido, vencido 1 día → gracia
  // --------------------------------------------------------------------------
  it("Escenario 4: Mi Plan, interruptor encendido, vencido 1 día → gracia", () => {
    const fixedNow = new Date("2026-11-24T12:00:00.000Z");
    const configOn: AppConfigState = {
      pausaActiva: true,
      pausaDesde: "2026-11-15T00:00:00.000Z",
      semillaFin: "2026-12-25",
    };
    // Vencida hace 1 día (Nov 23): gracia de 3 días termina Nov 26 > Nov 24
    const store = {
      slug: "tienda-vencida-1d",
      plan: "pro" as const,
      planExpiresAt: "2026-11-23T12:00:00.000Z",
      subscriptionStatus: "active",
      active: true,
    };

    const state = getStoreAccessState(store, configOn, fixedNow);
    expect(state).toBe("gracia");
  });

  // --------------------------------------------------------------------------
  // Escenario 5: Mi Plan, interruptor encendido, vencido 5 días → pausa
  // --------------------------------------------------------------------------
  it("Escenario 5: Mi Plan, interruptor encendido, vencido 5 días → pausa", () => {
    const fixedNow = new Date("2026-11-24T12:00:00.000Z");
    const configOn: AppConfigState = {
      pausaActiva: true,
      pausaDesde: "2026-11-15T00:00:00.000Z",
      semillaFin: "2026-12-25",
    };
    // Vencida hace 5 días (Nov 19): gracia terminó Nov 22 < Nov 24
    const store = {
      slug: "tienda-vencida-5d",
      plan: "pro" as const,
      planExpiresAt: "2026-11-19T12:00:00.000Z",
      subscriptionStatus: "active",
      active: true,
    };

    const state = getStoreAccessState(store, configOn, fixedNow);
    expect(state).toBe("pausa");
  });

  // --------------------------------------------------------------------------
  // Escenario 6: /terminos sin "plan gratuito" (salvo mención histórica en §5) y fecha actualizada
  // --------------------------------------------------------------------------
  it("Escenario 6: /terminos sin 'plan gratuito' (salvo mención histórica en §5), fecha Noviembre 2026 y textos exactos", () => {
    const terminosTsxPath = path.join(repoRoot, "src/routes/terminos.tsx");
    const content = fs.readFileSync(terminosTsxPath, "utf-8");

    // Verificar que no hay menciones de plan gratuito fuera de la cláusula §5
    const cleanedContent = content.replace("El plan gratuito Semilla deja de ofrecerse", "");
    expect(cleanedContent.toLowerCase()).not.toContain("plan gratuito");

    const normalizedContent = content.replace(/\s+/g, " ");
    expect(content).toContain('lastUpdated = "Noviembre 2026"');
    expect(content).toContain("Etapa de lanzamiento");
    expect(content).toContain("El plan gratuito Semilla deja de ofrecerse");
    expect(normalizedContent).toContain("24 de diciembre de 2026");
    expect(normalizedContent).toContain("25 de diciembre de 2026");
    expect(normalizedContent).toContain("por al menos 90 días");
  });

  // --------------------------------------------------------------------------
  // Escenario 7: /ayuda sin "plan gratuito" y con 90 días
  // --------------------------------------------------------------------------
  it("Escenario 7: /ayuda sin 'plan gratuito' y con 90 días", () => {
    const ayudaTsxPath = path.join(repoRoot, "src/routes/ayuda.tsx");
    const content = fs.readFileSync(ayudaTsxPath, "utf-8");

    expect(content.toLowerCase()).not.toContain("plan gratuito");
    expect(content).toContain("90 días");
  });

  // --------------------------------------------------------------------------
  // Escenario 8: isSemillaAssignable según semilla_fin (hora Lima)
  // --------------------------------------------------------------------------
  it("Escenario 8: isSemillaAssignable según fecha límite semilla_fin en hora Lima", () => {
    const config: AppConfigState = {
      pausaActiva: true,
      pausaDesde: "2026-11-01",
      semillaFin: "2026-12-25",
    };

    // 24 dic 2026 12:00 Lima (17:00 UTC) -> asignable
    expect(isSemillaAssignable(config, new Date("2026-12-24T17:00:00.000Z"))).toBe(true);

    // 25 dic 2026 12:00 Lima (17:00 UTC) -> no asignable (día S)
    expect(isSemillaAssignable(config, new Date("2026-12-25T17:00:00.000Z"))).toBe(false);

    // 26 dic 2026 12:00 Lima (17:00 UTC) -> no asignable
    expect(isSemillaAssignable(config, new Date("2026-12-26T17:00:00.000Z"))).toBe(false);

    // Sin semilla_fin configurado -> asignable
    expect(isSemillaAssignable({ semillaFin: null })).toBe(true);
    expect(isSemillaAssignable(null)).toBe(true);
  });

  // --------------------------------------------------------------------------
  // Escenario 12: diff de openspec/specs contra INFORMACIÓN NECESARIA = vacío
  // --------------------------------------------------------------------------
  it("Escenario 12: openspec/specs refleja exactamente INFORMACIÓN NECESARIA/especificaciones-openspec", () => {
    const specPlanesLocal = fs.readFileSync(
      path.join(repoRoot, "openspec/specs/planes-suscripciones/spec.md"),
      "utf-8",
    ).trim();
    const specPlanesInfo = fs.readFileSync(
      path.join(infoNecesariaDir, "03-PRODUCTO-Y-REQUISITOS/especificaciones-openspec/planes-suscripciones/spec.md"),
      "utf-8",
    ).trim();

    expect(specPlanesLocal).toBe(specPlanesInfo);

    const specRegistroLocal = fs.readFileSync(
      path.join(repoRoot, "openspec/specs/registro-invitaciones/spec.md"),
      "utf-8",
    ).trim();
    const specRegistroInfo = fs.readFileSync(
      path.join(infoNecesariaDir, "03-PRODUCTO-Y-REQUISITOS/especificaciones-openspec/registro-invitaciones/spec.md"),
      "utf-8",
    ).trim();

    expect(specRegistroLocal).toBe(specRegistroInfo);
  });

  // --------------------------------------------------------------------------
  // Escenario 13: Escaneo de src/ sin textos mercante/público con "plan gratuito", "gratis para siempre" o "Plan Semilla"
  // --------------------------------------------------------------------------
  it("Escenario 13: Ningún texto visible en src/ dice 'plan gratuito', 'gratis para siempre' ni 'Plan Semilla'", () => {
    const srcDir = path.join(repoRoot, "src");

    const prohibitedPatterns = [
      /gratis para siempre/i,
      /plan gratuito/i,
      /Plan Semilla/i,
    ];

    // Lista blanca explícita documentada:
    // - Comentarios o strings internos en semilla-notice.ts / tests
    // - En super.tiendas.tsx o super.dashboard.tsx: "Semilla (antiguo)"
    // - En terminos.tsx: "El plan gratuito Semilla deja de ofrecerse" (redacción histórica de la cláusula §5)
    // - En novedades.tsx: mayo 2026 (RNF-57.2.3: lo histórico no se reescribe)
    function checkFile(filePath: string) {
      const relPath = path.relative(repoRoot, filePath).replace(/\\/g, "/");
      if (relPath.includes("__tests__") || relPath.endsWith(".test.ts") || relPath.endsWith(".test.tsx")) {
        return;
      }

      // RNF-57.2.3: Lo histórico no se reescribe
      if (relPath === "src/routes/novedades.tsx") {
        return;
      }

      const content = fs.readFileSync(filePath, "utf-8");
      const lines = content.split("\n");

      lines.forEach((line, idx) => {
        const trimmed = line.trim();
        if (trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*")) {
          return;
        }

        // Excepciones permitidas documentadas
        if (relPath === "src/routes/terminos.tsx" && line.includes("El plan gratuito Semilla deja de ofrecerse")) {
          return;
        }
        if (relPath === "src/routes/register.tsx" && line.includes('"bajo el Plan Semilla"')) {
          return;
        }
        if (relPath.startsWith("src/routes/super.") && line.includes("Semilla (antiguo)")) {
          return;
        }
        if (relPath === "src/lib/semilla-notice.ts" && line.includes("semilla")) {
          return;
        }

        for (const pattern of prohibitedPatterns) {
          if (pattern.test(line)) {
            // Permitir 'semilla' en identificadores de tipo o keys (ej. plan === 'semilla')
            if (pattern.source.includes("Plan Semilla") && !line.includes("Plan Semilla")) {
              continue;
            }
            throw new Error(
              `Violación de RF-57.2.13 en ${relPath}:${idx + 1}: ${line.trim()}`,
            );
          }
        }
      });
    }

    function walkDir(dir: string) {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const full = path.join(dir, file);
        if (fs.statSync(full).isDirectory()) {
          walkDir(full);
        } else if (file.endsWith(".ts") || file.endsWith(".tsx")) {
          checkFile(full);
        }
      }
    }

    walkDir(srcDir);
  });

  // --------------------------------------------------------------------------
  // Escenario 15: isStoreInactiveCandidate
  // --------------------------------------------------------------------------
  it("Escenario 15: isStoreInactiveCandidate (89d -> false, 90d poca actividad -> true, 120d 10+ visitas -> false, semilla -> false)", () => {
    const fixedNow = new Date("2026-11-24T12:00:00.000Z");
    const configOn: AppConfigState = {
      pausaActiva: true,
      pausaDesde: "2026-05-01T00:00:00.000Z", // régimen de pausa activo desde mayo 2026
      semillaFin: "2026-12-25",
    };

    // Caso A: en pausa hace 89 días, 0 visitas, 0 clicks -> false
    // Venció hace 89 + 3 = 92 días: 2026-08-24
    const store89d = {
      slug: "tienda-89d",
      plan: "pro" as const,
      planExpiresAt: new Date(fixedNow.getTime() - (89 + 3) * 86400000).toISOString(),
      active: true,
      views: 0,
      whatsappClicks: 0,
    };
    expect(getDaysInPause(store89d, configOn, fixedNow)).toBe(89);
    expect(isStoreInactiveCandidate(store89d, configOn, fixedNow)).toBe(false);

    // Caso B: en pausa hace 90 días, 5 visitas (<10), 0 clicks -> true
    const store90d = {
      slug: "tienda-90d",
      plan: "pro" as const,
      planExpiresAt: new Date(fixedNow.getTime() - (90 + 3) * 86400000).toISOString(),
      active: true,
      views: 5,
      whatsappClicks: 0,
    };
    expect(getDaysInPause(store90d, configOn, fixedNow)).toBe(90);
    expect(isStoreInactiveCandidate(store90d, configOn, fixedNow)).toBe(true);

    // Caso C: en pausa hace 120 días, pero con 15 visitas (>=10) -> false
    const store120dActiveViews = {
      slug: "tienda-120d-views",
      plan: "pro" as const,
      planExpiresAt: new Date(fixedNow.getTime() - (120 + 3) * 86400000).toISOString(),
      active: true,
      views: 15,
      whatsappClicks: 0,
    };
    expect(getDaysInPause(store120dActiveViews, configOn, fixedNow)).toBe(120);
    expect(isStoreInactiveCandidate(store120dActiveViews, configOn, fixedNow)).toBe(false);

    // Caso D: tienda Semilla activa (nunca en pausa mientras esté activa) -> false
    const storeSemilla = {
      slug: "tienda-semilla",
      plan: "semilla" as const,
      planExpiresAt: null,
      active: true,
      views: 0,
      whatsappClicks: 0,
    };
    expect(isStoreInactiveCandidate(storeSemilla, configOn, fixedNow)).toBe(false);
  });

  // --------------------------------------------------------------------------
  // Escenario 16: cancelSubscription en store.ts conserva plan
  // --------------------------------------------------------------------------
  it("Escenario 16: cancelSubscription en store.ts conserva el plan de la tienda", () => {
    const storeTsPath = path.join(repoRoot, "src/lib/store.ts");
    const content = fs.readFileSync(storeTsPath, "utf-8");

    // Verificar que no se asigna plan: "semilla" al cancelar suscripción
    expect(content).not.toContain('plan: "semilla", // Degradar a semilla');
    // Verifica que se mantiene st.plan
    expect(content).toContain("plan: st.plan,");
    expect(content).toContain("3 * 86_400_000"); // Vencida hace 3 días
  });
});
