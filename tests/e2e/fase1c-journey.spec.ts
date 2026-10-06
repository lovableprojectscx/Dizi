import { test, expect } from "@playwright/test";
import crypto from "crypto";
import fs from "fs";
import https from "https";

const SUPABASE_URL = "https://zkqzdwxjthjdjchimmds.supabase.co";
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "";

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

/**
 * FASE 1C · Suite de Pruebas E2E de Blindaje (Mobile Viewport 360x800)
 *
 * Escenarios requeridos por Jack:
 * 1. Registro normal (plan semilla).
 * 2. Dueño guarda configuración y diseño.
 * 3. Logo + 1 producto + carga masiva.
 * 4. Llega al límite del plan: mensaje toast sin perder borradores.
 * 5. Borrado de fotos de Storage con la sesión autenticada del dueño.
 * 6. Registro con invitación (token canjeado -> plan emprendedor activo).
 * 7. Superadmin gestiona (login a /super/login -> /super/tiendas).
 */

test.describe("FASE 1C · Suite de Blindaje E2E (360x800)", () => {
  test.use({
    viewport: { width: 360, height: 800 },
  });

  test.setTimeout(240_000);

  const NORMAL_SLUG = "zz-audit-c1c-normal";
  const NORMAL_EMAIL = "zz-audit-c1c-normal@testdizi.com";
  const NORMAL_PASS = `Audit-${crypto.randomUUID()}!`;
  const NORMAL_NAME = "Audit Normal 1C";
  const NORMAL_PHONE = "912345678";

  const INVITED_SLUG = "zz-audit-c1c-invited";
  const INVITED_EMAIL = "zz-audit-c1c-invited@testdizi.com";
  const INVITED_PASS = `Audit-${crypto.randomUUID()}!`;
  const INVITED_NAME = "Audit Invitada 1C";
  const INVITED_PHONE = "912345679";
  const INVITE_TOKEN = "tok-audit-c1c-inv";

  const SUPER_EMAIL = `zz-audit-super-${crypto.randomUUID().slice(0, 8)}@testdizi.com`;
  const SUPER_PASS = `Audit-${crypto.randomUUID()}!`;

  test.beforeAll(async () => {
    // Configurar super admin temporal con credencial aleatoria
    console.log(`[BeforeAll Fase 1C] Creando super admin dinámico: ${SUPER_EMAIL}...`);
    await signUpUser(SUPER_EMAIL, SUPER_PASS);
    await executeSql(`
      UPDATE auth.users
      SET email_confirmed_at = now(),
          raw_app_meta_data = '{"provider":"email","providers":["email"],"role":"super_admin"}'::jsonb
      WHERE email = '${SUPER_EMAIL}';
    `);

    // Asegurar token de invitación para el paso 6
    await executeSql(`
      INSERT INTO public.invites (token, plan, used, expires_at, duration_months, duration_value, duration_unit, notes)
      VALUES ('${INVITE_TOKEN}', 'emprendedor', false, now() + interval '30 days', 1, 1, 'months', 'Fase 1C audit')
      ON CONFLICT (token) DO UPDATE SET used = false, expires_at = now() + interval '30 days';
    `);
    console.log("[BeforeAll Fase 1C] Super admin e invitación configurados.");
  });

  test.afterAll(async () => {
    console.log("[Teardown Fase 1C] Limpiando datos de prueba...");
    try {
      await executeSql(`
        DELETE FROM public.invites WHERE token = '${INVITE_TOKEN}';
        DELETE FROM public.products WHERE store_id IN (SELECT id FROM public.stores WHERE slug LIKE 'zz-audit%');
        DELETE FROM public.categories WHERE store_id IN (SELECT id FROM public.stores WHERE slug LIKE 'zz-audit%');
        DELETE FROM public.stores WHERE slug LIKE 'zz-audit%';
      `);
      console.log("[Teardown Fase 1C] Registros de BD de prueba eliminados.");
    } catch (err) {
      console.error("[Teardown Fase 1C] Error en limpieza de BD:", err);
    } finally {
      try {
        // Borrar usuarios de prueba por sus IDs exactos creados en esta corrida
        const userRows: any = await executeSql(`
          SELECT id FROM auth.users WHERE email IN ('${SUPER_EMAIL}', '${NORMAL_EMAIL}', '${INVITED_EMAIL}')
        `);
        const userIds = Array.isArray(userRows) ? userRows.map((r: any) => r.id).filter(Boolean) : [];
        if (userIds.length > 0) {
          const idsList = userIds.map((id: string) => `'${id}'`).join(", ");
          await executeSql(`
            DELETE FROM auth.identities WHERE user_id IN (${idsList});
            DELETE FROM auth.users WHERE id IN (${idsList});
          `);
          console.log(`[Teardown Fase 1C] ${userIds.length} usuarios temporales borrados por ID exacto.`);
        } else {
          // Fallback seguro usando patrón exacto de prueba (nunca filtro amplio)
          await executeSql(`
            DELETE FROM auth.identities WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE 'zz-audit-%@testdizi.com');
            DELETE FROM auth.users WHERE email LIKE 'zz-audit-%@testdizi.com';
          `);
          console.log("[Teardown Fase 1C] Usuarios temporales borrados con patrón exacto 'zz-audit-%@testdizi.com'.");
        }


        const superAdmins: any = await executeSql(`
          SELECT id, email, raw_app_meta_data->>'role' as role 
          FROM auth.users 
          WHERE raw_app_meta_data->>'role' = 'super_admin';
        `);
        console.log("[Teardown Fase 1C] Super admins restantes (solo Jack):", superAdmins);
      } catch (finallyErr) {
        console.error("[Teardown Fase 1C] Error en finally:", finallyErr);
      }
    }
  });

  test("Recorrido completo Fase 1C", async ({ page }) => {
    // ─────────────────────────────────────────────────────────────
    // 1. REGISTRO NORMAL (Plan Semilla)
    // ─────────────────────────────────────────────────────────────
    console.log("[Paso 1] Iniciando Registro Normal...");
    await page.goto("/register");
    await page.waitForLoadState("domcontentloaded");

    // Paso 1 de registro: Nombre y teléfono
    const nameInput = page.locator('input[placeholder="Ej. Florería María"]');
    await expect(nameInput).toBeVisible({ timeout: 15000 });
    await nameInput.fill(NORMAL_NAME);

    const phoneInput = page.locator('input[type="tel"]');
    await phoneInput.fill(NORMAL_PHONE);

    const nextBtn1 = page.locator('button:has-text("Siguiente paso")');
    await expect(nextBtn1).toBeEnabled();
    await nextBtn1.click();

    // Paso 2: Plantilla
    await page.waitForTimeout(600);
    const nextBtn2 = page.locator('button:has-text("Siguiente paso")');
    await expect(nextBtn2).toBeVisible({ timeout: 10000 });
    await nextBtn2.click();

    // Paso 3: Credenciales
    await page.waitForTimeout(600);
    const slugInput = page.locator('input[placeholder="floreria-maria"]');
    await slugInput.fill(NORMAL_SLUG);

    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill(NORMAL_EMAIL);

    const passInput = page.locator('input[type="password"]');
    await passInput.fill(NORMAL_PASS);

    const termsCheck = page.locator("#acceptTerms");
    if (await termsCheck.isVisible().catch(() => false)) {
      await termsCheck.check();
    }

    const submitRegister = page.locator('button:has-text("Lanzar mi Catálogo")');
    await expect(submitRegister).toBeEnabled();
    await submitRegister.click();

    // Redirección al panel /admin
    await page.waitForURL(/\/admin/, { timeout: 35000 });
    await expect(page).toHaveURL(/\/admin/);
    console.log("[Paso 1] Registro normal completado exitosamente en /admin");

    await page.screenshot({ path: "test-results/capturas-fase1c/01_registro_normal.png" });

    // Cerrar modal de bienvenida / onboarding si aparece
    await page.waitForTimeout(1500);
    const onboardingClose = page.locator('button[aria-label="Cerrar"]').or(page.locator('button:has-text("Cerrar")')).or(page.locator('button:has-text("Saltar")')).or(page.locator('button:has-text("Entendido")')).first();
    if (await onboardingClose.isVisible({ timeout: 3000 }).catch(() => false)) {
      await onboardingClose.click({ force: true });
      await page.waitForTimeout(500);
    }

    // Obtener storeId de la tienda creada vía client
    const storeInfo = await page.evaluate(async (slug) => {
      const sb = (window as any).__supabase;
      if (!sb) return null;
      const { data } = await sb.from("stores").select("id, plan, slug").eq("slug", slug).maybeSingle();
      return data;
    }, NORMAL_SLUG);

    console.log("Tienda Normal en BD:", storeInfo);
    expect(storeInfo).not.toBeNull();
    expect(storeInfo.plan).toBe("semilla");
    const normalStoreId = storeInfo.id;

    // ─────────────────────────────────────────────────────────────
    // 2. DUEÑO GUARDA CONFIGURACIÓN Y DISEÑO
    // ─────────────────────────────────────────────────────────────
    console.log("[Paso 2] Probando que el dueño guarde Configuración y Diseño...");
    await page.goto("/admin/configuracion");
    await page.waitForLoadState("domcontentloaded");

    // Modificar nombre comercial
    const configNameInput = page.locator('input[placeholder="Mi Tienda"]');
    await expect(configNameInput).toBeVisible({ timeout: 15000 });
    await configNameInput.fill("Audit Normal Editada");

    // Subir logo
    const logoInput = page.locator('input[type="file"][accept="image/*"]').first();
    await logoInput.setInputFiles("public/images/mockups/boutique.png");
    await page.waitForTimeout(1500);

    // Guardar cambios en configuración
    const saveConfigBtn = page.locator('button:has-text("Guardar cambios")').first();
    await expect(saveConfigBtn).toBeEnabled({ timeout: 10000 });
    await saveConfigBtn.click();

    // Esperar mensaje toast de éxito
    await expect(page.locator("text=Configuración guardada").or(page.locator("text=guardad"))).toBeVisible({ timeout: 15000 });
    console.log("[Paso 2a] Configuración y logo guardados exitosamente.");

    // Ir a /admin/diseno y guardar
    await page.goto("/admin/diseno");
    await page.waitForLoadState("domcontentloaded");

    const saveDisenoBtn = page.locator('button:has-text("Guardar cambios")').first();
    await expect(saveDisenoBtn).toBeVisible({ timeout: 15000 });
    await saveDisenoBtn.click();
    await expect(page.locator("text=Diseño guardado").or(page.locator("text=guardad"))).toBeVisible({ timeout: 15000 });
    console.log("[Paso 2b] Diseño guardado exitosamente.");

    await page.screenshot({ path: "test-results/capturas-fase1c/02_dueno_guarda_config_diseno.png" });

    // ─────────────────────────────────────────────────────────────
    // 3. LOGO + 1 PRODUCTO + CARGA MASIVA
    // ─────────────────────────────────────────────────────────────
    console.log("[Paso 3] Creando 1 producto individual y realizando carga masiva...");
    await page.goto("/admin/productos");
    await page.waitForLoadState("domcontentloaded");

    // 3.1: Producto individual
    const newProdBtn = page.locator('button:has-text("Nuevo Producto")').or(page.locator('button:has-text("Crear producto")')).first();
    await expect(newProdBtn).toBeVisible({ timeout: 15000 });
    await newProdBtn.click();

    const prodNameInput = page.locator('input[placeholder="Ej. iPhone 15 Pro Max 256GB"]');
    await expect(prodNameInput).toBeVisible({ timeout: 10000 });
    await prodNameInput.fill("Vestido Seda 1C");

    const consultCheckbox = page.locator('label:has-text("A consultar")').first();
    if (await consultCheckbox.isVisible({ timeout: 3000 }).catch(() => false)) {
      await consultCheckbox.click();
    }

    const prodPriceInput = page.locator('input[placeholder="0.00"]').or(page.locator('input[type="text"][inputMode="decimal"]')).first();
    await prodPriceInput.fill("89.00");

    const singleFileInput = page.locator('input[type="file"][accept="image/*"]:not([multiple])');
    await singleFileInput.setInputFiles("public/images/mockups/boutique.png");
    await page.waitForTimeout(1500);

    const saveSingleProdBtn = page.locator('button:has-text("Guardar producto")');
    await expect(saveSingleProdBtn).toBeEnabled();
    await saveSingleProdBtn.click();

    await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 25000 });
    console.log("[Paso 3a] 1 producto individual guardado con éxito.");

    // 3.2: Carga masiva de 2 fotos
    const multipleFileInput = page.locator('input[type="file"][multiple]');
    await multipleFileInput.setInputFiles([
      "public/images/mockups/eco.png",
      "public/images/mockups/luxury.png",
    ]);

    const bulkDialogTitle = page.locator("text=Carga Masiva por Fotos");
    await expect(bulkDialogTitle).toBeVisible({ timeout: 15000 });

    const confirmImportBtn = page.locator('button:has-text("Confirmar Importación")');
    await expect(confirmImportBtn).toBeVisible();
    await confirmImportBtn.click();

    await expect(bulkDialogTitle).not.toBeVisible({ timeout: 45000 });

    const completeDialog = page.locator("text=Completa tus productos").or(page.locator("text=Completar detalles"));
    if (await completeDialog.isVisible({ timeout: 6000 }).catch(() => false)) {
      const laterBtn = page.locator('button:has-text("Hacerlo más tarde")').or(page.locator('button:has-text("Guardar todos los cambios")')).first();
      await laterBtn.click({ force: true });
      await expect(completeDialog).not.toBeVisible({ timeout: 10000 });
    }

    console.log("[Paso 3b] Carga masiva de fotos completada.");
    await page.screenshot({ path: "test-results/capturas-fase1c/03_logo_producto_carga_masiva.png" });

    // ─────────────────────────────────────────────────────────────
    // 4. LLEGA AL LÍMITE DEL PLAN (20 productos en Semilla)
    // ─────────────────────────────────────────────────────────────
    console.log("[Paso 4] Simulando alcance del límite de 20 productos y verificando toast sin perder borrador...");

    const fillResult = await page.evaluate(async (sId) => {
      try {
        const sb = (window as any).__supabase;
        if (!sb) return { error: "No __supabase" };

        const { data: currentProducts, error: countErr } = await sb.from("products").select("id").eq("store_id", sId).eq("visible", true);
        if (countErr) return { error: countErr.message };

        const currentCount = currentProducts ? currentProducts.length : 0;
        const needed = 20 - currentCount;

        if (needed > 0) {
          const dummyInserts = [];
          for (let i = 1; i <= needed; i++) {
            dummyInserts.push({
              store_id: sId,
              name: `Prod Relleno ${i}`,
              price: 10,
              visible: true,
              is_sample: false
            });
          }
          const { error: insErr } = await sb.from("products").insert(dummyInserts);
          if (insErr) return { error: insErr.message };
        }
        return { success: true, countBeforeExceed: 20 };
      } catch (e: any) {
        return { error: e.message };
      }
    }, normalStoreId);

    console.log("Resultado de llenado a 20 productos:", fillResult);
    expect(fillResult.error).toBeUndefined();

    // Recargar página de productos para reflejar el estado actual
    await page.reload();
    await page.waitForLoadState("domcontentloaded");

    // Intentar crear el producto 21 desde la interfaz de usuario
    const addExcessBtn = page.locator('button:has-text("Nuevo Producto")').or(page.locator('button:has-text("Crear producto")')).first();
    await expect(addExcessBtn).toBeVisible({ timeout: 15000 });
    await addExcessBtn.click();

    const excessName = page.locator('input[placeholder="Ej. iPhone 15 Pro Max 256GB"]');
    await expect(excessName).toBeVisible({ timeout: 10000 });
    await excessName.fill("Producto Excedente 21");

    const excessPrice = page.locator('input[placeholder="0.00"]').or(page.locator('input[type="text"][inputMode="decimal"]')).first();
    if (await page.locator('label:has-text("A consultar")').isVisible().catch(() => false)) {
      await page.locator('label:has-text("A consultar")').click();
    }
    await excessPrice.fill("99.90");

    const excessFileInput = page.locator('input[type="file"][accept="image/*"]:not([multiple])');
    await excessFileInput.setInputFiles("public/images/mockups/pastel.png");
    await page.waitForTimeout(1500);

    const saveExcessBtn = page.locator('button:has-text("Guardar producto")');
    await saveExcessBtn.click();

    // Aserción clave 1: Debe aparecer el mensaje toast específico
    const toastLimitMsg = page.locator("text=Llegaste al límite de tu plan (20 productos). Oculta alguno o mejora tu plan.");
    await expect(toastLimitMsg).toBeVisible({ timeout: 15000 });

    // Aserción clave 2: El modal NO se cierra y los borradores NO se pierden
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(excessName).toHaveValue("Producto Excedente 21");
    console.log("[Paso 4] Aserción exitosa: Toast de límite mostrado y borrador conservado intacto.");

    await page.screenshot({ path: "test-results/capturas-fase1c/04_limite_alcanzado_toast_borrador.png" });

    // Cerrar el modal cancelando
    const cancelModalBtn = page.locator('button:has-text("Cancelar")').first();
    if (await cancelModalBtn.isVisible().catch(() => false)) {
      await cancelModalBtn.click();
    } else {
      await page.keyboard.press("Escape");
    }

    // ─────────────────────────────────────────────────────────────
    // 5. BORRADO DE FOTOS DE STORAGE CON LA SESIÓN AUTENTICADA
    // ─────────────────────────────────────────────────────────────
    console.log("[Paso 5] Limpiando fotos de Storage con la sesión autenticada del dueño...");
    const cleanupStorageResult = await page.evaluate(async (sId) => {
      try {
        const sb = (window as any).__supabase;
        if (!sb) return { success: false, reason: "No __supabase" };

        const { data: rootFiles, error: listRootErr } = await sb.storage.from("images").list(sId);
        if (listRootErr) return { success: false, error: listRootErr.message };

        const { data: prodFiles } = await sb.storage.from("images").list(`${sId}/products`);

        const paths: string[] = [];
        if (rootFiles) {
          for (const f of rootFiles) {
            if (f.name !== "products") {
              paths.push(`${sId}/${f.name}`);
            }
          }
        }
        if (prodFiles) {
          for (const f of prodFiles) {
            paths.push(`${sId}/products/${f.name}`);
          }
        }

        if (paths.length === 0) return { success: true, count: 0 };

        const { error: delErr } = await sb.storage.from("images").remove(paths);
        if (delErr) return { success: false, error: delErr.message };

        return { success: true, deletedCount: paths.length };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    }, normalStoreId);

    console.log("Resultado de borrado en Storage:", cleanupStorageResult);
    expect(cleanupStorageResult.success).toBe(true);

    // Cerrar sesión
    await page.evaluate(() => localStorage.clear());

    // ─────────────────────────────────────────────────────────────
    // 6. REGISTRO CON INVITACIÓN
    // ─────────────────────────────────────────────────────────────
    console.log("[Paso 6] Registrando tienda con token de invitación...");
    await page.goto(`/register?invite=${INVITE_TOKEN}`);
    await page.waitForLoadState("domcontentloaded");

    // Verificar que se reconoce el plan de la invitación
    await expect(page.locator("text=/EMPRENDEDOR/i").first()).toBeVisible({ timeout: 15000 });

    const invNameInput = page.locator('input[placeholder="Ej. Florería María"]');
    await invNameInput.fill(INVITED_NAME);

    const invPhoneInput = page.locator('input[type="tel"]');
    await invPhoneInput.fill(INVITED_PHONE);

    const invNext1 = page.locator('button:has-text("Siguiente paso")');
    await invNext1.click();

    await page.waitForTimeout(600);
    const invNext2 = page.locator('button:has-text("Siguiente paso")');
    await invNext2.click();

    await page.waitForTimeout(600);
    const invSlugInput = page.locator('input[placeholder="floreria-maria"]');
    await invSlugInput.fill(INVITED_SLUG);

    const invEmailInput = page.locator('input[type="email"]');
    await invEmailInput.fill(INVITED_EMAIL);

    const invPassInput = page.locator('input[type="password"]');
    await invPassInput.fill(INVITED_PASS);

    const invTerms = page.locator("#acceptTerms");
    if (await invTerms.isVisible().catch(() => false)) {
      await invTerms.check();
    }

    const invSubmit = page.locator('button:has-text("Lanzar mi Catálogo")');
    await invSubmit.click();

    await page.waitForURL(/\/admin/, { timeout: 35000 });
    console.log("[Paso 6] Registro con invitación completado en /admin");
    await page.screenshot({ path: "test-results/capturas-fase1c/05_registro_con_invitacion.png" });

    // Verificar plan de la tienda en BD vía client
    const invitedStoreInfo = await page.evaluate(async (slug) => {
      const sb = (window as any).__supabase;
      if (!sb) return null;
      const { data } = await sb.from("stores").select("id, plan, subscription_status").eq("slug", slug).maybeSingle();
      return data;
    }, INVITED_SLUG);

    console.log("Tienda Invitada en BD:", invitedStoreInfo);
    expect(invitedStoreInfo).not.toBeNull();
    expect(invitedStoreInfo.plan).toBe("emprendedor");
    expect(invitedStoreInfo.subscription_status).toBe("active");

    // Cerrar sesión
    await page.evaluate(() => localStorage.clear());

    // ─────────────────────────────────────────────────────────────
    // 7. SUPERADMIN GESTIONA
    // ─────────────────────────────────────────────────────────────
    console.log("[Paso 7] Verificando acceso y gestión del Super Administrador...");
    await page.goto("/super/login");
    await page.waitForLoadState("domcontentloaded");

    const superEmailInput = page.locator('input[type="email"]');
    await expect(superEmailInput).toBeVisible({ timeout: 15000 });
    await superEmailInput.fill(SUPER_EMAIL);

    const superPassInput = page.locator('input[type="password"]');
    await superPassInput.fill(SUPER_PASS);

    const loginBtn = page.locator('button:has-text("Ingresar al Panel")').or(page.locator('button[type="submit"]')).first();
    await loginBtn.click();

    // Esperar redirección al dashboard
    await page.waitForURL(/\/super\/dashboard/, { timeout: 25000 });
    console.log("[Paso 7a] Login de Super Admin exitoso en /super/dashboard.");

    // Navegar a /super/tiendas
    await page.goto("/super/tiendas");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.locator("body")).toContainText("Total Tiendas", { timeout: 15000 });
    console.log("[Paso 7b] Panel de Super Admin /super/tiendas cargado correctamente con listado.");

    await page.screenshot({ path: "test-results/capturas-fase1c/06_superadmin_gestion.png" });

    console.log("\n=======================================================");
    console.log("TODAS LAS ETAPAS DEL RECORRIDO E2E FASE 1C FINALIZARON CON ÉXITO");
    console.log("=======================================================\n");
  });
});
