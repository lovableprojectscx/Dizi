import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Store, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { signInWithEmail, getUserRole } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [{ title: "Iniciar Sesion — Dizi" }],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const setCurrentStore = useApp((s) => s.setCurrentStore);
  const fetchData = useApp((s) => s.fetchData);
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

      // Super admins deben entrar por /super/login
      if (role === "super_admin") {
        toast.info("Eres Super Admin. Redirigiendo a tu panel.");
        navigate({ to: "/super/dashboard" });
        return;
      }

      // Buscar la tienda asociada a este usuario
      const { data: stores } = await supabase
        .from("stores")
        .select("id")
        .eq("owner_id", user.id)
        .limit(1);

      if (stores && stores.length > 0) {
        setCurrentStore(stores[0].id);
        await fetchData();
        navigate({ to: "/admin" });
      } else {
        // Usuario autenticado pero sin tienda — redirigir al registro
        toast.info("No tienes una tienda creada aun. Completa el registro.");
        navigate({ to: "/register" });
      }
    } catch (err: any) {
      const msg = err?.message ?? "Error al iniciar sesion.";
      if (msg.includes("Invalid login credentials")) {
        toast.error("Correo o contrasena incorrectos.");
      } else if (msg.includes("Email not confirmed")) {
        toast.error("Debes confirmar tu correo antes de ingresar. Revisa tu bandeja.");
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <div className="p-4">
        <Button variant="ghost" asChild className="gap-2">
          <Link to="/">
            <ArrowLeft className="w-4 h-4" /> Volver al inicio
          </Link>
        </Button>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-background rounded-3xl border shadow-xl p-8 relative overflow-hidden">

          <div className="text-center mb-8 relative">
            <img src="/images/Icono.png" alt="Dizi Icon" className="mx-auto h-16 w-16 object-contain mb-4" />
            <h1 className="text-2xl font-bold tracking-tight">Bienvenido de nuevo</h1>
            <p className="text-muted-foreground text-sm mt-2">
              Ingresa a tu panel de control y gestiona tu catalogo
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 relative">
            <div className="space-y-2">
              <label className="text-sm font-medium">Correo Electronico</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex h-12 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="tu@correo.com"
                required
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Contrasena</label>
                <a href="#" className="text-xs text-primary hover:underline">Olvide mi contrasena</a>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex h-12 w-full rounded-xl border border-input bg-transparent pl-3 pr-10 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-12 text-base mt-2" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Ingresando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Ingresar al Panel <Store className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            No tienes una cuenta?{" "}
            <Link to="/register" className="text-primary font-medium hover:underline">
              Crea tu tienda gratis
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
