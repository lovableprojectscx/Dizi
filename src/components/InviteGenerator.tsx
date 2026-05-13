import { useState } from "react";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Copy, Check, Link2 } from "lucide-react";
import { toast } from "sonner";
import type { PlanId } from "@/lib/types";

const PLAN_OPTIONS: { value: PlanId; label: string }[] = [
  { value: "emprendedor", label: "Emprendedor (S/ 14.90)" },
  { value: "pro",         label: "Pro (S/ 19.90)" },
  { value: "ilimitado",   label: "Ilimitado (S/ 34.90)" },
  { value: "semilla",     label: "Semilla (Gratis)" },
];

interface GeneratedLink {
  token: string;
  plan: PlanId;
  url: string;
  createdAt: string;
}

/** Genera tokens criptográficamente seguros de 24 chars */
function generateToken(): string {
  const arr = new Uint8Array(18);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function InviteGenerator() {
  const addInvite = useApp((s) => s.addInvite);
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("emprendedor");
  const [loading, setLoading] = useState(false);
  const [generatedLinks, setGeneratedLinks] = useState<GeneratedLink[]>([]);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const token = generateToken();
      await addInvite({ token, plan: selectedPlan });

      const url = `${window.location.origin}/register?invite=${token}`;
      const newLink: GeneratedLink = {
        token,
        plan: selectedPlan,
        url,
        createdAt: new Date().toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }),
      };

      setGeneratedLinks((prev) => [newLink, ...prev].slice(0, 5));
      await copyToClipboard(url, token);
      toast.success("¡Enlace generado y copiado!");
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
      <div className="flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 space-y-2">
          <label className="text-sm font-medium">Plan para la nueva tienda</label>
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
        <Button
          onClick={handleGenerate}
          disabled={loading}
          className="whitespace-nowrap h-10 px-6 shadow-lg shadow-primary/20"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Generando…
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Link2 className="w-4 h-4" />
              Generar y Copiar Link
            </span>
          )}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Envía este enlace al cliente. El plan queda bloqueado en el link — si no se usa en 30 días expira automáticamente.
      </p>

      {/* Historial de links generados en esta sesión */}
      {generatedLinks.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-primary/10">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Links generados esta sesión
          </p>
          {generatedLinks.map((link) => (
            <div
              key={link.token}
              className="flex items-center gap-2 bg-background rounded-lg border px-3 py-2 text-sm"
            >
              <span className="font-semibold text-primary capitalize w-24 shrink-0">{link.plan}</span>
              <span className="flex-1 truncate text-muted-foreground font-mono text-xs">{link.url}</span>
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
