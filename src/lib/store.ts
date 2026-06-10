import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Category, PlanId, Product, Store, Invite, SubscriptionStatus } from "./types";
import { supabase, uploadBase64ToStorage } from "./supabase";
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
  views: row.views || 0,
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
  bioDescription: row.bio_description ?? undefined,
  locationLat: row.location_lat ? Number(row.location_lat) : undefined,
  locationLng: row.location_lng ? Number(row.location_lng) : undefined,
  locationAddress: row.location_address ?? undefined,
  quickLinks: row.quick_links ?? [],
  bioLinksEnabled: row.bio_links_enabled ?? false,
  bioLogo: row.bio_logo ?? undefined,
  bioBanner: row.bio_banner ?? undefined,
  bioTheme: row.bio_theme ?? "default",
  bioTypography: row.bio_typography ?? "sans",
  bioButtonStyle: row.bio_button_style === "rounded-full" ? "pill-solid" : (row.bio_button_style ?? "pill-solid"),
  bioButtonColor: row.bio_button_color ?? undefined,
  bioButtonTextColor: row.bio_button_text_color ?? undefined,
  bioBgImage: row.bio_bg_image ?? undefined,
  bioBgColor: row.bio_bg_color ?? undefined,
  categories: (row.categories || []).map((c: any) => ({ id: c.id, name: c.name })),
  products: (row.products || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    price: p.price !== null && p.price !== undefined ? Number(p.price) : null,
    categoryId: p.category_id,
    image: p.image,
    description: p.description,
    isOnSale: p.is_on_sale,
    originalPrice: p.original_price !== null && p.original_price !== undefined ? Number(p.original_price) : null,
    visible: p.visible,
    isSample: p.is_sample,
  })),
});

interface AppState {
  stores: Store[];
  currentStoreId: string | null;
  impersonatedBy: string | null;
  fetchError: string | null;
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
  setTrialPlan: (storeId: string, plan: PlanId, durationDays?: number) => Promise<void>;
  toggleStoreActive: (storeId: string) => void;
  startImpersonation: (storeId: string) => void;
  stopImpersonation: () => void;
  incWhatsappClicks: (storeId: string) => void;
  incViews: (storeId: string) => void;
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
      fetchError: null,

      fetchData: async () => {
        set({ fetchError: null });
        try {
          const { data, error } = await supabase
            .from("stores")
            .select("*, categories(*), products(*)");
          if (error) throw error;
          if (data) {
            const dbStores = data.map((row) => mapStoreFromDB(row));
            set({ stores: dbStores, fetchError: null });
          }
        } catch (err: any) {
          console.error("[fetchData] Supabase error:", err);
          set({ fetchError: err?.message || "Error de conexión con la base de datos." });
        }
      },

      setCurrentStore: (id) => set({ currentStoreId: id }),

      updateStore: async (id, patch) => {
        const updatedPatch = { ...patch };

        // Subir logo si es base64
        if (patch.logo && patch.logo.startsWith("data:")) {
          try {
            updatedPatch.logo = await uploadBase64ToStorage(patch.logo, `${id}/logo.webp`);
          } catch (uploadErr) {
            console.error("[updateStore] Logo upload failed, falling back to base64", uploadErr);
          }
        }

        // Subir bannerImage si es base64 (soporta múltiples imágenes separadas por |||)
        const patchAny = patch as any;
        if (patchAny.bannerImage) {
          try {
            const parts = patchAny.bannerImage.split("|||");
            const uploadedParts = await Promise.all(
              parts.map(async (part: string, index: number) => {
                if (part.startsWith("data:")) {
                  const uniqueId = Math.random().toString(36).slice(2, 6);
                  return await uploadBase64ToStorage(part, `${id}/banners/banner_${index}_${uniqueId}.webp`);
                }
                return part;
              })
            );
            (updatedPatch as any).bannerImage = uploadedParts.filter(Boolean).join("|||");
          } catch (uploadErr) {
            console.error("[updateStore] Banner upload failed, falling back to original", uploadErr);
          }
        }

        // Subir bioLogo si es base64
        if (patch.bioLogo && patch.bioLogo.startsWith("data:")) {
          try {
            updatedPatch.bioLogo = await uploadBase64ToStorage(patch.bioLogo, `${id}/bio_logo.webp`);
          } catch (uploadErr) {
            console.error("[updateStore] Bio Logo upload failed, falling back to base64", uploadErr);
          }
        }

        // Subir bioBanner si es base64
        if (patch.bioBanner && patch.bioBanner.startsWith("data:")) {
          try {
            updatedPatch.bioBanner = await uploadBase64ToStorage(patch.bioBanner, `${id}/bio_banner.webp`);
          } catch (uploadErr) {
            console.error("[updateStore] Bio Banner upload failed, falling back to base64", uploadErr);
          }
        }

        // Subir bioBgImage si es base64
        if (patch.bioBgImage && patch.bioBgImage.startsWith("data:")) {
          try {
            updatedPatch.bioBgImage = await uploadBase64ToStorage(patch.bioBgImage, `${id}/bio_bg.webp`);
          } catch (uploadErr) {
            console.error("[updateStore] Bio Background Image upload failed, falling back to base64", uploadErr);
          }
        }

        const dbPatch: any = {};
        if (updatedPatch.slug !== undefined) dbPatch.slug = updatedPatch.slug;
        if (updatedPatch.name !== undefined) dbPatch.name = updatedPatch.name;
        if (updatedPatch.phone !== undefined) dbPatch.phone = updatedPatch.phone;
        if (updatedPatch.logo !== undefined) dbPatch.logo = updatedPatch.logo;
        if (updatedPatch.model !== undefined) dbPatch.model = updatedPatch.model;
        if (updatedPatch.niche !== undefined) dbPatch.niche = updatedPatch.niche;
        if (updatedPatch.brandColor !== undefined) dbPatch.brand_color = updatedPatch.brandColor;
        if ((updatedPatch as any).bgColor !== undefined) dbPatch.bg_color = (updatedPatch as any).bgColor;
        if ((updatedPatch as any).bannerImage !== undefined) dbPatch.banner_image = (updatedPatch as any).bannerImage;
        if ((updatedPatch as any).bannerTitle !== undefined) dbPatch.banner_title = (updatedPatch as any).bannerTitle;
        if (updatedPatch.isPublished !== undefined) dbPatch.is_published = updatedPatch.isPublished;
        if (updatedPatch.priceFilterEnabled !== undefined) dbPatch.price_filter_enabled = updatedPatch.priceFilterEnabled;
        if (updatedPatch.libroReclamacionesActivo !== undefined) dbPatch.libro_reclamaciones_activo = updatedPatch.libroReclamacionesActivo;
        if (updatedPatch.empresaRuc !== undefined) dbPatch.empresa_ruc = updatedPatch.empresaRuc;
        if (updatedPatch.empresaRazonSocial !== undefined) dbPatch.empresa_razon_social = updatedPatch.empresaRazonSocial;
        if (updatedPatch.empresaDireccion !== undefined) dbPatch.empresa_direccion = updatedPatch.empresaDireccion;
        if (updatedPatch.planExpiresAt !== undefined) dbPatch.plan_expires_at = updatedPatch.planExpiresAt;
        if (updatedPatch.subscriptionStatus !== undefined) dbPatch.subscription_status = updatedPatch.subscriptionStatus;
        if (updatedPatch.cancelledAt !== undefined) dbPatch.cancelled_at = updatedPatch.cancelledAt;
        if (updatedPatch.cancelReason !== undefined) dbPatch.cancel_reason = updatedPatch.cancelReason;
        if (updatedPatch.planDurationMonths !== undefined) dbPatch.plan_duration_months = updatedPatch.planDurationMonths;
        if (updatedPatch.bioDescription !== undefined) dbPatch.bio_description = updatedPatch.bioDescription;
        if (updatedPatch.locationLat !== undefined) dbPatch.location_lat = updatedPatch.locationLat;
        if (updatedPatch.locationLng !== undefined) dbPatch.location_lng = updatedPatch.locationLng;
        if (updatedPatch.locationAddress !== undefined) dbPatch.location_address = updatedPatch.locationAddress;
        if (updatedPatch.quickLinks !== undefined) dbPatch.quick_links = updatedPatch.quickLinks;
        if (updatedPatch.bioLinksEnabled !== undefined) dbPatch.bio_links_enabled = updatedPatch.bioLinksEnabled;
        if (updatedPatch.bioLogo !== undefined) dbPatch.bio_logo = updatedPatch.bioLogo;
        if (updatedPatch.bioBanner !== undefined) dbPatch.bio_banner = updatedPatch.bioBanner;
        if (updatedPatch.bioTheme !== undefined) dbPatch.bio_theme = updatedPatch.bioTheme;
        if (updatedPatch.bioTypography !== undefined) dbPatch.bio_typography = updatedPatch.bioTypography;
        if (updatedPatch.bioButtonStyle !== undefined) dbPatch.bio_button_style = updatedPatch.bioButtonStyle;
        if (updatedPatch.bioButtonColor !== undefined) dbPatch.bio_button_color = updatedPatch.bioButtonColor;
        if (updatedPatch.bioButtonTextColor !== undefined) dbPatch.bio_button_text_color = updatedPatch.bioButtonTextColor;
        if (updatedPatch.bioBgImage !== undefined) dbPatch.bio_bg_image = updatedPatch.bioBgImage;
        if (updatedPatch.bioBgColor !== undefined) dbPatch.bio_bg_color = updatedPatch.bioBgColor;

        try {
          if (Object.keys(dbPatch).length > 0) {
            const { error: updateError } = await supabase.from("stores").update(dbPatch).eq("id", id);
            if (updateError) throw updateError;
          }

          set((s) => ({
            stores: s.stores.map((st) => (st.id === id ? { ...st, ...updatedPatch } : st)),
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

        // No es necesario actualizar las columnas de facturación directamente desde el cliente
        // ya que el RPC 'activate_subscription_with_invite' se encarga de configurarlas en el servidor de forma segura.

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
        if (storeId) {
          // Llamar al RPC seguro que valida y aplica el invite atómicamente en el servidor
          const { data: inviteData, error: rpcError } = await supabase.rpc("activate_subscription_with_invite", {
            p_store_id: storeId,
            p_invite_token: token,
          });

          if (rpcError) {
            console.error("[markInviteUsed] activate_subscription_with_invite error:", rpcError);
            throw rpcError;
          }

          const inviteArray = inviteData as any[];
          if (inviteArray && inviteArray.length > 0) {
            const invite = inviteArray[0];
            const isTrial = invite.duration_months === 0;

            // Calcular fecha y estado correctos
            const expiresAt = new Date();
            if (isTrial) {
              expiresAt.setDate(expiresAt.getDate() + 15);
            } else {
              expiresAt.setMonth(expiresAt.getMonth() + (invite.duration_months ?? 1));
            }

            const subscriptionStatus = isTrial ? "trial" : "active";
            const planDurationMonths = isTrial ? 0 : (invite.duration_months ?? 1);

            // Actualizar estado local
            set((s) => ({
              stores: s.stores.map((st) =>
                st.id === storeId
                  ? {
                      ...st,
                      plan: invite.plan as PlanId,
                      planExpiresAt: expiresAt.toISOString(),
                      subscriptionStatus: subscriptionStatus as SubscriptionStatus,
                      planDurationMonths: planDurationMonths,
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

      setTrialPlan: async (storeId, plan, durationDays = 15) => {
        try {
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + durationDays);

          const { error } = await supabase
            .from("stores")
            .update({
              plan,
              plan_expires_at: expiresAt.toISOString(),
              subscription_status: "trial",
              plan_duration_months: 0,
            })
            .eq("id", storeId);

          if (error) throw error;

          set((s) => ({
            stores: s.stores.map((st) =>
              st.id === storeId
                ? {
                    ...st,
                    plan,
                    planExpiresAt: expiresAt.toISOString(),
                    subscriptionStatus: "trial" as SubscriptionStatus,
                    planDurationMonths: 0,
                    cancelledAt: undefined,
                    cancelReason: undefined,
                  }
                : st
            ),
          }));
          toast.success(`Prueba de ${durationDays} días activada`);
        } catch (error) {
          console.error("[setTrialPlan] Error:", error);
          toast.error("Error al activar plan de prueba");
        }
      },

      upsertProduct: async (storeId, product) => {
        const prodId = product.id || uid();
        let imageUrl = product.image;

        // Si la imagen es un base64, subirla a Supabase Storage
        if (imageUrl && imageUrl.startsWith("data:")) {
          try {
            imageUrl = await uploadBase64ToStorage(imageUrl, `${storeId}/products/${prodId}.webp`);
          } catch (uploadErr) {
            console.error("[upsertProduct] Image upload failed, falling back to base64", uploadErr);
          }
        }

        const cleanPrice = (product.price !== undefined && product.price !== null && product.price !== 0) ? product.price : null;
        const cleanOriginalPrice = (product.originalPrice !== undefined && product.originalPrice !== null && product.originalPrice !== 0) ? product.originalPrice : null;

        const p = { 
          ...product, 
          id: prodId, 
          image: imageUrl,
          price: cleanPrice,
          originalPrice: cleanOriginalPrice,
          description: product.description || undefined
        };

        try {
          const st = useApp.getState().stores.find((s) => s.id === storeId);
          const exists = st ? st.products.some((pr) => pr.id === p.id) : false;
          const isNewRealProduct = !exists && !p.isSample;
          const hasOnlySamples = st ? (st.products.length > 0 && st.products.every((pr) => pr.isSample)) : false;

          if (isNewRealProduct && hasOnlySamples) {
            const { error: delErr } = await supabase
              .from("products")
              .delete()
              .eq("store_id", storeId)
              .eq("is_sample", true);
            if (delErr) {
              console.error("[upsertProduct] Error deleting sample products:", delErr);
            }
          }

          const { error } = await supabase.from("products").upsert({
            id: p.id, store_id: storeId, category_id: p.categoryId || null,
            name: p.name, price: p.price, original_price: p.originalPrice,
            image: p.image, description: p.description || null, is_on_sale: p.isOnSale,
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

      incViews: async (storeId) => {
        set((s) => ({
          stores: s.stores.map((st) =>
            st.id === storeId ? { ...st, views: (st.views || 0) + 1 } : st
          ),
        }));

        try {
          const { error } = await supabase.rpc("increment_views", { store_id_param: storeId });
          if (error) throw error;
        } catch (error) {
          console.error("[incViews] Error:", error);
        }
      },
    }),
    {
      name: "dizi-catalogos-v2",
      partialize: (state) => ({
        // Guardamos las URLs reales (http) en local storage para carga instantánea, 
        // pero omitimos los base64 temporales si quedara alguno para no desbordar los 5MB
        stores: state.stores.map((st) => ({
          ...st,
          logo: st.logo?.startsWith("data:") ? undefined : st.logo,
          bannerImage: st.bannerImage
            ? st.bannerImage.split("|||").map((img) => (img.startsWith("data:") ? "" : img)).filter(Boolean).join("|||") || undefined
            : undefined,
          bioLogo: st.bioLogo?.startsWith("data:") ? undefined : st.bioLogo,
          bioBanner: st.bioBanner?.startsWith("data:") ? undefined : st.bioBanner,
          bioBgImage: st.bioBgImage?.startsWith("data:") ? undefined : st.bioBgImage,
          products: st.products.map((p) => ({
            ...p,
            image: p.image?.startsWith("data:") ? undefined : p.image,
          })),
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
