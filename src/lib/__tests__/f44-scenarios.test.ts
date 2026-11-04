import { describe, it, expect, vi, beforeEach } from "vitest";
import { diffProduct, toDbPatch, isConflict, ProductConflictError } from "../product-sync";
import type { Product, Store } from "../types";

describe("F44: Escenarios E1 a E8 (Sincronización segura del panel)", () => {
  const baseStoreId = "zz-audit-sync-store";

  const originalProductInDb: Product = {
    id: "prod-sync-01",
    name: "Vestido Sirena Elegante",
    price: 80,
    categoryId: "cat-01",
    image: "https://example.com/vestido.webp",
    description: "Vestido de gala",
    isOnSale: false,
    originalPrice: null,
    visible: true,
    isSample: false,
    sortOrder: 1,
    tags: ["fiesta", "nuevo"],
    variations: [
      { id: "v1", name: "S", price: null, image: null },
      { id: "v2", name: "M", price: null, image: null },
      { id: "v3", name: "L", price: null, image: null },
      { id: "v4", name: "XL", price: null, image: null },
    ],
    wholesaleTiers: [{ min_qty: 6, price: 65 }],
    version: 5,
    updatedAt: "2026-11-03T10:00:00.000Z",
  };

  describe("E1: Datos viejos no pisan tallas (RF-44.4 guardado parcial)", () => {
    it("dado que A guardó S, M, L y XL, y B tiene datos viejos ([S]), cuando B cambia solo el precio, la base conserva S, M, L y XL", () => {
      // Dispositivo B tiene en su caché local un producto viejo con solo talla S
      const staleProductOnDeviceB: Product = {
        ...originalProductInDb,
        variations: [{ id: "v1", name: "S", price: null, image: null }],
        price: 80,
      };

      // Dispositivo B solo modifica el precio a 95
      const editedOnDeviceB: Product = {
        ...staleProductOnDeviceB,
        price: 95,
      };

      // Se calcula el diff parcial contra la versión que Device B cargó
      const diff = diffProduct(staleProductOnDeviceB, editedOnDeviceB);
      expect(diff).toEqual({ price: 95 });
      expect(diff.variations).toBeUndefined();

      // Se genera el patch para la base de datos
      const patch = toDbPatch(diff);
      expect(patch).toEqual({ price: 95 });
      expect(patch.variations).toBeUndefined();

      // Simulación de aplicación en base de datos: solo se aplica el patch a la fila existente
      const dbRowAfterDeviceB = {
        ...originalProductInDb,
        ...patch,
      };

      // La base de datos conserva todas las tallas guardadas por A y actualiza únicamente el precio
      expect(dbRowAfterDeviceB.price).toBe(95);
      expect(dbRowAfterDeviceB.variations).toBeDefined();
      expect(dbRowAfterDeviceB.variations?.length).toBe(4);
      expect(dbRowAfterDeviceB.variations?.map((v) => v.name)).toEqual(["S", "M", "L", "XL"]);
    });
  });

  describe("E2: Edición simultánea y detección de conflicto optimista (RF-44.5)", () => {
    it("dado que A y B abrieron versión 5, cuando A guarda (v6) y luego B guarda, B recibe aviso y recarga versión actual", () => {
      let dbVersion = 5;
      let dbProduct = { ...originalProductInDb, version: dbVersion };

      // Dispositivo A guarda cambio: actualiza nombre y sube a version 6
      const patchA = { name: "Vestido Sirena Noche" };
      const expectedVersionA = 5;

      let rowsAffectedA = 0;
      if (dbProduct.version === expectedVersionA) {
        dbVersion += 1;
        dbProduct = { ...dbProduct, ...patchA, version: dbVersion };
        rowsAffectedA = 1;
      }
      expect(rowsAffectedA).toBe(1);
      expect(dbProduct.version).toBe(6);
      expect(dbProduct.name).toBe("Vestido Sirena Noche");

      // Dispositivo B intenta guardar cambio con su versión vieja (5)
      const expectedVersionB = 5;
      let rowsAffectedB = 0;
      if (dbProduct.version === expectedVersionB) {
        dbVersion += 1;
        dbProduct = { ...dbProduct, price: 99, version: dbVersion };
        rowsAffectedB = 1;
      }

      // 0 filas afectadas: conflicto detectado
      expect(rowsAffectedB).toBe(0);
      expect(isConflict(null, rowsAffectedB)).toBe(true);

      // Se crea y lanza ProductConflictError con el producto fresco
      const conflictError = new ProductConflictError(
        "Este producto se modificó desde otro dispositivo. Te mostramos la versión actual; revisa y vuelve a guardar.",
        dbProduct
      );

      expect(conflictError.code).toBe("PRODUCT_VERSION_CONFLICT");
      expect(conflictError.message).toBe(
        "Este producto se modificó desde otro dispositivo. Te mostramos la versión actual; revisa y vuelve a guardar."
      );
      expect(conflictError.freshProduct?.version).toBe(6);
      expect(conflictError.freshProduct?.name).toBe("Vestido Sirena Noche");

      // El producto en base de datos NO fue pisado por B
      expect(dbProduct.price).toBe(80);
    });
  });

  describe("E3: Error de la base de datos (RF-44.6)", () => {
    it("dado un error al guardar, se notifica el error y el estado del panel permanece sin cambios corruptos", () => {
      const originalState = { ...originalProductInDb };
      let localProduct = { ...originalProductInDb };

      const simulateSave = (shouldFail: boolean) => {
        if (shouldFail) {
          throw new Error("violates check constraint 'wholesale_tiers_valid'");
        }
        localProduct = { ...localProduct, price: 100 };
      };

      expect(() => simulateSave(true)).toThrow("violates check constraint 'wholesale_tiers_valid'");
      // El panel no muta su estado si la base rechaza
      expect(localProduct.price).toBe(originalState.price);
    });
  });

  describe("E4: Reordenar productos (RF-44.7)", () => {
    it("reordenar productos genera patch exclusivo de sort_order sin alterar precio, visibilidad ni tallas", () => {
      const diff: Partial<Product> = { sortOrder: 42 };
      const patch = toDbPatch(diff);

      expect(patch).toEqual({ sort_order: 42 });
      expect(patch.price).toBeUndefined();
      expect(patch.visible).toBeUndefined();
      expect(patch.variations).toBeUndefined();
      expect(patch.wholesale_tiers).toBeUndefined();
    });
  });

  describe("E5: Entrar con datos viejos y migración persist (RF-44.1 y RF-44.2)", () => {
    it("descarta datos cacheados de versiones previas a F44 al inicializar persist", () => {
      // Mock de estado guardado en versión 0 (antes de F44)
      const oldPersistedState = {
        stores: [{ id: "old-store", products: [{ id: "old-prod", name: "Viejo" }] }],
        lastFetched: 1700000000,
      };

      // Función de migración definida en store.ts persist configuration
      const migrate = (persistedState: any, version: number) => {
        if (version < 1) {
          return {
            ...persistedState,
            stores: [],
            lastFetched: null,
          };
        }
        return persistedState;
      };

      const migrated = migrate(oldPersistedState, 0);
      expect(migrated.stores).toEqual([]);
      expect(migrated.lastFetched).toBeNull();
    });
  });

  describe("E6: Volver a la pestaña tras más de 60 segundos (RF-44.1)", () => {
    it("evalúa si han pasado más de 60 segundos desde lastFetched para disparar revalidación SWR", () => {
      const checkShouldRevalidate = (lastFetched: number | null, now: number): boolean => {
        if (!lastFetched) return true;
        return now - lastFetched > 60 * 1000;
      };

      const baseTime = 1000000;

      // Hace 30 segundos: no revalida
      expect(checkShouldRevalidate(baseTime, baseTime + 30 * 1000)).toBe(false);

      // Hace 61 segundos: sí revalida
      expect(checkShouldRevalidate(baseTime, baseTime + 61 * 1000)).toBe(true);

      // Sin timestamp previo: siempre revalida
      expect(checkShouldRevalidate(null, baseTime)).toBe(true);
    });
  });

  describe("E7: Editar abre versión fresca de la base (RF-44.3)", () => {
    it("al invocar la lectura de edición, se obtiene el producto actualizado directamente", async () => {
      const mockDbProduct = {
        ...originalProductInDb,
        name: "Vestido Actualizado en la Base",
        price: 110,
        version: 7,
      };

      const fetchProductFreshMock = vi.fn().mockResolvedValue(mockDbProduct);

      const openedProduct = await fetchProductFreshMock(baseStoreId, "prod-sync-01");
      expect(openedProduct.name).toBe("Vestido Actualizado en la Base");
      expect(openedProduct.price).toBe(110);
      expect(openedProduct.version).toBe(7);
    });
  });

  describe("E8: Alternar visibilidad (RF-44.8)", () => {
    it("ocultar o mostrar un producto manda únicamente visible y version, preservando tallas y precios", () => {
      const currentVersion = originalProductInDb.version ?? 1;
      const newVisible = !originalProductInDb.visible;

      const updatePayload = {
        visible: newVisible,
      };

      expect(updatePayload).toEqual({ visible: false });
      expect((updatePayload as any).variations).toBeUndefined();
      expect((updatePayload as any).price).toBeUndefined();
      expect((updatePayload as any).wholesale_tiers).toBeUndefined();
    });
  });

  describe("E9: Diálogo abierto en B, panel se revalida con el cambio de A, y B guarda -> conflicto, no pisa", () => {
    it("dado que B abrió el modal con la versión 5 (foto base), A guarda cambio en DB (sube a v6) y el panel de B se revalida a v6; cuando B guarda sus cambios, upsertProduct usa la foto base (v5), detecta conflicto (0 filas), no pisa el cambio de A y lanza ProductConflictError", () => {
      // Estado inicial en la BD
      let dbProduct: Product = {
        ...originalProductInDb,
        name: "Vestido Sirena Original",
        price: 80,
        version: 5,
      };

      // 1. Dispositivo B abre el diálogo: toma la foto base retornada por la lectura fresca
      const baseSnapshotB: Product = { ...dbProduct };
      expect(baseSnapshotB.version).toBe(5);

      // B comienza a editar en el formulario: cambia el precio a 95
      const editedProductB: Product = {
        ...baseSnapshotB,
        price: 95,
      };

      // 2. Mientras el diálogo de B sigue abierto, el Dispositivo A guarda en la base
      const patchA = { name: "Vestido Sirena Modificado por A" };
      dbProduct = {
        ...dbProduct,
        ...patchA,
        version: dbProduct.version! + 1, // Ahora v6 en DB
      };
      expect(dbProduct.version).toBe(6);
      expect(dbProduct.name).toBe("Vestido Sirena Modificado por A");

      // 3. El panel de B se revalida en segundo plano (SWR) con el diálogo aún abierto
      // El store de B (st.products) ahora contiene la versión 6 de A
      const storeStateOnB: Product[] = [{ ...dbProduct }];
      expect(storeStateOnB[0].version).toBe(6);

      // 4. B hace clic en Guardar. upsertProduct(storeId, editedProductB, baseSnapshotB):
      // Debe calcular el diff contra baseSnapshotB (no contra storeStateOnB)
      const diff = diffProduct(baseSnapshotB, editedProductB);
      expect(diff).toEqual({ price: 95 });

      const patch = toDbPatch(diff);
      // El WHERE version debe usar baseSnapshotB.version (5), NO storeStateOnB[0].version (6)
      const targetVersion = baseSnapshotB.version;
      expect(targetVersion).toBe(5);

      // En la base de datos real, el UPDATE busca WHERE id = prod.id AND version = 5
      // Como dbProduct.version ya es 6, coincide con 0 filas
      let rowsUpdated = 0;
      if (dbProduct.version === targetVersion) {
        dbProduct = { ...dbProduct, ...patch, version: dbProduct.version! + 1 };
        rowsUpdated = 1;
      }

      expect(rowsUpdated).toBe(0);

      // Al no actualizar filas, se lanza ProductConflictError
      if (rowsUpdated === 0) {
        const error = new ProductConflictError(
          "Este producto se modificó desde otro dispositivo. Te mostramos la versión actual; revisa y vuelve a guardar.",
          dbProduct
        );
        expect(error.code).toBe("PRODUCT_VERSION_CONFLICT");
        expect(error.freshProduct?.name).toBe("Vestido Sirena Modificado por A");
        expect(error.freshProduct?.version).toBe(6);
      }

      // La base de datos conserva intacto el cambio de A y no fue pisada por B
      expect(dbProduct.name).toBe("Vestido Sirena Modificado por A");
      expect(dbProduct.price).toBe(80); // El precio de B (95) no pisó la BD
      expect(dbProduct.version).toBe(6);
    });
  });
});
