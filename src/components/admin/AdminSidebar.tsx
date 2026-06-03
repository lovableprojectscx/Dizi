import { Link, useRouterState } from "@tanstack/react-router";
import { signOut } from "@/lib/auth";
import { useApp } from "@/lib/store";
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
import { Home, Package, Settings, Star, Palette, LogOut, ClipboardList, Link2, Sparkles } from "lucide-react";

export function AdminSidebar() {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const storeId = useApp((s) => s.currentStoreId);
  const store = useApp((s) => s.stores.find((st) => st.id === storeId));

  const section1 = [
    { title: "Inicio", url: "/admin/dashboard", icon: Home },
    { title: "Productos", url: "/admin/productos", icon: Package },
  ];

  const section2 = [
    { title: "Link en Bio", url: "/admin/link-bio", icon: Link2 },
    { title: "Diseño Estándar", url: "/admin/diseno", icon: Palette },
    { title: "Diseño Premium", url: "/admin/diseno-premium", icon: Sparkles },
  ];

  const section3 = [
    { title: "Configuración", url: "/admin/configuracion", icon: Settings },
    ...(store?.libroReclamacionesActivo
      ? [{ title: "Reclamaciones", url: "/admin/reclamaciones", icon: ClipboardList }]
      : []),
    { title: "Mi Plan", url: "/admin/plan", icon: Star },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link to="/admin/dashboard" className="flex items-center px-2 py-2">
          <img src="/images/Logo.png" alt="Dizi" className="h-8 w-auto object-contain" />
        </Link>
      </SidebarHeader>
      
      <SidebarContent>
        {/* Grupo 1: Mi Tienda */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/75">Mi tienda</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {section1.map((it) => {
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
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Grupo 2: Canales y Apariencia */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/75">Canales y Apariencia</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {section2.map((it) => {
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
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Grupo 3: Ajustes y Cuenta */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/75">Ajustes y Cuenta</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {section3.map((it) => {
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
              
              {/* Cerrar Sesión */}
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={async () => {
                    await signOut();
                    window.location.href = "/login";
                  }}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Cerrar Sesión</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
