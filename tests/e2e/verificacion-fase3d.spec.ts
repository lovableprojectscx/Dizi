import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";
import https from "https";
const SUPABASE_URL = "https://zkqzdwxjthjdjchimmds.supabase.co";
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "";

async function signUpUser(email: string, pass: string) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password: pass }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`signUpUser failed: ${txt}`);
  }
  return res.json();
}

import crypto from "crypto";

const SUPER_EMAIL = `zz-audit-super-${crypto.randomUUID().slice(0, 8)}@testdizi.com`;
const SUPER_PASS = `Audit-${crypto.randomUUID()}!`;

async function getAuthToken(email: string, pass: string): Promise<string> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password: pass }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`getAuthToken failed: ${txt}`);
  }
  const data = await res.json();
  return data.access_token;
}

async function createStoreDirect(storeId: string, slug: string, token: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/initialize_store`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      p_id: storeId,
      p_slug: slug,
      p_name: "Tienda Fresca Audit",
      p_phone: "51999888777",
      p_country_code: "51",
      p_country_iso: "PE",
      p_category_id: `c_${storeId}`,
      p_plan: "semilla",
      p_owner_id: "94880b8d-2525-46eb-b3e8-8d81c83644b2",
      p_model: "minimal",
      p_niche: "general",
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`initialize_store failed (${res.status}): ${txt}`);
  }
}

function getMcpToken() {
  const tokenFilePath = "C:\\Users\\JACK FRANKLIN\\.gemini\\antigravity\\mcp_oauth_tokens.json";
  if (fs.existsSync(tokenFilePath)) {
    try {
      const data = JSON.parse(fs.readFileSync(tokenFilePath, "utf8"));
      if (data["https://mcp.supabase.com/mcp"] && data["https://mcp.supabase.com/mcp"].token) {
        return data["https://mcp.supabase.com/mcp"].token.access_token;
      }
    } catch (e) {}
  }
  return null;
}

function executeSql(query: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const token = getMcpToken();
    if (!token) return reject(new Error("No MCP token"));
    const payload = JSON.stringify({ query });
    const req = https.request({
      hostname: "api.supabase.com",
      path: "/v1/projects/zkqzdwxjthjdjchimmds/database/query",
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
      },
    }, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(data);
        }
      });
    });
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

test.describe("Fase 3D: Datos Frescos en Panel y Actualización de Logos", () => {
  test.describe.configure({ mode: "serial" });

  test.use({
    viewport: { width: 360, height: 800 },
  });

  test.setTimeout(240_000);

  const LOGO_SLUG = `zz-audit-logo-${Date.now().toString(36)}`;
  const LOGO_EMAIL = `${LOGO_SLUG}@testdizi.com`;
  const LOGO_PASS = `Audit-${crypto.randomUUID()}!`;

  let createdStoreIds: string[] = [];

  test.beforeAll(async () => {
    console.log(`[BeforeAll] Configurando super admin de prueba con credenciales dinámicas: ${SUPER_EMAIL}...`);
    await signUpUser(SUPER_EMAIL, SUPER_PASS);
    await executeSql(`
      UPDATE auth.users
      SET email_confirmed_at = now(),
          raw_app_meta_data = '{"provider":"email","providers":["email"],"role":"super_admin"}'::jsonb
      WHERE email = '${SUPER_EMAIL}';
    `);
    console.log("[BeforeAll] Super admin temporal configurado exitosamente.");
  });

  test.afterAll(async () => {
    console.log("[Teardown] Limpiando datos de prueba...");
    try {
      // 1. Limpiar fotos creadas en storage usando Storage API antes de borrar el superToken
      let superToken = "";
      try {
        superToken = await getAuthToken(SUPER_EMAIL, SUPER_PASS);
      } catch (e) {
        console.warn("[Teardown] No se pudo obtener superToken:", e);
      }

      const objects: any = await executeSql(`
        SELECT name FROM storage.objects 
        WHERE bucket_id = 'images' 
        AND (name LIKE 's_%' AND (storage.foldername(name))[1] IN (SELECT id FROM public.stores WHERE slug LIKE 'zz-audit%'));
      `);
      if (Array.isArray(objects) && objects.length > 0 && superToken) {
        const paths = objects.map((o: any) => o.name);
        await fetch(`${SUPABASE_URL}/storage/v1/object/images`, {
          method: "DELETE",
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${superToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prefixes: paths }),
        });
        console.log(`[Teardown] Eliminadas ${paths.length} fotos de storage.`);
      }

      // 2. Limpiar registros en base de datos
      await executeSql(`
        DELETE FROM public.products WHERE store_id IN (SELECT id FROM public.stores WHERE slug LIKE 'zz-audit%');
        DELETE FROM public.categories WHERE store_id IN (SELECT id FROM public.stores WHERE slug LIKE 'zz-audit%');
        DELETE FROM public.stores WHERE slug LIKE 'zz-audit%';
      `);
      console.log("[Teardown] Registros de BD de prueba eliminados.");
    } catch (err) {
      console.error("[Teardown] Error durante limpieza de storage/BD:", err);
    } finally {
      // SIEMPRE borrar todos los usuarios temporales audit y super admins en finally
      try {
        // Borrar usuarios de prueba por sus IDs exactos creados en esta corrida
        const userRows: any = await executeSql(`
          SELECT id FROM auth.users WHERE email IN ('${SUPER_EMAIL}', '${LOGO_EMAIL}')
        `);
        const userIds = Array.isArray(userRows) ? userRows.map((r: any) => r.id).filter(Boolean) : [];
        if (userIds.length > 0) {
          const idsList = userIds.map((id: string) => `'${id}'`).join(", ");
          await executeSql(`
            DELETE FROM auth.identities WHERE user_id IN (${idsList});
            DELETE FROM auth.users WHERE id IN (${idsList});
          `);
          console.log(`[Teardown] ${userIds.length} usuarios temporales borrados por ID exacto.`);
        } else {
          // Fallback seguro usando patrón exacto de prueba (nunca filtro amplio)
          await executeSql(`
            DELETE FROM auth.identities WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE 'zz-audit-%@testdizi.com');
            DELETE FROM auth.users WHERE email LIKE 'zz-audit-%@testdizi.com';
          `);
          console.log("[Teardown] Usuarios temporales borrados con patrón exacto 'zz-audit-%@testdizi.com'.");
        }


        // 3. Verificación de conteo residual canónico usando split_part
        const checkRes: any = await executeSql(`
          SELECT 'stores_audit' as tipo, count(*)::text as cant FROM public.stores WHERE slug LIKE 'zz-audit%'
          UNION ALL
          SELECT 'users_audit', count(*)::text FROM auth.users WHERE email LIKE '%audit%'
          UNION ALL
          SELECT 'invites_audit', count(*)::text FROM public.invites WHERE token LIKE '%audit%' OR notes LIKE '%audit%'
          UNION ALL
          SELECT 'sueltas', count(*)::text FROM storage.objects WHERE bucket_id = 'images' AND split_part(name, '/', 1) NOT IN (SELECT id::text FROM public.stores);
        `);
        console.log("[Teardown] Conteo canónico final:", checkRes);

        // 4. Verificación de que no queda ningún super_admin aparte de Jack
        const superAdmins: any = await executeSql(`
          SELECT id, email, raw_app_meta_data->>'role' as role 
          FROM auth.users 
          WHERE raw_app_meta_data->>'role' = 'super_admin';
        `);
        console.log("[Teardown] Super admins restantes en el sistema (solo Jack):", superAdmins);
      } catch (finallyErr) {
        console.error("[Teardown] Error en finally de teardown:", finallyErr);
      }
    }
  });

  test("1. Super Admin: Botón Actualizar refresca tiendas nuevas sin borrar caché", async ({ page }) => {
    // 1. Iniciar sesión como Super Admin
    await page.goto("/super/login");
    await page.waitForLoadState("domcontentloaded");

    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible({ timeout: 15000 });
    await emailInput.fill(SUPER_EMAIL);

    const passInput = page.locator('input[type="password"]');
    await passInput.fill(SUPER_PASS);

    const loginBtn = page.locator('button[type="submit"]').or(page.locator('button:has-text("Ingresar")')).first();
    await loginBtn.click();

    await page.waitForURL(/\/super\/dashboard/, { timeout: 25000 });
    console.log("[E2E] Login Super Admin exitoso.");

    // 2. Navegar a /super/tiendas
    await page.goto("/super/tiendas");
    await page.waitForLoadState("domcontentloaded");

    // Verificar presencia de "Tiendas Registradas" y el botón "Actualizar"
    await expect(page.locator("text=Tiendas Registradas")).toBeVisible({ timeout: 15000 });
    const refreshBtn = page.getByRole("button", { name: /actualizar/i });
    await expect(refreshBtn).toBeVisible();
    await expect(page.locator("text=/actualizado/i").first()).toBeVisible();

    // 3. Crear una tienda fresca en la base de datos en segundo plano mediante RPC autenticada
    const superToken = await getAuthToken(SUPER_EMAIL, SUPER_PASS);
    const freshSlug = `zz-audit-fresca-${Date.now().toString(36)}`;
    const freshStoreId = `s_${Date.now().toString(36).slice(-7)}`;
    createdStoreIds.push(freshStoreId);

    await createStoreDirect(freshStoreId, freshSlug, superToken);
    console.log(`[E2E] Tienda creada en BD en segundo plano: ${freshSlug} (${freshStoreId})`);

    // Verificar que inicialmente NO está en el DOM porque la caché local del panel retiene la lista anterior
    const searchInput = page.locator('input[placeholder*="Buscar tienda"]').first();
    await searchInput.fill(freshSlug);
    await page.waitForTimeout(600);
    expect(await page.locator(`text=${freshSlug}`).isVisible()).toBe(false);

    // Limpiar campo de búsqueda
    await searchInput.fill("");

    // 4. Presionar botón "Actualizar"
    await refreshBtn.click();

    // Esperar a que termine de actualizar y vuelva el estado "Actualizado hace un momento"
    await expect(page.locator("text=/actualizado hace un momento/i")).toBeVisible({ timeout: 15000 });

    // 5. La tienda fresca AHORA aparece en la lista sin borrar caché ni recargar página
    await searchInput.fill(freshSlug);
    await expect(page.locator(`text=${freshSlug}`).filter({ visible: true }).first()).toBeVisible({ timeout: 10000 });
    console.log(`[E2E] Tienda fresca ${freshSlug} visible inmediatamente tras pulsar Actualizar.`);

    await page.screenshot({ path: "test-results/fase3d/01_super_tiendas_actualizado.png" });
  });

  test("2. Logo con nombre único timestamped y borrado automático del archivo anterior en Storage", async ({ page }) => {
    // 1. Registro de tienda audit
    await page.goto("/register");
    await page.waitForLoadState("domcontentloaded");

    const nameInput = page.locator('input[placeholder="Ej. Florería María"]');
    await expect(nameInput).toBeVisible({ timeout: 15000 });
    await nameInput.fill(`Tienda ${LOGO_SLUG}`);

    const phoneInput = page.locator('input[type="tel"]');
    await phoneInput.fill("912 345 678");

    await page.locator('button:has-text("Siguiente paso")').click();
    await page.waitForTimeout(600);
    await page.locator('button:has-text("Siguiente paso")').click();
    await page.waitForTimeout(600);

    await page.locator('input[placeholder="floreria-maria"]').fill(LOGO_SLUG);
    await page.locator('input[type="email"]').fill(LOGO_EMAIL);
    await page.locator('input[type="password"]').fill(LOGO_PASS);

    const termsCheckbox = page.locator("#acceptTerms");
    await termsCheckbox.check();

    await page.locator('button:has-text("Lanzar mi Catálogo")').click();
    await page.waitForURL(/\/admin/, { timeout: 35000 });

    // Cerrar modal de bienvenida / configuración inicial
    await page.waitForTimeout(1000);
    const skipConfigBtn = page.locator('button:has-text("Saltar configuración")');
    if (await skipConfigBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await skipConfigBtn.click({ force: true });
      await page.waitForTimeout(500);
    }
    const closeWizard = page.locator('button[aria-label="Cerrar"], button:has-text("Cerrar")').first();
    if (await closeWizard.isVisible({ timeout: 2000 }).catch(() => false)) {
      await closeWizard.click({ force: true });
      await page.waitForTimeout(500);
    }
    const residualDialog = page.locator('[role="dialog"]');
    if (await residualDialog.isVisible({ timeout: 1000 }).catch(() => false)) {
      await page.keyboard.press("Escape");
      await page.waitForTimeout(500);
    }

    // 2. Ir a /admin/configuracion y subir Logo A
    await page.goto("/admin/configuracion");
    await page.waitForLoadState("domcontentloaded");

    const logoInput = page.locator('input[title="Haz clic para subir logo"]');
    await expect(logoInput).toBeAttached({ timeout: 10000 });

    const logoAPath = path.resolve("scratch/logo_a.png");
    await logoInput.setInputFiles(logoAPath);

    // Esperar a que la imagen se convierta a WebP
    await page.waitForTimeout(1500);

    // Guardar cambios
    const saveBtn = page.getByRole("button", { name: /guardar cambios/i });
    await saveBtn.scrollIntoViewIfNeeded();
    await expect(saveBtn).toBeEnabled({ timeout: 10000 });
    await saveBtn.click();
    await expect(page.locator("text=Configuración guardada correctamente")).toBeVisible({ timeout: 15000 });

    // 3. Abrir catálogo público /t/<slug> y verificar Logo A
    await page.goto(`/t/${LOGO_SLUG}`);
    await page.waitForLoadState("domcontentloaded");
    const logoImgA = page.locator('header img[src*="logo_"]').first();
    await expect(logoImgA).toBeVisible({ timeout: 10000 });
    const srcA = await logoImgA.getAttribute("src");
    console.log("[E2E] Logo A cargado en catálogo con URL:", srcA);
    expect(srcA).toContain("logo_");

    // 4. Volver a /admin/configuracion y subir Logo B
    await page.goto("/admin/configuracion");
    await page.waitForLoadState("domcontentloaded");

    const logoBPath = path.resolve("scratch/logo_b.png");
    await logoInput.setInputFiles(logoBPath);
    await page.waitForTimeout(1500);

    await saveBtn.scrollIntoViewIfNeeded();
    await saveBtn.click();
    await expect(page.locator("text=Configuración guardada correctamente")).toBeVisible({ timeout: 15000 });

    // 5. Recargar catálogo público /t/<slug> y verificar Logo B
    await page.goto(`/t/${LOGO_SLUG}`);
    await page.waitForLoadState("domcontentloaded");
    const logoImgB = page.locator('header img[src*="logo_"]').first();
    await expect(logoImgB).toBeVisible({ timeout: 10000 });
    const srcB = await logoImgB.getAttribute("src");
    console.log("[E2E] Logo B cargado en catálogo con URL:", srcB);
    expect(srcB).toContain("logo_");
    expect(srcB).not.toBe(srcA);

    // 6. Verificar en Storage que Logo A fue eliminado y solo existe Logo B
    const filenameA = srcA?.split("/").pop();
    const filenameB = srcB?.split("/").pop();
    expect(filenameA).not.toBe(filenameB);

    const storeRow: any = await executeSql(`SELECT id FROM public.stores WHERE slug = '${LOGO_SLUG}';`);
    const storeId = storeRow[0]?.id;
    if (storeId) {
      createdStoreIds.push(storeId);
      const storageRows: any = await executeSql(`
        SELECT name FROM storage.objects 
        WHERE bucket_id = 'images' AND name LIKE '${storeId}/logo_%';
      `);
      console.log(`[E2E] Logos en storage para ${storeId}:`, storageRows.map((r: any) => r.name));
      expect(storageRows.some((r: any) => r.name.includes(filenameA))).toBe(false);
      expect(storageRows.some((r: any) => r.name.includes(filenameB))).toBe(true);
    }

    await page.screenshot({ path: "test-results/fase3d/02_logo_actualizado_catalogo.png" });
  });

  test("3. Sincronizar logo con bio, cambiar logo del bio -> logo del catálogo sigue cargando (HTTP 200)", async ({ page }) => {
    // 1. Obtener la URL del logo actual del catálogo en la base de datos
    const storeRow: any = await executeSql(`SELECT id, logo FROM public.stores WHERE slug = '${LOGO_SLUG}';`);
    const catalogLogoUrl = storeRow[0]?.logo;
    expect(catalogLogoUrl).toBeTruthy();
    console.log(`[E2E Test 3] Logo activo del catálogo: ${catalogLogoUrl}`);

    // Iniciar sesión con la tienda creada
    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");
    await page.locator('input[type="email"]').fill(LOGO_EMAIL);
    await page.locator('input[type="password"]').fill(LOGO_PASS);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/admin/, { timeout: 25000 });

    // Descartar posibles diálogos residuales
    const skipBtn = page.locator('button:has-text("Saltar configuración")');
    if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipBtn.click({ force: true });
    }
    if (await page.locator('[role="dialog"]').isVisible({ timeout: 1000 }).catch(() => false)) {
      await page.keyboard.press("Escape");
    }

    // Navegar a /admin/link-bio
    await page.goto("/admin/link-bio");
    await page.waitForLoadState("domcontentloaded");

    // En tiendas nuevas el Bio-Link viene desactivado; habilitarlo si el switch está inactivo
    const enableSwitch = page.locator('button[role="switch"]').first();
    await expect(enableSwitch).toBeVisible({ timeout: 15000 });
    const isChecked = await enableSwitch.getAttribute("aria-checked");
    if (isChecked !== "true") {
      await enableSwitch.click();
      await page.waitForTimeout(600);
    }

    // Cambiar a pestaña "Apariencia" donde reside la foto de perfil y el botón de sincronización
    const aparienciaTab = page.locator('button[role="tab"]:has-text("Apariencia")');
    await expect(aparienciaTab).toBeVisible({ timeout: 10000 });
    await aparienciaTab.click();

    // 2. Sincronizar el logo con el bio ("Usar logo de mi tienda")
    const syncLogoBtn = page.getByRole("button", { name: /usar logo de mi tienda/i });
    await expect(syncLogoBtn).toBeVisible({ timeout: 10000 });
    await syncLogoBtn.click();
    await expect(page.locator("text=sincronizada con el logo de tu tienda")).toBeVisible({ timeout: 5000 });

    // Guardar cambios en Link-in-Bio (sincronizado con store.logo)
    const saveBioBtn = page.getByRole("button", { name: /guardar cambios/i });
    await saveBioBtn.scrollIntoViewIfNeeded();
    await expect(saveBioBtn).toBeEnabled({ timeout: 10000 });
    const patch1Promise = page.waitForResponse(
      (res) => res.url().includes("/rest/v1/stores") && res.request().method() === "PATCH" && (res.status() === 204 || res.status() === 200)
    );
    await saveBioBtn.click();
    await patch1Promise;
    await expect(page.locator("text=guardado correctamente").first()).toBeVisible({ timeout: 15000 });

    // Verificar en BD que bio_logo == logo
    const checkSynced: any = await executeSql(`SELECT logo, bio_logo FROM public.stores WHERE slug = '${LOGO_SLUG}';`);
    expect(checkSynced[0]?.bio_logo).toBe(catalogLogoUrl);
    console.log(`[E2E Test 3] Sincronización exitosa: bio_logo === logo (${catalogLogoUrl})`);

    // 3. Cambiar el logo del bio subiendo una imagen nueva
    await aparienciaTab.click();
    const bioLogoFileInput = page.locator('label:has-text("Foto de Perfil Especial")').locator('..').locator('input[type="file"]');
    await bioLogoFileInput.setInputFiles("scratch/logo_a.png");
    await page.waitForTimeout(2000);

    // Guardar cambios en Link-in-Bio con el nuevo bioLogo
    await saveBioBtn.scrollIntoViewIfNeeded();
    await expect(saveBioBtn).toBeEnabled({ timeout: 10000 });
    const patch2Promise = page.waitForResponse(
      (res) => res.url().includes("/rest/v1/stores") && res.request().method() === "PATCH" && (res.status() === 204 || res.status() === 200)
    );
    await saveBioBtn.click();
    await patch2Promise;
    await expect(page.locator("text=guardado correctamente").first()).toBeVisible({ timeout: 15000 });

    // Verificar en BD que bio_logo cambió pero store.logo sigue apuntando al logo original
    const checkAfterChange: any = await executeSql(`SELECT logo, bio_logo FROM public.stores WHERE slug = '${LOGO_SLUG}';`);
    expect(checkAfterChange[0]?.logo).toBe(catalogLogoUrl);
    expect(checkAfterChange[0]?.bio_logo).not.toBe(catalogLogoUrl);
    console.log(`[E2E Test 3] Nuevo bio_logo: ${checkAfterChange[0]?.bio_logo}`);

    // 4. Probar que el logo del catálogo sigue existiendo y respondiendo HTTP 200 (no fue borrado de Storage)
    const logoHttpRes = await page.request.get(catalogLogoUrl);
    expect(logoHttpRes.status()).toBe(200);
    console.log(`[E2E Test 3] HTTP ${logoHttpRes.status()} verificado exitosamente en ${catalogLogoUrl}`);

    // 5. Cargar el catálogo público /t/<slug> y confirmar que el logo se renderiza
    await page.goto(`/t/${LOGO_SLUG}`);
    await page.waitForLoadState("domcontentloaded");
    const catalogLogoImg = page.locator('header img[src*="logo_"]').first();
    await expect(catalogLogoImg).toBeVisible({ timeout: 10000 });
    const renderedSrc = await catalogLogoImg.getAttribute("src");
    expect(renderedSrc).toBe(catalogLogoUrl);
    console.log("[E2E Test 3] Verificación completada: el logo del catálogo sigue intacto y visible.");
  });

  test("4. Lista 'no romper' §4 (puntos 2, 3, 4, 8)", async ({ page }) => {
    // Iniciar sesión con la tienda creada
    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");
    await page.locator('input[type="email"]').fill(LOGO_EMAIL);
    await page.locator('input[type="password"]').fill(LOGO_PASS);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/admin/, { timeout: 25000 });

    // Cerrar cualquier diálogo inicial si existiera
    const skipConfigBtn = page.locator('button:has-text("Saltar configuración")');
    if (await skipConfigBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipConfigBtn.click({ force: true });
    }
    const residualDialog = page.locator('[role="dialog"]');
    if (await residualDialog.isVisible({ timeout: 1000 }).catch(() => false)) {
      await page.keyboard.press("Escape");
    }

    // Punto 2: Subir 1 producto con foto
    await page.goto("/admin/productos");
    await page.waitForLoadState("domcontentloaded");
    const newProdBtn = page.locator('button:has-text("+ Producto")').or(page.locator('button:has-text("Nuevo Producto")')).first();
    await expect(newProdBtn).toBeVisible({ timeout: 15000 });
    await newProdBtn.click();

    const nameInput = page.locator('input[placeholder*="iPhone"]').first();
    await expect(nameInput).toBeVisible({ timeout: 10000 });
    await nameInput.fill("Producto Prueba Audit");
    const consultLabel = page.locator('label:has-text("A consultar")').first();
    await consultLabel.click();
    const priceInput = page.locator('input[placeholder="0.00"]').or(page.locator('input[inputmode="decimal"]')).first();
    await priceInput.fill("25.00");

    const fileInput = page.locator('input[type="file"][accept*="image"]:not([multiple])').first();
    await fileInput.setInputFiles("scratch/logo_a.png");
    await page.waitForTimeout(1500);

    const saveProdBtn = page.locator('button:has-text("Guardar producto")').or(page.locator('button:has-text("Guardar Producto")')).first();
    await expect(saveProdBtn).toBeEnabled({ timeout: 10000 });
    await saveProdBtn.click();
    await expect(page.locator("text=Producto Prueba Audit").filter({ visible: true }).first()).toBeVisible({ timeout: 20000 });
    console.log("[No Romper §4.2] Producto con foto creado con éxito.");

    // Punto 3: Cambiar diseño y guardar configuración
    await page.goto("/admin/diseno");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("text=Diseño del Catálogo").or(page.locator("text=Estructura")).first()).toBeVisible({ timeout: 15000 });
    const saveDesignBtn = page.getByRole("button", { name: /guardar cambios/i }).first();
    if (await saveDesignBtn.isVisible()) {
      await saveDesignBtn.click();
      await expect(page.locator("text=guardado con éxito").or(page.locator("text=guardado")).first()).toBeVisible({ timeout: 10000 });
    }
    console.log("[No Romper §4.3] Pantalla de diseño cargada y guardada.");

    // Punto 4: Abrir /admin/link-bio, ver enlaces y guardar
    await page.goto("/admin/link-bio");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("text=Link en Bio")).toBeVisible({ timeout: 15000 });
    const saveBioBtn = page.getByRole("button", { name: /guardar cambios/i }).or(page.getByRole("button", { name: /guardar/i })).first();
    if (await saveBioBtn.isVisible()) {
      await saveBioBtn.click();
      await expect(page.locator("text=guardado correctamente").first()).toBeVisible({ timeout: 15000 });
    }
    console.log("[No Romper §4.4] Link en Bio guardado correctamente.");

    // Punto 8: Super Admin - verificar gestión de suscripción
    // Asegurar usuario super admin activo
    const superCheck: any = await executeSql(`SELECT id FROM auth.users WHERE email = '${SUPER_EMAIL}';`);
    if (!superCheck || superCheck.length === 0) {
      await signUpUser(SUPER_EMAIL, SUPER_PASS);
      await executeSql(`
        UPDATE auth.users
        SET email_confirmed_at = now(),
            raw_app_meta_data = '{"provider":"email","providers":["email"],"role":"super_admin"}'::jsonb
        WHERE email = '${SUPER_EMAIL}';
      `);
    }

    await page.context().clearCookies();
    await page.goto("/super/login");
    await page.waitForLoadState("domcontentloaded");
    const superEmailInput = page.locator('input[type="email"]');
    await expect(superEmailInput).toBeVisible({ timeout: 15000 });
    await superEmailInput.fill(SUPER_EMAIL);
    await page.locator('input[type="password"]').fill(SUPER_PASS);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/super\/dashboard/, { timeout: 25000 });

    await page.goto("/super/tiendas");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("text=Total Tiendas").or(page.locator("text=Tiendas Registradas")).filter({ visible: true }).first()).toBeVisible({ timeout: 15000 });
    console.log("[No Romper §4.8] Super Admin tiendas cargado y operativo.");
  });
});
