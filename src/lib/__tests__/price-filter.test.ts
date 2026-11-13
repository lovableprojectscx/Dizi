import { describe, it, expect } from "vitest";
import {
  computePriceBounds,
  formatPriceRangeLabel,
  getProductFilterablePrices,
  hasUsablePriceBounds,
  isPriceRangeActive,
  matchesPriceRange,
  normalizePriceRange,
  parsePriceBounds,
  shouldFallbackToLegacyProductsRpc,
} from "../price-filter";
import type { Product } from "../types";

const makeProduct = (
  id: string,
  price: number,
  variations?: Array<{ id: string; name: string; price?: number }>,
): Product => ({
  id,
  name: `Producto ${id}`,
  price,
  categoryId: "cat-1",
  image: "/images/sin-foto.svg",
  visible: true,
  variations,
});

describe("Filtro de Precios — lógica pura (price-filter.ts)", () => {
  it("E1: desactiva rango usable cuando solo hay productos A consultar o un único precio", () => {
    const soloConsultar = [makeProduct("1", 0), makeProduct("2", 0)];
    const boundsConsultar = computePriceBounds(soloConsultar);
    expect(boundsConsultar).toEqual({ min: 0, max: 0 });
    expect(hasUsablePriceBounds(boundsConsultar)).toBe(false);

    const precioUnico = [makeProduct("3", 45), makeProduct("4", 45)];
    const boundsUnico = computePriceBounds(precioUnico);
    expect(boundsUnico).toEqual({ min: 45, max: 45 });
    expect(hasUsablePriceBounds(boundsUnico)).toBe(false);
    expect(normalizePriceRange(45, 45, boundsUnico)).toBeNull();
  });

  it("E2: slider dual Min–Max clampa valores y vuelve a null al regresar al rango completo", () => {
    const bounds = { min: 15, max: 200 };

    // Ajuste del mínimo o máximo activa el rango
    expect(normalizePriceRange(30, 200, bounds)).toEqual([30, 200]);
    expect(normalizePriceRange(15, 120, bounds)).toEqual([15, 120]);
    expect(normalizePriceRange(40, 110, bounds)).toEqual([40, 110]);

    // Clamping fuera de límites y corrección si se cruzan extremos
    expect(normalizePriceRange(5, 250, bounds)).toBeNull();
    expect(normalizePriceRange(90, 60, bounds)).toEqual([60, 90]);

    // Volver al rango total desactiva el recorte -> null (restaura portada y A consultar)
    expect(normalizePriceRange(15, 200, bounds)).toBeNull();
    expect(isPriceRangeActive([15, 200], bounds)).toBe(false);
    expect(isPriceRangeActive([25, 200], bounds)).toBe(true);
  });

  it("E5: excluye productos A consultar cuando hay rango activo y evalúa variaciones con precio positivo", () => {
    const bounds = { min: 20, max: 180 };
    const consultar = makeProduct("a-consultar", 0);
    const baseFueraVarDentro = makeProduct("var-match", 220, [
      { id: "v1", name: "Pequeño", price: 65 },
      { id: "v2", name: "Grande", price: 220 },
    ]);
    const soloVarPrecio = makeProduct("solo-var", 0, [
      { id: "v1", name: "Unidad", price: 48 },
    ]);
    const ambosFuera = makeProduct("fuera", 15, [{ id: "v1", name: "Mini", price: 18 }]);

    expect(getProductFilterablePrices(consultar)).toEqual([]);
    expect(getProductFilterablePrices(baseFueraVarDentro)).toEqual([220, 65, 220]);

    // Sin filtro activo -> incluye "A consultar"
    expect(matchesPriceRange(consultar, null, bounds)).toBe(true);

    // Con rango [30, 100] -> excluye "A consultar" y "fuera", incluye coincidencias en variación
    const range: [number, number] = [30, 100];
    expect(matchesPriceRange(consultar, range, bounds)).toBe(false);
    expect(matchesPriceRange(baseFueraVarDentro, range, bounds)).toBe(true);
    expect(matchesPriceRange(soloVarPrecio, range, bounds)).toBe(true);
    expect(matchesPriceRange(ambosFuera, range, bounds)).toBe(false);
  });

  it("E6: prioriza price_bounds del servidor (catálogos >36 ítems, incluso min=0 por sub-unidad) y detecta fallback legacy RPC", () => {
    // Evka-like: los primeros ítems en memoria empiezan en 60, pero servidor reporta min 50 (ítem >36)
    const parcialEnMemoria = [makeProduct("p1", 60), makeProduct("p2", 340)];
    expect(computePriceBounds(parcialEnMemoria, { min: 50, max: 340 })).toEqual({
      min: 50,
      max: 340,
    });

    // Sub-centavo (min=0 legal cuando max>0) vs payload inválido/null
    expect(parsePriceBounds({ min: 0, max: 135 })).toEqual({ min: 0, max: 135 });
    expect(parsePriceBounds(null)).toBeUndefined();
    expect(parsePriceBounds({ min: -5, max: 100 })).toBeUndefined();

    // Sin serverBounds (caché vieja), calcula desde memoria usando variaciones también
    expect(
      computePriceBounds([makeProduct("p1", 60.4), makeProduct("p2", 0, [{ id: "v", name: "X", price: 49.2 }])]),
    ).toEqual({ min: 49, max: 61 });

    // Detección de firma 7-arg ausente en PostgREST/Postgres
    expect(shouldFallbackToLegacyProductsRpc({ code: "PGRST202", message: "Could not find the function" })).toBe(true);
    expect(shouldFallbackToLegacyProductsRpc({ code: "42883", message: "function get_public_store_products does not exist" })).toBe(true);
    expect(shouldFallbackToLegacyProductsRpc({ status: 404, message: "Not found" })).toBe(true);
    expect(shouldFallbackToLegacyProductsRpc({ code: "42501", message: "permission denied" })).toBe(false);
  });

  it("E7: formatea de manera uniforme la etiqueta del chip de rango de precio", () => {
    expect(formatPriceRangeLabel([25, 140])).toBe("S/ 25 – S/ 140");
  });
});
