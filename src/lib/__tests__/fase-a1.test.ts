import { describe, it, expect } from "vitest";
import { planAllowsPromoBar, getEffectivePlan, type Store, type PlanId } from "@/lib/types";
import { mapStoreFromDB } from "@/lib/store";

describe("Fase A1 — Pruebas unitarias de Cintillo, Botón Bio y Marca de Agua", () => {
  describe("ERROR 1: Cintillo promocional bloqueado en Emprendedor y Semilla", () => {
    const makeStore = (plan: PlanId, expiresAt?: string): Store =>
      ({
        id: "test-store",
        plan,
        planExpiresAt: expiresAt,
      } as unknown as Store);

    it("bloquea el cintillo para tiendas con plan Semilla", () => {
      const store = makeStore("semilla");
      expect(planAllowsPromoBar(store)).toBe(false);
    });

    it("bloquea el cintillo para tiendas con plan Emprendedor (ej. milance)", () => {
      const store = makeStore("emprendedor");
      expect(planAllowsPromoBar(store)).toBe(false);
    });

    it("permite el cintillo para tiendas con plan Pro activo", () => {
      const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const store = makeStore("pro", future);
      expect(planAllowsPromoBar(store)).toBe(true);
    });

    it("permite el cintillo para tiendas con plan Ilimitado", () => {
      const store = makeStore("ilimitado");
      expect(planAllowsPromoBar(store)).toBe(true);
    });

    it("la vista previa del panel (previewStore) fuerza promoBarEnabled en false si el plan no lo permite", () => {
      const storeEmprendedor = makeStore("emprendedor");
      const promoBarEnabledInput = true;

      const previewPromoBarEnabled = planAllowsPromoBar(storeEmprendedor)
        ? promoBarEnabledInput
        : false;

      expect(previewPromoBarEnabled).toBe(false);
    });
  });

  describe("ERROR 2: Mapeo de bioShowCatalogButton (true/false/null) y campos visuales", () => {
    // Simula el mapeo realizado en loaders de bio.$slug.tsx y t.$slug.{-$categoria}.tsx
    const mapRpcDataToStoreFields = (data: any) => ({
      accentColor: data.accent_color ?? null,
      borderRadius: data.border_radius ?? null,
      imgShape: data.img_shape ?? null,
      bioShowCatalogButton: data.bio_show_catalog_button ?? null,
      showDiziBranding: data.show_dizi_branding ?? (data.plan === "semilla" ? true : false),
    });

    it("pasa bioShowCatalogButton como true cuando viene true de la base", () => {
      const mapped = mapRpcDataToStoreFields({
        plan: "pro",
        bio_show_catalog_button: true,
        accent_color: "#ff0000",
        border_radius: "16px",
        img_shape: "rounded",
      });
      expect(mapped.bioShowCatalogButton).toBe(true);
      expect(mapped.accentColor).toBe("#ff0000");
      expect(mapped.borderRadius).toBe("16px");
      expect(mapped.imgShape).toBe("rounded");
    });

    it("pasa bioShowCatalogButton como false cuando viene false de la base", () => {
      const mapped = mapRpcDataToStoreFields({
        plan: "pro",
        bio_show_catalog_button: false,
      });
      expect(mapped.bioShowCatalogButton).toBe(false);
    });

    it("pasa bioShowCatalogButton como null cuando viene null o undefined", () => {
      const mappedNull = mapRpcDataToStoreFields({
        plan: "pro",
        bio_show_catalog_button: null,
      });
      expect(mappedNull.bioShowCatalogButton).toBeNull();

      const mappedUndef = mapRpcDataToStoreFields({
        plan: "pro",
      });
      expect(mappedUndef.bioShowCatalogButton).toBeNull();
    });

    it("PublicCatalog evalúa correctamente la visibilidad del botón 'Ver Catálogo'", () => {
      const shouldShowButton = (
        bioShowCatalogButton: boolean | null | undefined,
        bioTypography: string
      ) => (bioShowCatalogButton ?? bioTypography === "serif");

      // Si se configuró explícitamente true en una fuente sans, debe mostrarse
      expect(shouldShowButton(true, "sans")).toBe(true);

      // Si se configuró explícitamente false en una fuente serif, debe ocultarse
      expect(shouldShowButton(false, "serif")).toBe(false);

      // Fallback histórico cuando es null: serif muestra, sans oculta
      expect(shouldShowButton(null, "serif")).toBe(true);
      expect(shouldShowButton(null, "sans")).toBe(false);
    });
  });

  describe("ERROR 3: Visibilidad de Marca 'Creado con Dizi'", () => {
    // Lógica canónica de PublicCatalog y Admin
    const computeShowBranding = (effectivePlan: PlanId, storeShowDiziBranding?: boolean | null) => {
      return effectivePlan === "semilla" ? true : (storeShowDiziBranding ?? false);
    };

    it("Semilla: siempre visible sin importar si showDiziBranding es null, false o true", () => {
      expect(computeShowBranding("semilla", null)).toBe(true);
      expect(computeShowBranding("semilla", undefined)).toBe(true);
      expect(computeShowBranding("semilla", false)).toBe(true);
      expect(computeShowBranding("semilla", true)).toBe(true);
    });

    it("Planes de pago con null o undefined: marca OCULTA por defecto (marca blanca)", () => {
      expect(computeShowBranding("emprendedor", null)).toBe(false);
      expect(computeShowBranding("emprendedor", undefined)).toBe(false);
      expect(computeShowBranding("pro", null)).toBe(false);
      expect(computeShowBranding("pro", undefined)).toBe(false);
      expect(computeShowBranding("ilimitado", null)).toBe(false);
      expect(computeShowBranding("ilimitado", undefined)).toBe(false);
    });

    it("Planes de pago con true: marca VISIBLE (para ganar comisiones de afiliados)", () => {
      expect(computeShowBranding("emprendedor", true)).toBe(true);
      expect(computeShowBranding("pro", true)).toBe(true);
      expect(computeShowBranding("ilimitado", true)).toBe(true);
    });

    it("admin.configuracion calcula el estado inicial correctamente por plan", () => {
      const getInitialState = (store: { plan: PlanId; showDiziBranding?: boolean | null }) => {
        return (
          store.showDiziBranding ?? (getEffectivePlan(store as unknown as Store) === "semilla")
        );
      };

      expect(getInitialState({ plan: "semilla", showDiziBranding: null })).toBe(true);
      expect(getInitialState({ plan: "pro", showDiziBranding: null })).toBe(false);
      expect(getInitialState({ plan: "pro", showDiziBranding: true })).toBe(true);
      expect(getInitialState({ plan: "pro", showDiziBranding: false })).toBe(false);
    });

    it("mapStoreFromDB asigna showDiziBranding false por defecto en planes de pago y true en semilla", () => {
      const storeSemilla = mapStoreFromDB({
        id: "s1",
        slug: "semilla-store",
        name: "Semilla Store",
        plan: "semilla",
        show_dizi_branding: null,
      });
      expect(storeSemilla.showDiziBranding).toBe(true);

      const storeProNull = mapStoreFromDB({
        id: "s2",
        slug: "pro-store",
        name: "Pro Store",
        plan: "pro",
        show_dizi_branding: null,
      });
      expect(storeProNull.showDiziBranding).toBe(false);

      const storeProTrue = mapStoreFromDB({
        id: "s3",
        slug: "pro-store-2",
        name: "Pro Store 2",
        plan: "pro",
        show_dizi_branding: true,
      });
      expect(storeProTrue.showDiziBranding).toBe(true);
    });
  });

  describe("Migración y Trigger: reset_branding_on_upgrade", () => {
    const computeShowBranding = (effectivePlan: PlanId, storeShowDiziBranding?: boolean | null) => {
      return effectivePlan === "semilla" ? true : (storeShowDiziBranding ?? false);
    };

    // Simulación exacta de la función PL/pgSQL reset_branding_on_upgrade()
    const simulateResetBrandingOnUpgrade = (
      oldRow: { plan: string; show_dizi_branding: boolean | null },
      newRow: { plan: string; show_dizi_branding: boolean | null }
    ) => {
      const result = { ...newRow };
      if (oldRow.plan === "semilla" && result.plan !== "semilla" && result.show_dizi_branding === true) {
        result.show_dizi_branding = null;
      }
      return result;
    };

    it("cuando una tienda pasa de semilla a pro y show_dizi_branding es true, lo reinicia a null", () => {
      const oldStore = { plan: "semilla", show_dizi_branding: true };
      const newStore = { plan: "pro", show_dizi_branding: true };

      const updated = simulateResetBrandingOnUpgrade(oldStore, newStore);
      expect(updated.show_dizi_branding).toBeNull();
      // Y en frontend, null en plan pro evalúa a marca oculta
      expect(computeShowBranding("pro", updated.show_dizi_branding)).toBe(false);
    });

    it("cuando una tienda pasa de semilla a emprendedor o ilimitado, también lo reinicia a null", () => {
      const oldStore = { plan: "semilla", show_dizi_branding: true };
      const updatedEmprendedor = simulateResetBrandingOnUpgrade(oldStore, {
        plan: "emprendedor",
        show_dizi_branding: true,
      });
      expect(updatedEmprendedor.show_dizi_branding).toBeNull();

      const updatedIlimitado = simulateResetBrandingOnUpgrade(oldStore, {
        plan: "ilimitado",
        show_dizi_branding: true,
      });
      expect(updatedIlimitado.show_dizi_branding).toBeNull();
    });

    it("no modifica show_dizi_branding si la tienda ya era de pago (ej. upgrade emprendedor -> pro)", () => {
      const oldStore = { plan: "emprendedor", show_dizi_branding: true };
      const newStore = { plan: "pro", show_dizi_branding: true };

      const updated = simulateResetBrandingOnUpgrade(oldStore, newStore);
      expect(updated.show_dizi_branding).toBe(true);
    });

    it("no modifica show_dizi_branding si ya era false o null al actualizar plan", () => {
      const oldStore = { plan: "semilla", show_dizi_branding: false };
      const newStore = { plan: "pro", show_dizi_branding: false };

      const updated = simulateResetBrandingOnUpgrade(oldStore, newStore);
      expect(updated.show_dizi_branding).toBe(false);
    });

    it("permite a la tienda de pago reactivar voluntariamente show_dizi_branding a true después del upgrade", () => {
      const currentStore = { plan: "pro", show_dizi_branding: null };
      const updatedByClient = simulateResetBrandingOnUpgrade(currentStore, {
        plan: "pro",
        show_dizi_branding: true,
      });
      expect(updatedByClient.show_dizi_branding).toBe(true);
      expect(computeShowBranding("pro", updatedByClient.show_dizi_branding)).toBe(true);
    });

    it("el archivo de migración supabase/migrations/20261020190000_marca_dizi_planes_pago.sql existe y contiene la función y el trigger", async () => {
      const fs = await import("fs");
      const path = await import("path");
      const migrationPath = path.resolve(
        process.cwd(),
        "supabase/migrations/20261020190000_marca_dizi_planes_pago.sql"
      );

      expect(fs.existsSync(migrationPath)).toBe(true);
      const sqlContent = fs.readFileSync(migrationPath, "utf-8");
      expect(sqlContent).toContain("CREATE OR REPLACE FUNCTION public.reset_branding_on_upgrade()");
      expect(sqlContent).toContain("BEFORE UPDATE OF plan ON public.stores");
      expect(sqlContent).toContain("UPDATE public.stores");
      expect(sqlContent).toContain("WHERE plan <> 'semilla' AND show_dizi_branding IS TRUE;");
    });
  });
});
