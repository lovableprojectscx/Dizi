import { describe, expect, it } from "vitest";
import {
  getNextTier,
  getTiers,
  getUnitPrice,
  hasDisparateVariationPrices,
  isStoreWholesaleEnabled,
  isWholesaleEligible,
  validateTiers,
} from "../wholesale";
import { Product, Store } from "../types";

describe("F42 · Precios por mayor (Motor de reglas wholesale.ts)", () => {
  const storeEmprendedor: Store = {
    id: "store-1",
    slug: "tienda-test",
    name: "Tienda Test",
    phone: "999888777",
    countryCode: "51",
    plan: "emprendedor",
    wholesaleEnabled: true,
    active: true,
    createdAt: "2026-01-01T00:00:00Z",
    whatsappClicks: 0,
    categories: [],
    products: [],
  };

  const storeApagada: Store = {
    ...storeEmprendedor,
    wholesaleEnabled: false,
  };

  const storeSemilla: Store = {
    ...storeEmprendedor,
    plan: "semilla",
    wholesaleEnabled: true,
  };

  const poloBase: Product = {
    id: "polo-1",
    name: "Polo Oversize Algodón",
    price: 35,
    categoryId: "cat-1",
    image: "/images/polo.jpg",
    visible: true,
    wholesaleTiers: [
      { min_qty: 3, price: 28 },
      { min_qty: 12, price: 24 },
    ],
    variations: [
      { id: "v-m", name: "Talla M" },
      { id: "v-l", name: "Talla L" },
      { id: "v-xl", name: "Talla XL" },
    ],
  };

  // 1. Escenario 1: Apagado = hoy
  it("E1 apagado = hoy: cuando el interruptor está apagado, no se aplican tiers y el precio es regular", () => {
    expect(isStoreWholesaleEnabled(storeApagada)).toBe(false);
    expect(isWholesaleEligible(poloBase, storeApagada)).toBe(false);

    const calc = getUnitPrice(poloBase, 3, storeApagada);
    expect(calc.isWholesaleApplied).toBe(false);
    expect(calc.unitPrice).toBe(35);
    expect(calc.totalSavings).toBe(0);
    expect(calc.appliedTier).toBeNull();

    const next = getNextTier(poloBase, 2, storeApagada);
    expect(next).toBeNull();
  });

  // 2. Escenario 2: Suma de tallas
  it("E2 suma de tallas: 2 M + 1 L (3 unidades) alcanzan el nivel 3 -> S/ 28 con subtotal S/ 84 y ahorro S/ 21", () => {
    const totalQty = 2 + 1; // 2 Talla M + 1 Talla L
    const calc = getUnitPrice(poloBase, totalQty, storeEmprendedor);

    expect(calc.isWholesaleApplied).toBe(true);
    expect(calc.unitPrice).toBe(28);
    expect(calc.unitSavings).toBe(7);
    expect(calc.totalSavings).toBe(21);
    expect(calc.appliedTier).toEqual({ min_qty: 3, price: 28 });
    expect(calc.unitPrice * totalQty).toBe(84);
  });

  // 3. Escenario 3: Falta poco
  it("E3 falta poco: con 2 unidades se cobra precio regular S/ 35 y sugiere agregar 1 más para pagar S/ 28 c/u", () => {
    const totalQty = 2;
    const calc = getUnitPrice(poloBase, totalQty, storeEmprendedor);

    expect(calc.isWholesaleApplied).toBe(false);
    expect(calc.unitPrice).toBe(35);
    expect(calc.totalSavings).toBe(0);

    const next = getNextTier(poloBase, totalQty, storeEmprendedor);
    expect(next).not.toBeNull();
    expect(next?.missingUnits).toBe(1);
    expect(next?.targetPrice).toBe(28);
    expect(next?.shouldShowSuggestion).toBe(true);
  });

  // 4. Escenario 4: Mejor nivel
  it("E4 mejor nivel: con 12 unidades se cobra el mejor escalón alcanzado (S/ 24)", () => {
    const totalQty = 12;
    const calc = getUnitPrice(poloBase, totalQty, storeEmprendedor);

    expect(calc.isWholesaleApplied).toBe(true);
    expect(calc.unitPrice).toBe(24);
    expect(calc.unitSavings).toBe(11);
    expect(calc.totalSavings).toBe(132); // 12 * 11
    expect(calc.appliedTier).toEqual({ min_qty: 12, price: 24 });
    expect(calc.unitPrice * totalQty).toBe(288);
  });

  // 5. Escenario 5: Oferta contra mayor
  it("E5 oferta contra mayor: producto en oferta a S/ 26 con nivel a S/ 28 cobra S/ 26 y no marca mayor aplicado", () => {
    const poloEnOferta: Product = {
      ...poloBase,
      price: 26, // Precio vigente de oferta
      originalPrice: 35,
      isOnSale: true,
      wholesaleTiers: [{ min_qty: 3, price: 28 }], // Nivel por mayor a 28 (más caro que oferta)
    };

    const calc = getUnitPrice(poloEnOferta, 3, storeEmprendedor);
    expect(calc.unitPrice).toBe(26);
    expect(calc.isWholesaleApplied).toBe(false);
    expect(calc.appliedTier).toBeNull();
  });

  // 6. Escenario 6: Plan Semilla
  it("E6 plan semilla: con plan efectivo semilla, el catálogo ignora los niveles guardados", () => {
    expect(isStoreWholesaleEnabled(storeSemilla)).toBe(false);
    expect(isWholesaleEligible(poloBase, storeSemilla)).toBe(false);

    const calc = getUnitPrice(poloBase, 5, storeSemilla);
    expect(calc.isWholesaleApplied).toBe(false);
    expect(calc.unitPrice).toBe(35);

    const tiers = getTiers(poloBase, storeSemilla);
    expect(tiers).toHaveLength(0);
  });

  // 7. Escenario 7: Validación
  it("E7 validacion: rechaza precios >= precio normal, cantidades decrecientes o niveles mayores a 3", () => {
    // Precio igual o mayor al producto
    const v1 = validateTiers([{ min_qty: 3, price: 35 }], 35);
    expect(v1.valid).toBe(false);
    expect(v1.error).toContain("debe ser menor al precio normal");

    // Cantidad mínima menor a 2
    const v2 = validateTiers([{ min_qty: 1, price: 25 }], 35);
    expect(v2.valid).toBe(false);
    expect(v2.error).toContain("al menos 2 unidades");

    // Cantidades no crecientes
    const v3 = validateTiers(
      [
        { min_qty: 5, price: 30 },
        { min_qty: 4, price: 25 },
      ],
      35,
    );
    expect(v3.valid).toBe(false);
    expect(v3.error).toContain("debe ser mayor");

    // Precios no decrecientes
    const v4 = validateTiers(
      [
        { min_qty: 3, price: 28 },
        { min_qty: 6, price: 29 },
      ],
      35,
    );
    expect(v4.valid).toBe(false);
    expect(v4.error).toContain("debe ser menor al del Nivel");

    // Más de 3 niveles
    const v5 = validateTiers(
      [
        { min_qty: 3, price: 30 },
        { min_qty: 6, price: 25 },
        { min_qty: 12, price: 20 },
        { min_qty: 24, price: 15 },
      ],
      35,
    );
    expect(v5.valid).toBe(false);
    expect(v5.error).toContain("Máximo 3 niveles");

    // Válido
    const vOk = validateTiers(
      [
        { min_qty: 3, price: 28 },
        { min_qty: 12, price: 24 },
      ],
      35,
    );
    expect(vOk.valid).toBe(true);
  });

  // 8. Escenario 8: Variaciones con precios distintos
  it("E8 variaciones con precios distintos: si una talla tiene precio distinto, se desmarca elegibilidad y se rechaza", () => {
    const poloConPreciosDispares: Product = {
      ...poloBase,
      variations: [
        { id: "v-m", name: "Talla M", price: 35 },
        { id: "v-xl", name: "Talla XL", price: 42 }, // Precio diferente
      ],
    };

    expect(hasDisparateVariationPrices(poloConPreciosDispares)).toBe(true);
    expect(isWholesaleEligible(poloConPreciosDispares, storeEmprendedor)).toBe(false);

    const val = validateTiers([{ min_qty: 3, price: 28 }], 35, poloConPreciosDispares.variations);
    expect(val.valid).toBe(false);
    expect(val.error).toContain("variaciones a distinto precio");
  });

  // 9. Regla ajustada por Jack: sugerencia solo si faltan 3 unidades o menos
  it("Ajuste Jack: sugerencia de siguiente nivel solo se muestra si faltan 3 unidades o menos", () => {
    // Polo con nivel a 12 unidades
    // Caso A: Tiene 8 unidades (faltan 4 u. -> missingUnits = 4 > 3)
    const nextA = getNextTier(poloBase, 8, storeEmprendedor);
    expect(nextA?.missingUnits).toBe(4);
    expect(nextA?.shouldShowSuggestion).toBe(false);

    // Caso B: Tiene 9 unidades (faltan 3 u. -> missingUnits = 3 <= 3)
    const nextB = getNextTier(poloBase, 9, storeEmprendedor);
    expect(nextB?.missingUnits).toBe(3);
    expect(nextB?.shouldShowSuggestion).toBe(true);

    // Caso C: Tiene 10 unidades (faltan 2 u. -> missingUnits = 2 <= 3)
    const nextC = getNextTier(poloBase, 10, storeEmprendedor);
    expect(nextC?.missingUnits).toBe(2);
    expect(nextC?.shouldShowSuggestion).toBe(true);
  });

  // 10. Revisión de Claude: un producto con un nivel a S/ 28 cuyo precio baja a S/ 27 se guarda, y el catálogo no aplica el nivel
  it("un producto con un nivel a S/ 28 cuyo precio baja a S/ 27 se guarda, y el catálogo no aplica el nivel", () => {
    // Producto con nivel a S/ 28 cuyo precio regular baja a S/ 27
    const productoConNivel28: Product = {
      ...poloBase,
      price: 35,
      wholesaleTiers: [{ min_qty: 3, price: 28 }],
    };

    const productoPrecioRebajado: Product = {
      ...productoConNivel28,
      price: 27,
    };

    // 1. Guardado permitido: la discrepancia es únicamente de precio frente al tier previo
    const validation = validateTiers(
      productoPrecioRebajado.wholesaleTiers || [],
      productoPrecioRebajado.price,
      productoPrecioRebajado.variations,
    );
    const isPriceOnlyMismatch =
      !validation.valid &&
      Boolean(validation.error?.includes("debe ser menor al precio normal del producto"));
    expect(isPriceOnlyMismatch).toBe(true);

    // 2. getTiers descarta el nivel porque 28 >= 27
    const tiersEnCatalogo = getTiers(productoPrecioRebajado, storeEmprendedor);
    expect(tiersEnCatalogo).toHaveLength(0);

    // 3. No es elegible para mayorista al no tener niveles válidos inferiores al precio
    expect(isWholesaleEligible(productoPrecioRebajado, storeEmprendedor)).toBe(false);

    // 4. El catálogo no aplica el nivel: con 3 unidades cobra S/ 27 y ahorro S/ 0
    const calc = getUnitPrice(productoPrecioRebajado, 3, storeEmprendedor);
    expect(calc.isWholesaleApplied).toBe(false);
    expect(calc.unitPrice).toBe(27);
    expect(calc.totalSavings).toBe(0);
    expect(calc.appliedTier).toBeNull();

    // 5. El carrito no sugiere niveles inválidos
    const next = getNextTier(productoPrecioRebajado, 2, storeEmprendedor);
    expect(next).toBeNull();
  });
});
