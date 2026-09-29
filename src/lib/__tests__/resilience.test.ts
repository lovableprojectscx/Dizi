import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { isRetryableError, invokeRpcWithRetry, supabase } from "../supabase";

describe("Resiliencia ante errores de conexión y Supabase 5xx (Bug B7)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("isRetryableError", () => {
    it("retorna true para códigos de estado 5xx (500, 502, 503, 504)", () => {
      expect(isRetryableError({ status: 500, message: "Internal Server Error" })).toBe(true);
      expect(isRetryableError({ status: 502, message: "Bad Gateway" })).toBe(true);
      expect(isRetryableError({ status: 503, message: "Service Unavailable" })).toBe(true);
      expect(isRetryableError({ status: 504, message: "Gateway Timeout" })).toBe(true);
      expect(isRetryableError({ code: "502", message: "Bad Gateway" })).toBe(true);
    });

    it("retorna false para códigos de error de cliente 4xx (400, 401, 403, 404, 422)", () => {
      expect(isRetryableError({ status: 400, message: "Bad Request" })).toBe(false);
      expect(isRetryableError({ status: 401, message: "Unauthorized" })).toBe(false);
      expect(isRetryableError({ status: 403, message: "Forbidden" })).toBe(false);
      expect(isRetryableError({ status: 404, message: "Not Found" })).toBe(false);
      expect(isRetryableError({ status: 422, message: "Unprocessable Entity" })).toBe(false);
      expect(isRetryableError({ code: "404", message: "Not Found" })).toBe(false);
    });

    it("retorna true para errores típicos de red y fetch de navegador", () => {
      expect(isRetryableError(new TypeError("Failed to fetch"))).toBe(true);
      expect(isRetryableError({ message: "TypeError: Failed to fetch" })).toBe(true);
      expect(isRetryableError({ name: "AbortError", message: "The operation was aborted" })).toBe(true);
      expect(isRetryableError({ message: "NetworkError when attempting to fetch resource." })).toBe(true);
      expect(isRetryableError({ message: "Timeout: La base de datos tardó demasiado en responder" })).toBe(true);
    });

    it("retorna false si el error es nulo, indefinido o error de negocio no transitorio", () => {
      expect(isRetryableError(null)).toBe(false);
      expect(isRetryableError(undefined)).toBe(false);
      expect(isRetryableError({ code: "P0001", message: "Contraseña incorrecta" })).toBe(false);
    });
  });

  describe("invokeRpcWithRetry", () => {
    it("retorna data inmediatamente si la llamada RPC inicial tiene éxito", async () => {
      const mockRpc = vi.spyOn(supabase, "rpc").mockResolvedValueOnce({
        data: { id: "store-123", name: "Tienda Demo" },
        error: null,
      } as any);

      const res = await invokeRpcWithRetry("get_public_store", { store_slug: "demo" });

      expect(mockRpc).toHaveBeenCalledTimes(1);
      expect(res.data).toEqual({ id: "store-123", name: "Tienda Demo" });
      expect(res.error).toBeNull();
    });

    it("reintenta hasta 3 veces ante error 502 y retorna exitosamente si el 3er intento responde 200", async () => {
      const mockRpc = vi
        .spyOn(supabase, "rpc")
        .mockResolvedValueOnce({
          data: null,
          error: { status: 502, message: "Bad Gateway" },
        } as any)
        .mockResolvedValueOnce({
          data: null,
          error: { status: 502, message: "Bad Gateway" },
        } as any)
        .mockResolvedValueOnce({
          data: { id: "store-resilient", name: "Tienda Resiliente" },
          error: null,
        } as any);

      const onRetry = vi.fn();
      const res = await invokeRpcWithRetry(
        "get_public_store",
        { store_slug: "resilient" },
        { maxRetries: 3, delays: [10, 10, 10], onRetry }
      );

      expect(mockRpc).toHaveBeenCalledTimes(3);
      expect(onRetry).toHaveBeenCalledTimes(2);
      expect(res.data).toEqual({ id: "store-resilient", name: "Tienda Resiliente" });
      expect(res.error).toBeNull();
    });

    it("NO reintenta ante error 404 (tienda no encontrada) y retorna error inmediatamente en 1 intento", async () => {
      const mockRpc = vi.spyOn(supabase, "rpc").mockResolvedValueOnce({
        data: null,
        error: { status: 404, message: "Store not found" },
      } as any);

      const onRetry = vi.fn();
      const res = await invokeRpcWithRetry(
        "get_public_store",
        { store_slug: "inexistente" },
        { maxRetries: 3, delays: [10, 10, 10], onRetry }
      );

      expect(mockRpc).toHaveBeenCalledTimes(1);
      expect(onRetry).not.toHaveBeenCalled();
      expect(res.data).toBeNull();
      expect(res.error).toEqual({ status: 404, message: "Store not found" });
    });

    it("agota los reintentos ante 502 persistente y registra el error final", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const mockRpc = vi.spyOn(supabase, "rpc").mockResolvedValue({
        data: null,
        error: { status: 502, message: "Bad Gateway Persistente" },
      } as any);

      const res = await invokeRpcWithRetry(
        "get_public_store",
        { store_slug: "caida-total" },
        { maxRetries: 2, delays: [10, 10] }
      );

      expect(mockRpc).toHaveBeenCalledTimes(3); // intento 0 + 2 reintentos = 3
      expect(res.data).toBeNull();
      expect(res.error).toBeTruthy();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("[Supabase Error Final] Endpoint: get_public_store, Status: 502"),
        expect.anything()
      );
    });
  });
});
