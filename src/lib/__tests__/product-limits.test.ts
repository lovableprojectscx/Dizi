import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import {
  PLANS,
  GRACE_DAYS,
  getEffectivePlan,
  getEffectiveProductLimit,
  type Store,
} from "../types";

describe("C3: Sincronización de Límites de Productos entre TypeScript y SQL", () => {
  it("Valores en types.ts coinciden con la especificación de negocio oficial", () => {
    expect(PLANS.semilla.productLimit).toBe(20);
    expect(PLANS.emprendedor.productLimit).toBe(100);
    expect(PLANS.pro.productLimit).toBe(300);
    expect(PLANS.ilimitado.productLimit).toBe(1000);
    expect(GRACE_DAYS).toBe(3);
  });

  it("La función SQL 'effective_product_limit' en la migración Fase 1C replica exactamente los límites de PLANS y GRACE_DAYS", () => {
    const migrationPath = path.resolve(
      __dirname,
      "../../../../supabase/migrations/20260929160000_fase1c_blindaje.sql"
    );

    // Fallback relativo si la estructura de carpetas difiere
    const finalPath = fs.existsSync(migrationPath)
      ? migrationPath
      : path.resolve(process.cwd(), "supabase/migrations/20260929160000_fase1c_blindaje.sql");

    expect(fs.existsSync(finalPath)).toBe(true);
    const sqlContent = fs.readFileSync(finalPath, "utf-8");

    // Verificar días de gracia en SQL
    expect(sqlContent).toContain(`interval '${GRACE_DAYS} days'`);

    // Verificar topes por cada plan en la función SQL
    expect(sqlContent).toMatch(new RegExp(`WHEN 'ilimitado' THEN ${PLANS.ilimitado.productLimit}`));
    expect(sqlContent).toMatch(new RegExp(`WHEN 'pro' THEN ${PLANS.pro.productLimit}`));
    expect(sqlContent).toMatch(new RegExp(`WHEN 'emprendedor' THEN ${PLANS.emprendedor.productLimit}`));
    expect(sqlContent).toMatch(new RegExp(`v_plan = 'semilla' THEN\\s+RETURN ${PLANS.semilla.productLimit}`));
  });

  it("getEffectivePlan y getEffectiveProductLimit degradan a semilla solo tras superar GRACE_DAYS", () => {
    const now = Date.now();
    const baseStore: Store = {
      id: "s_test",
      slug: "test-limits",
      name: "Test Limits Store",
      phone: "912345678",
      countryCode: "51",
      countryIso: "PE",
      plan: "pro",
      planExpiresAt: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(), // Venció hace 1 día (dentro de gracia <= 3)
      subscriptionStatus: "active",
      customPrice: null,
      planDurationMonths: 1,
      cancelledAt: null,
      cancelReason: null,
      views: 0,
      whatsappClicks: 0,
      showDiziBranding: true,
      model: "standard",
      niche: "general",
      brandColor: "#000",
      active: true,
      isPublished: true,
      categories: [],
      products: [],
      ownerId: "11111111-1111-1111-1111-111111111111",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Dentro de periodo de gracia: conserva 'pro' y 300 productos
    expect(getEffectivePlan(baseStore)).toBe("pro");
    expect(getEffectiveProductLimit(baseStore)).toBe(300);

    // Vencido hace 5 días (> GRACE_DAYS = 3): degrada a 'semilla' y 20 productos
    const expiredStore: Store = {
      ...baseStore,
      planExpiresAt: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(),
    };
    expect(getEffectivePlan(expiredStore)).toBe("semilla");
    expect(getEffectiveProductLimit(expiredStore)).toBe(20);
  });
});
