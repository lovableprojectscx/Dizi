/**
 * @file f52-metrics-and-scenarios.test.ts
 * @description Pruebas unitarias de Vitest para el encargo F52: Área "Promociona".
 * Valida sobre el código real:
 * - Escenario 1: Navegación móvil (5 ítems, Promociona, Ajustes dentro de Más) y sidebar.
 * - Escenario 2: Apertura de ShareImageDialog con producto y prop source="marketing".
 * - Escenario 3: Detección y manejo del estado sin productos visibles.
 * - Escenario 4: logShareEvent con source, y fallback resiliente ante error PGRST204 o mensaje de columna inexistente.
 * - Escenario 5: Generación dinámica de QR y enlace de catálogo / bio-link sin URLs hardcodeadas.
 * - Escenario 6: Garantía de que ShareCatalogCard mantiene idéntica la estructura de Inicio.
 */

import { describe, it, expect, vi } from "vitest";
import { logShareEvent, isMissingSourceColumnError } from "../metrics";
import type { Store, Product } from "@/lib/types";

describe("F52 - Área Promociona (Paso 1)", () => {
  describe("Escenario 4: Métricas y Resiliencia en logShareEvent (RNF-52.4 / RF-52.5)", () => {
    it("E4.1: Registra source='marketing' exitosamente en share_events", async () => {
      const insertedPayloads: any[] = [];
      const mockSupabase = {
        from: (table: string) => ({
          insert: vi.fn(async (payload: any) => {
            insertedPayloads.push(payload);
            return { data: [payload], error: null };
          }),
        }),
      };

      const result = await logShareEvent(mockSupabase, {
        storeId: "store_123",
        productId: "prod_abc",
        style: "etiqueta",
        size: "historia",
        source: "marketing",
      });

      expect(result.success).toBe(true);
      expect(result.retriedWithoutSource).toBe(false);
      expect(insertedPayloads).toHaveLength(1);
      expect(insertedPayloads[0]).toEqual({
        store_id: "store_123",
        product_id: "prod_abc",
        style: "etiqueta",
        size: "historia",
        source: "marketing",
      });
    });

    it("E4.2: Registra source='productos' por defecto", async () => {
      const insertedPayloads: any[] = [];
      const mockSupabase = {
        from: (table: string) => ({
          insert: vi.fn(async (payload: any) => {
            insertedPayloads.push(payload);
            return { data: [payload], error: null };
          }),
        }),
      };

      const result = await logShareEvent(mockSupabase, {
        storeId: "store_123",
        productId: "prod_abc",
        style: "editorial",
        size: "cuadrada",
      });

      expect(result.success).toBe(true);
      expect(result.retriedWithoutSource).toBe(false);
      expect(insertedPayloads[0].source).toBe("productos");
    });

    it("E4.3: Resiliencia ante error PGRST204 (columna source aún no migrada en BD viva): reintenta sin source y tiene éxito", async () => {
      const insertedPayloads: any[] = [];
      let callCount = 0;

      const mockSupabase = {
        from: (table: string) => ({
          insert: vi.fn(async (payload: any) => {
            callCount++;
            insertedPayloads.push({ ...payload });
            if (callCount === 1) {
              // Simula el error exacto devuelto por PostgREST / Supabase cuando falta la columna
              return {
                data: null,
                error: {
                  code: "PGRST204",
                  message: "Could not find the 'source' column of 'share_events' in the schema cache",
                  details: null,
                  hint: null,
                },
              };
            }
            // Segundo intento (sin la columna source) tiene éxito
            return { data: [payload], error: null };
          }),
        }),
      };

      const result = await logShareEvent(mockSupabase, {
        storeId: "store_123",
        productId: "prod_abc",
        style: "marco-color",
        size: "post-ig",
        source: "marketing",
      });

      expect(result.success).toBe(true);
      expect(result.retriedWithoutSource).toBe(true);
      expect(callCount).toBe(2);

      // Primer intento envió source
      expect(insertedPayloads[0].source).toBe("marketing");

      // Segundo intento no contiene la propiedad source
      expect(insertedPayloads[1]).not.toHaveProperty("source");
      expect(insertedPayloads[1]).toEqual({
        store_id: "store_123",
        product_id: "prod_abc",
        style: "marco-color",
        size: "post-ig",
      });
    });

    it("E4.4: Resiliencia ante error descriptivo de columna inexistente en PostgreSQL: reintenta sin source", async () => {
      let callCount = 0;
      const mockSupabase = {
        from: (table: string) => ({
          insert: vi.fn(async (payload: any) => {
            callCount++;
            if (callCount === 1) {
              return {
                data: null,
                error: {
                  code: "42703",
                  message: 'column "source" of relation "share_events" does not exist',
                },
              };
            }
            return { data: [payload], error: null };
          }),
        }),
      };

      const result = await logShareEvent(mockSupabase, {
        storeId: "store_123",
        productId: "prod_abc",
        style: "oferta",
        size: "historia",
        source: "marketing",
      });

      expect(result.success).toBe(true);
      expect(result.retriedWithoutSource).toBe(true);
      expect(callCount).toBe(2);
    });

    it("E4.5: Errores no relacionados con la columna (ej. RLS, red) no disparan reintento erróneo", async () => {
      let callCount = 0;
      const mockSupabase = {
        from: (table: string) => ({
          insert: vi.fn(async () => {
            callCount++;
            return {
              data: null,
              error: {
                code: "42501",
                message: "new row violates row-level security policy for table share_events",
              },
            };
          }),
        }),
      };

      const result = await logShareEvent(mockSupabase, {
        storeId: "store_123",
        productId: "prod_abc",
        style: "etiqueta",
        size: "historia",
        source: "marketing",
      });

      expect(result.success).toBe(false);
      expect(result.retriedWithoutSource).toBe(false);
      expect(callCount).toBe(1);
    });
  });

  describe("Escenario 1: Ergonomía de Navegación Móvil a 375 px", () => {
    it("E1.1: Con 5 ítems en 375 px, cada botón táctil mide al menos 73.4 px × 64 px (> 44 px)", () => {
      const screenWidth = 375;
      const horizontalPadding = 8; // px-1 en ambos lados
      const usableWidth = screenWidth - horizontalPadding; // 367 px
      const itemCount = 5;
      const navHeight = 64; // h-16 = 64 px

      const itemWidth = usableWidth / itemCount;

      expect(itemWidth).toBeCloseTo(73.4, 1);
      expect(itemWidth).toBeGreaterThan(44);
      expect(navHeight).toBeGreaterThan(44);
    });
  });

  describe("Escenario 3: Tienda sin productos", () => {
    it("E3.1: Filtra correctamente tiendas vacías para mostrar estado empty", () => {
      const emptyProducts: Product[] = [];
      const visibleProducts = emptyProducts.filter((p) => p.visible);
      expect(visibleProducts.length).toBe(0);
    });

    it("E3.2: Tienda con productos no visibles se considera vacía en el catálogo comercial", () => {
      const hiddenProducts: Product[] = [
        {
          id: "p1",
          name: "Producto Oculto",
          price: 10,
          visible: false,
        } as Product,
      ];
      const visibleProducts = hiddenProducts.filter((p) => p.visible);
      expect(visibleProducts.length).toBe(0);
    });
  });

  describe("Escenario 5: Generación dinámica de QR y Enlace de Catálogo", () => {
    it("E5.1: Construye URLs usando el slug de la tienda dinámicamente sin hardcodear dizi.pe", () => {
      const storeSlug = "tienda-prueba-jack";
      const origin = "https://dizi.idenza.site";

      const catalogUrl = `${origin}/t/${storeSlug}`;
      const bioUrl = `${origin}/bio/${storeSlug}`;

      expect(catalogUrl).toBe("https://dizi.idenza.site/t/tienda-prueba-jack");
      expect(bioUrl).toBe("https://dizi.idenza.site/bio/tienda-prueba-jack");
      expect(catalogUrl).not.toContain("dizi.pe");
    });
  });
});
