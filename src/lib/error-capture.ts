/**
 * @file error-capture.ts
 * @description Módulo de intercepción fuera de banda (out-of-band) de excepciones y rechazos no capturados.
 * Diseñado para entornos de ejecución donde el framework de servidor (h3 / Nitro) captura y normaliza
 * prematuramente los errores arrojados en una respuesta genérica HTTP 500 (`HTTPError`), perdiendo el stack trace.
 * Almacena el último error con una ventana de vigencia (TTL de 5 segundos) para su posterior logging diagnóstico.
 */

let lastCapturedError: { error: unknown; at: number } | undefined;
const TTL_MS = 5_000;

function record(error: unknown) {
  lastCapturedError = { error, at: Date.now() };
}

if (typeof globalThis.addEventListener === "function") {
  globalThis.addEventListener("error", (event) => record((event as ErrorEvent).error ?? event));
  globalThis.addEventListener("unhandledrejection", (event) =>
    record((event as PromiseRejectionEvent).reason),
  );
}

export function consumeLastCapturedError(): unknown {
  if (!lastCapturedError) return undefined;
  if (Date.now() - lastCapturedError.at > TTL_MS) {
    lastCapturedError = undefined;
    return undefined;
  }
  const { error } = lastCapturedError;
  lastCapturedError = undefined;
  return error;
}
