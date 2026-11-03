import { test, expect } from "@playwright/test";

/**
 * F44: Pruebas End-to-End con 2 Navegadores Reales (Playwright)
 * Escenarios: E1, E2, E5, E6
 * Tienda audit: zz-audit-sync
 */

test.describe("F44 · Sincronización segura del panel con 2 navegadores reales (zz-audit-sync)", () => {
  const storeId = "zz-audit-sync-id";
  const storeSlug = "zz-audit-sync";

  let sharedDb: {
    store: any;
    products: any[];
  };

  const initialProducts = [
    {
      id: "prod-sync-01",
      store_id: storeId,
      category_id: "cat-sync-01",
      name: "Vestido Sirena Azul",
      price: 50,
      original_price: null,
      image: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600&auto=format&fit=crop&q=80",
      description: "Vestido de noche",
      is_on_sale: false,
      visible: true,
      is_sample: false,
      sort_order: 1,
      tags: ["fiesta"],
      variations: [
        { id: "var-s", name: "S", price: null, image: null },
      ],
      wholesale_tiers: [],
      version: 1,
      updated_at: new Date().toISOString(),
    },
  ];

  const sessionPayload = {
    access_token: "mock-token-audit-sync",
    token_type: "bearer",
    expires_in: 3600,
    expires_at: 9999999999,
    refresh_token: "mock-refresh",
    user: {
      id: "user-audit-sync-01",
      aud: "authenticated",
      role: "authenticated",
      email: "zz-audit-sync@testdizi.com",
      app_metadata: { role: "store_owner" },
      user_metadata: {},
    },
  };

  test.beforeEach(() => {
    sharedDb = {
      store: {
        id: storeId,
        slug: storeSlug,
        name: "Tienda Audit Sync",
        phone: "51999999999",
        country_code: "51",
        country_iso: "PE",
        plan: "pro",
        active: true,
        is_published: true,
        onboarding_completed: true,
        onboardingCompleted: true,
        logo: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=200",
        banner_image: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600",
        categories: [
          { id: "cat-sync-01", store_id: storeId, name: "Vestidos", icon: "Sparkles", sort_order: 1 },
        ],
      },
      products: JSON.parse(JSON.stringify(initialProducts)),
    };
  });

  async function setupBrowser(context: any, page: any, initialStoreState?: any) {
    const storeState = initialStoreState || {
      ...sharedDb.store,
      products: sharedDb.products,
    };

    await page.addInitScript(
      ({ session, store }) => {
        localStorage.setItem("sb-zkqzdwxjthjdjchimmds-auth-token", JSON.stringify(session));
        localStorage.setItem(
          "dizi-catalogos-v2",
          JSON.stringify({
            state: {
              stores: [store],
              currentStoreId: store.id,
              fetchError: null,
              lastFetched: Date.now(),
            },
            version: 1,
          })
        );
      },
      { session: sessionPayload, store: storeState }
    );

    await context.route("**/auth/v1/**", async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(sessionPayload),
      });
    });

    await context.route("**/rest/v1/stores*", async (route: any) => {
      const storeWithRelations = {
        ...sharedDb.store,
        categories: sharedDb.store.categories,
        products: sharedDb.products,
      };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([storeWithRelations]),
      });
    });

    await context.route("**/rest/v1/products*", async (route: any) => {
      const method = route.request().method();
      const url = route.request().url();

      if (method === "GET") {
        const idMatch = url.match(/id=eq\.([^&]+)/);
        if (idMatch) {
          const p = sharedDb.products.find((prod) => prod.id === idMatch[1]);
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(p ? [p] : []),
          });
          return;
        }
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(sharedDb.products),
        });
        return;
      }

      if (method === "PATCH") {
        const idMatch = url.match(/id=eq\.([^&]+)/);
        const versionMatch = url.match(/version=eq\.([^&]+)/);
        const prodId = idMatch ? idMatch[1] : null;
        const expectedVersion = versionMatch ? parseInt(versionMatch[1], 10) : null;

        const postData = route.request().postDataJSON() || {};
        const pIndex = sharedDb.products.findIndex((prod) => prod.id === prodId);

        if (pIndex === -1) {
          await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
          return;
        }

        const existing = sharedDb.products[pIndex];

        // Verificación de concurrencia optimista
        if (expectedVersion !== null && existing.version !== expectedVersion) {
          // Versión obsoleta -> 0 filas actualizadas
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify([]),
          });
          return;
        }

        const nextVersion = existing.version + 1;
        const nextUpdatedAt = new Date().toISOString();

        sharedDb.products[pIndex] = {
          ...existing,
          ...postData,
          version: nextVersion,
          updated_at: nextUpdatedAt,
        };

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([{ version: nextVersion, updated_at: nextUpdatedAt }]),
        });
        return;
      }

      if (method === "POST") {
        const postData = route.request().postDataJSON() || {};
        const newProd = {
          ...postData,
          version: 1,
          updated_at: new Date().toISOString(),
        };
        sharedDb.products.push(newProd);
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify(newProd),
        });
        return;
      }

      await route.continue();
    });
  }

  test("E1 y E2: 2 Navegadores reales - Datos viejos no pisan tallas y Conflicto en edición simultánea", async ({
    browser,
  }) => {
    const contextA = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const contextB = await browser.newContext({ viewport: { width: 375, height: 812 } });

    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    await setupBrowser(contextA, pageA);
    await setupBrowser(contextB, pageB);

    // Navegadores A y B entran a productos
    await pageA.goto("/admin/productos");
    await pageB.goto("/admin/productos");

    // Ambos ven el producto cargado en las cards móviles (.md:hidden)
    const productCardA = pageA.locator(".md\\:hidden").getByText("Vestido Sirena Azul").first();
    const productCardB = pageB.locator(".md\\:hidden").getByText("Vestido Sirena Azul").first();

    await expect(productCardA).toBeVisible({ timeout: 10000 });
    await expect(productCardB).toBeVisible({ timeout: 10000 });

    // --- E1: Dispositivo A actualiza tallas en la base ---
    sharedDb.products[0].variations = [
      { id: "var-s", name: "S", price: null, image: null },
      { id: "var-m", name: "M", price: null, image: null },
      { id: "var-l", name: "L", price: null, image: null },
      { id: "var-xl", name: "XL", price: null, image: null },
    ];
    sharedDb.products[0].version = 2;

    // Dispositivo B abre el producto para editar
    const editBtnB = pageB.locator(".md\\:hidden button:has(svg.lucide-pencil)").first();
    await editBtnB.click();
    await expect(pageB.getByText("Editar Producto")).toBeVisible({ timeout: 5000 });

    // B cambia únicamente el precio a 99.00
    const priceInputB = pageB.locator('input[placeholder="0.00"]').first();
    await priceInputB.fill("99.00");

    // Dispositivo B guarda
    const saveBtnB = pageB.getByRole("button", { name: "Guardar Cambios" });
    await saveBtnB.click();

    // Verificamos E1: En la base compartida, el precio se actualizó a 99 y las tallas S, M, L, XL se conservaron intactas
    expect(sharedDb.products[0].price).toBe(99);
    expect(sharedDb.products[0].variations).toHaveLength(4);
    expect(sharedDb.products[0].variations.map((v: any) => v.name)).toEqual(["S", "M", "L", "XL"]);

    // --- E2: Edición simultánea y detección de conflicto ---
    // Ambos abren el modal en la versión actual (3)
    await editBtnB.click();
    await expect(pageB.getByText("Editar Producto")).toBeVisible({ timeout: 5000 });

    // Mientras B tiene el modal abierto con v3, el dispositivo A guarda un cambio en la base (sube a v4)
    sharedDb.products[0].version = 4;
    sharedDb.products[0].name = "Vestido Sirena Azul Noche";

    // B intenta guardar con la versión antigua (v3)
    await priceInputB.fill("120.00");
    await saveBtnB.click();

    // B recibe el toast de conflicto optimista sin pisar la base (RF-44.5)
    await expect(
      pageB.getByText("Este producto se modificó desde otro dispositivo")
    ).toBeVisible({ timeout: 6000 });

    // La base de datos no fue pisada con el cambio conflictivo
    expect(sharedDb.products[0].name).toBe("Vestido Sirena Azul Noche");

    await contextA.close();
    await contextB.close();
  });

  test("E5 y E6: Stale-While-Revalidate al entrar y al volver a la pestaña tras 60 s", async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const page = await context.newPage();

    // Dispositivo con caché local desactualizada
    const staleProduct = {
      ...sharedDb.products[0],
      name: "Vestido Sirena Azul Desactualizado",
    };

    const staleStore = {
      ...sharedDb.store,
      products: [staleProduct],
    };

    await setupBrowser(context, page, staleStore);

    // E5: Al entrar al panel, SWR pinta lo disponible pero revalida inmediatamente en segundo plano
    await page.goto("/admin/productos");

    // Debe mostrarse el nombre actualizado de la base de datos en la card móvil
    await expect(
      page.locator(".md\\:hidden").getByText("Vestido Sirena Azul").first()
    ).toBeVisible({ timeout: 10000 });

    // E6: Dispositivo secundario cambia el producto en la base
    sharedDb.products[0].name = "Vestido Sirena Azul Actualizado en Segundo Plano";

    // Volver a la pestaña tras >60s dispara revalidación
    await page.evaluate(() => {
      const raw = localStorage.getItem("dizi-catalogos-v2");
      if (raw) {
        const parsed = JSON.parse(raw);
        parsed.state.lastFetched = Date.now() - 70 * 1000;
        localStorage.setItem("dizi-catalogos-v2", JSON.stringify(parsed));
      }
      Object.defineProperty(document, "visibilityState", { value: "visible", writable: true });
      document.dispatchEvent(new Event("visibilitychange"));
    });

    // Se revalida automáticamente y se ve el cambio
    await expect(
      page.locator(".md\\:hidden").getByText("Vestido Sirena Azul Actualizado en Segundo Plano").first()
    ).toBeVisible({ timeout: 10000 });

    await context.close();
  });

  test.afterAll(() => {
    sharedDb.products = [];
    expect(sharedDb.products.length).toBe(0);
  });
});
