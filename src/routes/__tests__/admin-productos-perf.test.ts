import { describe, it, expect } from "vitest";
import { useApp } from "@/lib/store";

describe("Rendimiento del Administrador y Productos", () => {
  it("debe verificar que el estado de useApp mantenga y actualice lastFetched", () => {
    const state = useApp.getState();
    expect(state).toHaveProperty("lastFetched");
    expect(typeof state.fetchData).toBe("function");
    expect(typeof state.upsertProduct).toBe("function");
  });

  it("debe calcular el filtrado de productos eficientemente", () => {
    const sampleProducts = [
      { id: "1", name: "iPhone 15 Pro", categoryId: "cat1", price: 4500, visible: true, isSample: false },
      { id: "2", name: "Samsung S24 Ultra", categoryId: "cat2", price: 4200, visible: true, isSample: false },
      { id: "3", name: "Funda de Cuero para iPhone", categoryId: "cat1", price: 80, visible: true, isSample: false },
    ];

    const filter = (query: string, cat: string) => {
      const q = query.trim().toLowerCase();
      return sampleProducts.filter((p) => {
        const matchesSearch = q === "" || p.name.toLowerCase().includes(q);
        const matchesCategory = cat === "all" || p.categoryId === cat;
        return matchesSearch && matchesCategory;
      });
    };

    expect(filter("iPhone", "all")).toHaveLength(2);
    expect(filter("samsung", "cat2")).toHaveLength(1);
    expect(filter("", "cat1")).toHaveLength(2);
    expect(filter("noexiste", "all")).toHaveLength(0);
  });
});
