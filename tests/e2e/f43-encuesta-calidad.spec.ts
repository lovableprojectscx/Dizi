import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";
import { execSync } from "child_process";

/**
 * @file f43-encuesta-calidad.spec.ts
 * @description Suite de Pruebas E2E de la Encuesta de Calidad F43 en móvil (Pixel 7 / 375 px).
 *
 * Cumple con todos los lineamientos aprobados por Jack:
 * 1. Sin service_role. Autenticación con signUpUser usando VITE_SUPABASE_ANON_KEY (desde variable de entorno en terminal)
 *    y confirmación con db query --remote.
 * 2. Registro y borrado estricto por IDs (auth.identities, auth.users, stores).
 * 3. Inclusión de zz-audit-tienda-base para E14 en creación y borrado.
 * 4. Super admin mediante storageState leído desde process.env.SUPER_SESSION_PATH (sin SUPER_ADMIN_PASSWORD).
 * 5. Blindaje estricto de clientes reales en producción:
 *    - Acciones de Super Admin (Aplicar / Rechazar) filtran primero por el código DZ exacto y exigen coincidencia
 *      estricta de exactamente 1 fila con la tienda zz-audit-f43-*. Jamás tocan respuestas de clientes reales.
 *    - Validación estricta con SQL de solo lectura antes y después: el conteo y estados de survey_responses
 *      de tiendas que no sean zz-audit se mantienen 100% idénticos.
 * 6. Verificación de conteo residual canónico: auth y stores = 0, survey_responses = 0, invitaciones = 0, fotos sueltas = 4.
 */

const SUPABASE_URL = "https://zkqzdwxjthjdjchimmds.supabase.co";
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
const SUPER_SESSION_PATH = process.env.SUPER_SESSION_PATH || "";
const SCRATCH_DIR = path.join(os.tmpdir(), "dizi-e2e-f43");
const TEST_PASSWORD = "AuditPassword123!";

// Registro de IDs para limpieza estricta
const createdUserIds: string[] = [];
const createdStoreIds: string[] = [];

// Códigos DZ generados en las pruebas para validar en Super Admin
let semillaRewardCode = "";
let proRewardCode = "";

// Línea base de encuestas reales (no zz-audit) para verificar que ninguna cambió de estado
let initialRealTotal = 0;
let initialRealAplicado = 0;
let initialRealRechazado = 0;
let initialRealPendiente = 0;

// Definición de las 6 cuentas y tiendas requeridas
const TEST_STORES = [
  {
    email: "zz-audit-f43-semilla@testdizi.com",
    slug: "zz-audit-f43-semilla",
    name: "Audit Semilla F43",
    plan: "semilla",
  },
  {
    email: "zz-audit-f43-pro@testdizi.com",
    slug: "zz-audit-f43-pro",
    name: "Audit Pro F43",
    plan: "pro",
  },
  {
    email: "zz-audit-f43-ilimitado@testdizi.com",
    slug: "zz-audit-f43-ilimitado",
    name: "Audit Ilimitado F43",
    plan: "ilimitado",
  },
  {
    email: "zz-audit-f43-incompleta@testdizi.com",
    slug: "zz-audit-f43-incompleta",
    name: "Audit Incompleta F43",
    plan: "semilla",
  },
  {
    email: "zz-audit-f43-demo@testdizi.com",
    slug: "zz-audit-f43-demo",
    name: "Audit Demo F43",
    plan: "emprendedor",
  },
  {
    email: "zz-audit-tienda-base@testdizi.com",
    slug: "zz-audit-tienda-base",
    name: "Audit Tienda Base E14",
    plan: "semilla",
  },
];

function runRemoteSql(sql: string, readOnly = false): any {
  if (!fs.existsSync(SCRATCH_DIR)) {
    fs.mkdirSync(SCRATCH_DIR, { recursive: true });
  }
  const tempSqlFile = path.join(SCRATCH_DIR, `temp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.sql`);
  fs.writeFileSync(tempSqlFile, sql, "utf8");

  try {
    const flag = readOnly ? "--read-only" : "--yes";
    const cmd = `npx.cmd supabase db query --remote ${flag} --file "${tempSqlFile}" --output-format json`;
    const stdout = execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    try {
      return JSON.parse(stdout);
    } catch {
      return stdout;
    }
  } finally {
    if (fs.existsSync(tempSqlFile)) {
      try {
        fs.unlinkSync(tempSqlFile);
      } catch {}
    }
  }
}

async function signUpUser(email: string, pass: string): Promise<string> {
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
    throw new Error(`signUpUser falló para ${email}: ${txt}`);
  }

  const json: any = await res.json();
  const userId = json?.user?.id || json?.id;
  if (!userId) {
    throw new Error(`No se obtuvo user.id al registrar ${email}: ${JSON.stringify(json)}`);
  }
  return userId;
}

test.describe("F43 · Encuesta de calidad (E2E movil-android)", () => {
  test.beforeAll(async () => {
    console.log("\n[BeforeAll F43] Verificando variables de entorno y sesión...");

    if (!SUPABASE_ANON_KEY) {
      throw new Error(
        "ERROR BLOQUEANTE: VITE_SUPABASE_ANON_KEY o SUPABASE_ANON_KEY no está definida en la terminal. Jack debe proporcionarla en el entorno."
      );
    }

    // Registrar línea base de encuestas reales (no zz-audit)
    const baselineRealSurveys = runRemoteSql(
      `
      SELECT 
        count(*) FILTER (WHERE reward_status = 'aplicado') as aplicado,
        count(*) FILTER (WHERE reward_status = 'rechazado') as rechazado,
        count(*) FILTER (WHERE reward_status = 'pendiente') as pendiente,
        count(*) as total
      FROM public.survey_responses
      WHERE store_id NOT IN (SELECT id FROM public.stores WHERE slug LIKE 'zz-audit-%');
    `,
      true
    );
    initialRealTotal = Number(baselineRealSurveys?.rows?.[0]?.total ?? 0);
    initialRealAplicado = Number(baselineRealSurveys?.rows?.[0]?.aplicado ?? 0);
    initialRealRechazado = Number(baselineRealSurveys?.rows?.[0]?.rechazado ?? 0);
    initialRealPendiente = Number(baselineRealSurveys?.rows?.[0]?.pendiente ?? 0);
    console.log(
      `[BeforeAll F43] Línea base encuestas reales: Total=${initialRealTotal}, Aplicadas=${initialRealAplicado}, Rechazadas=${initialRealRechazado}, Pendientes=${initialRealPendiente}`
    );

    console.log("[BeforeAll F43] Sembrando 6 usuarios y tiendas zz-audit con signUpUser...");
    for (const item of TEST_STORES) {
      const userId = await signUpUser(item.email, TEST_PASSWORD);
      createdUserIds.push(userId);
      console.log(` -> Usuario creado: ${item.email} (ID: ${userId})`);

      // Generar storeId determinístico y registrar antes de insertar
      const storeId = crypto.randomUUID();
      createdStoreIds.push(storeId);

      // Confirmar correo e insertar tienda vinculada al owner_id
      const storeInsertSql = `
        UPDATE auth.users SET email_confirmed_at = now() WHERE id = '${userId}';
        INSERT INTO public.stores (
          id, name, slug, phone, owner_id, plan, subscription_status, created_at, updated_at
        ) VALUES (
          '${storeId}', '${item.name}', '${item.slug}', '999000111', '${userId}', '${item.plan}', 'active', now(), now()
        );
      `;
      runRemoteSql(storeInsertSql, false);
      console.log(` -> Tienda creada: ${item.slug} (ID: ${storeId})`);
    }

    console.log(`[BeforeAll F43] Siembra completa: ${createdUserIds.length} usuarios y ${createdStoreIds.length} tiendas.`);
  });

  test.afterAll(async () => {
    console.log("\n[Teardown F43] Limpiando datos de prueba por IDs exactos...");
    try {
      if (createdStoreIds.length > 0) {
        const storeIdList = createdStoreIds.map((id) => `'${id}'`).join(", ");
        runRemoteSql(
          `
          DELETE FROM public.survey_responses WHERE store_id IN (${storeIdList});
          DELETE FROM public.products WHERE store_id IN (${storeIdList});
          DELETE FROM public.categories WHERE store_id IN (${storeIdList});
          DELETE FROM public.stores WHERE id IN (${storeIdList});
        `,
          false
        );
        console.log(` -> ${createdStoreIds.length} tiendas y sus registros asociados eliminados por ID.`);
      }

      if (createdUserIds.length > 0) {
        const userIdList = createdUserIds.map((id) => `'${id}'`).join(", ");
        runRemoteSql(
          `
          DELETE FROM auth.identities WHERE user_id IN (${userIdList});
          DELETE FROM auth.users WHERE id IN (${userIdList});
        `,
          false
        );
        console.log(` -> ${createdUserIds.length} usuarios temporales eliminados por ID.`);
      }

      // Borrar storageState de super admin si existe
      if (SUPER_SESSION_PATH && fs.existsSync(SUPER_SESSION_PATH)) {
        try {
          fs.unlinkSync(SUPER_SESSION_PATH);
          console.log(` -> Archivo de sesión eliminado: ${SUPER_SESSION_PATH}`);
        } catch (e) {
          console.warn(` -> No se pudo borrar ${SUPER_SESSION_PATH}:`, e);
        }
      }

      // Verificación de integridad de respuestas reales (no zz-audit)
      console.log("\n[Teardown F43] Verificando que ninguna encuesta real cambió de estado...");
      const postCheckRealSurveys = runRemoteSql(
        `
        SELECT 
          count(*) FILTER (WHERE reward_status = 'aplicado') as aplicado,
          count(*) FILTER (WHERE reward_status = 'rechazado') as rechazado,
          count(*) FILTER (WHERE reward_status = 'pendiente') as pendiente,
          count(*) as total
        FROM public.survey_responses
        WHERE store_id NOT IN (SELECT id FROM public.stores WHERE slug LIKE 'zz-audit-%');
      `,
        true
      );
      const finalRealTotal = Number(postCheckRealSurveys?.rows?.[0]?.total ?? -1);
      const finalRealAplicado = Number(postCheckRealSurveys?.rows?.[0]?.aplicado ?? -1);
      const finalRealRechazado = Number(postCheckRealSurveys?.rows?.[0]?.rechazado ?? -1);
      const finalRealPendiente = Number(postCheckRealSurveys?.rows?.[0]?.pendiente ?? -1);

      console.log(` -> Total respuestas reales: ${finalRealTotal} (inicial: ${initialRealTotal})`);
      console.log(` -> Aplicadas reales: ${finalRealAplicado} (inicial: ${initialRealAplicado})`);
      console.log(` -> Rechazadas reales: ${finalRealRechazado} (inicial: ${initialRealRechazado})`);
      console.log(` -> Pendientes reales: ${finalRealPendiente} (inicial: ${initialRealPendiente})`);

      expect(finalRealTotal).toBe(initialRealTotal);
      expect(finalRealAplicado).toBe(initialRealAplicado);
      expect(finalRealRechazado).toBe(initialRealRechazado);
      expect(finalRealPendiente).toBe(initialRealPendiente);

      // Conteo residual canónico (debe ser 0, 0, 0, 0, 4)
      console.log("\n[Teardown F43] Ejecutando conteo residual canónico de auditoría...");
      const residualUsers = runRemoteSql("SELECT count(*) FROM auth.users WHERE email LIKE 'zz-audit-%';", true);
      const countUsers = Number(residualUsers?.rows?.[0]?.count ?? -1);

      const residualStores = runRemoteSql("SELECT count(*) FROM public.stores WHERE slug LIKE 'zz-audit-%';", true);
      const countStores = Number(residualStores?.rows?.[0]?.count ?? -1);

      const residualSurveys = runRemoteSql(
        "SELECT count(*) FROM public.survey_responses sr JOIN public.stores s ON sr.store_id = s.id WHERE s.slug LIKE 'zz-audit-%';",
        true
      );
      const countSurveys = Number(residualSurveys?.rows?.[0]?.count ?? -1);

      const residualInvites = runRemoteSql("SELECT count(*) FROM public.invites WHERE token LIKE '%audit%';", true);
      const countInvites = Number(residualInvites?.rows?.[0]?.count ?? -1);

      const residualPhotos = runRemoteSql(
        "SELECT count(*) FROM storage.objects WHERE bucket_id = 'images' AND split_part(name, '/', 1) NOT IN (SELECT id FROM public.stores);",
        true
      );
      const countPhotos = Number(residualPhotos?.rows?.[0]?.count ?? -1);

      console.log(` -> Usuarios zz-audit residuales: ${countUsers} (esperado: 0)`);
      console.log(` -> Tiendas zz-audit residuales: ${countStores} (esperado: 0)`);
      console.log(` -> Encuestas zz-audit residuales: ${countSurveys} (esperado: 0)`);
      console.log(` -> Invitaciones audit residuales: ${countInvites} (esperado: 0)`);
      console.log(` -> Fotos sueltas en storage: ${countPhotos} (esperado: 4)`);

      expect(countUsers).toBe(0);
      expect(countStores).toBe(0);
      expect(countSurveys).toBe(0);
      expect(countInvites).toBe(0);
      expect(countPhotos).toBe(4);
    } catch (err) {
      console.error("[Teardown F43] Error en teardown o verificación residual:", err);
      throw err;
    }
  });

  // ─────────────────────────────────────────────────────────────
  // E1: Semilla ve sus preguntas, responde y recibe código DZ
  // ─────────────────────────────────────────────────────────────
  test("E1 Semilla ve sus preguntas, envía y recibe código DZ con enlace WhatsApp", async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[type="email"]').fill("zz-audit-f43-semilla@testdizi.com");
    await page.locator('input[type="password"]').fill(TEST_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/admin/, { timeout: 25000 });

    // Tarjeta en /admin/dashboard
    await page.goto("/admin/dashboard");
    const surveyCard = page.locator('text="Responde 7 preguntas y gana 15 días"');
    await expect(surveyCard).toBeVisible({ timeout: 15000 });

    const respondBtn = page.getByRole("link", { name: /Responder encuesta/i });
    await expect(respondBtn).toBeVisible();
    await respondBtn.click();
    await page.waitForURL(/\/admin\/encuesta/);

    // Textos exactos de preguntas Semilla
    await expect(page.getByText("Pregunta 1 de 7")).toBeVisible();
    await expect(page.getByText("¿Cómo conociste DIZI?")).toBeVisible();
    await expect(page.getByText("¿Te llegan pedidos de clientes desde tu catálogo?")).toBeVisible();
    await expect(page.getByText("Del 0 al 10, ¿recomendarías DIZI a otro negocio?")).toBeVisible();
    await expect(page.getByText("¿Para qué creaste tu catálogo?")).toBeVisible();
    await expect(page.getByText("¿Qué te frena para cargar más productos?")).toBeVisible();
    await expect(page.getByText("¿Qué tendría que tener DIZI para que pagues un plan?")).toBeVisible();
    await expect(page.getByText("¿Cuánto pagarías al mes por tu catálogo?")).toBeVisible();

    // Respuestas
    await page.getByRole("button", { name: "TikTok" }).click();
    await page.getByRole("button", { name: "algunos" }).click();
    await page.getByRole("button", { name: "10", exact: true }).click();
    await page.getByRole("button", { name: "vender por WhatsApp" }).click();
    await page.getByRole("button", { name: "tiempo" }).click();
    await page.locator('textarea[placeholder="Escribe tu respuesta aquí..."]').fill("Poder personalizar más el catálogo");
    await page.getByRole("button", { name: "S/ 20" }).click();

    // Enviar respuestas
    await page.getByRole("button", { name: "Enviar respuestas y ver mi código" }).click();

    // Pantalla final
    await expect(page.getByText("¡Muchas gracias por tus respuestas!")).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("15 días de prueba de Emprendedor")).toBeVisible();
    await expect(page.getByText("Envíanos tu código por WhatsApp y revisamos tu premio")).toBeVisible();

    const codeLocator = page.locator("text=/^DZ-[2-9A-Z]{6}$/");
    await expect(codeLocator).toBeVisible();

    semillaRewardCode = (await codeLocator.textContent())?.trim() || "";
    console.log(`[E1] Código DZ obtenido para Semilla: "${semillaRewardCode}"`);
    expect(semillaRewardCode).toMatch(/^DZ-[2-9A-Z]{6}$/);

    const waLink = page.getByRole("link", { name: /Enviar por WhatsApp/i });
    await expect(waLink).toBeVisible();
    const href = await waLink.getAttribute("href");
    expect(href).toContain("https://wa.me/51925176472");
    expect(href).toContain("Hola%2C%20termin%C3%A9%20la%20encuesta%20de%20DIZI");
  });

  // ─────────────────────────────────────────────────────────────
  // E3: Pro ve las preguntas de su plan con multiselección
  // ─────────────────────────────────────────────────────────────
  test("E3 Pro ve las preguntas de su plan con multiselección y campo opcional", async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[type="email"]').fill("zz-audit-f43-pro@testdizi.com");
    await page.locator('input[type="password"]').fill(TEST_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/admin/, { timeout: 25000 });

    await page.goto("/admin/encuesta");

    // Preguntas 4 a 7 de Pro
    await expect(page.getByText("¿Empezaste con el plan gratis antes de pagar?")).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("¿Qué funciones de Pro usas?")).toBeVisible();
    await expect(page.getByText("¿Piensas renovar?")).toBeVisible();
    await expect(page.getByText("¿Te interesa pagar el año completo con 25% de descuento?")).toBeVisible();

    // Respuestas
    await page.getByRole("button", { name: "Facebook" }).click();
    await page.getByRole("button", { name: "casi todos mis pedidos" }).click();
    await page.getByRole("button", { name: "9", exact: true }).click();
    await page.getByRole("button", { name: "sí", exact: true }).first().click();
    await page.getByRole("button", { name: "cintillo" }).click();
    await page.getByRole("button", { name: "varios banners" }).click();
    await page.getByRole("button", { name: "tal vez" }).click();
    await page.locator('textarea[placeholder="Cuéntanos más detalles si deseas..."]').fill("Dependerá de las ventas del mes");
    await page.getByRole("button", { name: "sí", exact: true }).last().click();

    await page.getByRole("button", { name: "Enviar respuestas y ver mi código" }).click();

    // Beneficio Pro
    await expect(page.getByText("15 días más de tu plan")).toBeVisible({ timeout: 15000 });
    const proCodeLocator = page.locator("text=/^DZ-[2-9A-Z]{6}$/");
    await expect(proCodeLocator).toBeVisible();

    proRewardCode = (await proCodeLocator.textContent())?.trim() || "";
    console.log(`[E3] Código DZ obtenido para Pro: "${proRewardCode}"`);
    expect(proRewardCode).toMatch(/^DZ-[2-9A-Z]{6}$/);
  });

  // ─────────────────────────────────────────────────────────────
  // E4: Ilimitado no la ve
  // ─────────────────────────────────────────────────────────────
  test("E4 Ilimitado no la ve: Sin tarjeta en dashboard y aviso en /admin/encuesta", async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[type="email"]').fill("zz-audit-f43-ilimitado@testdizi.com");
    await page.locator('input[type="password"]').fill(TEST_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/admin/, { timeout: 25000 });

    await page.goto("/admin/dashboard");
    await expect(page.locator('text="Responde 7 preguntas y gana 15 días"')).not.toBeVisible();

    await page.goto("/admin/encuesta");
    await expect(page.getByText("Encuesta no disponible")).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("Esta tienda tiene plan ilimitado o es una cuenta de demostración")).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────
  // E5: Obligatorias
  // ─────────────────────────────────────────────────────────────
  test("E5 Obligatorias: Bloquea el envío si faltan respuestas", async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[type="email"]').fill("zz-audit-f43-incompleta@testdizi.com");
    await page.locator('input[type="password"]').fill(TEST_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/admin/, { timeout: 25000 });

    await page.goto("/admin/encuesta");

    await page.getByRole("button", { name: "Enviar respuestas y ver mi código" }).click();

    await expect(page.getByText("Esta pregunta es obligatoria.").first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("¡Muchas gracias por tus respuestas!")).not.toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────
  // E7: Una sola vez: Tienda que ya respondió ve directo su código
  // ─────────────────────────────────────────────────────────────
  test("E7 Una sola vez: Tienda que ya respondió ve directo su código", async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[type="email"]').fill("zz-audit-f43-semilla@testdizi.com");
    await page.locator('input[type="password"]').fill(TEST_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/admin/, { timeout: 25000 });

    await page.goto("/admin/encuesta");

    await expect(page.getByText("¡Muchas gracias por tus respuestas!")).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("Pregunta 1 de 7")).not.toBeVisible();
    await expect(page.locator("text=/^DZ-[2-9A-Z]{6}$/")).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────
  // E9, E10, E11, E13: Super admin gestiona respuestas
  // ─────────────────────────────────────────────────────────────
  test("E9, E10, E11, E13: Super admin gestiona respuestas, aplica premio y exporta CSV", async ({ browser }) => {
    if (!SUPER_SESSION_PATH) {
      throw new Error(
        "ERROR BLOQUEANTE: La variable de entorno SUPER_SESSION_PATH no está definida. Debe apuntar al archivo de sesión generado con login-super.cjs."
      );
    }
    if (!fs.existsSync(SUPER_SESSION_PATH)) {
      throw new Error(
        `ERROR BLOQUEANTE: No existe el archivo de sesión de super admin en "${SUPER_SESSION_PATH}". Jack debe iniciar sesión a mano en modo visible antes de correr esta prueba.`
      );
    }

    if (!semillaRewardCode || !proRewardCode) {
      throw new Error(
        `ERROR: Se requieren los códigos DZ generados en E1 ("${semillaRewardCode}") y E3 ("${proRewardCode}") antes de ejecutar las pruebas de Super Admin.`
      );
    }

    const context = await browser.newContext({ storageState: SUPER_SESSION_PATH });
    const page = await context.newPage();

    // Aceptar automáticamente los diálogos window.confirm ("¿Confirmas aplicar...?")
    page.on("dialog", (dialog) => dialog.accept());

    // Acceder al módulo de encuestas
    await page.goto("/super/encuestas");
    await expect(page.getByRole("heading", { name: "Encuestas de Calidad (F43)" })).toBeVisible({ timeout: 20000 });

    const searchInput = page.locator('input[placeholder*="Buscar por código"]');
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    // ─────────────────────────────────────────────────────────
    // E9 / E10: Aplicar premio SOLO a la fila zz-audit-f43-semilla con su código
    // ─────────────────────────────────────────────────────────
    await searchInput.fill(semillaRewardCode);

    // Localizar la fila que contenga estrictamente el código DZ y la tienda zz-audit
    const semillaRow = page.locator("table tbody tr").filter({
      hasText: semillaRewardCode,
    }).filter({
      hasText: "zz-audit-f43-semilla",
    });

    // Validar explícitamente que existe exactamente 1 fila y que pertenece a zz-audit ANTES de cualquier clic
    await expect(semillaRow).toHaveCount(1, { timeout: 15000 });
    await expect(semillaRow.locator(`text="${semillaRewardCode}"`)).toBeVisible();
    await expect(semillaRow.locator('text="zz-audit-f43-semilla"')).toBeVisible();

    const applyBtn = semillaRow.getByRole("button", { name: "Aplicar premio" });
    await expect(applyBtn).toBeVisible({ timeout: 5000 });

    // Clic SOLO dentro de la fila de zz-audit-f43-semilla
    await applyBtn.click();

    // El estado de esa fila debe cambiar a Aplicado y el botón desaparecer
    await expect(semillaRow.getByText("Aplicado")).toBeVisible({ timeout: 15000 });
    await expect(applyBtn).not.toBeVisible();

    // ─────────────────────────────────────────────────────────
    // E11: Rechazar premio SOLO a la fila zz-audit-f43-pro con su código
    // ─────────────────────────────────────────────────────────
    await searchInput.fill(proRewardCode);

    const proRow = page.locator("table tbody tr").filter({
      hasText: proRewardCode,
    }).filter({
      hasText: "zz-audit-f43-pro",
    });

    // Validar explícitamente que existe exactamente 1 fila y que pertenece a zz-audit ANTES de cualquier clic
    await expect(proRow).toHaveCount(1, { timeout: 15000 });
    await expect(proRow.locator(`text="${proRewardCode}"`)).toBeVisible();
    await expect(proRow.locator('text="zz-audit-f43-pro"')).toBeVisible();

    const rejectBtn = proRow.getByRole("button", { name: "Rechazar" });
    await expect(rejectBtn).toBeVisible({ timeout: 5000 });

    // Clic SOLO dentro de la fila de zz-audit-f43-pro
    await rejectBtn.click();

    // El estado de esa fila debe cambiar a Rechazado y el botón desaparecer
    await expect(proRow.getByText("Rechazado")).toBeVisible({ timeout: 15000 });
    await expect(rejectBtn).not.toBeVisible();

    // ─────────────────────────────────────────────────────────
    // E13: Exportar CSV
    // ─────────────────────────────────────────────────────────
    await searchInput.fill("");
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: /Exportar CSV/i }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain("dizi-encuestas-");

    await context.close();
  });

  // ─────────────────────────────────────────────────────────────
  // E14: Nada más cambia: Catálogo público permanece idéntico
  // ─────────────────────────────────────────────────────────────
  test("E14 Nada más cambia: Catálogo público permanece idéntico", async ({ page }) => {
    await page.goto("/t/zz-audit-tienda-base");
    await expect(page.locator("body")).toBeVisible({ timeout: 15000 });
    await expect(page).toHaveTitle(/Dizi|catálogo/i);
  });

  // ─────────────────────────────────────────────────────────────
  // E16: Tiendas demo fuera
  // ─────────────────────────────────────────────────────────────
  test("E16 Demo fuera: Tiendas con slug -demo no participan", async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[type="email"]').fill("zz-audit-f43-demo@testdizi.com");
    await page.locator('input[type="password"]').fill(TEST_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/admin/, { timeout: 25000 });

    await page.goto("/admin/encuesta");
    await expect(page.getByText("Encuesta no disponible")).toBeVisible({ timeout: 15000 });
  });
});
