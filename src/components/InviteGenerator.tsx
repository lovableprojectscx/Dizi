import { useState } from "react";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Copy, Check, Link2, Calendar, FileText } from "lucide-react";
import { toast } from "sonner";
import type { PlanId } from "@/lib/types";
import { PLAN_DURATION_OPTIONS } from "@/lib/types";

const PLAN_OPTIONS: { value: PlanId; label: string }[] = [
  { value: "emprendedor", label: "Emprendedor (S/ 14.90)" },
  { value: "pro",         label: "Pro (S/ 19.90)" },
  { value: "ilimitado",   label: "Ilimitado (S/ 34.90)" },
  { value: "semilla",     label: "Semilla (Gratis)" },
];

interface GeneratedLink {
  token: string;
  plan: PlanId;
  durationMonths: number;
  url: string;
  createdAt: string;
  linkExpiresAt: string;
}

function generateToken(): string {
  const arr = new Uint8Array(18);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
}

export function InviteGenerator() {
  const addInvite = useApp((s) => s.addInvite);
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("emprendedor");
  const [durationMonths, setDurationMonths] = useState<number>(1);
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatedLinks, setGeneratedLinks] = useState<GeneratedLink[]>([]);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const token = generateToken();

      await addInvite({
        token,
        plan: selectedPlan,
        used: false,
        durationMonths,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        notes: notes.trim() || undefined,
      });

      const url = `${window.location.origin}/register?invite=${token}`;
      const linkExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      const newLink: GeneratedLink = {
        token,
        plan: selectedPlan,
        durationMonths,
        url,
        createdAt: new Date().toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }),
        linkExpiresAt: formatShortDate(linkExpiresAt),
      };

      setGeneratedLinks((prev) => [newLink, ...prev].slice(0, 8));
      await copyToClipboard(url, token);
      toast.success("Enlace generado y copiado!");
      setNotes("");
    } catch {
      toast.error("Error al generar el enlace. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (url: string, token: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 2000);
    } catch {
      toast.error("No se pudo copiar. Copia el link manualmente.");
    }
  };

  return (
    <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Plan
          </label>
          <select
            value={selectedPlan}
            onChange={(e) => setSelectedPlan(e.target.value as PlanId)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
          >
            {PLAN_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <Calendar className="w-3 h-3" /> Duracion del plan
          </label>
          <select
            value={durationMonths}
            onChange={(e) => setDurationMonths(Number(e.target.value))}
            disabled={selectedPlan === "semilla"}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {PLAN_DURATION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={loading}
          className="h-10 px-6 shadow-lg shadow-primary/20"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Generando...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Link2 className="w-4 h-4" />
              Generar y Copiar Link
            </span>
          )}
        </Button>
      </div>

      <div>
        <button
          type="button"
          onClick={() => setShowNotes(!showNotes)}
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          <FileText className="w-3 h-3" />
          {showNotes ? "Ocultar notas" : "Agregar nota interna (opcional)"}
        </button>
        {showNotes && (
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ej: Cliente referido por Maria Lopez, acordado por WhatsApp..."
            rows={2}
            className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
          />
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        El link expira en <strong>30 dias</strong> si no se usa.
        {selectedPlan !== "semilla" && (
          <> El plan <strong>{selectedPlan}</strong> durara <strong>{PLAN_DURATION_OPTIONS.find(o => o.value === durationMonths)?.label}</strong> desde que el cliente se registre.</>
        )}
      </p>

      {generatedLinks.length > 0 && (
        <div className="space-y-2 pt-3 border-t border-primary/10">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Links generados esta sesion
          </p>
          {generatedLinks.map((link) => (
            <div
              key={link.token}
              className="flex items-center gap-2 bg-background rounded-lg border px-3 py-2.5 text-sm"
            >
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 ${
                link.plan === "ilimitado" ? "bg-purple-100 text-purple-700" :
                link.plan === "pro" ? "bg-blue-100 text-blue-700" :
                link.plan === "emprendedor" ? "bg-orange-100 text-orange-700" :
                "bg-gray-100 text-gray-600"
              }`}>
                {link.plan}
              </span>

              {link.plan !== "semilla" && (
                <span className="text-[10px] text-muted-foreground shrink-0 flex items-center gap-0.5">
                  <Calendar className="w-2.5 h-2.5" />
                  {PLAN_DURATION_OPTIONS.find(o => o.value === link.durationMonths)?.label}
                </span>
              )}

              <span className="flex-1 truncate text-muted-foreground font-mono text-xs">{link.url}</span>

              <span className="text-[10px] text-muted-foreground shrink-0 hidden sm:block">
                Link vence: {link.linkExpiresAt}
              </span>

              <span className="text-xs text-muted-foreground shrink-0">{link.createdAt}</span>

              <button
                onClick={() => copyToClipboard(link.url, link.token)}
                className="shrink-0 p-1 rounded hover:bg-muted transition-colors"
                title="Copiar link"
              >
                {copiedToken === link.token
                  ? <Check className="w-3.5 h-3.5 text-emerald-500" />
                  : <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                }
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
