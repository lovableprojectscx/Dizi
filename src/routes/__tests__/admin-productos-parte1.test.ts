import { describe, it, expect } from "vitest";
import { formatPrice } from "@/lib/whatsapp";
import { getThumbnailUrl, getOptimizedImageUrl } from "@/lib/image-utils";
import { PLANS, type Product, type Category } from "@/lib/types";

// Helper de parseo de categorías usado en el catálogo y administración
const parseCategoryName = (name: string, icon?: string) => {
  if (!name) return { label: "", iconKey: icon || "" };
  if (name.includes("|")) {
    const [label, iconKey] = name.split("|");
    return {
      label: label ? label.trim() : "",
      iconKey: icon ? icon.trim() : (iconKey ? iconKey.trim() : ""),
    };
  }
  return {
    label: name.trim(),
    iconKey: icon ? icon.trim() : "",
  };
};

describe("Parte 1: Catálogo de Productos y Carga Masiva", () => {
  describe("1. Formateo y Validación de Precios", () => {
    it("formatea correctamente precios en Soles (S/)", () => {
      expect(formatPrice(100)).toBe("S/ 100.00");
      expect(formatPrice(12.5)).toBe("S/ 12.50");
      expect(formatPrice(0)).toBe("A consultar");
      expect(formatPrice(null)).toBe("A consultar");
      expect(formatPrice(undefined)).toBe("A consultar");
    });

    it("procesa precios con coma decimal convertidos a número", () => {
      const inputWithComma = "49,90";
      const cleanPrice = inputWithComma.replace(",", ".");
      const parsed = parseFloat(cleanPrice);
      expect(parsed).toBe(49.9);
      expect(formatPrice(parsed)).toBe("S/ 49.90");
    });

    it("valida ofertas donde originalPrice es mayor que el precio de venta", () => {
      const p: Product = {
        id: "prod-1",
        name: "Zapatillas Urbanas",
        price: 150,
        originalPrice: 200,
        isOnSale: true,
        visible: true,
      };

      const hasValidDiscount =
        p.isOnSale &&
        p.originalPrice !== null &&
        p.originalPrice !== undefined &&
        p.price !== null &&
        p.price !== undefined &&
        p.originalPrice > p.price;

      expect(hasValidDiscount).toBe(true);
      expect(p.originalPrice! - p.price!).toBe(50);
    });
  });

  describe("2. Parseo y Manejo de Categorías e Iconos", () => {
    it("extrae label e iconKey cuando la categoría usa el formato con pipe '|'", () => {
      const res = parseCategoryName("Tecnología|laptop");
      expect(res.label).toBe("Tecnología");
      expect(res.iconKey).toBe("laptop");
    });

    it("devuelve label plano cuando no contiene pipe", () => {
      const res = parseCategoryName("Polos y Camisas");
      expect(res.label).toBe("Polos y Camisas");
      expect(res.iconKey).toBe("");
    });

    it("prioriza el icono explícito si se pasa como segundo parámetro", () => {
      const res = parseCategoryName("Calzado", "shoe");
      expect(res.label).toBe("Calzado");
      expect(res.iconKey).toBe("shoe");
    });

    it("indexa categorías en un Map O(1) para renderizado rápido", () => {
      const categories: Category[] = [
        { id: "cat-1", name: "Bebidas|wine" },
        { id: "cat-2", name: "Snacks|cookie" },
      ];

      const categoryMap = new Map<string, { label: string; iconKey: string }>();
      categories.forEach((c) => {
        categoryMap.set(c.id, parseCategoryName(c.name));
      });

      expect(categoryMap.get("cat-1")).toEqual({ label: "Bebidas", iconKey: "wine" });
      expect(categoryMap.get("cat-2")).toEqual({ label: "Snacks", iconKey: "cookie" });
      expect(categoryMap.get("cat-inexistente")).toBeUndefined();
    });
  });

  describe("3. Filtrado y Búsqueda de Productos", () => {
    const products: Product[] = [
      { id: "p1", name: "iPhone 15 Pro", price: 4500, categoryId: "cat-tech", visible: true, description: "Celular Apple" },
      { id: "p2", name: "Samsung Galaxy S24", price: 3900, categoryId: "cat-tech", visible: true, description: "Smartphone #destacado" },
      { id: "p3", name: "Café Orgánico 250g", price: 28, categoryId: "cat-food", visible: false, description: "Grano entero" },
    ];

    it("filtra productos por texto de búsqueda (nombre y descripción)", () => {
      const q = "apple";
      const filtered = products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
      );
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe("p1");
    });

    it("filtra productos por categoría seleccionada", () => {
      const selectedCategory = "cat-tech";
      const filtered = products.filter((p) => p.categoryId === selectedCategory);
      expect(filtered).toHaveLength(2);
    });

    it("detecta tag #destacado sin ensuciar la descripción base", () => {
      const p = products[1];
      const isFeatured = p.description?.includes("#destacado");
      const cleanDesc = (p.description || "").replace(/#destacado/g, "").trim();

      expect(isFeatured).toBe(true);
      expect(cleanDesc).toBe("Smartphone");
    });
  });

  describe("4. Control de Límites por Plan", () => {
    it("comprueba correctamente el límite de productos en Plan Semilla (20)", () => {
      const limit = PLANS["semilla"].productLimit;
      expect(limit).toBe(20);

      const currentCount = 20;
      const reachedLimit = currentCount >= limit;
      expect(reachedLimit).toBe(true);
    });

    it("valida que la carga masiva no supere el cupo disponible", () => {
      const limit = PLANS["emprendedor"].productLimit; // 100
      const currentProducts = 95;
      const filesToUpload = 10;

      const canUpload = currentProducts + filesToUpload <= limit;
      expect(canUpload).toBe(false);
    });
  });

  describe("5. Reordenamiento Seguro de Productos (Swap)", () => {
    it("intercambia posiciones de productos de forma inmutable", () => {
      const initial = ["p1", "p2", "p3"];
      const fromIdx = 0;
      const toIdx = 1;

      const next = [...initial];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);

      expect(next).toEqual(["p2", "p1", "p3"]);
    });

    it("restringe subir el primer elemento o bajar el último elemento", () => {
      const list = ["p1", "p2", "p3"];
      const isFirst = (idx: number) => idx === 0;
      const isLast = (idx: number) => idx === list.length - 1;

      expect(isFirst(0)).toBe(true);
      expect(isLast(2)).toBe(true);
      expect(isFirst(1)).toBe(false);
      expect(isLast(1)).toBe(false);
    });
  });

  describe("6. Resolución de Miniaturas y URLs de Imágenes", () => {
    it("resuelve la miniatura _thumb.webp para imágenes en Supabase Storage", () => {
      const hdUrl = "https://xyz.supabase.co/storage/v1/object/public/images/tienda-1/prod-1.webp";
      const thumbUrl = getThumbnailUrl(hdUrl);
      expect(thumbUrl).toBe("https://xyz.supabase.co/storage/v1/object/public/images/tienda-1/prod-1_thumb.webp");
    });

    it("mantiene intacta la URL si ya es una miniatura o una URL externa", () => {
      const alreadyThumb = "https://xyz.supabase.co/storage/v1/object/public/images/tienda-1/prod-1_thumb.webp";
      expect(getThumbnailUrl(alreadyThumb)).toBe(alreadyThumb);

      const external = "https://images.unsplash.com/photo-12345";
      expect(getThumbnailUrl(external)).toBe(external);
    });

    it("limpia parámetros query de URLs para evitar bypass de caché", () => {
      const urlWithQuery = "https://xyz.supabase.co/storage/v1/object/public/images/logo.webp?t=123456789";
      expect(getOptimizedImageUrl(urlWithQuery)).toBe("https://xyz.supabase.co/storage/v1/object/public/images/logo.webp");
    });
  });
});
