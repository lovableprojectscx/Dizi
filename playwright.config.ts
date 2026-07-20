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
  },
  projects: [
    { name: "chromium-escritorio", use: { ...devices["Desktop Chrome"] } },
    { name: "movil-android", use: { ...devices["Pixel 7"] } },
  ],
});
