import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

/**
 * F44: Pruebas E2E contra la BASE DE DATOS REAL de Supabase (sin mocks de /rest/v1/*)
 * Tienda audit: zz-audit-sync
 * Escenarios: E1, E2, E9
 *
 * Variables de entorno requeridas:
 * - E2E_SUPABASE_URL: URL del proyecto Supabase
 * - E2E_SUPABASE_ANON_KEY: Clave pública (anon) del proyecto Supabase
 * - E2E_EMAIL: Correo del usuario administrador de prueba
 * - E2E_PASSWORD: Contraseña del usuario administrador de prueba
 *
 * Si falta cualquiera de estas variables, la suite se omite automáticamente (test.skip).
 * Este archivo no lee archivos locales (.env) ni contiene credenciales en el código fuente.
 */

const supabaseUrl = process.env.E2E_SUPABASE_URL;
const supabaseAnonKey = process.env.E2E_SUPABASE_ANON_KEY;
const testEmail = process.env.E2E_EMAIL;
const testPassword = process.env.E2E_PASSWORD;

const hasRequiredEnv = Boolean(
  supabaseUrl && supabaseAnonKey && testEmail && testPassword
);

test.describe("F44 · Pruebas con Base de Datos Real (zz-audit-sync)", () => {
  test.skip(
    !hasRequiredEnv,
    "Pruebas omitidas: faltan variables de entorno requeridas (E2E_SUPABASE_URL, E2E_SUPABASE_ANON_KEY, E2E_EMAIL, E2E_PASSWORD)"
  );

  test.beforeEach(async () => {
    test.skip(
      !hasRequiredEnv,
      "Pruebas omitidas: faltan variables de entorno requeridas (E2E_SUPABASE_URL, E2E_SUPABASE_ANON_KEY, E2E_EMAIL, E2E_PASSWORD)"
    );
  });

  const storeId = "zz-audit-sync-id";
  const storeSlug = "zz-audit-sync";

  let realSession: any = null;
  let supabase: any = null;

  test.beforeAll(async () => {
    if (!hasRequiredEnv) return;
    supabase = createClient(supabaseUrl!, supabaseAnonKey!);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testEmail!,
      password: testPassword!,
    });
    if (error || !data.session) {
      throw new Error(`Error autenticando usuario real de prueba: ${error?.message}`);
    }
    realSession = data.session;
  });

  async function setupRealBrowser(context: any, page: any, customInitialStore?: any) {
    let authStorageKey = "sb-zkqzdwxjthjdjchimmds-auth-token";
    if (supabaseUrl) {
      try {
        const urlObj = new URL(supabaseUrl);
        const ref = urlObj.hostname.split(".")[0];
        if (ref) authStorageKey = `sb-${ref}-auth-token`;
      } catch {
        // mantener fallback
      }
    }

    await page.addInitScript(
      ({ session, initialStore, storageKey }) => {
        // Inyectamos la sesión real obtenida de Supabase Auth
        localStorage.setItem(
          storageKey,
          JSON.stringify({ ...session, currentSession: session })
        );

        if (initialStore) {
          localStorage.setItem(
            "dizi-catalogos-v2",
            JSON.stringify({
              state: {
                stores: [initialStore],
                currentStoreId: initialStore.id,
                fetchError: null,
                lastFetched: Date.now(),
              },
              version: 1,
            })
          );
        }
      },
      { session: realSession, initialStore: customInitialStore, storageKey: authStorageKey }
    );
  }

  test("E1: dos paneles abiertos - panel A edita tallas y panel B edita precio, tallas de A no se pierden", async ({
    browser,
  }) => {
    // 1. Resetear producto en base real a su estado inicial E1
    await supabase.from("products").update({
      name: "Vestido Sirena Azul E1",
      price: 50,
      visible: true,
      variations: [{ id: "var-s", name: "S", price: null, image: null }],
    }).eq("id", "prod-sync-audit-01");

    const contextA = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const contextB = await browser.newContext({ viewport: { width: 375, height: 812 } });

    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    await setupRealBrowser(contextA, pageA);
    await setupRealBrowser(contextB, pageB);

    // Ambos paneles navegan a productos
    await pageA.goto("/admin/productos");
    await pageB.goto("/admin/productos");

    // Ambos paneles cargan el producto desde la base de datos real
    await expect(pageA.locator(".md\\:hidden").getByText("Vestido Sirena Azul E1").first()).toBeVisible({ timeout: 15000 });
    await expect(pageB.locator(".md\\:hidden").getByText("Vestido Sirena Azul E1").first()).toBeVisible({ timeout: 15000 });

    // --- Panel A edita las tallas: agrega opciones M, L, XL ---
    const editBtnA = pageA.locator(".md\\:hidden button:has(svg.lucide-pencil)").first();
    await editBtnA.click();
    await expect(pageA.getByText("Editar Producto")).toBeVisible({ timeout: 5000 });

    // Agregar variación M
    await pageA.getByRole("button", { name: "Agregar Opción" }).click();
    const varInputsA = pageA.locator('input[placeholder*="Ej: Rojo"]');
    await varInputsA.nth(1).fill("M");

    // Agregar variación L
    await pageA.getByRole("button", { name: "Agregar Opción" }).click();
    await varInputsA.nth(2).fill("L");

    // Agregar variación XL
    await pageA.getByRole("button", { name: "Agregar Opción" }).click();
    await varInputsA.nth(3).fill("XL");

    // Guardar cambios en Panel A
    await pageA.getByRole("button", { name: "Guardar Cambios" }).click();
    await expect(pageA.getByText("Producto guardado correctamente")).toBeVisible({ timeout: 8000 });

    // --- Panel B edita solo el precio a 89.00 ---
    const editBtnB = pageB.locator(".md\\:hidden button:has(svg.lucide-pencil)").first();
    await editBtnB.click();
    await expect(pageB.getByText("Editar Producto")).toBeVisible({ timeout: 5000 });

    const priceInputB = pageB.locator('input[placeholder="0.00"]').first();
    await priceInputB.fill("89.00");

    // Guardar cambios en Panel B
    await pageB.getByRole("button", { name: "Guardar Cambios" }).click();
    await expect(pageB.getByText("Producto guardado correctamente")).toBeVisible({ timeout: 8000 });

    // Verificar en la base real que el precio se actualizó a 89 y las 4 tallas se conservaron
    const { data: dbProd } = await supabase
      .from("products")
      .select("version, variations, price, visible")
      .eq("id", "prod-sync-audit-01")
      .single();

    expect(Number(dbProd.price)).toBe(89);
    expect(dbProd.variations).toHaveLength(4);
    expect(dbProd.variations.map((v: any) => v.name)).toEqual(["S", "M", "L", "XL"]);
    expect(dbProd.visible).toBe(true);

    await contextA.close();
    await contextB.close();
  });

  test("E2: con cache vieja, el panel muestra datos actuales de la base tras revalidar y no escribe desde cache", async ({
    browser,
  }) => {
    // 1. En la base de datos real, el producto tiene nombre y precio actualizados
    await supabase.from("products").update({
      name: "Vestido Sirena Azul E2 Real",
      price: 115,
      visible: true,
    }).eq("id", "prod-sync-audit-01");

    // 2. Simulamos un dispositivo cuya caché en localStorage tiene datos desactualizados
    const staleStore = {
      id: storeId,
      slug: storeSlug,
      name: "Tienda Audit Sync",
      phone: "51999999999",
      countryCode: "51",
      countryIso: "PE",
      plan: "pro",
      active: true,
      isPublished: true,
      onboardingCompleted: true,
      categories: [{ id: "cat-sync-audit-01", storeId: storeId, name: "Vestidos" }],
      products: [
        {
          id: "prod-sync-audit-01",
          name: "Vestido Sirena Azul Antiguo en Cache",
          price: 25,
          categoryId: "cat-sync-audit-01",
          image: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600",
          visible: true,
          version: 1,
        },
      ],
    };

    const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const page = await context.newPage();

    await setupRealBrowser(context, page, staleStore);

    // Navega a productos: SWR muestra el estado pero revalida inmediatamente contra la base real
    await page.goto("/admin/productos");

    // El panel debe mostrar los datos reales de la base ("Vestido Sirena Azul E2 Real"), no la caché vieja
    await expect(
      page.locator(".md\\:hidden").getByText("Vestido Sirena Azul E2 Real").first()
    ).toBeVisible({ timeout: 15000 });

    // La base de datos real NUNCA fue sobreescrita con los datos de la caché vieja
    const { data: dbProd } = await supabase
      .from("products")
      .select("name, price, version, visible")
      .eq("id", "prod-sync-audit-01")
      .single();

    expect(dbProd.name).toBe("Vestido Sirena Azul E2 Real");
    expect(Number(dbProd.price)).toBe(115);
    expect(dbProd.visible).toBe(true);

    await context.close();
  });

  test("E9: con dialogo abierto, otro panel guarda cambio; al guardar sale aviso de conflicto y no pisa nada", async ({
    browser,
  }) => {
    // 1. Estado inicial en base real para E9
    await supabase.from("products").update({
      name: "Vestido Sirena Azul E9 Base",
      price: 60,
      visible: true,
    }).eq("id", "prod-sync-audit-01");

    const contextA = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const contextB = await browser.newContext({ viewport: { width: 375, height: 812 } });

    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    await setupRealBrowser(contextA, pageA);
    await setupRealBrowser(contextB, pageB);

    await pageB.goto("/admin/productos");
    await expect(pageB.locator(".md\\:hidden").getByText("Vestido Sirena Azul E9 Base").first()).toBeVisible({ timeout: 15000 });

    // 2. Dispositivo B abre el diálogo para editar (foto base con versión actual)
    const editBtnB = pageB.locator(".md\\:hidden button:has(svg.lucide-pencil)").first();
    await editBtnB.click();
    await expect(pageB.getByText("Editar Producto")).toBeVisible({ timeout: 5000 });

    // B edita el precio a 199.00
    const priceInputB = pageB.locator('input[placeholder="0.00"]').first();
    await priceInputB.fill("199.00");

    // 3. Mientras B tiene el diálogo abierto, otro cliente (A) actualiza el producto en la base real
    await supabase.from("products").update({
      name: "Vestido Sirena Azul E9 Modificado por A",
      price: 70,
    }).eq("id", "prod-sync-audit-01");

    // 4. B intenta guardar sus cambios
    const saveBtnB = pageB.getByRole("button", { name: "Guardar Cambios" });
    await saveBtnB.click();

    // 5. Debe salir el aviso de conflicto optimista (RF-44.5)
    await expect(
      pageB.getByText("Este producto se modificó desde otro dispositivo")
    ).toBeVisible({ timeout: 8000 });

    // 6. Verificar en la base de datos real que los cambios de A se mantuvieron intactos y B no los pisó
    const { data: dbProd } = await supabase
      .from("products")
      .select("name, price, version, visible")
      .eq("id", "prod-sync-audit-01")
      .single();

    expect(dbProd.name).toBe("Vestido Sirena Azul E9 Modificado por A");
    expect(Number(dbProd.price)).toBe(70); // NO fue pisado por 199.00

    await contextA.close();
    await contextB.close();
  });
});
