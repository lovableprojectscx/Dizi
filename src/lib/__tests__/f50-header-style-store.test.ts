import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock de Supabase para capturar dbPatch en updateStore
let capturedUpdatePatch: any = null;
let capturedStoreId: string | null = null;

vi.mock("@/lib/supabase", () => {
  return {
    supabase: {
      from: (table: string) => ({
        select: () => ({
          eq: () => Promise.resolve({ data: [], error: null }),
        }),
        delete: () => ({
          eq: () => ({
            eq: () => Promise.resolve({ error: null }),
          }),
        }),
        upsert: () => Promise.resolve({ error: null }),
        update: (patch: any) => {
          if (table === "stores") {
            capturedUpdatePatch = patch;
          }
          return {
            eq: (_col: string, id: string) => {
              capturedStoreId = id;
              return Promise.resolve({ error: null });
            },
          };
        },
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

import { mapStoreFromDB, useApp } from "@/lib/store";
import type { Store } from "@/lib/types";

describe("F50 · header_style en store.ts (mapStoreFromDB y updateStore)", () => {
  const storeId = "store-test-f50";

  beforeEach(() => {
    capturedUpdatePatch = null;
    capturedStoreId = null;

    const initialStore: Store = {
      id: storeId,
      slug: "tienda-test-f50",
      name: "Tienda F50",
      phone: "51999888777",
      countryCode: "51",
      countryIso: "PE",
      plan: "pro",
      active: true,
      onboardingCompleted: true,
      createdAt: new Date().toISOString(),
      whatsappClicks: 0,
      headerStyle: "standard",
      categories: [],
      products: [],
    };

    useApp.setState({
      stores: [initialStore],
      currentStoreId: storeId,
      fetchError: null,
    });
  });

  describe("mapStoreFromDB: header_style entra desde la base de datos", () => {
    it("mapea row.header_style = 'profile' a store.headerStyle = 'profile'", () => {
      const row = {
        id: "s1",
        slug: "test-profile",
        name: "Test Profile",
        header_style: "profile",
      };
      const store = mapStoreFromDB(row);
      expect(store.headerStyle).toBe("profile");
    });

    it("mapea row.header_style = 'standard' a store.headerStyle = 'standard'", () => {
      const row = {
        id: "s2",
        slug: "test-standard",
        name: "Test Standard",
        header_style: "standard",
      };
      const store = mapStoreFromDB(row);
      expect(store.headerStyle).toBe("standard");
    });

    it("mapea row.header_style = null o ausente a store.headerStyle = null", () => {
      const rowWithoutHeader = {
        id: "s3",
        slug: "test-null",
        name: "Test Null",
      };
      const store1 = mapStoreFromDB(rowWithoutHeader);
      expect(store1.headerStyle).toBeNull();

      const rowWithNull = {
        id: "s4",
        slug: "test-null-explicit",
        name: "Test Null Explicit",
        header_style: null,
      };
      const store2 = mapStoreFromDB(rowWithNull);
      expect(store2.headerStyle).toBeNull();
    });
  });

  describe("updateStore: headerStyle sale hacia dbPatch para Supabase", () => {
    it("al enviar headerStyle: 'profile', actualiza el estado en memoria y envía header_style: 'profile' a la BD", async () => {
      const { updateStore } = useApp.getState();

      await updateStore(storeId, { headerStyle: "profile" });

      // Verificación en estado de useApp
      const currentStore = useApp.getState().stores.find((s) => s.id === storeId);
      expect(currentStore?.headerStyle).toBe("profile");

      // Verificación en dbPatch enviado a Supabase
      expect(capturedStoreId).toBe(storeId);
      expect(capturedUpdatePatch).toBeDefined();
      expect(capturedUpdatePatch.header_style).toBe("profile");
    });

    it("al enviar headerStyle: 'standard', actualiza el estado y envía header_style: 'standard'", async () => {
      const { updateStore } = useApp.getState();

      await updateStore(storeId, { headerStyle: "standard" });

      const currentStore = useApp.getState().stores.find((s) => s.id === storeId);
      expect(currentStore?.headerStyle).toBe("standard");

      expect(capturedUpdatePatch.header_style).toBe("standard");
    });

    it("al actualizar otros campos sin modificar headerStyle, dbPatch no incluye header_style", async () => {
      const { updateStore } = useApp.getState();

      await updateStore(storeId, { name: "Nuevo Nombre" });

      expect(capturedUpdatePatch.name).toBe("Nuevo Nombre");
      expect(capturedUpdatePatch.header_style).toBeUndefined();
    });
  });
});
