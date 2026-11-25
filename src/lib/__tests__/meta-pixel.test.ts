import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../supabase", () => ({
  supabase: {},
}));

import {
  META_PIXEL_ID,
  canTrackPixel,
  isPixelAllowedPath,
  isPixelEnabledHost,
  resetMetaPixelForTests,
  trackCompleteRegistration,
  trackLead,
  trackPageView,
} from "../meta-pixel";

interface FakeScriptElement {
  async: boolean;
  src: string;
}

function setupBrowserEnv(options: {
  hostname: string;
  pathname: string;
  role?: "super_admin" | "store_owner" | null;
}) {
  const appendedScripts: FakeScriptElement[] = [];
  const storage = new Map<string, string>();
  if (options.role) {
    storage.set(
      "sb-test-auth-token",
      JSON.stringify({
        currentSession: {
          user: {
            id: "u_test",
            app_metadata: { role: options.role },
          },
        },
      }),
    );
  }

  const localStorageMock: Record<string, unknown> = {
    getItem: (k: string) => storage.get(k) ?? null,
    setItem: (k: string, v: string) => {
      storage.set(k, v);
      localStorageMock[k] = v;
    },
    removeItem: (k: string) => {
      storage.delete(k);
      delete localStorageMock[k];
    },
    key: (i: number) => Array.from(storage.keys())[i] ?? null,
    get length() {
      return storage.size;
    },
  };
  for (const [k, v] of storage.entries()) {
    localStorageMock[k] = v;
  }

  const windowMock: Record<string, unknown> = {
    location: {
      hostname: options.hostname,
      pathname: options.pathname,
    },
    localStorage: localStorageMock,
  };

  const documentMock = {
    querySelector: (selector: string) =>
      appendedScripts.find((s) => selector.includes(s.src)) ?? null,
    createElement: () => ({ async: false, src: "" }),
    getElementsByTagName: () => [],
    head: {
      appendChild: (el: FakeScriptElement) => {
        appendedScripts.push(el);
        return el;
      },
    },
  };

  vi.stubGlobal("window", windowMock);
  vi.stubGlobal("document", documentMock);
  vi.stubGlobal("localStorage", localStorageMock);

  return { windowMock, appendedScripts };
}

describe("meta-pixel (F58)", () => {
  beforeEach(() => {
    resetMetaPixelForTests();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("define el ID público constante 1453347423533488", () => {
    expect(META_PIXEL_ID).toBe("1453347423533488");
  });

  it("isPixelAllowedPath permite solo rutas de DIZI y bloquea /t/, /bio/, /pedido/, /admin, /super", () => {
    const allowed = [
      "/",
      "/register",
      "/register/",
      "/login",
      "/ayuda",
      "/novedades",
      "/terminos",
      "/privacidad",
      "/register?plan=pro#paso1",
    ];
    for (const path of allowed) {
      expect(isPixelAllowedPath(path), `Esperaba permitido: ${path}`).toBe(true);
    }

    const blocked = [
      "/t/floreriademo",
      "/t/floreriademo/ramos",
      "/bio/floreriademo",
      "/pedido/ABC123",
      "/admin",
      "/admin/productos",
      "/super",
      "/super/tiendas",
      "/otra-ruta",
      "",
    ];
    for (const path of blocked) {
      expect(isPixelAllowedPath(path), `Esperaba bloqueado: ${path}`).toBe(false);
    }
  });

  it("isPixelEnabledHost permite solo dizi.idenza.site y dizicatalogo.com con y sin www", () => {
    expect(isPixelEnabledHost("dizi.idenza.site")).toBe(true);
    expect(isPixelEnabledHost("www.dizi.idenza.site")).toBe(true);
    expect(isPixelEnabledHost("dizicatalogo.com")).toBe(true);
    expect(isPixelEnabledHost("www.dizicatalogo.com")).toBe(true);
    expect(isPixelEnabledHost(" DIZI.IDENZA.SITE ")).toBe(true);

    expect(isPixelEnabledHost("localhost")).toBe(false);
    expect(isPixelEnabledHost("dizi-git-f58.vercel.app")).toBe(false);
    expect(isPixelEnabledHost("")).toBe(false);
    expect(isPixelEnabledHost(null)).toBe(false);
  });

  it("no dispara en modo preview/test (localhost) ni para rol super_admin", () => {
    setupBrowserEnv({ hostname: "localhost", pathname: "/" });
    expect(canTrackPixel("/")).toBe(false);
    expect(trackPageView("/")).toBe(false);

    vi.unstubAllGlobals();
    resetMetaPixelForTests();

    setupBrowserEnv({
      hostname: "dizi.idenza.site",
      pathname: "/",
      role: "super_admin",
    });
    expect(canTrackPixel("/")).toBe(false);
    expect(trackPageView("/")).toBe(false);
  });

  it("carga fbevents.js una sola vez e inicializa el píxel una sola vez", () => {
    const { windowMock, appendedScripts } = setupBrowserEnv({
      hostname: "dizi.idenza.site",
      pathname: "/",
      role: "store_owner",
    });

    expect(trackPageView("/")).toBe(true);
    expect(trackLead("/register")).toBe(true);
    expect(trackCompleteRegistration("floreria", "/register")).toBe(true);

    expect(appendedScripts).toHaveLength(1);
    expect(appendedScripts[0].src).toBe("https://connect.facebook.net/en_US/fbevents.js");

    const fbq = windowMock.fbq as { queue: unknown[][] };
    expect(fbq.queue).toEqual([
      ["init", "1453347423533488"],
      ["track", "PageView"],
      ["track", "Lead"],
      ["track", "CompleteRegistration", { content_category: "floreria" }],
    ]);
  });

  it("no dispara en rutas prohibidas aunque el host sea productivo", () => {
    const { windowMock, appendedScripts } = setupBrowserEnv({
      hostname: "dizicatalogo.com",
      pathname: "/t/floreriademo",
    });

    expect(trackPageView("/t/floreriademo")).toBe(false);
    expect(trackPageView("/bio/floreriademo")).toBe(false);
    expect(trackPageView("/pedido/P123")).toBe(false);
    expect(trackPageView("/admin")).toBe(false);
    expect(trackPageView("/super")).toBe(false);

    expect(appendedScripts).toHaveLength(0);
    expect(windowMock.fbq).toBeUndefined();
  });
});
