import { describe, it, expect } from "vitest";
import { createMemoryHistory } from "@tanstack/react-router";
import { getRouter } from "@/router";

describe("Opción 1: TanStack Router con parámetro opcional /t/$slug/{-$categoria}", () => {
  it("coincide con /t/catalogo (sin categoría)", async () => {
    const router = getRouter();
    const history = createMemoryHistory({ initialEntries: ["/t/catalogo"] });
    router.update({ history } as any);
    await router.load();

    const matches = router.state.matches;
    expect(matches.length).toBeGreaterThan(0);
    const lastMatch = matches[matches.length - 1];
    expect(lastMatch.routeId).toBe("/t/$slug/{-$categoria}");
    expect(lastMatch.params.slug).toBe("catalogo");
    expect(lastMatch.params.categoria).toBeUndefined();
  });

  it("coincide con /t/catalogo/flores-follajes (con categoría)", async () => {
    const router = getRouter();
    const history = createMemoryHistory({ initialEntries: ["/t/catalogo/flores-follajes"] });
    router.update({ history } as any);
    await router.load();

    const matches = router.state.matches;
    expect(matches.length).toBeGreaterThan(0);
    const lastMatch = matches[matches.length - 1];
    expect(lastMatch.routeId).toBe("/t/$slug/{-$categoria}");
    expect(lastMatch.params.slug).toBe("catalogo");
    expect(lastMatch.params.categoria).toBe("flores-follajes");
  });
});

describe("vercel.json rewrite para /t/:slug/:categoria/ (Fase 4B)", () => {
  it("contiene la regla con barra final /t/:slug/:categoria/ hacia /api/seo con c=:categoria antes de la regla sin barra", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const vercelJsonPath = path.resolve(process.cwd(), "vercel.json");
    const vercelConfig = JSON.parse(fs.readFileSync(vercelJsonPath, "utf-8"));
    const rewrites = vercelConfig.rewrites;

    const trailingSlashRule = rewrites.find(
      (r: any) => r.source === "/t/:slug/:categoria/"
    );
    expect(trailingSlashRule).toBeDefined();
    expect(trailingSlashRule.destination).toBe(
      "/api/seo?slug=:slug&type=catalog&c=:categoria"
    );

    const normalRule = rewrites.find(
      (r: any) => r.source === "/t/:slug/:categoria"
    );
    expect(normalRule).toBeDefined();
    expect(normalRule.destination).toBe(
      "/api/seo?slug=:slug&type=catalog&c=:categoria"
    );

    const trailingIndex = rewrites.indexOf(trailingSlashRule);
    const normalIndex = rewrites.indexOf(normalRule);
    expect(trailingIndex).toBeLessThan(normalIndex);
  });
});

