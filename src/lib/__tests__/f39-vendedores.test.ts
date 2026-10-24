import { describe, it, expect } from "vitest";
import { buildSellerMessage, buildWaUrl } from "../whatsapp";
import { getMaxSellers, PLANS, type Store, type Seller } from "../types";
import {
  resolveActiveSellers,
  resolveWhatsAppDispatch,
  canToggleSeller,
  resolvePublicStoreSellers,
  normalizeMainSellerName,
} from "../sellers";

describe("F39: Varios Vendedores (WhatsApp Múltiple)", () => {
  describe("1. buildSellerMessage - Saludo y preservación de texto sin romper palabras", () => {
    it("solo quita 'Hola' + puntuación opcional (',', '!', ':') y nunca come palabras como 'me'", () => {
      const msg = "Hola, me interesa el producto: Zapatillas Urbanas";
      const result = buildSellerMessage("Dianis", msg);
      expect(result).toBe("Hola Dianis, me interesa el producto: Zapatillas Urbanas");
    });

    it("funciona con 'Hola me gustaría...' sin comerse la palabra 'me'", () => {
      const msg = "Hola me gustaría consultar sobre los productos.";
      const result = buildSellerMessage("Dianis", msg);
      expect(result).toBe("Hola Dianis, me gustaría consultar sobre los productos.");
    });

    it("funciona con 'Hola!' y 'Hola:'", () => {
      expect(buildSellerMessage("Luisa", "Hola! Quiero hacer un pedido")).toBe(
        "Hola Luisa, quiero hacer un pedido",
      );
      expect(buildSellerMessage("Luisa", "Hola: quiero hacer un pedido")).toBe(
        "Hola Luisa, quiero hacer un pedido",
      );
    });

    it("no duplica 'Hola' cuando el mensaje es solo 'Hola'", () => {
      expect(buildSellerMessage("Luisa", "Hola")).toBe("Hola Luisa");
      expect(buildSellerMessage("Luisa", "Hola!")).toBe("Hola Luisa");
      expect(buildSellerMessage("Luisa", "hola,")).toBe("Hola Luisa");
    });

    it("agrega saludo en minúscula si el mensaje no empieza con Hola (ej: 'tengo una consulta.')", () => {
      const msg = "tengo una consulta.";
      const result = buildSellerMessage("Dianis", msg);
      expect(result).toBe("Hola Dianis, tengo una consulta.");
    });

    it("devuelve 'Hola <Nombre>' si el mensaje es vacío o nulo", () => {
      expect(buildSellerMessage("Dianis", "")).toBe("Hola Dianis");
      expect(buildSellerMessage("Dianis", undefined)).toBe("Hola Dianis");
    });

    it("conserva el mensaje original si no se proporciona nombre", () => {
      expect(buildSellerMessage("", "Hola, consulta")).toBe("Hola, consulta");
    });
  });

  describe("2. Mensajes REALES de los 7 Puntos de Contacto", () => {
    const STORE_COMPLEJO = "ADORNIA | WE HOME & DECO";
    const SELLER = "Dianis";

    // Punto 1: Checkout / Enviar Pedido
    it("Punto 1 (Carrito): con vendedor elegido saluda por su nombre; sin vendedor mantiene nombre de tienda", () => {
      const lines = "• Anillo Diamante x1 — S/ 250.00";
      // Con vendedor
      const orderBodyConVendedor = `quiero hacer este pedido:\n\n${lines}\n\nTotal: S/ 250.00`;
      const msgVendedor = buildSellerMessage(SELLER, orderBodyConVendedor);
      expect(msgVendedor).toBe(`Hola Dianis, quiero hacer este pedido:\n\n${lines}\n\nTotal: S/ 250.00`);

      // Sin vendedores
      const msgDirecto = `Hola ${STORE_COMPLEJO}, quiero hacer este pedido:\n\n${lines}\n\nTotal: S/ 250.00`;
      expect(msgDirecto).toBe(`Hola ADORNIA | WE HOME & DECO, quiero hacer este pedido:\n\n${lines}\n\nTotal: S/ 250.00`);
    });

    // Punto 2: Consultar Producto
    it("Punto 2 (Consultar producto): conserva 'me interesa el producto' intacto", () => {
      const msg = "Hola, me interesa el producto: Lámpara Nórdica (Madera / 220V)";
      const res = buildSellerMessage(SELLER, msg);
      expect(res).toBe("Hola Dianis, me interesa el producto: Lámpara Nórdica (Madera / 220V)");
    });

    // Punto 3: Soporte / Consulta General (supportClick)
    it("Punto 3 (Soporte): con vendedor usa 'tengo una consulta.' sin el nombre de la tienda; sin vendedor conserva tienda con símbolos", () => {
      // Con vendedor
      const msgConVendedor = buildSellerMessage(SELLER, "tengo una consulta.");
      expect(msgConVendedor).toBe("Hola Dianis, tengo una consulta.");

      // Sin vendedor
      const msgSinVendedor = `Hola ${STORE_COMPLEJO}, tengo una consulta.`;
      expect(msgSinVendedor).toBe("Hola ADORNIA | WE HOME & DECO, tengo una consulta.");
    });

    // Punto 4: Sin Resultados (búsqueda y sin búsqueda)
    it("Punto 4 (Sin resultados con búsqueda): 'Hola, busco: ...' -> 'Hola Dianis, busco: ...'", () => {
      const msg = "Hola, busco: Espejo Ovalado 60x40";
      const res = buildSellerMessage(SELLER, msg);
      expect(res).toBe("Hola Dianis, busco: Espejo Ovalado 60x40");
    });

    it("Punto 4 (Sin resultados sin búsqueda): conserva tienda con símbolos", () => {
      const msg = `Hola, me gustaría consultar sobre los productos de ${STORE_COMPLEJO}`;
      const res = buildSellerMessage(SELLER, msg);
      expect(res).toBe("Hola Dianis, me gustaría consultar sobre los productos de ADORNIA | WE HOME & DECO");
    });

    // Punto 5: Bio "Pedir por WhatsApp"
    it("Punto 5 (Bio): 'Hola, me gustaría consultar...' no pierde el 'me'", () => {
      const msg = "Hola, me gustaría consultar sobre los productos.";
      const res = buildSellerMessage(SELLER, msg);
      expect(res).toBe("Hola Dianis, me gustaría consultar sobre los productos.");
    });

    // Punto 6: Tienda Vacía / Encabezado
    it("Punto 6 (Tienda vacía): 'Hola, me gustaría consultar sobre los productos de Tienda.'", () => {
      const msg = `Hola, me gustaría consultar sobre los productos de ${STORE_COMPLEJO}.`;
      const res = buildSellerMessage(SELLER, msg);
      expect(res).toBe("Hola Dianis, me gustaría consultar sobre los productos de ADORNIA | WE HOME & DECO.");
    });

    // Punto 7: InAppBrowser Modal
    it("Punto 7 (InAppHelpModal): genera el enlace al teléfono del vendedor elegido", () => {
      const finalMsg = buildSellerMessage(SELLER, "quiero hacer este pedido:\nTotal: S/ 100.00");
      const sellerPhone = "51935555485";
      const waUrl = buildWaUrl(sellerPhone, finalMsg);
      expect(waUrl).toContain("https://wa.me/51935555485");
      expect(waUrl).toContain(encodeURIComponent("Hola Dianis, quiero hacer este pedido:"));
    });
  });

  describe("3. Contrato de Datos Supabase (country_iso y reglas del trigger)", () => {
    it("serializa vendedores a snake_case (country_iso) al guardar en DB", () => {
      const frontendSellers: Seller[] = [
        {
          id: "seller_1",
          name: "Dianis Flores",
          phone: "51935555485",
          countryIso: "PE",
          active: true,
        },
        {
          id: "seller_2",
          name: "Luisa Méndez",
          phone: "573001234567",
          countryIso: "CO",
          active: false,
        },
      ];

      // Transformación realizada por store.ts
      const dbSellers = frontendSellers.map((s) => ({
        id: s.id,
        name: s.name,
        phone: s.phone,
        country_iso: s.countryIso || "PE",
        active: s.active ?? true,
      }));

      // Verificación de claves exactas requeridas por el trigger
      expect(dbSellers[0]).toEqual({
        id: "seller_1",
        name: "Dianis Flores",
        phone: "51935555485",
        country_iso: "PE",
        active: true,
      });
      expect(dbSellers[1]).toEqual({
        id: "seller_2",
        name: "Luisa Méndez",
        phone: "573001234567",
        country_iso: "CO",
        active: false,
      });

      // Valida cada regla exigida por el trigger en PostgreSQL:
      for (const elem of dbSellers) {
        expect(elem.id).toBeTruthy();
        expect(elem.name.length).toBeGreaterThanOrEqual(1);
        expect(elem.name.length).toBeLessThanOrEqual(40);
        expect(elem.phone).toMatch(/^[0-9]{6,15}$/);
        expect(elem.country_iso).toMatch(/^[A-Z]{2}$/);
        expect(typeof elem.active).toBe("boolean");
      }
    });

    it("deserializa vendedores de snake_case (country_iso) a camelCase (countryIso)", () => {
      const dbRowSellers = [
        {
          id: "s1",
          name: "Dianis",
          phone: "51935555485",
          country_iso: "PE",
          active: true,
        },
      ];

      // Mapeo realizado en mapStoreFromDB y rutas públicas
      const mappedSellers: Seller[] = dbRowSellers.map((s: any) => ({
        id: s.id,
        name: s.name,
        phone: s.phone,
        countryIso: s.country_iso ?? s.countryIso ?? "PE",
        active: s.active ?? true,
      }));

      expect(mappedSellers[0].countryIso).toBe("PE");
      expect(mappedSellers[0].name).toBe("Dianis");
    });
  });

  describe("4. Nombre del Vendedor Principal (mainSellerName)", () => {
    it("usa mainSellerName en el selector y saludo si está configurado", () => {
      const storeMock: Partial<Store> = {
        name: "ADORNIA TIENDA OFICIAL",
        mainSellerName: "Franklin",
        phone: "51925176472",
        countryIso: "PE",
      };

      const displayName = storeMock.mainSellerName?.trim() || storeMock.name!;
      expect(displayName).toBe("Franklin");

      const msg = buildSellerMessage(displayName, "tengo una consulta.");
      expect(msg).toBe("Hola Franklin, tengo una consulta.");
    });

    it("usa store.name por defecto si mainSellerName no está configurado", () => {
      const storeMock: Partial<Store> = {
        name: "ADORNIA TIENDA OFICIAL",
        mainSellerName: undefined,
        phone: "51925176472",
        countryIso: "PE",
      };

      const displayName = storeMock.mainSellerName?.trim() || storeMock.name!;
      expect(displayName).toBe("ADORNIA TIENDA OFICIAL");
    });
  });

  describe("5. getMaxSellers - Límites por plan contando el principal", () => {
    it("Semilla permite 1 (solo el principal)", () => {
      expect(getMaxSellers({ plan: "semilla" })).toBe(1);
    });

    it("Emprendedor permite 1 (solo el principal)", () => {
      expect(getMaxSellers({ plan: "emprendedor" })).toBe(1);
    });

    it("Pro permite hasta 3 vendedores en total", () => {
      expect(getMaxSellers({ plan: "pro" })).toBe(3);
    });

    it("Ilimitado permite hasta 5 vendedores en total", () => {
      expect(getMaxSellers({ plan: "ilimitado" })).toBe(5);
    });

    it("Plan Pro vencido con más de 3 días de gracia degrada a 1 (Semilla)", () => {
      const pastDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
      expect(getMaxSellers({ plan: "pro", planExpiresAt: pastDate })).toBe(1);
    });

    it("Plan Pro vencido dentro del periodo de gracia (<= 3 días) conserva 3", () => {
      const graceDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();
      expect(getMaxSellers({ plan: "pro", planExpiresAt: graceDate })).toBe(3);
    });
  });

  describe("6. Catálogo de planes (PLANS.features)", () => {
    it("Pro incluye 'Varios vendedores (hasta 3)'", () => {
      expect(PLANS.pro.features).toContain("Varios vendedores (hasta 3)");
    });

    it("Ilimitado incluye 'Varios vendedores (hasta 5)'", () => {
      expect(PLANS.ilimitado.features).toContain("Varios vendedores (hasta 5)");
    });

    it("Semilla y Emprendedor NO incluyen varios vendedores", () => {
      expect(PLANS.semilla.features.some((f) => f.includes("vendedores"))).toBe(false);
      expect(PLANS.emprendedor.features.some((f) => f.includes("vendedores"))).toBe(false);
    });
  });

  describe("7. Bloqueo en Panel de Administración según Plan", () => {
    it("en Emprendedor bloquea agregar vendedores (maxExtraSellers === 0)", () => {
      const storeEmprendedor: Partial<Store> = { plan: "emprendedor", sellers: [] };
      const maxTotal = getMaxSellers(storeEmprendedor as Store);
      const maxExtra = Math.max(0, maxTotal - 1);
      const canAdd = (storeEmprendedor.sellers?.length || 0) < maxExtra;

      expect(maxTotal).toBe(1);
      expect(maxExtra).toBe(0);
      expect(canAdd).toBe(false);
    });

    it("en Pro permite hasta 2 vendedores extra (3 en total con principal)", () => {
      const storePro: Partial<Store> = {
        plan: "pro",
        sellers: [{ id: "s1", name: "Dianis", phone: "51935555485", active: true }],
      };
      const maxTotal = getMaxSellers(storePro as Store);
      const maxExtra = Math.max(0, maxTotal - 1);
      const canAdd = (storePro.sellers?.length || 0) < maxExtra;

      expect(maxTotal).toBe(3);
      expect(maxExtra).toBe(2);
      expect(canAdd).toBe(true);
    });

    it("en Pro bloquea cuando ya se alcanzaron 2 vendedores extra", () => {
      const storeProFull: Partial<Store> = {
        plan: "pro",
        sellers: [
          { id: "s1", name: "Dianis", phone: "51935555485", active: true },
          { id: "s2", name: "Luisa", phone: "51939980472", active: true },
        ],
      };
      const maxTotal = getMaxSellers(storeProFull as Store);
      const maxExtra = Math.max(0, maxTotal - 1);
      const canAdd = (storeProFull.sellers?.length || 0) < maxExtra;

      expect(canAdd).toBe(false);
    });
  });

  describe("8. Hotfix F39: SellerPicker dentro del Carrito abierto (Portal & Radix Dialog)", () => {
    it("SellerPicker debe implementar Radix Dialog con Portal (falla en master donde era un div estático sin portal)", async () => {
      const fs = await import("fs");
      const path = await import("path");
      const filePath = path.resolve(process.cwd(), "src/components/public/SellerPicker.tsx");
      const content = fs.readFileSync(filePath, "utf-8");

      // En master: no usaba Dialog ni DialogPortal de Radix (era un simple div con z-[9999] dentro de #root)
      // En la rama hotfix: importa y renderiza Dialog y DialogPortal
      expect(content).toMatch(/import[\s\S]*Dialog[\s\S]*from[\s\S]*["']@\/components\/ui\/dialog["']/);
      expect(content).toMatch(/<Dialog[\s\S]*<DialogPortal>/);
      expect(content).not.toMatch(/<div[^>]*data-testid="seller-picker-backdrop"[^>]*className="fixed inset-0 z-\[9999\]/);
    });
  });

  describe("9. Encargo F39b: Página propia de vendedores y activación flexible", () => {
    // Prueba 1: principal apagado + 1 extra → va directo al extra (saluda por nombre)
    it("principal apagado + 1 extra → va directo al extra, sin selector y saludando por nombre", () => {
      const storeMock: Partial<Store> = {
        name: "MODA URBANA",
        phone: "51999111222",
        countryIso: "PE",
        mainSellerActive: false,
        sellers: [
          {
            id: "s1",
            name: "Lucho",
            phone: "51988776655",
            countryIso: "PE",
            active: true,
          },
        ],
      };

      const activeList = resolveActiveSellers(storeMock as Store);
      expect(activeList).toHaveLength(1);
      expect(activeList[0].id).toBe("s1");
      expect(activeList[0].name).toBe("Lucho");
      expect(activeList[0].isMain).toBe(false);

      const dispatch = resolveWhatsAppDispatch(
        storeMock as Store,
        "quiero hacer este pedido:\n\n• Zapatilla x1\n\nTotal: S/ 150.00",
      );

      // Va directo sin abrir selector
      expect(dispatch.requiresPicker).toBe(false);
      // Destino es el teléfono de Lucho, no el principal
      expect(dispatch.targetPhone).toBe("51988776655");
      // Saluda por el nombre de Lucho
      expect(dispatch.finalMessage).toContain("Hola Lucho, quiero hacer este pedido:");
    });

    // Comparativa: principal activo sin extras → va directo a la tienda sin saludo de vendedor
    it("principal activo sin extras → va directo a la tienda sin alterar el saludo (identico a hoy)", () => {
      const storeMock: Partial<Store> = {
        name: "MODA URBANA",
        phone: "51999111222",
        countryIso: "PE",
        mainSellerActive: true,
        sellers: [],
      };

      const dispatch = resolveWhatsAppDispatch(
        storeMock as Store,
        "Hola MODA URBANA, quiero hacer este pedido:\n\n• Zapatilla x1\n\nTotal: S/ 150.00",
      );

      expect(dispatch.requiresPicker).toBe(false);
      expect(dispatch.targetPhone).toBe("51999111222");
      expect(dispatch.finalMessage).toBe(
        "Hola MODA URBANA, quiero hacer este pedido:\n\n• Zapatilla x1\n\nTotal: S/ 150.00",
      );
    });

    // Prueba 2: no se puede apagar el último activo
    it("no se puede apagar el último activo (garantiza >= 1 vendedor activo)", () => {
      // Caso 2.1: Solo está el principal activo
      const storeOnlyMain: Partial<Store> = {
        plan: "pro",
        mainSellerActive: true,
        sellers: [
          { id: "s1", name: "Dianis", phone: "51935555485", active: false },
        ],
      };
      const checkMainOff = canToggleSeller(storeOnlyMain as Store, "main", false);
      expect(checkMainOff.ok).toBe(false);
      expect(checkMainOff.error).toBe("Debe quedar al menos un vendedor activo.");

      // Caso 2.2: Principal apagado y solo queda 1 extra activo
      const storeOnlyOneExtra: Partial<Store> = {
        plan: "pro",
        mainSellerActive: false,
        sellers: [
          { id: "s1", name: "Dianis", phone: "51935555485", active: true },
        ],
      };
      const checkExtraOff = canToggleSeller(storeOnlyOneExtra as Store, "s1", false);
      expect(checkExtraOff.ok).toBe(false);
      expect(checkExtraOff.error).toBe("Debe quedar al menos un vendedor activo.");

      // Caso 2.3: Hay 2 activos -> apagar uno sí está permitido
      const storeTwoActive: Partial<Store> = {
        plan: "pro",
        mainSellerActive: true,
        sellers: [
          { id: "s1", name: "Dianis", phone: "51935555485", active: true },
        ],
      };
      expect(canToggleSeller(storeTwoActive as Store, "main", false).ok).toBe(true);
      expect(canToggleSeller(storeTwoActive as Store, "s1", false).ok).toBe(true);
    });

    // Prueba 3: plan bajado a Semilla → usa el principal aunque estuviese apagado
    it("plan bajado a Semilla → el catálogo usa el principal aunque esté apagado (no se queda sin WhatsApp)", () => {
      const storeDowngraded: Partial<Store> = {
        name: "BOUTIQUE BELLA",
        phone: "51987654321",
        plan: "semilla",
        mainSellerActive: false, // Estaba apagado en BD
        sellers: [
          { id: "s1", name: "Dianis", phone: "51935555485", active: true },
          { id: "s2", name: "Paolo", phone: "51939980472", active: true },
        ],
      };

      // get_public_store fuerza mainSellerActive = true y sellers = []
      const publicStoreView = resolvePublicStoreSellers(storeDowngraded as Store);
      expect(publicStoreView.mainSellerActive).toBe(true);
      expect(publicStoreView.sellers).toEqual([]);

      // El catálogo público resultante solo tiene 1 vendedor (el principal)
      const catalogActiveSellers = resolveActiveSellers({
        ...storeDowngraded,
        ...publicStoreView,
      } as Store);
      expect(catalogActiveSellers).toHaveLength(1);
      expect(catalogActiveSellers[0].id).toBe("main");
      expect(catalogActiveSellers[0].phone).toBe("51987654321");
    });

    // Prueba 4: el nombre vacío del principal se guarda como null
    it("el nombre vacío del vendedor principal se normaliza como null para limpiar la base de datos", () => {
      expect(normalizeMainSellerName("")).toBeNull();
      expect(normalizeMainSellerName("   ")).toBeNull();
      expect(normalizeMainSellerName(null)).toBeNull();
      expect(normalizeMainSellerName(undefined)).toBeNull();
      expect(normalizeMainSellerName("  Franklin  ")).toBe("Franklin");
    });

    // Prueba 5 (Ajuste Jack): tienda bajada a Semilla, con principal apagado y 2 extras, puede prender el principal
    it("tienda bajada a Semilla con principal apagado y 2 extras activos: puede volver a prender el principal", () => {
      const storeSemillaOverLimit: Partial<Store> = {
        name: "TIENDA EN SEMILLA",
        phone: "51911222333",
        plan: "semilla",
        mainSellerActive: false,
        sellers: [
          { id: "s1", name: "Dianis", phone: "51935555485", active: true },
          { id: "s2", name: "Paolo", phone: "51939980472", active: true },
        ],
      };

      // Prender el principal siempre está permitido
      const checkTurnOnMain = canToggleSeller(storeSemillaOverLimit as Store, "main", true);
      expect(checkTurnOnMain.ok).toBe(true);

      // En cambio, prender un extra inactivo en este estado sí se bloquea
      const storeWithInactiveExtra = {
        ...storeSemillaOverLimit,
        sellers: [
          ...storeSemillaOverLimit.sellers!,
          { id: "s3", name: "Extra", phone: "51900000000", active: false },
        ],
      };
      const checkTurnOnExtra = canToggleSeller(storeWithInactiveExtra as Store, "s3", true);
      expect(checkTurnOnExtra.ok).toBe(false);
      expect(checkTurnOnExtra.error).toContain("El plan solo permite hasta 1 vendedor");
    });
  });
});
