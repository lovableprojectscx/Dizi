import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase", () => {
  return {
    supabase: {
      from: () => ({
        select: () => ({
          eq: () => Promise.resolve({ data: [], error: null }),
        }),
        delete: () => ({
          eq: () => ({
            eq: () => Promise.resolve({ error: null }),
          }),
        }),
        upsert: () => Promise.resolve({ error: null }),
        update: () => ({
          eq: () => Promise.resolve({ error: null }),
        }),
      }),
      storage: {
        from: () => ({
          remove: () => Promise.resolve({ error: null }),
        }),
      },
      auth: {
        getSession: () => Promise.resolve({ data: { session: null } }),
      },
    },
    uploadBase64ToStorage: vi.fn(async (_data: string, path: string) => `https://zkqzdwxjthjdjchimmds.supabase.co/storage/v1/object/public/images/${path}`),
    invokeRpcWithRetry: vi.fn(async () => ({ data: null, error: null })),
  };
});

// Import useApp and partializeAppState after mocking supabase
import { useApp, partializeAppState } from "@/lib/store";
import type { Store, Product } from "@/lib/types";

describe("Persistencia y Exclusión de data: Base64 en localStorage (store.ts)", () => {
  const storeId = "s_test_persist";

  beforeEach(() => {
    const initialStore: Store = {
      id: storeId,
      slug: "tienda-persist-test",
      name: "Tienda Persist Test",
      phone: "51999888777",
      countryCode: "51",
      countryIso: "PE",
      plan: "pro",
      active: true,
      onboardingCompleted: true,
      createdAt: new Date().toISOString(),
      whatsappClicks: 0,
      categories: [{ id: "cat-1", name: "General|box" }],
      products: [],
    };

    useApp.setState({
      stores: [initialStore],
      currentStoreId: storeId,
      fetchError: null,
    });
  });

  it("tras upsert de 50 productos con thumbnail base64, el estado en memoria tiene thumbnail: undefined", async () => {
    const { upsertProduct } = useApp.getState();

    for (let i = 1; i <= 50; i++) {
      const prodInput: Product = {
        id: `prod-${i}`,
        name: `Producto HD ${i}`,
        price: 25.0 + i,
        categoryId: "cat-1",
        image: `https://mock.storage/products/prod-${i}.webp`,
        thumbnail: `data:image/webp;base64,UklGRm4AAABXRUJQVlA4IGIAAAAQBACdASoBAAEAPuFypE8nJaQisAEsDYAWiWUAAP7/5hT92...${i}`,
        visible: true,
      };

      await upsertProduct(storeId, prodInput);
    }

    const state = useApp.getState();
    const store = state.stores.find((s) => s.id === storeId);
    expect(store?.products).toHaveLength(50);

    // Todos los productos en memoria deben tener thumbnail: undefined tras upsert
    for (const p of store!.products) {
      expect(p.thumbnail).toBeUndefined();
    }
  });

  it("tras upsert de 50 productos con thumbnail base64, el estado persistido (partialize) no contiene ningún 'data:'", async () => {
    const { upsertProduct } = useApp.getState();

    // 50 productos con thumbnails y/o imágenes base64
    for (let i = 1; i <= 50; i++) {
      const prodInput: Product = {
        id: `prod-bulk-${i}`,
        name: `Producto Carga Masiva ${i}`,
        price: 30.0,
        categoryId: "cat-1",
        image: `data:image/webp;base64,IMAGE_BASE64_PAYLOAD_PRODUCT_${i}`,
        thumbnail: `data:image/webp;base64,THUMB_BASE64_PAYLOAD_PRODUCT_${i}`,
        visible: true,
      };

      await upsertProduct(storeId, prodInput);
    }

    const state = useApp.getState();
    const persistedState = partializeAppState(state);
    const jsonString = JSON.stringify(persistedState);

    // Verificación estricta solicitada por Jack: ningún "data:" en el estado persistido
    expect(jsonString.includes("data:")).toBe(false);

    // Verificar que los 50 productos están guardados con sus URLs remotas
    const persistedStore = persistedState.stores.find((s: any) => s.id === storeId);
    expect(persistedStore).toBeDefined();
    expect(persistedStore!.products).toHaveLength(50);
    for (const p of persistedStore!.products) {
      expect(p.thumbnail).toBeUndefined();
      expect(p.image).toContain("https://");
      expect(p.image).not.toContain("data:");
    }
  });

  it("partialize excluye directamente thumbnail si existiera en un producto no procesado", () => {
    // Inyectar producto que tenga thumbnail en base64 de forma residual
    const dirtyProduct: Product = {
      id: "prod-dirty",
      name: "Producto Residual",
      price: 15.0,
      categoryId: "cat-1",
      image: "data:image/webp;base64,RAW_IMAGE_DATA",
      thumbnail: "data:image/webp;base64,RAW_THUMBNAIL_DATA",
      visible: true,
    };

    useApp.setState({
      stores: [
        {
          id: storeId,
          slug: "tienda-persist-test",
          name: "Tienda Persist Test",
          phone: "51999888777",
          countryCode: "51",
          countryIso: "PE",
          plan: "pro",
          active: true,
          createdAt: new Date().toISOString(),
          whatsappClicks: 0,
          categories: [],
          products: [dirtyProduct],
        },
      ],
      currentStoreId: storeId,
      fetchError: null,
    });

    const state = useApp.getState();
    const persistedState = partializeAppState(state);
    const persistedStore = persistedState.stores.find((s: any) => s.id === storeId);
    expect(persistedStore).toBeDefined();
    const persistedProd = persistedStore!.products[0];

    // Tanto image como thumbnail base64 son excluidos a undefined
    expect(persistedProd.image).toBeUndefined();
    expect(persistedProd.thumbnail).toBeUndefined();

    const jsonString = JSON.stringify(persistedState);
    expect(jsonString.includes("data:")).toBe(false);
  });
});
