import {
  createFileRoute,
  Outlet,
  Link,
  redirect,
  useRouterState,
  useRouter,
} from "@tanstack/react-router";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  Eye,
  Home,
  Package,
  Tag,
  Settings,
  ClipboardList,
  Link2,
  AlertTriangle,
} from "lucide-react";
import { getActiveSession, getSessionSync, signOut } from "@/lib/auth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { OnboardingWizard } from "@/components/admin/OnboardingWizard";

export const Route = createFileRoute("/admin")({
  beforeLoad: async () => {
    try {
      const session = await getActiveSession();
      if (!session) {
        throw redirect({ to: "/login" });
      }
    } catch (err) {
      // Si el error es una redirección intencional de TanStack Router, lo relanzamos
      if (err && typeof err === "object" && "to" in err) {
        throw err;
      }
      console.warn(
        "[admin beforeLoad] Falló la verificación de sesión en red, usando almacenamiento local:",
        err,
      );
      const session = getSessionSync();
      if (!session) {
        throw redirect({ to: "/login" });
      }
    }
  },
  component: AdminLayout,
});

function AdminLayout() {
  const storeId = useApp((s) => s.currentStoreId);
  const stores = useApp((s) => s.stores);
  const fetchError = useApp((s) => s.fetchError);
  const impersonating = useApp((s) => s.impersonatedBy);
  const stop = useApp((s) => s.stopImpersonation);
  const setStore = useApp((s) => s.setCurrentStore);
  const router = useRouter();

  if (stores.length === 0) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background p-4 text-center">
        <div className="flex flex-col items-center gap-4 max-w-md">
          {fetchError ? (
            <>
              <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                  />
                </svg>
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-bold">Error de Conexión</h2>
                <p className="text-sm text-muted-foreground leading-normal">
                  No se pudo conectar con el servidor. Si estás usando Wi-Fi de Movistar o Claro,
                  intenta desactivándolo y navegando con tus datos móviles (4G/5G).
                </p>
              </div>
              <Button
                onClick={() => {
                  router.invalidate();
                }}
                className="mt-2 font-bold h-10 px-6"
              >
                Reintentar
              </Button>
            </>
          ) : (
            <>
              <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <div className="space-y-1">
                <h2 className="text-xl font-bold">Cargando panel...</h2>
                <p className="text-sm text-muted-foreground">Estamos preparando tu catalogo</p>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  const store = stores.find((s) => s.id === storeId) ?? stores[0];

  if (stores.length > 0 && !storeId) {
    setStore(stores[0].id);
  }

  return (
    <SidebarProvider>
      <OnboardingWizard />
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {impersonating && (
            <div className="bg-amber-100 text-amber-900 text-xs sm:text-sm px-3 sm:px-4 py-2 flex items-center justify-between gap-2 shadow-sm relative z-30">
              <span className="flex items-center gap-1.5 sm:gap-2 leading-tight flex-1 min-w-0">
                <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                <span className="line-clamp-2 sm:truncate">
                  Viendo como <strong className="font-bold">{store?.name}</strong>{" "}
                  <span className="opacity-75 whitespace-nowrap">(modo soporte)</span>
                </span>
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  stop();
                }}
                asChild
                className="h-7 sm:h-8 px-2 sm:px-3 text-xs shrink-0 border-amber-300 hover:bg-amber-200 hover:text-amber-900 bg-amber-50"
              >
                <Link to="/super/tiendas">
                  <LogOut className="h-3 w-3 sm:mr-1.5" />
                  <span className="hidden sm:inline">Salir</span>
                  <span className="sm:hidden ml-1">Salir</span>
                </Link>
              </Button>
            </div>
          )}
          {store && !store.active && (
            <div className="bg-red-50 text-red-900 border-b border-red-200 text-xs sm:text-sm px-3 sm:px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm relative z-30">
              <span className="flex items-start gap-2 leading-tight flex-1">
                <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold text-red-800">
                    Tu catálogo digital está actualmente suspendido
                  </p>
                  <p className="text-xs text-red-700">
                    Tu tienda ha sido pausada temporalmente debido a inactividad en tu plan Semilla.
                    Tu enlace original ha sido liberado, y actualmente tu catálogo está accesible
                    bajo el enlace de soporte temporal <code>/t/{store.slug}</code>.
                  </p>
                </div>
              </span>
              <Button
                size="sm"
                variant="destructive"
                asChild
                className="h-8 font-bold text-xs shrink-0 bg-red-600 hover:bg-red-700 text-white self-start sm:self-center"
              >
                <a
                  href={`https://wa.me/51925176472?text=${encodeURIComponent(`Hola Dizi, mi catálogo de la tienda "${store.name}" fue suspendido por inactividad. Quisiera reactivarlo.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Contactar a Soporte
                </a>
              </Button>
            </div>
          )}
          <header className="h-14 border-b flex items-center px-3 gap-3 bg-card sticky top-0 z-20">
            <SidebarTrigger />
            <div className="flex-1" />
          </header>
          <main className="flex-1 p-4 md:p-6 bg-background pb-20 md:pb-6">
            <Outlet />
          </main>

          {/* Bottom Nav para movil */}
          <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t flex items-center justify-around px-2 z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
            <MobileNavItem to="/admin/dashboard" icon={Home} label="Inicio" />
            <MobileNavItem to="/admin/productos" icon={Package} label="Productos" />
            <MobileNavItem to="/admin/link-bio" icon={Link2} label="Bio-Link" />
            {store?.libroReclamacionesActivo && (
              <MobileNavItem to="/admin/reclamaciones" icon={ClipboardList} label="Reclamos" />
            )}
            <MobileNavItem to="/admin/configuracion" icon={Settings} label="Ajustes" />
          </nav>
        </div>
      </div>
    </SidebarProvider>
  );
}

function MobileNavItem({ to, icon: Icon, label }: { to: string; icon: any; label: string }) {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const active = path === to || (to !== "/admin/dashboard" && path.startsWith(to));

  return (
    <Link
      to={to}
      className={cn(
        "relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors",
        active ? "text-primary" : "text-muted-foreground",
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center h-8 w-14 rounded-full transition-all duration-200",
          active ? "bg-primary/10" : "",
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <span className={cn("text-[10px] font-medium", active ? "font-bold" : "")}>{label}</span>
    </Link>
  );
}

export const _redirectFromAdmin = redirect;
