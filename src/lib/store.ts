import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Category, PlanId, Product, Store, Invite } from "./types";
import { initialStores } from "./mock-data";
import { supabase } from "./supabase";

// ── Helpers para mapeo BD <-> App ──
const mapStoreFromDB = (row: any): Store => ({
  id: row.id,
  slug: row.slug,
  name: row.name,
  phone: row.phone || "",
  countryCode: row.country_code || "51",
  logo: row.logo,
  plan: row.plan as PlanId,
  model: row.model,
  brandColor: row.brand_color,
  ownerId: row.owner_id,
  active: row.active,
  isPublished: row.is_published,
  createdAt: row.created_at,
  whatsappClicks: row.whatsapp_clicks || 0,
  categories: (row.categories || []).map((c: any) => ({
    id: c.id,
    name: c.name,
  })),
  products: (row.products || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    price: Number(p.price),
    categoryId: p.category_id,
    image: p.image,
    description: p.description,
    isOnSale: p.is_on_sale,
    originalPrice: p.original_price ? Number(p.original_price) : undefined,
    visible: p.visible,
    isSample: p.is_sample,
  })),
});

interface AppState {
  stores: Store[];
  invites: Invite[];
  currentStoreId: string | null;
  impersonatedBy: string | null; // super admin id when impersonating
  // db sync
  fetchData: () => Promise<void>;
  // store CRUD
  setCurrentStore: (id: string | null) => void;
  updateStore: (id: string, patch: Partial<Store>) => void;
  addStore: (store: Store) => void;
  // invites
  addInvite: (invite: Invite) => void;
  markInviteUsed: (token: string) => void;
  // products
  upsertProduct: (storeId: string, product: Product) => void;
  deleteProduct: (storeId: string, productId: string) => void;
  toggleProductVisible: (storeId: string, productId: string) => void;
  // categories
  upsertCategory: (storeId: string, cat: Category) => void;
  deleteCategory: (storeId: string, catId: string) => void;
  // super
  setPlan: (storeId: string, plan: PlanId) => void;
  toggleStoreActive: (storeId: string) => void;
  startImpersonation: (storeId: string) => void;
  stopImpersonation: () => void;
  // analytics
  incWhatsappClicks: (storeId: string) => void;
}

const uid = () => Math.random().toString(36).slice(2, 10);

export const useApp = create<AppState>()(
  persist(
    (set) => ({
      stores: initialStores,
      invites: [],
      currentStoreId: "s1",
      impersonatedBy: null,
      fetchData: async () => {
        const { data, error } = await supabase
          .from("stores")
          .select("*, categories(*), products(*)");
        if (data && !error) {
          set({ stores: data.map(mapStoreFromDB) });
        } else {
          console.error("Error fetching data:", error);
        }
      },
      setCurrentStore: (id) => set({ currentStoreId: id }),
      updateStore: async (id, patch) => {
        set((s) => ({
          stores: s.stores.map((st) => (st.id === id ? { ...st, ...patch } : st)),
        }));
        
        // Supabase sync
        const dbPatch: any = {};
        if (patch.name !== undefined) dbPatch.name = patch.name;
        if (patch.phone !== undefined) dbPatch.phone = patch.phone;
        if (patch.logo !== undefined) dbPatch.logo = patch.logo;
        if (patch.model !== undefined) dbPatch.model = patch.model;
        if (patch.brandColor !== undefined) dbPatch.brand_color = patch.brandColor;
        if (patch.isPublished !== undefined) dbPatch.is_published = patch.isPublished;
        
        if (Object.keys(dbPatch).length > 0) {
          await supabase.from("stores").update(dbPatch).eq("id", id);
        }
      },
      addStore: async (store) => {
        set((s) => ({ stores: [...s.stores, store] }));
        
        // 1. Insert store
        await supabase.from("stores").insert({
          id: store.id,
          slug: store.slug,
          name: store.name,
          phone: store.phone,
          country_code: store.countryCode,
          logo: store.logo,
          plan: store.plan,
          model: store.model,
          brand_color: store.brandColor,
          owner_id: store.ownerId,
          active: store.active,
          is_published: store.isPublished,
        });

        // 2. Insert initial categories
        if (store.categories.length > 0) {
          await supabase.from("categories").insert(
            store.categories.map(c => ({
              id: c.id,
              store_id: store.id,
              name: c.name
            }))
          );
        }

        // 3. Insert initial products
        if (store.products.length > 0) {
          await supabase.from("products").insert(
            store.products.map(p => ({
              id: p.id,
              store_id: store.id,
              category_id: p.categoryId,
              name: p.name,
              price: p.price,
              original_price: p.originalPrice,
              image: p.image,
              description: p.description,
              is_on_sale: p.isOnSale,
              visible: p.visible,
              is_sample: p.isSample,
            }))
          );
        }
      },
      addInvite: (invite) =>
        set((s) => ({ invites: [...s.invites, invite] })),
      markInviteUsed: (token) =>
        set((s) => ({
          invites: s.invites.map((i) => (i.token === token ? { ...i, used: true } : i)),
        })),
      upsertProduct: async (storeId, product) => {
        const prodId = product.id || uid();
        const p = { ...product, id: prodId };
        
        set((s) => ({
          stores: s.stores.map((st) => {
            if (st.id !== storeId) return st;
            const exists = st.products.some((pr) => pr.id === p.id);
            const isNewRealProduct = !exists && !p.isSample;
            const hasOnlySamples = st.products.length > 0 && st.products.every(pr => pr.isSample);
            let currentProducts = st.products;
            
            // Eliminamos los ejemplos si es el primer producto real
            if (isNewRealProduct && hasOnlySamples) currentProducts = [];

            return {
              ...st,
              products: exists
                ? currentProducts.map((pr) => (pr.id === p.id ? p : pr))
                : [...currentProducts, p],
            };
          }),
        }));
        
        await supabase.from("products").upsert({
          id: p.id,
          store_id: storeId,
          category_id: p.categoryId,
          name: p.name,
          price: p.price,
          original_price: p.originalPrice,
          image: p.image,
          description: p.description,
          is_on_sale: p.isOnSale,
          visible: p.visible,
          is_sample: p.isSample,
        });
        
        // Si borramos samples visualmente, en la DB habría que borrarlos, pero por ahora simplificamos.
      },
      deleteProduct: async (storeId, productId) => {
        set((s) => ({
          stores: s.stores.map((st) =>
            st.id === storeId
              ? { ...st, products: st.products.filter((p) => p.id !== productId) }
              : st
          ),
        }));
        await supabase.from("products").delete().eq("id", productId);
      },
      toggleProductVisible: async (storeId, productId) => {
        let newVisible = true;
        set((s) => ({
          stores: s.stores.map((st) =>
            st.id === storeId
              ? {
                  ...st,
                  products: st.products.map((p) => {
                    if (p.id === productId) {
                      newVisible = !p.visible;
                      return { ...p, visible: newVisible };
                    }
                    return p;
                  }),
                }
              : st
          ),
        }));
        await supabase.from("products").update({ visible: newVisible }).eq("id", productId);
      },
      upsertCategory: async (storeId, cat) => {
        const catId = cat.id || uid();
        const c = { ...cat, id: catId };
        
        set((s) => ({
          stores: s.stores.map((st) => {
            if (st.id !== storeId) return st;
            const exists = st.categories.some((ca) => ca.id === c.id);
            return {
              ...st,
              categories: exists
                ? st.categories.map((ca) => (ca.id === c.id ? c : ca))
                : [...st.categories, c],
            };
          }),
        }));
        
        await supabase.from("categories").upsert({
          id: c.id,
          store_id: storeId,
          name: c.name,
        });
      },
      deleteCategory: async (storeId, catId) => {
        set((s) => ({
          stores: s.stores.map((st) =>
            st.id === storeId
              ? { ...st, categories: st.categories.filter((c) => c.id !== catId) }
              : st
          ),
        }));
        await supabase.from("categories").delete().eq("id", catId);
      },
      setPlan: async (storeId, plan) => {
        set((s) => ({
          stores: s.stores.map((st) => (st.id === storeId ? { ...st, plan } : st)),
        }));
        await supabase.from("stores").update({ plan }).eq("id", storeId);
      },
      toggleStoreActive: async (storeId) => {
        let newActive = true;
        set((s) => ({
          stores: s.stores.map((st) => {
            if (st.id === storeId) {
              newActive = !st.active;
              return { ...st, active: newActive };
            }
            return st;
          }),
        }));
        await supabase.from("stores").update({ active: newActive }).eq("id", storeId);
      },
      startImpersonation: (storeId) =>
        set({ currentStoreId: storeId, impersonatedBy: "superadmin" }),
      stopImpersonation: () => set({ impersonatedBy: null }),
      incWhatsappClicks: (storeId) =>
        set((s) => ({
          stores: s.stores.map((st) =>
            st.id === storeId ? { ...st, whatsappClicks: st.whatsappClicks + 1 } : st
          ),
        })),
    }),
    {
      name: "dizi-catalogos-v1",
    }
  )
);

// Cart store keyed by storeId
interface CartItem {
  productId: string;
  qty: number;
}
interface CartState {
  carts: Record<string, CartItem[]>;
  add: (storeId: string, productId: string) => void;
  setQty: (storeId: string, productId: string, qty: number) => void;
  remove: (storeId: string, productId: string) => void;
  clear: (storeId: string) => void;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      carts: {},
      add: (storeId, productId) =>
        set((s) => {
          const cart = s.carts[storeId] ?? [];
          const exists = cart.find((i) => i.productId === productId);
          const next = exists
            ? cart.map((i) =>
                i.productId === productId ? { ...i, qty: i.qty + 1 } : i
              )
            : [...cart, { productId, qty: 1 }];
          return { carts: { ...s.carts, [storeId]: next } };
        }),
      setQty: (storeId, productId, qty) =>
        set((s) => {
          const cart = s.carts[storeId] ?? [];
          const next =
            qty <= 0
              ? cart.filter((i) => i.productId !== productId)
              : cart.map((i) => (i.productId === productId ? { ...i, qty } : i));
          return { carts: { ...s.carts, [storeId]: next } };
        }),
      remove: (storeId, productId) =>
        set((s) => ({
          carts: {
            ...s.carts,
            [storeId]: (s.carts[storeId] ?? []).filter(
              (i) => i.productId !== productId
            ),
          },
        })),
      clear: (storeId) =>
        set((s) => ({ carts: { ...s.carts, [storeId]: [] } })),
    }),
    { name: "dizi-carts-v1" }
  )
);
