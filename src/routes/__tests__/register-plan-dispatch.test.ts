import { describe, it, expect, vi, beforeEach } from "vitest";
import { useApp } from "@/lib/store";
import type { PlanId } from "@/lib/types";

// Mock Supabase RPC para initialize_store
vi.mock("@/lib/supabase", () => ({
  supabase: {
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })),
      insert: vi.fn().mockResolvedValue({ error: null }),
      select: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      })),
    })),
  },
  invokeRpcWithRetry: vi.fn().mockResolvedValue({ data: null, error: null }),
}));

describe("G9/Registro: plan vs requestedPlan en creación de tienda", () => {
  beforeEach(() => {
    useApp.setState({ stores: [], currentStoreId: null });
    vi.clearAllMocks();
  });

  it("Registro con ?plan=pro (sin invitación): el panel muestra Semilla de inmediato sin recargar", async () => {
    const invitePlan: PlanId | null = null;
    const requestedPlan: PlanId = "pro";

    // Simula la llamada en register.tsx:1028-1038
    await useApp.getState().addStore({
      id: "store_test_pro",
      slug: "tienda-pro-test",
      name: "Tienda Pro Test",
      phone: "987654321",
      countryCode: "51",
      countryIso: "PE",
      plan: invitePlan ?? "semilla", // debe ser 'semilla'
      requestedPlan: requestedPlan && requestedPlan !== "semilla" ? requestedPlan : undefined,
      termsAcceptedAt: new Date().toISOString(),
      active: true,
      isPublished: true,
      createdAt: "2026-09-30",
      whatsappClicks: 0,
      model: "simple" as any,
      categories: [{ id: "cat_1", name: "Principal" }],
      products: [],
    });

    const store = useApp.getState().stores.find((s) => s.id === "store_test_pro");
    expect(store).toBeDefined();
    // El plan activo en el panel es SEMILLA
    expect(store?.plan).toBe("semilla");
    // El plan solicitado para seguimiento en super-admin es PRO
    expect(store?.requestedPlan).toBe("pro");
  });

  it("Registro con ?invite=(emprendedor) + ?plan=pro: el panel muestra Emprendedor", async () => {
    const invitePlan: PlanId | null = "emprendedor";
    const requestedPlan: PlanId = "pro";

    // Simula la llamada en register.tsx:1028-1038
    await useApp.getState().addStore({
      id: "store_test_invite",
      slug: "tienda-invite-test",
      name: "Tienda Invite Test",
      phone: "987654321",
      countryCode: "51",
      countryIso: "PE",
      plan: invitePlan ?? "semilla", // debe ser 'emprendedor' por la invitación
      requestedPlan: requestedPlan && requestedPlan !== "semilla" ? requestedPlan : undefined,
      termsAcceptedAt: new Date().toISOString(),
      active: true,
      isPublished: true,
      createdAt: "2026-09-30",
      whatsappClicks: 0,
      model: "simple" as any,
      categories: [{ id: "cat_2", name: "Principal" }],
      products: [],
    });

    const store = useApp.getState().stores.find((s) => s.id === "store_test_invite");
    expect(store).toBeDefined();
    // El plan activo en el panel es EMPRENDEDOR (otorgado por la invitación)
    expect(store?.plan).toBe("emprendedor");
    // El plan solicitado sigue siendo PRO
    expect(store?.requestedPlan).toBe("pro");
  });
});
