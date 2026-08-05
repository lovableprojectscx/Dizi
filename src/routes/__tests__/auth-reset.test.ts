import { describe, it, expect, vi } from "vitest";
import { resetPasswordForEmail, updateUserPassword } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

// Mock Supabase Auth methods
vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
    },
  },
}));

describe("Pruebas Unitarias del Flujo de Restablecimiento de Contraseña (Auth)", () => {
  it("debe solicitar el correo de recuperación de contraseña con la URL de redirección a /login?reset=true", async () => {
    const mockReset = vi.spyOn(supabase.auth, "resetPasswordForEmail").mockResolvedValue({
      data: {},
      error: null,
    } as any);

    const email = "cliente@ejemplo.com";
    await resetPasswordForEmail(email);

    expect(mockReset).toHaveBeenCalledWith(email, {
      redirectTo: expect.stringContaining("/login?reset=true"),
    });
  });

  it("debe lanzar un error si la solicitud de correo de recuperación falla", async () => {
    vi.spyOn(supabase.auth, "resetPasswordForEmail").mockResolvedValue({
      data: null,
      error: { message: "Email not found" } as any,
    });

    await expect(resetPasswordForEmail("noexiste@ejemplo.com")).rejects.toThrow("Email not found");
  });

  it("debe actualizar la contraseña del usuario mediante updateUser", async () => {
    const mockUpdate = vi.spyOn(supabase.auth, "updateUser").mockResolvedValue({
      data: { user: { id: "user_123" } },
      error: null,
    } as any);

    const newPassword = "MiNuevaContrasena2026!";
    await updateUserPassword(newPassword);

    expect(mockUpdate).toHaveBeenCalledWith({ password: newPassword });
  });

  it("debe lanzar un error si la nueva contraseña no cumple con los requisitos del servidor", async () => {
    vi.spyOn(supabase.auth, "updateUser").mockResolvedValue({
      data: null,
      error: { message: "Password should be at least 6 characters" } as any,
    });

    await expect(updateUserPassword("123")).rejects.toThrow(
      "Password should be at least 6 characters",
    );
  });
});
