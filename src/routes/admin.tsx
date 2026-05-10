import { createFileRoute, Outlet, Link, redirect, useNavigate } from "@tanstack/react-router";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { LogOut, Eye } from "lucide-react";
import { getActiveSession, signOut } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  beforeLoad: async () => {
    const session = await getActiveSession();
    if (!session) {
      throw redirect({ to: "/login" });
    }
  },
  component: AdminLayout,
});

function AdminLayout() {
  const storeId = useApp((s) => s.currentStoreId);
  const stores = useApp((s) => s.stores);
  const impersonating = useApp((s) => s.impersonatedBy);
  const stop = useApp((s) => s.stopImpersonation);
  const setStore = useApp((s) => s.setCurrentStore);
  const store = stores.find((s) => s.id === storeId) ?? stores[0];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {impersonating && (
            <div className="bg-amber-100 text-amber-900 text-sm px-4 py-2 flex items-center justify-between">
              <span className="inline-flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Viendo como <strong>{store?.name}</strong> (modo soporte)
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  stop();
                }}
                asChild
              >
                <Link to="/super/tiendas">
                  <LogOut className="h-3 w-3 mr-1" />
                  Salir
                </Link>
              </Button>
            </div>
          )}
          <header className="h-14 border-b flex items-center px-3 gap-3 bg-card sticky top-0 z-20">
            <SidebarTrigger />
            <div className="flex-1" />
            {/* Selector de tienda eliminado por petición del usuario */}
          </header>
          <main className="flex-1 p-4 md:p-6 bg-background">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

// Index redirect for /admin -> /admin/dashboard
export const _redirectFromAdmin = redirect; // unused, just to avoid tree-shake issues
