import { defineConfig, devices } from "@playwright/test";

/**
 * Configuración de pruebas E2E - Dizi (IS-489)
 *
 * Ejecutar contra el servidor local:   npm run dev  (en otra terminal)  →  npm run test:e2e
 * Ejecutar contra producción:          PW_BASE_URL=https://tu-dominio.vercel.app npm run test:e2e
 *
 * Evidencias generadas por CADA prueba (para el informe y el video):
 *  - Video .webm de la ejecución       → test-results/<prueba>/video.webm
 *  - Trace navegable (paso a paso)     → npx playwright show-trace test-results/<prueba>/trace.zip
 *  - Captura final                     → test-results/<prueba>/*.png
 *  - Reporte HTML consolidado          → npm run test:e2e:report
 */
function getBypassSecret(): string | undefined {
  if (process.env.VERCEL_PROTECTION_BYPASS) return process.env.VERCEL_PROTECTION_BYPASS;
  if (process.env.VERCEL_AUTOMATION_BYPASS_SECRET) return process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  try {
    const { execSync } = require("child_process");
    const out = execSync('reg query "HKCU\\Environment" /v "VERCEL_AUTOMATION_BYPASS_SECRET"', {
      stdio: ["pipe", "pipe", "ignore"],
    }).toString();
    const match = out.match(/REG_\w+\s+(\S+)/);
    if (match) return match[1];
  } catch {}
  return undefined;
}

const vercelBypassToken = getBypassSecret();

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  retries: 0,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL: process.env.PW_BASE_URL || "http://localhost:5173",
    video: "on", // graba video de TODAS las pruebas (requisito del entregable)
    trace: "on", // trace navegable con capturas de cada paso
    screenshot: "on",
    locale: "es-PE",
    viewport: { width: 1280, height: 720 },
    extraHTTPHeaders: vercelBypassToken
      ? {
          "x-vercel-protection-bypass": vercelBypassToken,
          "x-vercel-set-bypass-cookie": "s_true",
        }
      : undefined,
  },
  projects: [
    { name: "chromium-escritorio", use: { ...devices["Desktop Chrome"] } },
    { name: "movil-android", use: { ...devices["Pixel 7"] } },
  ],
  webServer: process.env.PW_BASE_URL
    ? undefined
    : {
        command: "npm run dev",
        url: "http://localhost:5173",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
