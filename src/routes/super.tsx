import { createFileRoute, Outlet, Link, redirect, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { LayoutDashboard, Store as StoreIcon, ShieldCheck, LogOut } from "lucide-react";
import { getActiveSession, getUserRole, signOut } from "@/lib/auth";

export const Route = createFileRoute("/super")({
  beforeLoad: async ({ location }) => {
    // Permitir acceso a la página de login sin estar autenticado
    if (location.pathname === "/super/login") return;

    const session = await getActiveSession();
    const role = getUserRole(session?.user ?? null);
    if (!session || role !== "super_admin") {
      throw redirect({ to: "/super/login" });
    }
  },
  component: SuperLayout,
});

const items = [
  { title: "Dashboard", url: "/super/dashboard", icon: LayoutDashboard },
  { title: "Tiendas", url: "/super/tiendas", icon: StoreIcon },
];

function SuperLayout() {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/super/login" });
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <Link to="/super/dashboard" className="flex items-center gap-2 px-2 py-2">
              <div className="h-8 w-8 rounded-lg bg-foreground text-background flex items-center justify-center shrink-0">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <span className="font-semibold">Dizi Admin</span>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Control</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((it) => (
                    <SidebarMenuItem key={it.url}>
                      <SidebarMenuButton asChild isActive={path === it.url}>
                        <Link to={it.url}>
                          <it.icon className="h-4 w-4" />
                          <span>{it.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                  {/* Logout */}
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={handleLogout} className="text-destructive hover:text-destructive">
                      <LogOut className="h-4 w-4" />
                      <span>Cerrar Sesion</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b flex items-center justify-between px-3 gap-3 bg-card sticky top-0 z-20">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <span className="text-sm text-muted-foreground">Panel Dizi — Super Admin</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </header>
          <main className="flex-1 p-4 md:p-6 bg-background">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export const _r = redirect;

