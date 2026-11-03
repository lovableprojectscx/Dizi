/**
 * @file super.encuestas.tsx
 * @description Centro de gestión de respuestas de encuestas de calidad (F43) para el Super Administrador.
 * Permite:
 * - Listar todas las respuestas con filtros por plan y estado de premio.
 * - Búsqueda en tiempo real por código DZ-XXXXXX o slug de tienda.
 * - Visualización de cuántas tiendas tiene el mismo dueño para detectar cuentas duplicadas.
 * - Detalle expandible con las 7 respuestas de cada comercio.
 * - Acciones seguras de "Aplicar premio" (15 días) y "Rechazar".
 * - Exportación a archivo CSV limpio de datos personales.
 */

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { useApp } from "@/lib/store";
import {
  exportSurveyResponsesToCsv,
  getQuestionsForGroup,
  type SurveyGroup,
  type SurveyResponseRecord,
} from "@/lib/survey";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Search,
  Download,
  Gift,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ExternalLink,
  Store as StoreIcon,
  HelpCircle,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/types";

export const Route = createFileRoute("/super/encuestas")({
  component: SuperEncuestasPage,
});

function SuperEncuestasPage() {
  const listSurveyResponses = useApp((s) => s.listSurveyResponses);
  const applySurveyReward = useApp((s) => s.applySurveyReward);
  const rejectSurveyReward = useApp((s) => s.rejectSurveyReward);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [responses, setResponses] = useState<SurveyResponseRecord[]>([]);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const loadData = async (showToast = false) => {
    try {
      setRefreshing(true);
      const data = await listSurveyResponses();
      setResponses(data);
      if (showToast) toast.success("Encuestas actualizadas");
    } catch (err: any) {
      console.error("[SuperEncuestas] Error al cargar:", err);
      toast.error(err?.message || "Error al cargar las respuestas de encuesta");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtrado y búsqueda
  const filteredResponses = useMemo(() => {
    return responses.filter((r) => {
      // Búsqueda por código o slug
      const q = search.trim().toLowerCase();
      if (q) {
        const matchCode = r.reward_code.toLowerCase().includes(q);
        const matchSlug = (r.store_slug || "").toLowerCase().includes(q);
        const matchName = (r.store_name || "").toLowerCase().includes(q);
        if (!matchCode && !matchSlug && !matchName) return false;
      }

      // Filtro de plan
      if (planFilter !== "all" && r.plan_at_response !== planFilter) {
        return false;
      }

      // Filtro de estado
      if (statusFilter !== "all" && r.reward_status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [responses, search, planFilter, statusFilter]);

  const handleApplyReward = async (id: string, code: string) => {
    if (!window.confirm(`¿Confirmas aplicar el premio de 15 días para el código ${code}?`)) {
      return;
    }
    try {
      setProcessingId(id);
      await applySurveyReward(id);
      toast.success(`Premio aplicado con éxito para ${code}`);
      await loadData();
    } catch (err: any) {
      console.error("[handleApplyReward] Error:", err);
      toast.error(err?.message || "Error al aplicar el premio");
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectReward = async (id: string, code: string) => {
    if (!window.confirm(`¿Estás seguro de rechazar el premio para el código ${code}?`)) {
      return;
    }
    try {
      setProcessingId(id);
      await rejectSurveyReward(id);
      toast.info(`Premio rechazado para ${code}`);
      await loadData();
    } catch (err: any) {
      console.error("[handleRejectReward] Error:", err);
      toast.error(err?.message || "Error al rechazar el premio");
    } finally {
      setProcessingId(null);
    }
  };

  const handleExportCsv = () => {
    try {
      const csv = exportSurveyResponsesToCsv(filteredResponses);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `dizi-encuestas-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success(`Exportadas ${filteredResponses.length} respuestas a CSV`);
    } catch (err: any) {
      console.error("[handleExportCsv] Error:", err);
      toast.error("Error al exportar el archivo CSV");
    }
  };

  const handleCopyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
    toast.success("Código copiado");
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Encabezado y acciones principales */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-heading tracking-tight">
            Encuestas de Calidad (F43)
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Revisión de respuestas, control de duplicados y asignación de 15 días de beneficio.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="rounded-xl cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Actualizar
          </Button>

          <Button
            size="sm"
            onClick={handleExportCsv}
            disabled={filteredResponses.length === 0}
            className="rounded-xl font-bold bg-primary text-primary-foreground shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV ({filteredResponses.length})
          </Button>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <Card className="border-border/80 rounded-2xl shadow-2xs">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por código (DZ-...) o tienda..."
              className="pl-9 rounded-xl h-10 text-xs sm:text-sm"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-full sm:w-[150px] rounded-xl h-10 text-xs font-medium">
                <SelectValue placeholder="Plan al responder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los planes</SelectItem>
                <SelectItem value="semilla">Semilla</SelectItem>
                <SelectItem value="emprendedor">Emprendedor</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px] rounded-xl h-10 text-xs font-medium">
                <SelectValue placeholder="Estado premio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="aplicado">Aplicado</SelectItem>
                <SelectItem value="rechazado">Rechazado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Respuestas */}
      <Card className="border-border/80 rounded-2xl shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-muted-foreground space-y-2">
            <div className="w-7 h-7 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs">Cargando respuestas de encuesta...</p>
          </div>
        ) : filteredResponses.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground space-y-2">
            <HelpCircle className="w-8 h-8 mx-auto text-muted-foreground/60" />
            <p className="text-sm font-medium">No se encontraron respuestas registradas.</p>
            <p className="text-xs text-muted-foreground">
              Las tiendas que completen la encuesta aparecerán listadas aquí.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="w-[140px] text-xs font-bold">Código</TableHead>
                  <TableHead className="text-xs font-bold">Tienda</TableHead>
                  <TableHead className="text-xs font-bold">Plan al responder</TableHead>
                  <TableHead className="text-xs font-bold">Tiendas del dueño</TableHead>
                  <TableHead className="text-xs font-bold">Fecha</TableHead>
                  <TableHead className="text-xs font-bold">Estado</TableHead>
                  <TableHead className="text-right text-xs font-bold">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResponses.map((r) => {
                  const isExpanded = expandedId === r.id;
                  const isProcessing = processingId === r.id;
                  const group = r.plan_at_response as SurveyGroup;
                  const questions = getQuestionsForGroup(group);

                  return (
                    <React.Fragment key={r.id}>
                      <TableRow className="hover:bg-muted/30 transition-colors">
                        {/* Código */}
                        <TableCell className="font-mono font-bold text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="text-foreground">{r.reward_code}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyCode(r.reward_code)}
                              className="text-muted-foreground hover:text-foreground cursor-pointer"
                              title="Copiar código"
                            >
                              {copiedCode === r.reward_code ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </TableCell>

                        {/* Tienda */}
                        <TableCell>
                          <div className="space-y-0.5">
                            <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                              {r.store_name || r.store_slug}
                              <a
                                href={`/t/${r.store_slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-primary"
                                title="Ver catálogo público"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                            <span className="text-[11px] text-muted-foreground font-mono">
                              {r.store_slug}
                            </span>
                          </div>
                        </TableCell>

                        {/* Plan al responder */}
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="text-[10px] uppercase font-bold tracking-wider"
                          >
                            {r.plan_at_response}
                          </Badge>
                        </TableCell>

                        {/* Conteo de tiendas del dueño (Alerta de duplicados) */}
                        <TableCell>
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              (r.owner_store_count || 1) > 1
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                                : "text-muted-foreground"
                            }`}
                          >
                            {r.owner_store_count || 1} {(r.owner_store_count || 1) === 1 ? "tienda" : "tiendas"}
                          </span>
                        </TableCell>

                        {/* Fecha */}
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(r.created_at)}
                        </TableCell>

                        {/* Estado */}
                        <TableCell>
                          {r.reward_status === "pendiente" && (
                            <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border-amber-300">
                              <Clock className="w-3 h-3 mr-1" /> Pendiente
                            </Badge>
                          )}
                          {r.reward_status === "aplicado" && (
                            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-300">
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Aplicado
                            </Badge>
                          )}
                          {r.reward_status === "rechazado" && (
                            <Badge className="bg-muted text-muted-foreground border-border">
                              <XCircle className="w-3 h-3 mr-1" /> Rechazado
                            </Badge>
                          )}
                        </TableCell>

                        {/* Acciones */}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {r.reward_status === "pendiente" && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleApplyReward(r.id, r.reward_code)}
                                  disabled={isProcessing}
                                  className="h-8 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                                >
                                  Aplicar premio
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRejectReward(r.id, r.reward_code)}
                                  disabled={isProcessing}
                                  className="h-8 text-xs font-semibold rounded-lg text-destructive hover:bg-destructive/10 cursor-pointer"
                                >
                                  Rechazar
                                </Button>
                              </>
                            )}

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setExpandedId(isExpanded ? null : r.id)}
                              className="h-8 w-8 p-0 rounded-lg cursor-pointer"
                              title={isExpanded ? "Ocultar respuestas" : "Ver respuestas"}
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>

                      {/* Fila expandible con las 7 respuestas */}
                      {isExpanded && (
                        <TableRow className="bg-muted/15 border-b-2">
                          <TableCell colSpan={7} className="p-4 sm:p-5">
                            <div className="space-y-3 max-w-4xl">
                              <div className="flex items-center justify-between pb-2 border-b border-border/40">
                                <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                                  Respuestas registradas (Versión {r.survey_version})
                                </span>
                                {r.reward_applied_at && (
                                  <span className="text-[11px] text-muted-foreground">
                                    Aplicado el: {formatDate(r.reward_applied_at)}
                                  </span>
                                )}
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {questions.map((q) => {
                                  const val = r.answers?.[q.id];
                                  const formatted = Array.isArray(val) ? val.join(", ") : val ?? "—";
                                  return (
                                    <div
                                      key={q.id}
                                      className="p-3 rounded-xl bg-card border border-border/60 space-y-1"
                                    >
                                      <p className="text-[11px] font-semibold text-muted-foreground">
                                        {q.number}. {q.label}
                                      </p>
                                      <p className="text-xs font-bold text-foreground">
                                        {formatted}
                                      </p>
                                      {q.id === "q6" && r.answers?.q6_porque && (
                                        <p className="text-[11px] text-muted-foreground italic pt-1 border-t border-border/30">
                                          ¿Por qué?: {r.answers.q6_porque}
                                        </p>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
