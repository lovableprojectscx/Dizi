import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Eye, EyeOff, Lock } from "lucide-react";
import { toast } from "sonner";
import { signInWithEmail, getUserRole } from "@/lib/auth";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/super/login")({
  head: () => ({
    meta: [{ title: "Acceso Super Admin — Dizi" }],
  }),
  component: SuperLoginPage,
});

function SuperLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { user } = await signInWithEmail(email.trim().toLowerCase(), password);
      const role = getUserRole(user);

      if (role !== "super_admin") {
        // Signed in but not a super admin — deny access
        await import("@/lib/auth").then(m => m.signOut());
        toast.error("Acceso denegado. No tienes permisos de Super Admin.");
        setLoading(false);
        return;
      }

      // Fetch fresh data for the super admin
      await useApp.getState().fetchData();

      navigate({ to: "/super/dashboard" });
    } catch (err: any) {
      const msg = err?.message ?? "Error al iniciar sesion.";
      if (msg.includes("Invalid login credentials")) {
        toast.error("Credenciales incorrectas. Verifica tu correo y contrasena.");
      } else {
        toast.error(msg);
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-foreground text-background flex items-center justify-center mb-4 shadow-lg">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Acceso Restringido</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Panel de control exclusivo — Dizi Super Admin
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-card border rounded-2xl p-6 shadow-sm">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Correo</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex h-11 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                placeholder="superadmin@dizi.pe"
                required
                autoComplete="username"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Contrasena</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex h-11 w-full rounded-xl border border-input bg-transparent px-3 pr-10 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                  placeholder="••••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-11 mt-2" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Verificando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Ingresar al Panel
                </span>
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Acceso exclusivo para el equipo Dizi / IDENZA
        </p>
      </div>
    </div>
  );
}
