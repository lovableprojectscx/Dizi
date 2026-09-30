import React from "react";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp, Layers, Award, MousePointerClick } from "lucide-react";

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

function EmptyChartState({ text }: { text: string }) {
  return (
    <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">
      {text}
    </div>
  );
}

interface SuperDashboardChartsProps {
  trendData: any[];
  nicheData: any[];
  planData: any[];
  topClicksData: any[];
  activeStores: number;
  totalStores: number;
}

export default function SuperDashboardCharts({
  trendData,
  nicheData,
  planData,
  topClicksData,
  activeStores,
  totalStores,
}: SuperDashboardChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Chart 1: Historical Trend */}
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
                  width={110}
                  className="text-[11px] font-medium text-foreground"
                />
                <RechartsTooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="clicks"
                  name="Clicks WhatsApp"
                  fill="#f59e0b"
                  radius={[0, 4, 4, 0]}
                  maxBarSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChartState text="Sin datos de clicks registrados" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
