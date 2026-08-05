import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Store, Eye, EyeOff, KeyRound, Mail, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  signInWithEmail,
  getUserRole,
  getActiveSession,
  getSessionSync,
  resetPasswordForEmail,
  updateUserPassword,
} from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { useApp } from "@/lib/store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/login")({
  beforeLoad: async () => {
    try {
      const session = await getActiveSession();
      if (session) {
        const role = getUserRole(session.user);
        throw redirect({ to: role === "super_admin" ? "/super/dashboard" : "/admin" });
      }
    } catch (err) {
      if (err && typeof err === "object" && "to" in err) {
        throw err;
      }
      const session = getSessionSync();
      if (session) {
        const role = getUserRole(session.user);
        throw redirect({ to: role === "super_admin" ? "/super/dashboard" : "/admin" });
      }
    }
  },
  head: () => ({
    meta: [
      { title: "Iniciar Sesión — Dizi" },
      { name: "description", content: "Accede a tu panel de Dizi y gestiona tu catálogo digital." },
      { name: "robots", content: "noindex, follow" },
    ],
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

  // Modal: Solicitar Correo de Recuperación
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // Modal: Establecer Nueva Contraseña
  const [resetOpen, setResetOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    // Escuchar el evento de recuperación de contraseña de Supabase Auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setResetOpen(true);
      }
    });

    // Detectar si regresa con query reset=true o hash de recuperación
    if (typeof window !== "undefined") {
      if (window.location.search.includes("reset=true") || window.location.hash.includes("type=recovery")) {
        setResetOpen(true);
      }
    }

    return () => subscription.unsubscribe();
  }, []);

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
        toast.error("Correo o contraseña incorrectos.");
      } else if (msg.includes("Email not confirmed")) {
        toast.error("Debes confirmar tu correo antes de ingresar. Revisa tu bandeja.");
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      toast.error("Ingresa tu correo electrónico.");
      return;
    }

    setForgotLoading(true);
    try {
      await resetPasswordForEmail(forgotEmail.trim().toLowerCase());
      setForgotSuccess(true);
      toast.success("Te hemos enviado un correo con instrucciones para restablecer tu contraseña.");
    } catch (err: any) {
      toast.error(err?.message || "Ocurrió un error al enviar el enlace de recuperación.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setResetLoading(true);
    try {
      await updateUserPassword(newPassword);
      toast.success("Tu contraseña ha sido actualizada correctamente. Ahora puedes ingresar.");
      setResetOpen(false);
      setNewPassword("");
    } catch (err: any) {
      toast.error(err?.message || "No se pudo actualizar la contraseña.");
    } finally {
      setResetLoading(false);
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
            <img
              src="/images/Icono.png"
              alt="Dizi Icon"
              className="mx-auto h-16 w-16 object-contain mb-4"
            />
            <h1 className="text-2xl font-bold tracking-tight">Bienvenido de nuevo</h1>
            <p className="text-muted-foreground text-sm mt-2">
              Ingresa a tu panel de control y gestiona tu catálogo
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 relative">
            <div className="space-y-2">
              <label className="text-sm font-medium">Correo Electrónico</label>
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
                <label className="text-sm font-medium">Contraseña</label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email);
                    setForgotSuccess(false);
                    setForgotOpen(true);
                  }}
                  className="text-xs text-primary font-bold hover:underline cursor-pointer"
                >
                  Olvidé mi contraseña
                </button>
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

            <Button type="submit" className="w-full h-12 text-base mt-2 font-bold" disabled={loading}>
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
            ¿No tienes una cuenta?{" "}
            <Link to="/register" className="text-primary font-medium hover:underline">
              Crea tu tienda gratis
            </Link>
          </div>
        </div>
      </div>

      {/* ── Modal 1: Solicitar Recuperación de Contraseña ── */}
      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <KeyRound className="w-5 h-5 text-primary" />
              Recuperar Contraseña
            </DialogTitle>
            <DialogDescription>
              Ingresa el correo electrónico asociado a tu cuenta para recibir un enlace de recuperación.
            </DialogDescription>
          </DialogHeader>

          {forgotSuccess ? (
            <div className="py-6 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
              <p className="font-bold text-sm text-foreground">
                ¡Enlace enviado a tu bandeja!
              </p>
              <p className="text-xs text-muted-foreground">
                Revisa tu correo electrónico (incluyendo la carpeta de SPAM) y haz clic en el enlace para restablecer tu contraseña.
              </p>
              <Button onClick={() => setForgotOpen(false)} className="mt-4 w-full font-bold">
                Entendido
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSendResetEmail} className="space-y-4 py-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="flex h-11 w-full rounded-xl border border-input bg-transparent pl-10 pr-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                    placeholder="tu@correo.com"
                    required
                  />
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setForgotOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={forgotLoading} className="font-bold">
                  {forgotLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Enviando...
                    </span>
                  ) : (
                    "Enviar Enlace"
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Modal 2: Establecer Nueva Contraseña ── */}
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <KeyRound className="w-5 h-5 text-primary" />
              Crear Nueva Contraseña
            </DialogTitle>
            <DialogDescription>
              Ingresa tu nueva contraseña para actualizar el acceso a tu cuenta en Dizi.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdatePassword} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Nueva Contraseña</label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="flex h-11 w-full rounded-xl border border-input bg-transparent pl-3 pr-10 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setResetOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={resetLoading} className="font-bold">
                {resetLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Guardando...
                  </span>
                ) : (
                  "Guardar Nueva Contraseña"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
