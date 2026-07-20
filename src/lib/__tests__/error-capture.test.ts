import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";

describe("Pruebas unitarias de error-capture.ts", () => {
  let errorListener: ((event: any) => void) | null = null;
  let rejectionListener: ((event: any) => void) | null = null;
  let consumeLastCapturedError: () => unknown;

  beforeAll(async () => {
    vi.useFakeTimers();

    // Mockeamos addEventListener en globalThis antes de importar el módulo
    globalThis.addEventListener = vi.fn((event: string, listener: any) => {
      if (event === "error") {
        errorListener = listener;
      }
      if (event === "unhandledrejection") {
        rejectionListener = listener;
      }
    });

    // Importamos dinámicamente el módulo para que registre los listeners usando el mock anterior
    const module = await import("../error-capture");
    consumeLastCapturedError = module.consumeLastCapturedError;
  });

  afterAll(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("debe retornar undefined inicialmente si no se ha capturado ningún error", () => {
    expect(consumeLastCapturedError()).toBeUndefined();
  });

  it("debe capturar y consumir un error global disparado", () => {
    const mockError = new Error("Test error");

    // Simulamos que el navegador dispara el evento de error
    if (errorListener) {
      errorListener({ error: mockError });
    }

    // Al consumirlo, debe devolver el error capturado
    expect(consumeLastCapturedError()).toBe(mockError);

    // Al consumirlo por segunda vez, debe quedar vacío (retornar undefined)
    expect(consumeLastCapturedError()).toBeUndefined();
  });

  it("debe capturar y consumir un unhandledrejection global disparado", () => {
    const mockRejectionReason = "Promise rejected!";

    // Simulamos que el navegador dispara el evento unhandledrejection
    if (rejectionListener) {
      rejectionListener({ reason: mockRejectionReason });
    }

    // Al consumirlo, debe devolver el motivo del rechazo
    expect(consumeLastCapturedError()).toBe(mockRejectionReason);
    expect(consumeLastCapturedError()).toBeUndefined();
  });

  it("debe descartar el error capturado si supera el TTL de 5 segundos", () => {
    const mockError = new Error("Expired error");

    if (errorListener) {
      errorListener({ error: mockError });
    }

    // Avanzamos el reloj virtual en 5001ms (superando TTL_MS = 5000)
    vi.advanceTimersByTime(5001);

    // Al consumirlo, ya no debe estar disponible (debe retornar undefined)
    expect(consumeLastCapturedError()).toBeUndefined();
  });
});
