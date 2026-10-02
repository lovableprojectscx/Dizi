import { useState, useEffect } from "react";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/**
 * Formatea el tiempo transcurrido desde la última sincronización con la base de datos.
 */
export function formatLastFetched(timestamp: number | null): string {
  if (!timestamp) return "Sin actualizar";
  const diffSec = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSec < 60) return "hace un momento";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin === 1) return "hace 1 min";
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours === 1) return "hace 1 h";
  return `hace ${diffHours} h`;
}

interface SuperRefreshButtonProps {
  className?: string;
}

/**
 * Botón de actualización forzada para el panel Super Admin.
 * Muestra el tiempo transcurrido desde la última carga y bloquea la acción durante la consulta.
 */
export function SuperRefreshButton({ className }: SuperRefreshButtonProps) {
  const fetchData = useApp((s) => s.fetchData);
  const lastFetched = useApp((s) => s.lastFetched);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [, setTick] = useState(0);

  // Intervalo para actualizar el contador relativo de tiempo cada 15 segundos
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 15000);
    return () => clearInterval(timer);
  }, []);

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await fetchData(true);
      toast.success("Tiendas actualizadas");
    } catch {
      toast.error("Error al actualizar tiendas");
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        Actualizado {formatLastFetched(lastFetched)}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={handleRefresh}
        disabled={isRefreshing}
        className="h-9 gap-1.5 shadow-xs"
      >
        <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")} />
        <span>{isRefreshing ? "Actualizando..." : "Actualizar"}</span>
      </Button>
    </div>
  );
}
