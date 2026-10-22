import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { useApp } from "@/lib/store";
import { DisenoUnificadoPage } from "../admin.diseno";
import { ErrorComponent, isNetworkError } from "../__root";
import { PortadaEstandar } from "@/components/public/PortadaEstandar";

// Mock minimal useRouter de TanStack Router para evitar warning en pruebas unitarias de ErrorComponent
vi.mock("@tanstack/react-router", async () => {
  const actual: any = await vi.importActual("@tanstack/react-router");
  return {
    ...actual,
    useRouter: () => ({
      invalidate: vi.fn(),
    }),
  };
});

describe("HOTFIX: fix-hooks-diseno", () => {
  const mockStore: any = {
    id: "store-test-1",
    name: "Tienda de Prueba",
    slug: "prueba",
    plan: "semilla",
    model: "grid",
    niche: "general",
    brandColor: "#4f46e5",
    bgColor: "#ffffff",
    textColor: "#1e293b",
    cardBg: "#f8fafc",
    accentColor: "#e0e7ff",
    borderRadius: "12px",
    imgShape: "rounded",
    isDark: false,
    catalogTypography: "sans",
    cardStyle: "standard",
    bannerImage: "https://example.com/banner.webp",
    bannerTitle: "Oferta",
    bannerTagline: "Descuentos",
    bannerBottomTag: "Nuevo",
    bannerStyle: "framed",
    promoBarEnabled: false,
    promoBarText: "",
    promoBarActionType: "none",
    promoBarActionValue: "",
    promoBarBgColor: "",
    promoBarTextColor: "",
    promoBarIsMarquee: false,
    showFeatured: true,
    categories: [],
    products: [],
  };

  describe("1. Error React #300 en admin.diseno.tsx", () => {
    let initialAppState: any;
    let syncExternalStoreSpy: any;

    beforeEach(() => {
      initialAppState = useApp.getState();
      // En pruebas bajo Node / SSR, Zustand v5 usa getServerSnapshot (getInitialState).
      // Redirigimos useSyncExternalStore a getSnapshot para simular el comportamiento exacto del cliente (browser).
      syncExternalStoreSpy = vi
        .spyOn(React, "useSyncExternalStore")
        .mockImplementation((subscribe, getSnapshot) => getSnapshot());
    });

    afterEach(() => {
      syncExternalStoreSpy?.mockRestore();
      useApp.setState(initialAppState, true);
    });

    it("renderiza con store sin lanzar error", () => {
      useApp.setState({
        stores: [mockStore],
        currentStoreId: mockStore.id,
      });

      expect(() => {
        const html = renderToStaticMarkup(<DisenoUnificadoPage />);
        expect(html).toContain("Diseño del Catálogo");
      }).not.toThrow();
    });

    it("renderiza con store null / stores vacías sin lanzar (muestra spinner seguro tras todos los hooks)", () => {
      useApp.setState({
        stores: [],
        currentStoreId: null,
      });

      expect(() => {
        const html = renderToStaticMarkup(<DisenoUnificadoPage />);
        // Debe mostrar el spinner de carga seguro sin explotar por hooks faltantes ni store.propiedad
        expect(html).toContain("animate-spin");
      }).not.toThrow();
    });

    it("tolera transición de store existente a store null sin lanzar", () => {
      // 1. Render con store existente
      useApp.setState({
        stores: [mockStore],
        currentStoreId: mockStore.id,
      });
      const htmlConStore = renderToStaticMarkup(<DisenoUnificadoPage />);
      expect(htmlConStore).toContain("Diseño del Catálogo");

      // 2. Render inmediatamente posterior con store null
      useApp.setState({
        stores: [],
        currentStoreId: null,
      });
      const htmlSinStore = renderToStaticMarkup(<DisenoUnificadoPage />);
      expect(htmlSinStore).toContain("animate-spin");
    });
  });

  describe("2. Portada Estándar en PC (Responsive y max-w-7xl)", () => {
    const banners = [
      "https://example.com/banner1.webp",
      "https://example.com/banner2.webp",
    ];

    it("incluye el contenedor con max-w-7xl centrado y márgenes para md/lg, y rounded-2xl en la sección", () => {
      const html = renderToStaticMarkup(
        <PortadaEstandar
          activeBanners={banners}
          bannerTitle="Título"
        />
      );

      // Contenedor exterior alineado a la grilla max-w-7xl
      expect(html).toContain("w-full md:max-w-7xl md:mx-auto md:px-4 md:mt-4 lg:mt-6");
      // Sección interna con rounded-2xl y aspect 3:1
      expect(html).toContain("aspect-[3/1]");
      expect(html).toContain("md:rounded-2xl");
      expect(html).toContain("overflow-hidden");
    });

    it("con 0 banners o isNarrowing=true retorna vacío sin dejar contenedor residual", () => {
      const htmlVacio = renderToStaticMarkup(
        <PortadaEstandar activeBanners={[]} />
      );
      expect(htmlVacio).toBe("");

      const htmlNarrow = renderToStaticMarkup(
        <PortadaEstandar activeBanners={banners} isNarrowing={true} />
      );
      expect(htmlNarrow).toBe("");
    });
  });

  describe("3. Mensaje de la Pantalla de Error (isNetworkError y ErrorComponent)", () => {
    describe("isNetworkError", () => {
      it("detecta errores de fetch y red", () => {
        expect(isNetworkError(new TypeError("Failed to fetch"))).toBe(true);
        expect(isNetworkError(new Error("NetworkError when attempting to fetch resource."))).toBe(true);
        expect(isNetworkError(new Error("network request failed"))).toBe(true);
        expect(isNetworkError(new Error("Load failed"))).toBe(true);
      });

      it("detecta errores de carga de chunks o módulos dinámicos", () => {
        expect(isNetworkError(new Error("Loading chunk 12 failed"))).toBe(true);
        expect(isNetworkError(new Error("Failed to fetch dynamically imported module"))).toBe(true);
        const chunkErr = new Error("chunk failed");
        chunkErr.name = "ChunkLoadError";
        expect(isNetworkError(chunkErr)).toBe(true);
      });

      it("identifica como no-red los errores lógicos o de React (#300)", () => {
        expect(
          isNetworkError(
            new Error("Minified React error #300; visit https://react.dev/errors/300")
          )
        ).toBe(false);
        expect(isNetworkError(new TypeError("Cannot read properties of undefined"))).toBe(false);
        expect(isNetworkError(new ReferenceError("foo is not defined"))).toBe(false);
      });
    });

    describe("ErrorComponent", () => {
      let consoleErrorSpy: any;

      beforeEach(() => {
        consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      });

      afterEach(() => {
        consoleErrorSpy?.mockRestore();
      });

      it("muestra consejo de Wi-Fi de Claro/Movistar ante fallos de red", () => {
        const networkError = new TypeError("Failed to fetch");
        const html = renderToStaticMarkup(
          <ErrorComponent error={networkError} reset={() => {}} />
        );

        expect(html).toContain("Esta página no pudo cargarse");
        expect(html).toContain("Si estás en Wi-Fi de Claro/Movistar");
        expect(html).toContain("Reintentar");
      });

      it("muestra mensaje amigable y OCULTA consejo de Wi-Fi y error técnico ante errores de la app (#300)", () => {
        const react300Error = new Error(
          "Minified React error #300: Rendered fewer hooks than expected."
        );
        const html = renderToStaticMarkup(
          <ErrorComponent error={react300Error} reset={() => {}} />
        );

        expect(html).toContain("Esta página no pudo cargarse");
        expect(html).toContain(
          "Algo falló al cargar esta página. Toca Reintentar; si sigue pasando, escríbenos."
        );
        // NO debe contener el consejo de Wi-Fi Claro/Movistar
        expect(html).not.toContain("Claro/Movistar");
        // NO debe mostrar el mensaje técnico de React al cliente
        expect(html).not.toContain("Minified React error #300");
        expect(html).not.toContain("Rendered fewer hooks than expected");
        // Botón en español
        expect(html).toContain("Reintentar");
        expect(html).toContain("Ir al inicio");
      });
    });
  });
});
