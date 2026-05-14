import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Category, PlanId, Product, Store, Invite, SubscriptionStatus } from "./types";
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
  bannerImage: row.banner_image,
  bannerTitle: row.banner_title,
  ownerId: row.owner_id,
  active: row.active,
  isPublished: row.is_published,
  createdAt: row.created_at,
  whatsappClicks: row.whatsapp_clicks || 0,
  priceFilterEnabled: row.price_filter_enabled ?? false,
  libroReclamacionesActivo: row.libro_reclamaciones_activo ?? false,
  empresaRuc: row.empresa_ruc ?? undefined,
  empresaRazonSocial: row.empresa_razon_social ?? undefined,
  empresaDireccion: row.empresa_direccion ?? undefined,
  planExpiresAt: row.plan_expires_at ?? undefined,
  subscriptionStatus: (row.subscription_status ?? "trial") as SubscriptionStatus,
  cancelledAt: row.cancelled_at ?? undefined,
  cancelReason: row.cancel_reason ?? undefined,
  planDurationMonths: row.plan_duration_months ?? undefined,
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
  currentStoreId: string | null;
  impersonatedBy: string | null;
  fetchData: () => Promise<void>;
  setCurrentStore: (id: string | null) => void;
  updateStore: (id: string, patch: Partial<Store>) => Promise<void>;
  addStore: (store: Store) => void;
  addInvite: (invite: Omit<Invite, "createdAt">) => Promise<void>;
  markInviteUsed: (token: string, storeId?: string) => Promise<void>;
  cancelSubscription: (storeId: string, reason?: string) => Promise<void>;
  extendSubscription: (storeId: string, monthsToAdd: number) => Promise<void>;
  upsertProduct: (storeId: string, product: Product) => void;
  deleteProduct: (storeId: string, productId: string) => void;
  toggleProductVisible: (storeId: string, productId: string) => void;
  upsertCategory: (storeId: string, cat: Category) => void;
  deleteCategory: (storeId: string, catId: string) => void;
  setPlan: (storeId: string, plan: PlanId, durationMonths?: number) => void;
  toggleStoreActive: (storeId: string) => void;
  startImpersonation: (storeId: string) => void;
  stopImpersonation: () => void;
  incWhatsappClicks: (storeId: string) => void;
}

const uid = () => Math.random().toString(36).slice(2, 10);

// Limpia claves de versiones anteriores del store para liberar localStorage
if (typeof window !== "undefined") {
  ["dizi-catalogos-v1"].forEach((key) => {
    try { localStorage.removeItem(key); } catch {}
  });
}

export const useApp = create<AppState>()(
  persist(
    (set) => ({
      stores: [],
      currentStoreId: null,
      impersonatedBy: null,

      fetchData: async () => {
        const { data, error } = await supabase
          .from("stores")
          .select("*, categories(*), products(*)");
        if (data && !error) {
          const dbStores = data.map((row) => mapStoreFromDB(row));
          set({ stores: dbStores });
        } else {
          console.error("[fetchData] Supabase error:", error);
        }
      },

      setCurrentStore: (id) => set({ currentStoreId: id }),

      updateStore: async (id, patch) => {
        const dbPatch: any = {};
        if (patch.slug !== undefined) dbPatch.slug = patch.slug;
        if (patch.name !== undefined) dbPatch.name = patch.name;
        if (patch.phone !== undefined) dbPatch.phone = patch.phone;
        if (patch.logo !== undefined) dbPatch.logo = patch.logo;
        if (patch.model !== undefined) dbPatch.model = patch.model;
        if (patch.brandColor !== undefined) dbPatch.brand_color = patch.brandColor;
        if ((patch as any).bgColor !== undefined) dbPatch.bg_color = (patch as any).bgColor;
        if ((patch as any).bannerImage !== undefined) dbPatch.banner_image = (patch as any).bannerImage;
        if ((patch as any).bannerTitle !== undefined) dbPatch.banner_title = (patch as any).bannerTitle;
        if (patch.isPublished !== undefined) dbPatch.is_published = patch.isPublished;
        if (patch.priceFilterEnabled !== undefined) dbPatch.price_filter_enabled = patch.priceFilterEnabled;
        if (patch.libroReclamacionesActivo !== undefined) dbPatch.libro_reclamaciones_activo = patch.libroReclamacionesActivo;
        if (patch.empresaRuc !== undefined) dbPatch.empresa_ruc = patch.empresaRuc;
        if (patch.empresaRazonSocial !== undefined) dbPatch.empresa_razon_social = patch.empresaRazonSocial;
        if (patch.empresaDireccion !== undefined) dbPatch.empresa_direccion = patch.empresaDireccion;
        if (patch.planExpiresAt !== undefined) dbPatch.plan_expires_at = patch.planExpiresAt;
        if (patch.subscriptionStatus !== undefined) dbPatch.subscription_status = patch.subscriptionStatus;
        if (patch.cancelledAt !== undefined) dbPatch.cancelled_at = patch.cancelledAt;
        if (patch.cancelReason !== undefined) dbPatch.cancel_reason = patch.cancelReason;
        if (patch.planDurationMonths !== undefined) dbPatch.plan_duration_months = patch.planDurationMonths;

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
          toast.error("No se pudo actualizar la configuracion");
          throw error;
        }
      },

      addStore: async (store) => {
        const { error: rpcError } = await supabase.rpc("initialize_store", {
          p_id: store.id,
          p_slug: store.slug,
          p_name: store.name,
          p_phone: store.phone,
          p_country_code: store.countryCode,
          p_plan: store.plan,
          p_owner_id: store.ownerId,
          p_model: store.model,
          p_niche: store.niche,
          p_category_id: store.categories[0]?.id || uid(),
        });

        if (rpcError) {
          console.error("[addStore] RPC error:", rpcError);
          throw rpcError;
        }

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

        set((s) => ({ stores: [...s.stores, store] }));
      },

      addInvite: async ({ token, plan, durationMonths, notes }) => {
        const { error } = await supabase.from("invites").insert({
          token,
          plan,
          duration_months: durationMonths ?? 1,
          notes: notes ?? null,
          // expires_at se calcula en el trigger de BD (30 días para el link)
        });
        if (error) {
          console.error("[addInvite] Error:", error);
          toast.error("No se pudo guardar la invitacion");
          throw error;
        }
      },

      markInviteUsed: async (token, storeId) => {
        // 1. Marcar el invite como usado
        const { error: updateError } = await supabase
          .from("invites")
          .update({ used: true })
          .eq("token", token);
        if (updateError) console.error("[markInviteUsed] Error:", updateError);

        // 2. Si tenemos storeId, activar la suscripción en la tienda usando los datos del invite
        if (storeId) {
          const { data: invite, error: fetchError } = await supabase
            .from("invites")
            .select("plan, duration_months")
            .eq("token", token)
            .single();

          if (!fetchError && invite) {
            const { error: rpcError } = await supabase.rpc("activate_subscription", {
              p_store_id: storeId,
              p_plan: invite.plan,
              p_duration_months: invite.duration_months ?? 1,
            });
            if (rpcError) console.error("[markInviteUsed] activate_subscription error:", rpcError);

            // Actualizar estado local
            const expiresAt = new Date();
            expiresAt.setMonth(expiresAt.getMonth() + (invite.duration_months ?? 1));
            set((s) => ({
              stores: s.stores.map((st) =>
                st.id === storeId
                  ? {
                      ...st,
                      plan: invite.plan as PlanId,
                      planExpiresAt: expiresAt.toISOString(),
                      subscriptionStatus: "active" as SubscriptionStatus,
                      planDurationMonths: invite.duration_months ?? 1,
                    }
                  : st
              ),
            }));
          }
        }
      },

      cancelSubscription: async (storeId, reason) => {
        try {
          const { error } = await supabase.rpc("cancel_subscription", {
            p_store_id: storeId,
            p_reason: reason ?? null,
          });
          if (error) throw error;

          set((s) => ({
            stores: s.stores.map((st) =>
              st.id === storeId
                ? {
                    ...st,
                    plan: "semilla" as PlanId,
                    subscriptionStatus: "cancelled" as SubscriptionStatus,
                    cancelledAt: new Date().toISOString(),
                    cancelReason: reason,
                    planExpiresAt: new Date().toISOString(),
                  }
                : st
            ),
          }));
          toast.success("Suscripcion cancelada");
        } catch (error) {
          console.error("[cancelSubscription] Error:", error);
          toast.error("Error al cancelar la suscripcion");
        }
      },

      extendSubscription: async (storeId, monthsToAdd) => {
        try {
          const { error } = await supabase.rpc("extend_subscription", {
            p_store_id: storeId,
            p_months_to_add: monthsToAdd,
          });
          if (error) throw error;

          // Calcular nueva fecha localmente
          set((s) => ({
            stores: s.stores.map((st) => {
              if (st.id !== storeId) return st;
              const base = st.planExpiresAt && new Date(st.planExpiresAt) > new Date()
                ? new Date(st.planExpiresAt)
                : new Date();
              base.setMonth(base.getMonth() + monthsToAdd);
              return {
                ...st,
                planExpiresAt: base.toISOString(),
                subscriptionStatus: "active" as SubscriptionStatus,
                cancelledAt: undefined,
                cancelReason: undefined,
              };
            }),
          }));
          toast.success(`Plan extendido ${monthsToAdd} mes${monthsToAdd > 1 ? "es" : ""}`);
        } catch (error) {
          console.error("[extendSubscription] Error:", error);
          toast.error("Error al extender la suscripcion");
        }
      },

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
        const s = useApp.getState();
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
          toast.success("Categoria guardada");
        } catch (error) {
          console.error("[upsertCategory] Error:", error);
          toast.error("Error al guardar categoria");
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
          toast.success("Categoria eliminada");
        } catch (error) {
          console.error("[deleteCategory] Error:", error);
          toast.error("No se pudo eliminar la categoria");
        }
      },

      setPlan: async (storeId, plan, durationMonths) => {
        try {
          if (plan === "semilla") {
            const { error } = await supabase.from("stores").update({
              plan,
              plan_expires_at: null,
              subscription_status: "trial",
              plan_duration_months: null,
            }).eq("id", storeId);
            if (error) throw error;

            set((s) => ({
              stores: s.stores.map((st) =>
                st.id === storeId
                  ? { ...st, plan, planExpiresAt: undefined, subscriptionStatus: "trial", planDurationMonths: undefined }
                  : st
              ),
            }));
          } else {
            const months = durationMonths ?? 1;
            const { error } = await supabase.rpc("activate_subscription", {
              p_store_id: storeId,
              p_plan: plan,
              p_duration_months: months,
            });
            if (error) throw error;

            const expiresAt = new Date();
            expiresAt.setMonth(expiresAt.getMonth() + months);

            set((s) => ({
              stores: s.stores.map((st) =>
                st.id === storeId
                  ? {
                      ...st,
                      plan,
                      planExpiresAt: expiresAt.toISOString(),
                      subscriptionStatus: "active" as SubscriptionStatus,
                      planDurationMonths: months,
                      cancelledAt: undefined,
                      cancelReason: undefined,
                    }
                  : st
              ),
            }));
          }
          toast.success("Plan actualizado");
        } catch (error) {
          console.error("[setPlan] Error:", error);
          toast.error("Error al actualizar plan");
        }
      },

      toggleStoreActive: async (storeId) => {
        const s = useApp.getState();
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
        set((s) => ({
          stores: s.stores.map((st) =>
            st.id === storeId ? { ...st, whatsappClicks: st.whatsappClicks + 1 } : st
          ),
        }));

        try {
          const { error } = await supabase.rpc("increment_whatsapp_clicks", { store_id_param: storeId });
          if (error) throw error;
        } catch (error) {
          console.error("[incWhatsappClicks] Error:", error);
        }
      },
    }),
    {
      name: "dizi-catalogos-v2",
      partialize: (state) => ({
        // Solo persistimos IDs y metadatos ligeros.
        // Las imágenes (logo, bannerImage, products[].image) se recargan
        // desde Supabase en fetchData — no las guardamos en localStorage
        // para no exceder el límite de ~5 MB.
        stores: state.stores.map((st) => ({
          ...st,
          logo: undefined,
          bannerImage: undefined,
          products: st.products.map((p) => ({ ...p, image: undefined })),
        })),
        currentStoreId: state.currentStoreId,
        impersonatedBy: state.impersonatedBy,
      }),
    }
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
