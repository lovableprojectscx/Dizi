import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Category, PlanId, Product, Store, Invite } from "./types";
import { initialStores } from "./mock-data";
import { supabase } from "./supabase";
import { toast } from "sonner";

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
  bgColor: row.bg_color,
  ownerId: row.owner_id,
  active: row.active,
  isPublished: row.is_published,
  createdAt: row.created_at,
  whatsappClicks: row.whatsapp_clicks || 0,
  categories: (row.categories || []).map((c: any) => ({ id: c.id, name: c.name })),
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
  impersonatedBy: string | null;
  fetchData: () => Promise<void>;
  setCurrentStore: (id: string | null) => void;
  updateStore: (id: string, patch: Partial<Store>) => Promise<void>;
  addStore: (store: Store) => void;
  addInvite: (invite: Invite) => void;
  markInviteUsed: (token: string) => void;
  upsertProduct: (storeId: string, product: Product) => void;
  deleteProduct: (storeId: string, productId: string) => void;
  toggleProductVisible: (storeId: string, productId: string) => void;
  upsertCategory: (storeId: string, cat: Category) => void;
  deleteCategory: (storeId: string, catId: string) => void;
  setPlan: (storeId: string, plan: PlanId) => void;
  toggleStoreActive: (storeId: string) => void;
  startImpersonation: (storeId: string) => void;
  stopImpersonation: () => void;
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
          const dbStores = data.map((row) => {
            const mapped = mapStoreFromDB(row);
            return mapped;
          });

          set(() => ({ 
            stores: dbStores 
          }));
        } else {
          console.error("[fetchData] Supabase error:", error);
        }
      },

      setCurrentStore: (id) => set({ currentStoreId: id }),

      updateStore: async (id, patch) => {
        const dbPatch: any = {};
        if (patch.name !== undefined) dbPatch.name = patch.name;
        if (patch.phone !== undefined) dbPatch.phone = patch.phone;
        if (patch.logo !== undefined) dbPatch.logo = patch.logo;
        if (patch.model !== undefined) dbPatch.model = patch.model;
        if (patch.brandColor !== undefined) dbPatch.brand_color = patch.brandColor;
        if ((patch as any).bgColor !== undefined) dbPatch.bg_color = (patch as any).bgColor;
        if (patch.isPublished !== undefined) dbPatch.is_published = patch.isPublished;
        
        try {
          if (Object.keys(dbPatch).length > 0) {
            const { error: updateError } = await supabase.from("stores").update(dbPatch).eq("id", id);
            if (updateError) throw updateError;
          }

          set((s) => ({
            stores: s.stores.map((st) => (st.id === id ? { ...st, ...patch } : st)),
          }));
        } catch (error) {
          console.error("[updateStore] Error:", error);
          toast.error("No se pudo actualizar la configuración");
          throw error;
        }
      },

      addStore: async (store) => {
        // Usar RPC para creación atómica (Tienda + Categoría Inicial)
        // Esto evita que se cree la tienda pero falle la categoría
        const { error: rpcError } = await supabase.rpc('initialize_store', {
          p_id: store.id,
          p_slug: store.slug,
          p_name: store.name,
          p_phone: store.phone,
          p_country_code: store.countryCode,
          p_plan: store.plan,
          p_owner_id: store.ownerId,
          p_model: store.model,
          p_niche: store.niche,
          p_category_id: store.categories[0]?.id || uid()
        });

        if (rpcError) {
          console.error("[addStore] RPC error:", rpcError);
          throw rpcError;
        }

        // Si hay más categorías (poco común en registro inicial, pero por si acaso)
        if (store.categories.length > 1) {
          const extraCats = store.categories.slice(1);
          const { error: catError } = await supabase.from("categories").insert(
            extraCats.map((c) => ({ id: c.id, store_id: store.id, name: c.name }))
          );
          if (catError) console.error("[addStore] Extra categories error:", catError);
        }

        if (store.products.length > 0) {
          const { error: prodError } = await supabase.from("products").insert(
            store.products.map((p) => ({
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
          if (prodError) {
            console.error("[addStore] Product insert error:", prodError);
            throw prodError;
          }
        }

        // Only update local state if everything succeeded
        set((s) => ({ stores: [...s.stores, store] }));
      },

      addInvite: (invite) => set((s) => ({ invites: [...s.invites, invite] })),

      markInviteUsed: (token) =>
        set((s) => ({
          invites: s.invites.map((i) => (i.token === token ? { ...i, used: true } : i)),
        })),

      upsertProduct: async (storeId, product) => {
        const prodId = product.id || uid();
        const p = { ...product, id: prodId };
        
        try {
          const { error } = await supabase.from("products").upsert({
            id: p.id, store_id: storeId, category_id: p.categoryId,
            name: p.name, price: p.price, original_price: p.originalPrice,
            image: p.image, description: p.description, is_on_sale: p.isOnSale,
            visible: p.visible, is_sample: p.isSample,
          });
          
          if (error) throw error;

          set((s) => ({
            stores: s.stores.map((st) => {
              if (st.id !== storeId) return st;
              const exists = st.products.some((pr) => pr.id === p.id);
              const isNewRealProduct = !exists && !p.isSample;
              const hasOnlySamples = st.products.length > 0 && st.products.every((pr) => pr.isSample);
              let currentProducts = st.products;
              if (isNewRealProduct && hasOnlySamples) currentProducts = [];
              return {
                ...st,
                products: exists
                  ? currentProducts.map((pr) => (pr.id === p.id ? p : pr))
                  : [...currentProducts, p],
              };
            }),
          }));
        } catch (error) {
          console.error("[upsertProduct] Error:", error);
          toast.error("Error al guardar producto");
        }
      },

      deleteProduct: async (storeId, productId) => {
        try {
          const { error } = await supabase.from("products").delete().eq("id", productId);
          if (error) throw error;
          
          set((s) => ({
            stores: s.stores.map((st) =>
              st.id === storeId
                ? { ...st, products: st.products.filter((p) => p.id !== productId) }
                : st
            ),
          }));
        } catch (error) {
          console.error("[deleteProduct] Error:", error);
          toast.error("Error al eliminar producto");
        }
      },

      toggleProductVisible: async (storeId, productId) => {
        const s = get();
        const store = s.stores.find(st => st.id === storeId);
        const product = store?.products.find(p => p.id === productId);
        if (!product) return;
        
        const newVisible = !product.visible;
        try {
          const { error } = await supabase.from("products").update({ visible: newVisible }).eq("id", productId);
          if (error) throw error;

          set((s) => ({
            stores: s.stores.map((st) =>
              st.id === storeId
                ? {
                    ...st,
                    products: st.products.map((p) =>
                      p.id === productId ? { ...p, visible: newVisible } : p
                    ),
                  }
                : st
            ),
          }));
        } catch (error) {
          console.error("[toggleProductVisible] Error:", error);
          toast.error("Error al cambiar visibilidad");
        }
      },

      upsertCategory: async (storeId, cat) => {
        try {
          const payload: any = { store_id: storeId, name: cat.name };
          if (cat.id) payload.id = cat.id;
          
          const { data, error } = await supabase.from("categories").upsert(payload).select().single();
          if (error) throw error;
          
          const savedCat = { id: data.id, name: data.name };

          set((s) => ({
            stores: s.stores.map((st) => {
              if (st.id !== storeId) return st;
              const exists = cat.id && st.categories.some((ca) => ca.id === cat.id);
              return {
                ...st,
                categories: exists
                  ? st.categories.map((ca) => (ca.id === cat.id ? savedCat : ca))
                  : [...st.categories, savedCat],
              };
            }),
          }));
          toast.success("Categoría guardada");
        } catch (error) {
          console.error("[upsertCategory] Error:", error);
          toast.error("Error al guardar categoría");
        }
      },

      deleteCategory: async (storeId, catId) => {
        try {
          const { error } = await supabase.from("categories").delete().eq("id", catId);
          if (error) throw error;

          set((s) => ({
            stores: s.stores.map((st) =>
              st.id === storeId
                ? { ...st, categories: st.categories.filter((c) => c.id !== catId) }
                : st
            ),
          }));
          toast.success("Categoría eliminada");
        } catch (error) {
          console.error("[deleteCategory] Error:", error);
          toast.error("No se pudo eliminar la categoría");
        }
      },

      setPlan: async (storeId, plan) => {
        try {
          const { error } = await supabase.from("stores").update({ plan }).eq("id", storeId);
          if (error) throw error;

          set((s) => ({
            stores: s.stores.map((st) => (st.id === storeId ? { ...st, plan } : st)),
          }));
          toast.success("Plan actualizado");
        } catch (error) {
          console.error("[setPlan] Error:", error);
          toast.error("Error al actualizar plan");
        }
      },

      toggleStoreActive: async (storeId) => {
        const s = get();
        const store = s.stores.find(st => st.id === storeId);
        if (!store) return;
        
        const newActive = !store.active;
        try {
          const { error } = await supabase.from("stores").update({ active: newActive }).eq("id", storeId);
          if (error) throw error;

          set((s) => ({
            stores: s.stores.map((st) => (st.id === storeId ? { ...st, active: newActive } : st)),
          }));
          toast.success(newActive ? "Tienda activada" : "Tienda desactivada");
        } catch (error) {
          console.error("[toggleStoreActive] Error:", error);
          toast.error("Error al cambiar estado");
        }
      },

      startImpersonation: (storeId) =>
        set({ currentStoreId: storeId, impersonatedBy: "superadmin" }),

      stopImpersonation: () => set({ impersonatedBy: null }),

      incWhatsappClicks: async (storeId) => {
        // Actualización optimista
        set((s) => ({
          stores: s.stores.map((st) =>
            st.id === storeId ? { ...st, whatsappClicks: st.whatsappClicks + 1 } : st
          ),
        }));
        
        try {
          const { error } = await supabase.rpc('increment_whatsapp_clicks', { store_id_param: storeId });
          if (error) throw error;
        } catch (error) {
          console.error("[incWhatsappClicks] Error:", error);
        }
      },
    }),
    { name: "dizi-catalogos-v1" }
  )
);

interface CartItem { productId: string; qty: number; }
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
            ? cart.map((i) => (i.productId === productId ? { ...i, qty: i.qty + 1 } : i))
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
            [storeId]: (s.carts[storeId] ?? []).filter((i) => i.productId !== productId),
          },
        })),
      clear: (storeId) =>
        set((s) => ({ carts: { ...s.carts, [storeId]: [] } })),
    }),
    { name: "dizi-carts-v1" }
  )
);
