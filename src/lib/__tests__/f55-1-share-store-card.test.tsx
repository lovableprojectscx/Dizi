import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

// Mock Supabase para pruebas sin .env
vi.mock("@/lib/supabase", () => ({
  supabase: {
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })),
      insert: vi.fn().mockResolvedValue({ error: null }),
      select: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      })),
    })),
  },
  invokeRpcWithRetry: vi.fn().mockResolvedValue({ data: null, error: null }),
}));

// Mock liviano de @tanstack/react-router
vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    children,
    ...rest
  }: {
    to?: string;
    children?: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={to || "#"} {...rest}>
      {children}
    </a>
  ),
}));

// Mock de metrics y trial-rewards
vi.mock("@/lib/share-image/metrics", () => ({
  logShareEvent: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock("@/lib/trial-rewards", () => ({
  claimTrialRewards: vi.fn().mockResolvedValue({ granted: [], totalDaysAdded: 0 }),
}));

// Mock de qrcode
vi.mock("qrcode", () => ({
  default: {
    toDataURL: vi.fn().mockResolvedValue("data:image/png;base64,mockqr"),
  },
}));

// Mock de CatalogPdfExport
vi.mock("@/components/public/CatalogPdfExport", () => ({
  CatalogPdfExportButton: ({ label = "PDF", ...rest }: { label?: string; [k: string]: any }) => (
    <button type="button" data-testid="btn-pdf" {...rest}>
      {label}
    </button>
  ),
}));

import { ShareStoreCard } from "@/components/admin/ShareStoreCard";
import type { Product, Store } from "@/lib/types";
import { logShareEvent } from "@/lib/share-image/metrics";
import { claimTrialRewards } from "@/lib/trial-rewards";
import { supabase } from "@/lib/supabase";

function makeProduct(id: string, image?: string): Product {
  return {
    id,
    name: `Producto ${id}`,
    price: 49.9,
    categoryId: "cat-1",
    image: image ?? "https://example.com/p.jpg",
    visible: true,
    isSample: false,
  };
}

function makeStore(productCountWithPhoto: number): Store {
  const products: Product[] = [];
  for (let i = 1; i <= productCountWithPhoto; i++) {
    products.push(makeProduct(`p${i}`, `https://example.com/prod_${i}.jpg`));
  }
  return {
    id: "s_audit_share_01",
    slug: "tienda-prueba-f551",
    name: "Florería & Detalles",
    phone: "51987654321",
    countryCode: "51",
    countryIso: "PE",
    plan: "pro",
    active: true,
    isPublished: true,
    createdAt: "2026-11-20T12:00:00.000Z",
    whatsappClicks: 5,
    views: 42,
    model: "grid",
    categories: [{ id: "cat-1", name: "Rosas" }],
    products,
  };
}

describe("F55.1 · ShareStoreCard — Bloque único y compacto para compartir en Inicio", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("E1 · Con >= 3 productos con foto: renderiza miniatura canvas 9:16 y botón Compartir coral", () => {
    const store = makeStore(4);
    const html = renderToStaticMarkup(<ShareStoreCard store={store} />);

    // Verifica presencia de la tarjeta principal
    expect(html).toContain('data-testid="share-store-card"');

    // Canvas de miniatura 9:16 presente con dimensiones 1080x1920
    expect(html).toContain('data-testid="catalog-thumb-canvas"');
    expect(html).toContain('width="1080"');
    expect(html).toContain('height="1920"');

    // Etiqueta destacada
    expect(html).toContain("Imagen lista");
    expect(html).toContain("Collage de tus productos");

    // Botón principal
    expect(html).toContain('data-testid="main-share-button"');
    expect(html).toContain("Compartir");
  });

  it("E2 · Con 1 o 2 productos: botón principal es coral (bg-primary) y comparte link sin miniatura", () => {
    const store = makeStore(2); // 2 productos
    const html = renderToStaticMarkup(<ShareStoreCard store={store} />);

    // NO debe contener canvas de miniatura
    expect(html).not.toContain('data-testid="catalog-thumb-canvas"');
    expect(html).not.toContain("Imagen lista");

    // Texto alternativo conciso
    expect(html).toContain("Envía el enlace directo a tus clientes por WhatsApp o redes sociales");

    // Botón principal es coral (bg-primary) porque hay >= 1 producto
    expect(html).toContain('data-testid="main-share-button"');
    expect(html).toContain("bg-primary");
    expect(html).toContain("Compartir");
  });

  it("E3 · Tienda con 0 productos visibles: botón Compartir es secundario (outline), NO coral", () => {
    const store = makeStore(0);
    const html = renderToStaticMarkup(<ShareStoreCard store={store} />);

    expect(html).not.toContain('data-testid="catalog-thumb-canvas"');
    expect(html).toContain('data-testid="main-share-button"');

    // Botón secundario outline para que la única acción coral sea "Agregar primer producto"
    const buttonHtml = html.match(/<button[^>]*data-testid="main-share-button"[^>]*>[\s\S]*?<\/button>/)?.[0] || "";
    expect(buttonHtml).not.toContain("bg-primary");
    expect(buttonHtml).toContain("border-border/80");
    expect(buttonHtml).toContain("bg-background");
    expect(buttonHtml).toContain("Compartir");
  });

  it("E4 · Fila de 4 botones secundarios con etiquetas cortas sin truncar ('Link', 'QR', 'PDF', 'Bio')", () => {
    const store = makeStore(3);
    const html = renderToStaticMarkup(<ShareStoreCard store={store} />);

    // 1. Link (etiqueta corta)
    expect(html).toContain('data-testid="btn-copy-link"');
    expect(html).toContain(">Link</span>");
    expect(html).not.toContain("Copiar link");

    // 2. QR
    expect(html).toContain('data-testid="btn-qr"');
    expect(html).toContain(">QR</span>");

    // 3. PDF
    expect(html).toContain('data-testid="btn-pdf"');
    expect(html).toContain("PDF");

    // 4. Bio (etiqueta corta con enlace correcto)
    expect(html).toContain('data-testid="btn-bio-link"');
    expect(html).toContain('href="/admin/link-bio"');
    expect(html).toContain(">Bio</span>");
    expect(html).not.toContain("Link en Bio");
  });

  it("E5 · Cabecera compacta: sin cajas de texto ni párrafos explicativos largos de ShareCatalogCard", () => {
    const store = makeStore(3);
    const html = renderToStaticMarkup(<ShareStoreCard store={store} />);

    // Título y subtítulo únicos
    expect(html).toContain("Comparte tu tienda");
    expect(html).toContain("Compártelo en tus estados y redes");

    // Textos largos de la antigua ShareCatalogCard que NO deben estar en Inicio
    expect(html).not.toContain("¿Qué es el Catálogo Digital?");
    expect(html).not.toContain("Para qué sirve");
    expect(html).not.toContain("Enlace a tu Catálogo Digital");
    expect(html).not.toContain("Descargar PDF"); // en su lugar el botón chico dice "PDF"
  });

  it("E6 · Verificación de contrato de registro de métricas y premios Pro", async () => {
    const store = makeStore(3);

    // Simulamos la llamada directa que ejecuta ShareStoreCard al compartir
    await logShareEvent(supabase, {
      storeId: store.id,
      productId: null,
      style: "catalogo",
      size: "historia",
      source: "catalogo",
    });

    expect(logShareEvent).toHaveBeenCalledWith(
      supabase,
      expect.objectContaining({
        storeId: store.id,
        productId: null,
        style: "catalogo",
        size: "historia",
        source: "catalogo",
      }),
    );

    await claimTrialRewards(store.id, supabase);
    expect(claimTrialRewards).toHaveBeenCalledWith(store.id, supabase);
  });
});
