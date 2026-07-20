import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useApp } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Store as StoreIcon,
  UserPlus,
  Package,
  MousePointerClick,
  TrendingUp,
  Award,
  ArrowUpRight,
  ClipboardList,
  AlertTriangle,
  ChevronRight,
  LogIn,
  Layers,
  XCircle,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/super/dashboard")({
  component: SuperDashboard,
});

// Custom Tooltip component for Recharts that matches our premium look
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/95 backdrop-blur-md border border-border/60 rounded-xl p-3 shadow-xl text-xs">
        <p className="font-bold text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
        <div className="space-y-1">
          {payload.map((p: any, idx: number) => (
            <p key={idx} className="font-semibold flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: p.color || p.fill }}
                />
                {p.name}:
              </span>
              <span className="font-mono text-foreground font-bold">
                {p.value.toLocaleString()}
              </span>
            </p>
          ))}
        </div>
      </div>
    );
  }
  return null;
}

function SuperDashboard() {
  const stores = useApp((s) => s.stores);
  const toggleActive = useApp((s) => s.toggleStoreActive);
  const startImpersonation = useApp((s) => s.startImpersonation);
  const navigate = useNavigate();

  // Impersonate a store (Access client dashboard)
  const impersonate = (id: string) => {
    startImpersonation(id);
    navigate({ to: "/admin/dashboard" });
  };

  // --- 1. DATA CALCULATIONS ---

  // KPI Metrics
  const totalStores = stores.length;
  const activeStores = stores.filter((s) => s.active).length;
  const suspendedStores = totalStores - activeStores;
  const totalProducts = stores.reduce((a, s) => a + (s.products?.length || 0), 0);
  const totalClicks = stores.reduce((a, s) => a + (s.whatsappClicks || 0), 0);

  // Premium ratio
  const premiumStores = stores.filter((s) => s.plan !== "semilla" && s.active).length;
  const premiumRatioPercent =
    totalStores > 0 ? Math.round((premiumStores / activeStores) * 100) : 0;

  // Signups this month (using local timezone month to avoid early UTC resets)
  const now = new Date();
  const thisMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const newSignupsThisMonth = stores.filter((s) => s.createdAt?.startsWith(thisMonthStr)).length;

  // --- 2. CHART DATA PROCESSING ---

  // 2a. Growth Trend Chart
  const monthMap: Record<string, number> = {};
  stores.forEach((s) => {
    if (s.createdAt) {
      const month = s.createdAt.slice(0, 7); // Get "YYYY-MM"
      monthMap[month] = (monthMap[month] || 0) + 1;
    }
  });

  // Calculate cumulative sum and trend points
  let cumulative = 0;
  const trendData = Object.entries(monthMap)
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((item) => {
      cumulative += item.count;
      // Convert "2026-05" to "May 26" for cleaner labels
      const [year, monthNum] = item.month.split("-");
      const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
      const label = date.toLocaleDateString("es-ES", { month: "short", year: "2-digit" });

      return {
        key: item.month,
        mes: label,
        "Nuevos Registros": item.count,
        "Total Acumulado": cumulative,
      };
    });

  // 2b. Niche (Category) Distribution Chart
  const nicheMap: Record<string, number> = {};
  stores.forEach((s) => {
    const niche = s.niche || "general";
    nicheMap[niche] = (nicheMap[niche] || 0) + 1;
  });

  const nicheLabels: Record<string, string> = {
    general: "General",
    comida: "Comida",
    bisuteria: "Bisutería",
    ropa: "Moda & Ropa",
    tech: "Tecnología",
    servicios: "Servicios",
    floreria: "Florería",
  };

  const nicheColors: Record<string, string> = {
    general: "#64748b", // slate
    comida: "#f97316", // orange
    bisuteria: "#ec4899", // pink
    ropa: "#a855f7", // purple
    tech: "#06b6d4", // cyan
    servicios: "#3b82f6", // blue
    floreria: "#f43f5e", // rose
  };

  const nicheData = Object.entries(nicheMap)
    .map(([niche, count]) => ({
      niche: nicheLabels[niche] || niche,
      Cantidad: count,
      fill: nicheColors[niche] || "#64748b",
    }))
    .sort((a, b) => b["Cantidad"] - a["Cantidad"]);

  // 2c. Plan Distribution Data
  const planMap: Record<string, number> = {
    semilla: 0,
    emprendedor: 0,
    pro: 0,
    ilimitado: 0,
  };
  stores.forEach((s) => {
    if (planMap[s.plan] !== undefined) {
      planMap[s.plan]++;
    }
  });

  const planLabels: Record<string, string> = {
    semilla: "Gratis (Semilla)",
    emprendedor: "Emprendedor",
    pro: "Catálogo Pro",
    ilimitado: "Ilimitado",
  };

  const planColors: Record<string, string> = {
    semilla: "#94a3b8", // slate-400
    emprendedor: "#fbbf24", // amber-400
    pro: "#3b82f6", // blue-500
    ilimitado: "#10b981", // emerald-500
  };

  const planData = Object.entries(planMap)
    .map(([plan, value]) => ({
      name: planLabels[plan] || plan,
      value,
      fill: planColors[plan] || "#64748b",
    }))
    .filter((item) => item.value > 0);

  // 2d. Top Stores by WhatsApp Clicks (Interaction)
  const topClicksData = [...stores]
    .filter((s) => s.whatsappClicks > 0)
    .sort((a, b) => b.whatsappClicks - a.whatsappClicks)
    .slice(0, 5)
    .map((s) => ({
      name: s.name.length > 15 ? s.name.substring(0, 13) + "..." : s.name,
      Clicks: s.whatsappClicks,
    }))
    .reverse(); // Reverse for horizontal chart rendering (top at the bottom of the list renders at the top of the chart)

  // --- 3. TABLES PROCESSING ---

  // Latest 5 registrations
  const latestStores = [...stores]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  // Churn/Alert warnings (Cancelled, Expired, or Suspended stores)
  const churnAlerts = stores
    .filter(
      (s) =>
        !s.active || s.subscriptionStatus === "cancelled" || s.subscriptionStatus === "expired",
    )
    .sort((a, b) => {
      const dateA = a.cancelledAt || a.createdAt;
      const dateB = b.cancelledAt || b.createdAt;
      return dateB.localeCompare(dateA);
    })
    .slice(0, 5);

  // Claim book (libro de reclamaciones) status
  const storesWithLibro = stores.filter((s) => s.libroReclamacionesActivo).length;

  return (
    <div className="space-y-6 max-w-7xl animate-in fade-in duration-500">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent">
            Panel Analítico de Control
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Métricas de crecimiento, interacción y salud de la plataforma SaaS Dizi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild className="h-9">
            <Link to="/super/tiendas">
              <StoreIcon className="w-4 h-4 mr-1.5" />
              Ver Todas las Tiendas
            </Link>
          </Button>
        </div>
      </div>

      {/* ── KPI METRICS CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={<StoreIcon className="h-5 w-5 text-indigo-500" />}
          label="Tiendas Activas"
          value={activeStores}
          description={`De un total de ${totalStores} registradas`}
          trend={{ value: `${suspendedStores} suspendidas`, positive: false }}
        />
        <MetricCard
          icon={<UserPlus className="h-5 w-5 text-emerald-500" />}
          label="Registros de este Mes"
          value={newSignupsThisMonth}
          description="Nuevas tiendas en este mes local"
          trend={{ value: `+${newSignupsThisMonth} nuevas`, positive: true }}
        />
        <MetricCard
          icon={<MousePointerClick className="h-5 w-5 text-amber-500" />}
          label="Interacción (Clicks)"
          value={totalClicks.toLocaleString()}
          description="Clicks totales enviados a WhatsApp"
          trend={{
            value: `~${totalStores > 0 ? Math.round(totalClicks / totalStores) : 0} c/tienda`,
            positive: true,
          }}
        />
        <MetricCard
          icon={<Award className="h-5 w-5 text-violet-500" />}
          label="Tasa de Conversión Premium"
          value={`${premiumRatioPercent}%`}
          description={`${premiumStores} tiendas con suscripción activa`}
          trend={{ value: `${premiumStores} premium`, positive: true }}
        />
      </div>

      {/* ── CHARTS SECTION ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Growth Trend */}
        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-indigo-500" />
                  Crecimiento Histórico de Tiendas
                </CardTitle>
                <CardDescription className="text-xs">
                  Registro mensual y crecimiento acumulado.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-80 pt-4">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorCum" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e2e8f0"
                    opacity={0.5}
                  />
                  <XAxis
                    dataKey="mes"
                    tickLine={false}
                    axisLine={false}
                    className="text-[10px] text-muted-foreground"
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    className="text-[10px] text-muted-foreground"
                  />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="Nuevos Registros"
                    stroke="#4f46e5"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorCount)"
                  />
                  <Area
                    type="monotone"
                    dataKey="Total Acumulado"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorCum)"
                  />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    iconType="circle"
                    wrapperStyle={{ fontSize: "11px", paddingBottom: "10px" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChartState text="Sin datos históricos suficientes" />
            )}
          </CardContent>
        </Card>

        {/* Chart 2: Niche Distribution */}
        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader className="pb-2">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-500" />
                Tiendas por Nicho de Negocio
              </CardTitle>
              <CardDescription className="text-xs">
                Desglose según la categoría de negocio seleccionada.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="h-80 pt-4">
            {nicheData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={nicheData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e2e8f0"
                    opacity={0.5}
                  />
                  <XAxis
                    dataKey="niche"
                    tickLine={false}
                    axisLine={false}
                    className="text-[10px] text-muted-foreground"
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    className="text-[10px] text-muted-foreground"
                  />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Bar dataKey="Cantidad" radius={[4, 4, 0, 0]} maxBarSize={45}>
                    {nicheData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChartState text="Sin tiendas registradas" />
            )}
          </CardContent>
        </Card>

        {/* Chart 3: Plan Distribution (Pie) */}
        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader className="pb-2">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-1.5">
                <Award className="w-4 h-4 text-violet-500" />
                Distribución de Suscripciones
              </CardTitle>
              <CardDescription className="text-xs">
                Proporción de tiendas por tipo de plan activo.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="h-80 pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            {planData.length > 0 ? (
              <>
                <div className="w-full sm:w-1/2 h-56 relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={planData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {planData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <RechartsTooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Counter */}
                  <div className="absolute text-center flex flex-col">
                    <span className="text-2xl font-black">{activeStores}</span>
                    <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">
                      Activas
                    </span>
                  </div>
                </div>
                <div className="w-full sm:w-1/2 flex flex-col gap-2.5 text-xs px-2">
                  {planData.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between border-b pb-1"
                    >
                      <span className="flex items-center gap-2 font-medium text-muted-foreground">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: item.fill }}
                        />
                        {item.name}
                      </span>
                      <span className="font-bold font-mono">
                        {item.value}{" "}
                        <span className="text-muted-foreground/60 font-normal">
                          ({Math.round((item.value / totalStores) * 100)}%)
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <EmptyChartState text="Sin planes registrados" />
            )}
          </CardContent>
        </Card>

        {/* Chart 4: Top Stores by Clicks */}
        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader className="pb-2">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-1.5">
                <MousePointerClick className="w-4 h-4 text-amber-500" />
                Top 5 Tiendas más Activas
              </CardTitle>
              <CardDescription className="text-xs">
                Tiendas con mayor flujo de clicks/redirecciones a WhatsApp.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="h-80 pt-4">
            {topClicksData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topClicksData}
                  layout="vertical"
                  margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke="#e2e8f0"
                    opacity={0.5}
                  />
                  <XAxis
                    type="number"
                    tickLine={false}
                    axisLine={false}
                    className="text-[10px] text-muted-foreground"
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    className="text-[11px] font-semibold text-foreground"
                    width={90}
                  />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Bar dataKey="Clicks" fill="#f59e0b" radius={[0, 4, 4, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChartState text="No hay clics registrados en ninguna tienda aún" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── TABLES SECTION ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Table 1: Latest Signups */}
        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-1.5">
                  <UserPlus className="w-4.5 h-4.5 text-indigo-500" />
                  Últimos Registros
                </CardTitle>
                <CardDescription className="text-xs">
                  Las tiendas creadas recientemente en la plataforma.
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild className="h-8 text-xs">
                <Link to="/super/tiendas">
                  Ver todas <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-2 flex-1">
            <div className="overflow-x-auto border rounded-xl bg-card">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b bg-muted/40 text-muted-foreground font-semibold">
                    <th className="p-3">Tienda</th>
                    <th className="p-3">Plan</th>
                    <th className="p-3">Fecha</th>
                    <th className="p-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {latestStores.map((s) => (
                    <tr key={s.id} className="hover:bg-muted/10 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {s.logo ? (
                            <img
                              src={s.logo}
                              alt=""
                              className="h-6 w-6 rounded-full object-cover shrink-0 border"
                            />
                          ) : (
                            <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center font-bold text-[9px] text-secondary-foreground shrink-0">
                              {s.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold truncate max-w-[120px]">{s.name}</p>
                            <span className="text-[10px] text-muted-foreground uppercase">
                              {nicheLabels[s.niche || "general"]}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge
                          variant="outline"
                          className="text-[10px] py-0 px-1.5 capitalize font-medium"
                        >
                          {s.plan}
                        </Badge>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {new Date(s.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 hover:bg-primary/10 hover:text-primary"
                          onClick={() => impersonate(s.id)}
                          title="Acceder como cliente"
                        >
                          <LogIn className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Table 2: Churn & Alerts */}
        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col">
          <CardHeader className="pb-2">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4.5 h-4.5 text-rose-500" />
                Alertas de Churn y Suspensiones
              </CardTitle>
              <CardDescription className="text-xs">
                Negocios suspendidos, vencidos o planes cancelados.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-2 flex-1">
            <div className="overflow-x-auto border rounded-xl bg-card">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b bg-muted/40 text-muted-foreground font-semibold">
                    <th className="p-3">Tienda</th>
                    <th className="p-3">Estado</th>
                    <th className="p-3">Motivo / Feedback</th>
                    <th className="p-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {churnAlerts.map((s) => (
                    <tr key={s.id} className="hover:bg-muted/10 transition-colors">
                      <td className="p-3 font-semibold">{s.name}</td>
                      <td className="p-3">
                        {!s.active ? (
                          <Badge
                            variant="destructive"
                            className="text-[10px] py-0 px-1.5 font-bold"
                          >
                            Suspendida
                          </Badge>
                        ) : s.subscriptionStatus === "cancelled" ? (
                          <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px] py-0 px-1.5 font-bold">
                            Cancelado
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-[10px] py-0 px-1.5 text-rose-600 border-rose-200"
                          >
                            Expirado
                          </Badge>
                        )}
                      </td>
                      <td className="p-3 max-w-[150px] truncate text-muted-foreground italic">
                        {s.cancelReason || "Sin motivo ingresado"}
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs font-semibold"
                          onClick={() => toggleActive(s.id)}
                        >
                          {s.active ? "Suspender" : "Re-Activar"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {churnAlerts.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="text-center text-muted-foreground py-6 text-xs italic"
                      >
                        No hay alertas de churn o tiendas inactivas. ¡Excelente!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── FOOTER ACTIONS GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Enlaces y Promociones Card (Acceso directo) */}
        <div className="lg:col-span-2">
          <Card className="border-border/50 shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-br from-primary/5 via-transparent to-transparent flex flex-col justify-between h-full">
            <CardHeader>
              <div className="flex items-center gap-2 text-primary">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold">
                    Enlaces Promocionales y Descuentos
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Crea links de invitación con precios especiales y duraciones a la medida de tu
                    cliente.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Ahora el generador de enlaces se encuentra en su propia sección centralizada. Puedes
                crear códigos con descuentos, duraciones en días o meses y notas de seguimiento, así
                como revocar enlaces activos.
              </p>
              <Link to="/super/promociones">
                <Button size="sm" className="w-full sm:w-auto flex items-center gap-2 shadow-sm">
                  Ir a Enlaces Promocionales
                  <ArrowUpRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Claim Book & System Stats (Occupies 1 column) */}
        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-1.5">
              <ClipboardList className="w-4.5 h-4.5 text-blue-500" />
              Libro de Reclamaciones
            </CardTitle>
            <CardDescription className="text-xs">
              Estado regulatorio del Libro de Reclamaciones del sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">
                  Tiendas con Libro Activo
                </span>
                <span className="text-2xl font-black text-blue-800">{storesWithLibro}</span>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Cumplimiento con las normativas de protección al consumidor del INDECOPI en Perú. Los
              comercios activos que superen su plan gratuito semilla pueden activar este módulo en
              sus configuraciones.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Sub-component: KPI Metric Card
interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  description: string;
  trend?: { value: string; positive: boolean };
}

function MetricCard({ icon, label, value, description, trend }: MetricCardProps) {
  return (
    <Card className="overflow-hidden relative border-border/50 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground text-sm font-semibold">
            {icon}
            {label}
          </div>
          {trend && (
            <span
              className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                trend.positive
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-rose-50 text-rose-600 border-rose-200",
              )}
            >
              {trend.value}
            </span>
          )}
        </div>
        <div className="mt-3 text-3xl font-black tracking-tight text-foreground">{value}</div>
        <p className="text-[11px] text-muted-foreground mt-1.5">{description}</p>
      </CardContent>
    </Card>
  );
}

// Sub-component: Empty Chart State
function EmptyChartState({ text }: { text: string }) {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center text-center gap-2 bg-muted/20 border border-dashed rounded-xl p-6">
      <HelpCircle className="w-8 h-8 text-muted-foreground/40" />
      <p className="text-xs text-muted-foreground font-medium">{text}</p>
    </div>
  );
}
