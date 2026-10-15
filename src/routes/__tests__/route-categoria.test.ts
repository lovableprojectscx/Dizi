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
