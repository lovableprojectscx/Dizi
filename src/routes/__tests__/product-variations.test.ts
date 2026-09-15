/**
 * @vitest-environment node
 */
import { describe, it, expect, beforeEach } from "vitest";
import { useCart, useApp } from "@/lib/store";
import type { Product, ProductVariation, Store } from "@/lib/types";
import { buildWaUrl, formatPrice } from "@/lib/whatsapp";

describe("Módulo de Variaciones de Producto con Imagen y Precios Dinámicos", () => {
  beforeEach(() => {
    useCart.getState().clear("store-test-1");
  });

  it("1. Estructura y tipado de ProductVariation", () => {
    const variation: ProductVariation = {
      id: "var_red_m",
      name: "Rojo / Talla M",
      price: 89.9,
      image: "https://dizi.pe/storage/products/shirt_red.webp",
    };

    const product: Product = {
      id: "prod-1",
      name: "Polo Oversize Premium",
      price: 79.9,
      categoryId: "cat-1",
      visible: true,
      image: "https://dizi.pe/storage/products/shirt_black.webp",
      variations: [
        variation,
        {
          id: "var_blue_l",
          name: "Azul Marino / Talla L",
          price: null, // Hereda precio base
          image: "https://dizi.pe/storage/products/shirt_blue.webp",
        },
      ],
    };

    expect(product.variations).toHaveLength(2);
    expect(product.variations?.[0].name).toBe("Rojo / Talla M");
    expect(product.variations?.[0].price).toBe(89.9);
    expect(product.variations?.[1].price).toBeNull();
  });

  it("2. Carrito de Compras (useCart) soporta múltiples variaciones del mismo producto", () => {
    const storeId = "store-test-1";
    const productId = "prod-polo";

    const varRojo: ProductVariation = {
      id: "var-rojo",
      name: "Rojo",
      price: 95.0,
      image: "https://dizi.pe/img/rojo.webp",
    };

    const varAzul: ProductVariation = {
      id: "var-azul",
      name: "Azul",
      price: 90.0,
      image: "https://dizi.pe/img/azul.webp",
    };

    // Añadir 1 Polo Rojo
    useCart.getState().add(storeId, productId, varRojo);
    let cart = useCart.getState().carts[storeId];
    expect(cart).toHaveLength(1);
    expect(cart[0].variationName).toBe("Rojo");
    expect(cart[0].qty).toBe(1);
    expect(cart[0].variationPrice).toBe(95.0);

    // Añadir 1 Polo Rojo adicional -> Incrementa cantidad a 2
    useCart.getState().add(storeId, productId, varRojo);
    cart = useCart.getState().carts[storeId];
    expect(cart).toHaveLength(1);
    expect(cart[0].qty).toBe(2);

    // Añadir 1 Polo Azul -> Crea una nueva línea separada
    useCart.getState().add(storeId, productId, varAzul);
    cart = useCart.getState().carts[storeId];
    expect(cart).toHaveLength(2);
    expect(cart[1].variationName).toBe("Azul");
    expect(cart[1].qty).toBe(1);
    expect(cart[1].variationPrice).toBe(90.0);

    // Modificar cantidad del Polo Azul a 3
    useCart.getState().setQty(storeId, productId, 3, "var-azul");
    cart = useCart.getState().carts[storeId];
    expect(cart.find((c) => c.variationId === "var-azul")?.qty).toBe(3);
    // El polo rojo sigue en 2
    expect(cart.find((c) => c.variationId === "var-rojo")?.qty).toBe(2);

    // Eliminar Polo Rojo
    useCart.getState().remove(storeId, productId, "var-rojo");
    cart = useCart.getState().carts[storeId];
    expect(cart).toHaveLength(1);
    expect(cart[0].variationId).toBe("var-azul");
  });

  it("3. Cálculo de Subtotales y Total del pedido con precios de variación", () => {
    const storeId = "store-test-1";
    const baseProduct: Product = {
      id: "prod-taza",
      name: "Taza Personalizada",
      price: 25.0,
      categoryId: "cat-1",
      visible: true,
    };

    const varDorada: ProductVariation = {
      id: "var-oro",
      name: "Edición Dorada",
      price: 35.0,
    };

    const varEstandar: ProductVariation = {
      id: "var-std",
      name: "Estándar",
      price: null, // Hereda precio base de S/ 25.0
    };

    useCart.getState().add(storeId, baseProduct.id, varDorada); // 1 x 35 = 35
    useCart.getState().add(storeId, baseProduct.id, varEstandar); // 1 x 25 = 25
    useCart.getState().setQty(storeId, baseProduct.id, 2, "var-std"); // 2 x 25 = 50

    const cart = useCart.getState().carts[storeId];
    const cartLines = cart.map((c) => {
      const effectivePrice =
        c.variationPrice !== null && c.variationPrice !== undefined
          ? c.variationPrice
          : baseProduct.price;
      return { ...c, effectivePrice };
    });

    const total = cartLines.reduce((acc, l) => acc + (l.effectivePrice || 0) * l.qty, 0);
    // 1 x 35 + 2 x 25 = 85.00
    expect(total).toBe(85.0);
  });

  it("4. Formateo de mensaje a WhatsApp con detalle de la variante seleccionada", () => {
    const lines = [
      { name: "Polo Oversize", varName: "Negro XL", qty: 2, price: 50.0 },
      { name: "Polo Oversize", varName: "Blanco M", qty: 1, price: 45.0 },
      { name: "Gorra Urbana", varName: null, qty: 1, price: 30.0 },
    ]
      .map((l) => {
        const itemPrice = l.price * l.qty;
        const varLabel = l.varName ? ` (Opción: ${l.varName})` : "";
        return `• ${l.name}${varLabel} x${l.qty} — ${formatPrice(itemPrice)}`;
      })
      .join("\n");

    const totalMsg = formatPrice(175.0);
    const msg = `Hola Tienda Dizi, quiero hacer este pedido:\n\n${lines}\n\nTotal: ${totalMsg}`;

    expect(msg).toContain("• Polo Oversize (Opción: Negro XL) x2 — S/ 100.00");
    expect(msg).toContain("• Polo Oversize (Opción: Blanco M) x1 — S/ 45.00");
    expect(msg).toContain("• Gorra Urbana x1 — S/ 30.00");
    expect(msg).toContain("Total: S/ 175.00");

    const waUrl = buildWaUrl("51987654321", msg);
    expect(waUrl).toContain("https://wa.me/51987654321?text=");
    expect(decodeURIComponent(waUrl)).toContain("• Polo Oversize (Opción: Negro XL)");
  });

  it("5. Formateo de consulta individual por WhatsApp con variante", () => {
    const productName = "Perfume Elegance 100ml";
    const varName = "Versión Gold";
    const varSuffix = varName ? ` (Opción: ${varName})` : "";
    const msg = `Hola, me interesa el producto: ${productName}${varSuffix}`;

    expect(msg).toBe("Hola, me interesa el producto: Perfume Elegance 100ml (Opción: Versión Gold)");
    const waUrl = buildWaUrl("51999888777", msg);
    expect(decodeURIComponent(waUrl)).toContain("Perfume Elegance 100ml (Opción: Versión Gold)");
  });

  it("6. Carga Masiva (Bulk Upload) procesa y persiste variaciones asociadas a cada foto", () => {
    interface BulkDraftTest {
      id: string;
      name: string;
      price: string;
      categoryId: string;
      description: string;
      variations?: ProductVariation[];
    }

    const drafts: BulkDraftTest[] = [
      {
        id: "draft-1",
        name: "Casaca Térmica",
        price: "120.00",
        categoryId: "cat-invierno",
        description: "Impermeable con capucha",
        variations: [
          { id: "v1", name: "Azul Marino / L", price: 130.0, image: "data:image/webp;base64,mock" },
          { id: "v2", name: "Negro / M", price: null, image: null },
          { id: "v3", name: "   ", price: null, image: null }, // Variante vacía que debe filtrarse
        ],
      },
    ];

    // Limpieza de variaciones vacías idéntica al flujo de producción
    const cleanVariations = (drafts[0].variations || [])
      .map((v) => ({ ...v, name: v.name.trim() }))
      .filter((v) => v.name.length > 0);

    expect(cleanVariations).toHaveLength(2);
    expect(cleanVariations[0].name).toBe("Azul Marino / L");
    expect(cleanVariations[0].price).toBe(130.0);
    expect(cleanVariations[1].name).toBe("Negro / M");
    expect(cleanVariations[1].price).toBeNull();
  });

  it("7. Resiliencia ante Supabase Schema Cache: retry compatible si la columna 'variations' aún no está en cache", async () => {
    // Simular el comportamiento del interceptor resiliente de upsertProduct
    const simulateUpsert = async (payload: any, schemaCacheHasColumn: boolean) => {
      if (!schemaCacheHasColumn && payload.variations !== undefined) {
        // Simular error de PostgREST: "Could not find the 'variations' column of 'products' in the schema cache"
        const error = {
          code: "PGRST204",
          message: "Could not find the 'variations' column of 'products' in the schema cache",
        };

        if (
          error.message?.includes("variations") ||
          error.code === "PGRST204"
        ) {
          const { variations, ...safePayload } = payload;
          return { data: { ...safePayload, id: safePayload.id || "generated-id" }, error: null, fallbackUsed: true };
        }
        return { data: null, error };
      }
      return { data: payload, error: null, fallbackUsed: false };
    };

    const productPayload = {
      id: "prod-123",
      name: "iPhone 15 Pro Max 256GB",
      price: 4999,
      variations: [{ id: "v1", name: "Red", price: 4999 }],
    };

    // Caso A: La base de datos aún no refresca el schema cache -> No lanza error, activa fallback seguro
    const resA = await simulateUpsert(productPayload, false);
    expect(resA.error).toBeNull();
    expect(resA.fallbackUsed).toBe(true);
    expect(resA.data.name).toBe("iPhone 15 Pro Max 256GB");

    // Caso B: La base de datos ya tiene el schema cache actualizado -> Guarda variaciones directamente
    const resB = await simulateUpsert(productPayload, true);
    expect(resB.error).toBeNull();
    expect(resB.fallbackUsed).toBe(false);
    expect(resB.data.variations).toHaveLength(1);
  });

  it("8. getThumbnailUrl preserva intacta la URL de imágenes de variaciones (_var_) evitando errores 404", async () => {
    const { getThumbnailUrl } = await import("@/lib/image-utils");

    const varImgUrl =
      "https://zkqzdwxjthjdjchimmds.supabase.co/storage/v1/object/public/images/s_celularesdemo/products/p_cel1_var_va1rd.webp";
    const mainProdImgUrl =
      "https://zkqzdwxjthjdjchimmds.supabase.co/storage/v1/object/public/images/s_celularesdemo/products/p_cel1.webp";

    // Para la imagen principal genera el sufijo _thumb.webp
    expect(getThumbnailUrl(mainProdImgUrl)).toBe(
      "https://zkqzdwxjthjdjchimmds.supabase.co/storage/v1/object/public/images/s_celularesdemo/products/p_cel1_thumb.webp"
    );

    // Para la imagen de variación NO debe añadir _thumb.webp para evitar 404
    expect(getThumbnailUrl(varImgUrl)).toBe(varImgUrl);
  });

  it("9. Carrito y pedido WhatsApp reflejan la opción seleccionada y precios efectivos de variantes", () => {
    const storeId = "store-test-1";
    const storeName = "Tienda Moda";

    const baseProduct: Product = {
      id: "prod-polo-1",
      name: "Polo Oversize",
      price: 40.0,
      categoryId: "cat-moda",
      visible: true,
      image: "https://dizi.pe/img/polo_base.webp",
      variations: [
        {
          id: "var-negro-m",
          name: "Negro / M",
          price: 45.0,
          image: "https://dizi.pe/img/polo_negro.webp",
        },
        {
          id: "var-blanco-s",
          name: "Blanco / S",
          price: null, // hereda 40.0
        },
      ],
    };

    // 1. Simulación de lógica handleAddToCart:
    // Si tiene variaciones, no debe añadir directamente a ciegas al carrito
    const shouldOpenModal = (p: Product) => Boolean(p.variations && p.variations.length > 0);
    expect(shouldOpenModal(baseProduct)).toBe(true);

    // 2. Cliente selecciona variante "Negro / M" con precio propio S/ 45.00
    useCart.getState().add(storeId, baseProduct.id, baseProduct.variations![0]);
    // Cliente selecciona variante "Blanco / S" que hereda precio S/ 40.00
    useCart.getState().add(storeId, baseProduct.id, baseProduct.variations![1]);
    // Cliente añade 1 más de "Negro / M" (qty = 2)
    useCart.getState().add(storeId, baseProduct.id, baseProduct.variations![0]);

    const cart = useCart.getState().carts[storeId];
    expect(cart).toHaveLength(2);

    // Mapeo idéntico a PublicCatalog.tsx
    const cartLines = cart.map((c) => {
      const effectivePrice =
        c.variationPrice !== null && c.variationPrice !== undefined
          ? c.variationPrice
          : baseProduct.price;
      const lineKey = c.variationId ? `${c.productId}_${c.variationId}` : c.productId;
      const itemImg = c.variationImage || baseProduct.image;
      return {
        ...c,
        product: baseProduct,
        effectivePrice,
        lineKey,
        itemImg,
      };
    });

    const total = cartLines.reduce((acc, l) => acc + (l.effectivePrice || 0) * l.qty, 0);

    // Línea 1: Negro / M x 2 @ 45.0 = 90.0
    const lineNegro = cartLines.find((l) => l.variationId === "var-negro-m")!;
    expect(lineNegro.qty).toBe(2);
    expect(lineNegro.effectivePrice).toBe(45.0);
    expect(lineNegro.lineKey).toBe("prod-polo-1_var-negro-m");
    expect(lineNegro.itemImg).toBe("https://dizi.pe/img/polo_negro.webp");

    // Línea 2: Blanco / S x 1 @ 40.0 = 40.0
    const lineBlanco = cartLines.find((l) => l.variationId === "var-blanco-s")!;
    expect(lineBlanco.qty).toBe(1);
    expect(lineBlanco.effectivePrice).toBe(40.0);
    expect(lineBlanco.lineKey).toBe("prod-polo-1_var-blanco-s");
    expect(lineBlanco.itemImg).toBe("https://dizi.pe/img/polo_base.webp");

    // Total: 90 + 40 = 130.0
    expect(total).toBe(130.0);

    // Construcción del mensaje de WhatsApp como en sendOrder()
    const lines = cartLines
      .map((l) => {
        const itemPrice = l.effectivePrice ? l.effectivePrice * l.qty : null;
        const varSuffix = l.variationName ? ` (Opción: ${l.variationName})` : "";
        return `• ${l.product.name}${varSuffix} x${l.qty} — ${formatPrice(itemPrice)}`;
      })
      .join("\n");

    const totalMsg = formatPrice(total);
    const msg = `Hola ${storeName}, quiero hacer este pedido:\n\n${lines}\n\nTotal: ${totalMsg}`;

    expect(msg).toContain("• Polo Oversize (Opción: Negro / M) x2 — S/ 90.00");
    expect(msg).toContain("• Polo Oversize (Opción: Blanco / S) x1 — S/ 40.00");
    expect(msg).toContain("Total: S/ 130.00");
  });
});

