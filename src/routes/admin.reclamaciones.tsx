import { createFileRoute } from "@tanstack/react-router";
import { useApp } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ClipboardList,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";

export const Route = createFileRoute("/admin/reclamaciones")({
  component: ReclamacionesPage,
});

/* ── Tipos ─────────────────────────────────────────────────── */
interface Reclamacion {
  id: string;
  numero_correlativo: number;
  fecha: string;
  estado: "pendiente" | "en_revision" | "resuelto";
  fecha_respuesta: string | null;
  respuesta_proveedor: string | null;
  // Sección A
  empresa_nombre: string;
  empresa_ruc: string | null;
  // Sección B
  consumidor_nombre: string;
  consumidor_tipo_doc: string;
  consumidor_num_doc: string;
  consumidor_domicilio: string | null;
  consumidor_telefono: string | null;
  consumidor_email: string | null;
  es_menor_edad: boolean;
  tutor_nombre: string | null;
  tutor_num_doc: string | null;
  // Sección C
  bien_descripcion: string | null;
  bien_monto: number | null;
  // Sección D
  tipo: "queja" | "reclamo";
  descripcion: string;
  pedido_consumidor: string | null;
}

/* ── Helpers ───────────────────────────────────────────────── */
const ESTADO_CONFIG = {
  pendiente: { label: "Pendiente", color: "bg-amber-100 text-amber-700", icon: Clock },
  en_revision: { label: "En revisión", color: "bg-blue-100 text-blue-700", icon: AlertCircle },
  resuelto: { label: "Resuelto", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
};

function diasHabiles(desde: string): number {
  let count = 0;
  const d = new Date(desde);
  const now = new Date();
  while (d < now) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) count++;
  }
  return count;
}

function formatFecha(iso: string) {
  return new Date(iso).toLocaleString("es-PE", { dateStyle: "medium", timeStyle: "short" });
}

/* ── Componente fila ───────────────────────────────────────── */
function ReclamacionRow({ rec, onUpdate }: { rec: Reclamacion; onUpdate: () => void }) {
  const [open, setOpen] = useState(false);
  const [estado, setEstado] = useState(rec.estado);
  const [respuesta, setRespuesta] = useState(rec.respuesta_proveedor ?? "");
  const [saving, setSaving] = useState(false);
  const cfg = ESTADO_CONFIG[estado];
  const Icon = cfg.icon;
  const diasTranscurridos = diasHabiles(rec.fecha);
  const vencido = diasTranscurridos > 15 && estado !== "resuelto";
  const año = new Date().getFullYear();
  const numFmt = `N° ${String(rec.numero_correlativo).padStart(4, "0")}-${año}`;

  const handleGuardar = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("reclamaciones")
        .update({
          estado,
          respuesta_proveedor: respuesta.trim() || null,
          fecha_respuesta: estado === "resuelto" ? new Date().toISOString() : null,
        })
        .eq("id", rec.id);
      if (error) throw error;
      toast.success("Reclamación actualizada");
      onUpdate();
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={`rounded-xl border overflow-hidden transition-all ${open ? "shadow-md" : ""} ${vencido ? "border-red-200" : "border-border"}`}
    >
      {/* Cabecera */}
      <button
        className="w-full text-left px-4 py-3.5 flex flex-wrap items-center gap-3"
        onClick={() => setOpen(!open)}
      >
        {/* Número */}
        <div className="shrink-0 w-28">
          <p className="font-black text-sm">{numFmt}</p>
          <p className="text-[10px] text-muted-foreground capitalize">{rec.tipo}</p>
        </div>

        {/* Consumidor */}
        <div className="flex-1 min-w-[140px]">
          <p className="font-semibold text-sm truncate">{rec.consumidor_nombre}</p>
          <p className="text-[10px] text-muted-foreground">
            {rec.consumidor_tipo_doc}: {rec.consumidor_num_doc}
          </p>
        </div>

        {/* Fecha */}
        <div className="shrink-0 text-xs text-muted-foreground hidden sm:block">
          {formatFecha(rec.fecha)}
        </div>

        {/* Estado */}
        <div className="shrink-0 flex items-center gap-1.5">
          {vencido && (
            <span className="text-[10px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full">
              ¡Vencido! {diasTranscurridos}dh
            </span>
          )}
          {!vencido && estado !== "resuelto" && (
            <span className="text-[10px] text-muted-foreground">{diasTranscurridos}/15 dh</span>
          )}
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${cfg.color}`}
          >
            <Icon className="h-3 w-3" />
            {cfg.label}
          </span>
        </div>

        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {/* Detalle expandible */}
      {open && (
        <div className="border-t bg-muted/20 px-4 py-4 space-y-4">
          {/* Grid de datos */}
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            {/* Sección B */}
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                B. Consumidor
              </p>
              <p className="font-bold">{rec.consumidor_nombre}</p>
              <p className="text-muted-foreground text-xs">
                {rec.consumidor_tipo_doc}: {rec.consumidor_num_doc}
              </p>
              {rec.consumidor_domicilio && <p className="text-xs">{rec.consumidor_domicilio}</p>}
              {rec.consumidor_telefono && <p className="text-xs">📞 {rec.consumidor_telefono}</p>}
              {rec.consumidor_email && <p className="text-xs">✉️ {rec.consumidor_email}</p>}
              {rec.es_menor_edad && (
                <p className="text-xs text-amber-700 font-semibold">
                  Menor de edad — Tutor: {rec.tutor_nombre} ({rec.tutor_num_doc})
                </p>
              )}
            </div>

            {/* Sección C */}
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                C. Bien o Servicio
              </p>
              {rec.bien_descripcion ? (
                <p className="text-xs">{rec.bien_descripcion}</p>
              ) : (
                <p className="text-xs text-muted-foreground">No especificado</p>
              )}
              {rec.bien_monto && (
                <p className="text-xs font-semibold">S/ {rec.bien_monto.toFixed(2)}</p>
              )}
            </div>
          </div>

          {/* Sección D */}
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              D. Detalle — <span className="capitalize">{rec.tipo}</span>
            </p>
            <div className="rounded-lg bg-background border p-3 text-sm leading-relaxed">
              {rec.descripcion}
            </div>
            {rec.pedido_consumidor && (
              <>
                <p className="text-[10px] font-bold text-muted-foreground">
                  Pedido del consumidor:
                </p>
                <div className="rounded-lg bg-background border p-3 text-sm leading-relaxed">
                  {rec.pedido_consumidor}
                </div>
              </>
            )}
          </div>

          {/* Aviso legal de plazo */}
          {vencido && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-3 py-2.5 text-xs text-red-700 font-medium">
              ⚠️ Han transcurrido <strong>{diasTranscurridos} días hábiles</strong> desde la
              presentación. El plazo legal de 15 días hábiles (Ley N° 31435 / DS N° 101-2022-PCM) ha
              vencido. Responde de inmediato para evitar una denuncia ante INDECOPI.
            </div>
          )}
          {!vencido && estado !== "resuelto" && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2.5 text-xs text-amber-700">
              ⏱ Tiempo transcurrido: <strong>{diasTranscurridos} de 15 días hábiles</strong>. Plazo
              legal conforme al DS N° 101-2022-PCM.
            </div>
          )}

          {/* Panel de respuesta */}
          <div className="space-y-2 pt-2 border-t">
            <p className="text-xs font-bold">Registrar respuesta / actualizar estado</p>
            <div className="flex gap-2 flex-wrap">
              {(["pendiente", "en_revision", "resuelto"] as const).map((e) => (
                <button
                  key={e}
                  onClick={() => setEstado(e)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition ${
                    estado === e
                      ? `${ESTADO_CONFIG[e].color} border-current`
                      : "border-border text-muted-foreground hover:border-primary"
                  }`}
                >
                  {ESTADO_CONFIG[e].label}
                </button>
              ))}
            </div>
            <textarea
              value={respuesta}
              onChange={(e) => setRespuesta(e.target.value)}
              placeholder="Escribe aquí la respuesta al consumidor (obligatoria al resolver)..."
              rows={3}
              className="w-full rounded-xl border px-3 py-2.5 text-sm resize-none outline-none focus:ring-2 focus:ring-primary bg-background"
            />
            <div className="flex items-center gap-3">
              <Button size="sm" onClick={handleGuardar} disabled={saving} className="font-bold">
                {saving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                    Guardando
                  </>
                ) : (
                  "Guardar"
                )}
              </Button>
              <p className="text-[10px] text-muted-foreground">
                La respuesta queda registrada con fecha y hora en el sistema.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Página principal ──────────────────────────────────────── */
function ReclamacionesPage() {
  const id = useApp((s) => s.currentStoreId);
  const store = useApp((s) => s.stores.find((st) => st.id === id));

  const [reclamaciones, setReclamaciones] = useState<Reclamacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<
    "todos" | "pendiente" | "en_revision" | "resuelto"
  >("todos");
  const [filtroTipo, setFiltroTipo] = useState<"todos" | "queja" | "reclamo">("todos");

  const fetchReclamaciones = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("reclamaciones")
      .select("*")
      .eq("tenant_id", id)
      .order("fecha", { ascending: false });
    if (!error && data) setReclamaciones(data as Reclamacion[]);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchReclamaciones();
  }, [fetchReclamaciones]);

  if (!store) return null;

  const filtered = reclamaciones
    .filter((r) => filtroEstado === "todos" || r.estado === filtroEstado)
    .filter((r) => filtroTipo === "todos" || r.tipo === filtroTipo);

  const pendientes = reclamaciones.filter((r) => r.estado === "pendiente").length;
  const enRevision = reclamaciones.filter((r) => r.estado === "en_revision").length;
  const resueltos = reclamaciones.filter((r) => r.estado === "resuelto").length;
  const vencidos = reclamaciones.filter(
    (r) => diasHabiles(r.fecha) > 15 && r.estado !== "resuelto",
  ).length;

  if (!store.libroReclamacionesActivo) {
    return (
      <div className="max-w-2xl space-y-4">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <ClipboardList className="h-6 w-6 text-primary" />
          Libro de Reclamaciones
        </h1>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800 space-y-2">
          <p className="font-bold">El Libro de Reclamaciones no está activo en tu catálogo.</p>
          <p>
            Ve a{" "}
            <a href="/admin/configuracion" className="underline font-semibold">
              Configuración
            </a>{" "}
            y activa el Libro de Reclamaciones para comenzar a recibir y gestionar quejas y reclamos
            de tus clientes, cumpliendo con la Ley N° 29571 y el DS N° 101-2022-PCM.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-primary" />
            Libro de Reclamaciones
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Conforme a Ley N° 29571 · DS N° 101-2022-PCM · Ley N° 32495
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchReclamaciones} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: reclamaciones.length, color: "text-foreground" },
          { label: "Pendientes", value: pendientes, color: "text-amber-600" },
          { label: "En revisión", value: enRevision, color: "text-blue-600" },
          { label: "Resueltos", value: resueltos, color: "text-emerald-600" },
        ].map((k) => (
          <div key={k.label} className="rounded-xl border bg-card p-3 text-center">
            <p className={`text-2xl font-black ${k.color}`}>{k.value}</p>
            <p className="text-xs text-muted-foreground">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Alerta vencidos */}
      {vencidos > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 font-semibold flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {vencidos} reclamación{vencidos > 1 ? "es" : ""} con plazo legal vencido (más de 15 días
          hábiles sin respuesta). Responde a la brevedad para evitar denuncias ante INDECOPI.
        </div>
      )}

      {/* Marco legal */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-xs text-muted-foreground space-y-1">
        <p className="font-bold text-foreground">Obligaciones legales del proveedor</p>
        <p>
          · Plazo máximo de respuesta: <strong>15 días hábiles improrrogables</strong> (Ley N° 31435
          / DS N° 101-2022-PCM).
        </p>
        <p>
          · Conservar las hojas de reclamación por un mínimo de <strong>2 años</strong> (Art. 9° DS
          N° 011-2011-PCM).
        </p>
        <p>
          · Remitir las hojas a INDECOPI cuando sea requerido, en el plazo indicado en el
          requerimiento.
        </p>
        <p>
          · El incumplimiento constituye infracción sancionable con multa de hasta 450 UIT (Art.
          158° Ley N° 29571).
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {(["todos", "pendiente", "en_revision", "resuelto"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFiltroEstado(f)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition ${
              filtroEstado === f
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:border-primary"
            }`}
          >
            {f === "todos" ? "Todos" : ESTADO_CONFIG[f].label}
            {f !== "todos" && (
              <span className="ml-1 opacity-60">
                ({reclamaciones.filter((r) => r.estado === f).length})
              </span>
            )}
          </button>
        ))}
        <div className="w-px bg-border mx-1" />
        {(["todos", "reclamo", "queja"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFiltroTipo(f)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition ${
              filtroTipo === f
                ? "bg-foreground text-background border-foreground"
                : "border-border text-muted-foreground hover:border-primary"
            }`}
          >
            {f === "todos" ? "Todos los tipos" : f.charAt(0).toUpperCase() + f.slice(1) + "s"}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground mt-2">Cargando reclamaciones...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">
            No hay reclamaciones{" "}
            {filtroEstado !== "todos"
              ? `con estado "${ESTADO_CONFIG[filtroEstado].label}"`
              : "registradas"}
            .
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((r) => (
            <ReclamacionRow key={r.id} rec={r} onUpdate={fetchReclamaciones} />
          ))}
        </div>
      )}

      {/* Nota de archivo */}
      {resueltos > 0 && (
        <p className="text-[10px] text-muted-foreground text-center">
          Los registros resueltos deben conservarse por mínimo 2 años conforme al Art. 9° del DS N°
          011-2011-PCM.
        </p>
      )}
    </div>
  );
}
