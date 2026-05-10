import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { signOut } from "@/lib/auth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Home, Package, Tag, Settings, Star, Palette, LogOut } from "lucide-react";

const items = [
  { title: "Inicio", url: "/admin/dashboard", icon: Home },
  { title: "Productos", url: "/admin/productos", icon: Package },
  { title: "Categorías", url: "/admin/categorias", icon: Tag },
  { title: "Diseño", url: "/admin/diseno", icon: Palette },
  { title: "Configuración", url: "/admin/configuracion", icon: Settings },
  { title: "Mi Plan", url: "/admin/plan", icon: Star },
];

export function AdminSidebar() {
  const path = useRouterState({ select: (r) => r.location.pathname });
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link to="/admin/dashboard" className="flex items-center px-2 py-2">
          <img src="/images/Logo.png" alt="Dizi" className="h-8 w-auto object-contain" />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Mi tienda</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((it) => {
                const active = path === it.url;
                return (
                  <SidebarMenuItem key={it.url}>
                    <SidebarMenuButton asChild isActive={active}>
                      <Link to={it.url} className="flex items-center gap-2">
                        <it.icon className="h-4 w-4" />
                        <span>{it.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
              {/* Logout */}
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={async () => {
                    await signOut();
                    window.location.href = "/login";
                  }}
                  className="text-destructive hover:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Cerrar Sesion</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
