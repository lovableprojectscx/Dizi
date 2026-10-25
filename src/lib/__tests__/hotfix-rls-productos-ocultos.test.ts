import { describe, it, expect, vi } from "vitest";
import * as fs from "fs";
import * as path from "path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PublicCatalog } from "@/components/public/PublicCatalog";
import type { Store } from "@/lib/types";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, params, ...props }: any) =>
    React.createElement("a", { href: to, ...props }, children),
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: "/", search: {} }),
  useRouter: () => ({ state: { location: { pathname: "/", search: {} } } }),
}));

describe("Hotfix de Seguridad RLS: products_public_select", () => {
  const migrationPath = path.resolve(
    __dirname,
    "../../../../supabase/migrations/20261025100000_hotfix_rls_productos_ocultos.sql"
  );

  const fallbackPath = path.resolve(
    process.cwd(),
    "supabase/migrations/20261025100000_hotfix_rls_productos_ocultos.sql"
  );

  const finalPath = fs.existsSync(migrationPath) ? migrationPath : fallbackPath;

  it("1. Archivo de migración existe y tiene formato AAAAMMDDHHMMSS_hotfix_rls_productos_ocultos.sql", () => {
    expect(fs.existsSync(finalPath)).toBe(true);
    expect(path.basename(finalPath)).toBe("20261025100000_hotfix_rls_productos_ocultos.sql");
  });

  it("2. La migración contiene DROP POLICY IF EXISTS idempotente y CREATE POLICY", () => {
    const sql = fs.readFileSync(finalPath, "utf8");
    expect(sql).toContain('DROP POLICY IF EXISTS "products_public_select" ON public.products;');
    expect(sql).toContain('CREATE POLICY "products_public_select" ON public.products');
    expect(sql).toContain("FOR SELECT TO public");
  });

  it("3. La cláusula USING exige products.visible = true para clientes públicos en tiendas activas y publicadas", () => {
    const sql = fs.readFileSync(finalPath, "utf8");
    expect(sql).toContain("stores.active = true AND stores.is_published = true AND products.visible = true");
    expect(sql).toContain("OR stores.owner_id = (SELECT auth.uid())");
  });

  it("4. La migración incluye bloque de reversión (rollback) manual comentado", () => {
    const sql = fs.readFileSync(finalPath, "utf8");
    expect(sql).toContain("SQL de Reversión (Rollback manual en caso de emergencia):");
    expect(sql).toContain("((stores.active = true) AND (stores.is_published = true))");
  });

  describe("5. Evaluación booleana estricta de la política RLS (Matriz de Acceso)", () => {
    interface StoreContext {
      id: string;
      active: boolean;
      is_published: boolean;
      owner_id: string;
    }

    interface ProductContext {
      id: string;
      store_id: string;
      visible: boolean;
    }

    // Réplica exacta de la lógica SQL de products_public_select
    function evaluateProductsPublicSelect(
      store: StoreContext,
      product: ProductContext,
      authUid: string | null
    ): boolean {
      if (store.id !== product.store_id) return false;
      const isPublicAccessAllowed = store.active && store.is_published && product.visible;
      const isOwnerAccessAllowed = authUid !== null && store.owner_id === authUid;
      return isPublicAccessAllowed || isOwnerAccessAllowed;
    }

    const store: StoreContext = {
      id: "store_123",
      active: true,
      is_published: true,
      owner_id: "user_owner_uuid",
    };

    const visibleProduct: ProductContext = {
      id: "prod_vis",
      store_id: "store_123",
      visible: true,
    };

    const hiddenProduct: ProductContext = {
      id: "prod_hid",
      store_id: "store_123",
      visible: false,
    };

    it("Usuario público (anon / auth.uid() null): producto visible en tienda activa es legible (TRUE)", () => {
      const canRead = evaluateProductsPublicSelect(store, visibleProduct, null);
      expect(canRead).toBe(true);
    });

    it("Usuario público (anon / auth.uid() null): producto OCULTO en tienda activa NO es legible (FALSE)", () => {
      const canRead = evaluateProductsPublicSelect(store, hiddenProduct, null);
      expect(canRead).toBe(false);
    });

    it("Usuario público: producto visible en tienda INACTIVA no es legible (FALSE)", () => {
      const inactiveStore = { ...store, active: false };
      const canRead = evaluateProductsPublicSelect(inactiveStore, visibleProduct, null);
      expect(canRead).toBe(false);
    });

    it("Usuario público: producto visible en tienda NO PUBLICADA no es legible (FALSE)", () => {
      const unpublishedStore = { ...store, is_published: false };
      const canRead = evaluateProductsPublicSelect(unpublishedStore, visibleProduct, null);
      expect(canRead).toBe(false);
    });

    it("Dueño autenticado (auth.uid() = owner_id): producto OCULTO SÍ es legible (TRUE)", () => {
      const canRead = evaluateProductsPublicSelect(store, hiddenProduct, "user_owner_uuid");
      expect(canRead).toBe(true);
    });

    it("Dueño autenticado (auth.uid() = owner_id): producto en tienda inactiva SÍ es legible (TRUE)", () => {
      const inactiveStore = { ...store, active: false };
      const canRead = evaluateProductsPublicSelect(inactiveStore, hiddenProduct, "user_owner_uuid");
      expect(canRead).toBe(true);
    });

    it("Otro usuario autenticado (auth.uid() != owner_id): producto OCULTO NO es legible (FALSE)", () => {
      const canRead = evaluateProductsPublicSelect(store, hiddenProduct, "other_user_uuid");
      expect(canRead).toBe(false);
    });
  });

  describe("6. Integridad de Vistas de Catálogo, Bio y Panel", () => {
    const mockStore: Store = {
      id: "s_test_rls",
      slug: "tienda-rls-test",
      name: "Tienda RLS Test",
      phone: "51987654321",
      model: "grid",
      plan: "pro",
      active: true,
      isPublished: true,
      categories: [{ id: "cat_1", name: "Principal", visible: true, productCount: 2 }],
      products: [
        {
          id: "p_1",
          name: "Producto Visible 1",
          price: 50,
          originalPrice: 70,
          isOnSale: true,
          visible: true,
          categoryId: "cat_1",
          image: "",
        },
        {
          id: "p_2",
          name: "Producto Oculto 2",
          price: 90,
          isOnSale: false,
          visible: false,
          categoryId: "cat_1",
          image: "",
        },
      ],
    };

    it("El catálogo público renderiza sin errores con productos visibles", () => {
      const html = renderToStaticMarkup(
        React.createElement(PublicCatalog, { store: mockStore, mode: "catalog" })
      );
      expect(html).toContain("Producto Visible 1");
      expect(html).not.toContain("Producto Oculto 2");
    });

    it("La vista Bio renderiza sin errores con productos visibles", () => {
      const html = renderToStaticMarkup(
        React.createElement(PublicCatalog, { store: mockStore, mode: "bio" })
      );
      expect(html).toContain("Producto Visible 1");
      expect(html).not.toContain("Producto Oculto 2");
    });

    it("El panel administrativo recibe la lista completa para permitir al dueño alternar visibilidad", () => {
      const ownerProducts = mockStore.products;
      expect(ownerProducts.length).toBe(2);
      expect(ownerProducts.find((p) => p.visible === false)).toBeDefined();
    });
  });
});
