import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { useApp } from "@/lib/store";
import { Route as DashboardRoute } from "../admin.dashboard";
import { Route as ProductsRoute } from "../admin.productos";

const Dashboard = DashboardRoute.options.component!;
const ProductsPage = ProductsRoute.options.component!;

// Mock minimal de TanStack Router para el Link en Dashboard
vi.mock("@tanstack/react-router", async () => {
  const actual: any = await vi.importActual("@tanstack/react-router");
  return {
    ...actual,
    Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
    useRouter: () => ({
      invalidate: vi.fn(),
    }),
  };
});

import { TooltipProvider } from "@/components/ui/tooltip";

// Mock minimal de TanStack Router para el Link en Dashboard
vi.mock("@tanstack/react-router", async () => {
  const actual: any = await vi.importActual("@tanstack/react-router");
  return {
    ...actual,
    Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
    useRouter: () => ({
      invalidate: vi.fn(),
    }),
  };
});

// Mock de qrcode para evitar llamadas asíncronas externas en tests unitarios
vi.mock("qrcode", () => ({
  default: {
    toDataURL: vi.fn().mockResolvedValue("data:image/png;base64,mockqr"),
  },
}));

function renderDashboard() {
  return renderToStaticMarkup(
    <TooltipProvider>
      <React.Suspense fallback={null}>
        <Dashboard />
      </React.Suspense>
    </TooltipProvider>
  );
}

function renderProductsPage() {
  return renderToStaticMarkup(
    <TooltipProvider>
      <React.Suspense fallback={null}>
        <ProductsPage />
      </React.Suspense>
    </TooltipProvider>
  );
}

describe("HOTFIX: hotfix-hooks-dashboard", () => {
  const mockStore: any = {
    id: "store-hotfix-1",
    name: "Tienda Hotfix",
    slug: "tienda-hotfix",
    plan: "semilla",
    phone: "51999999999",
    countryCode: "PE",
    whatsappClicks: 0,
    views: 10,
    subscriptionStatus: "active",
    planExpiresAt: null,
    bioLinksEnabled: true,
    bioDescription: "Mi bio link",
    categories: [],
    products: [
      {
        id: "p1",
        name: "Producto 1",
        price: 50,
        visible: true,
        categoryId: "c1",
        image: "https://example.com/p1.webp",
      },
    ],
  };

  let initialAppState: any;
  let syncExternalStoreSpy: any;

  beforeEach(() => {
    initialAppState = useApp.getState();
    syncExternalStoreSpy = vi
      .spyOn(React, "useSyncExternalStore")
      .mockImplementation((subscribe, getSnapshot) => getSnapshot());
  });

  afterEach(() => {
    syncExternalStoreSpy?.mockRestore();
    useApp.setState(initialAppState, true);
  });

  it("E1: renderiza el Dashboard con tienda sin lanzar error", () => {
    useApp.setState({
      stores: [mockStore],
      currentStoreId: mockStore.id,
    });

    expect(() => {
      const html = renderDashboard();
      expect(html).toContain("Tienda Hotfix");
      expect(html).toContain("Panel de administración de tu catálogo digital");
    }).not.toThrow();
  });

  it("E2: renderiza el Dashboard sin tienda (store undefined) sin lanzar error (muestra Cargando tu espacio...)", () => {
    useApp.setState({
      stores: [],
      currentStoreId: null,
    });

    expect(() => {
      const html = renderDashboard();
      expect(html).toContain("Cargando tu espacio...");
      expect(html).toContain("animate-spin");
    }).not.toThrow();
  });

  it("E3: el panel con tienda -> sin tienda -> con tienda no se cae", () => {
    // 1. Con tienda
    useApp.setState({
      stores: [mockStore],
      currentStoreId: mockStore.id,
    });
    const html1 = renderDashboard();
    expect(html1).toContain("Tienda Hotfix");

    // 2. Sin tienda (ej. recarga de sesión tras registro)
    useApp.setState({
      stores: [],
      currentStoreId: null,
    });
    const html2 = renderDashboard();
    expect(html2).toContain("Cargando tu espacio...");

    // 3. Con tienda nuevamente (datos cargados)
    useApp.setState({
      stores: [mockStore],
      currentStoreId: mockStore.id,
    });
    const html3 = renderDashboard();
    expect(html3).toContain("Tienda Hotfix");
  });

  it("E4: el panel de productos con tienda -> sin tienda -> con tienda no se cae", () => {
    // 1. Con tienda
    useApp.setState({
      stores: [mockStore],
      currentStoreId: mockStore.id,
    });
    const html1 = renderProductsPage();
    expect(html1).toContain("Producto 1");

    // 2. Sin tienda (ej. recarga de sesión tras registro)
    useApp.setState({
      stores: [],
      currentStoreId: null,
    });
    const html2 = renderProductsPage();
    expect(html2).toContain("Cargando productos...");

    // 3. Con tienda nuevamente (datos cargados)
    useApp.setState({
      stores: [mockStore],
      currentStoreId: mockStore.id,
    });
    const html3 = renderProductsPage();
    expect(html3).toContain("Producto 1");
  });
});
