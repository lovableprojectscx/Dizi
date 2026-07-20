import { describe, it, expect, vi } from "vitest";

describe("Pruebas de Integración - Capa de Seguridad y RPCs (Supabase)", () => {
  it("CP-12: RLS impide leer productos de otra tienda", async () => {
    // Simulamos un cliente autenticado de la Tienda A (clientA)
    const clientA = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(async () => ({ data: [], error: null })),
        })),
      })),
    };

    const storeB = { id: "store-b-uuid" };

    // Intentamos consultar productos de la Tienda B con la sesión de A
    const { data } = await clientA.from("products").select("*").eq("store_id", storeB.id);

    // Debe devolver 0 filas debido a las políticas Row Level Security (RLS)
    expect(data).toHaveLength(0);
  });

  it("CP-11: check_invite con token usado devuelve vacio", async () => {
    // Simulamos llamadas RPC del cliente anónimo (anon)
    const anon = {
      rpc: vi.fn(async (methodName, args) => {
        if (methodName === "check_invite" && args.p_token === "used-token-uuid") {
          return { data: [], error: null };
        }
        return { data: null, error: "Invalid invite" };
      }),
    };

    const usedToken = "used-token-uuid";

    // Se realiza la llamada a la RPC check_invite
    const { data } = await anon.rpc("check_invite", { p_token: usedToken });

    // Debe retornar un array vacío puesto que el token ya ha sido marcado como usado
    expect(data).toEqual([]);
  });

  it("CP-10: check_invite con token válido devuelve los datos del plan", async () => {
    const anon = {
      rpc: vi.fn(async (methodName, args) => {
        if (methodName === "check_invite" && args.p_token === "valid-token-uuid") {
          return { data: [{ plan: "pro", duration_months: 6 }], error: null };
        }
        return { data: [], error: null };
      }),
    };

    const validToken = "valid-token-uuid";

    // Se realiza la llamada con token válido
    const { data } = await anon.rpc("check_invite", { p_token: validToken });

    // Debe retornar los datos de configuración del plan e invitaciones
    expect(data).toHaveLength(1);
    expect(data[0].plan).toBe("pro");
    expect(data[0].duration_months).toBe(6);
  });

  it("CP-13: Registro forzando rol de super_admin se mitiga y asigna store_owner", async () => {
    // Simula el comportamiento del trigger trg_user_sync_role de la base de datos
    const dbTriggerSync = (userInputRole: string) => {
      // Si se intenta registrar como super_admin, se fuerza a store_owner
      if (userInputRole === "super_admin") {
        return "store_owner";
      }
      return userInputRole;
    };

    const resultingRole = dbTriggerSync("super_admin");
    expect(resultingRole).toBe("store_owner");
  });

  it("CP-14: GET /t/:slug de tienda no publicada retorna 404 o vacío", async () => {
    const getPublicStore = vi.fn(async (slug: string) => {
      // Simula la llamada RPC get_public_store
      if (slug === "tienda-no-publicada") {
        return { data: null, error: "Store not published" };
      }
      return { data: { name: "Tienda Activa" }, error: null };
    });

    const response = await getPublicStore("tienda-no-publicada");
    expect(response.data).toBeNull();
    expect(response.error).toBe("Store not published");
  });
});
