import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useApp } from "@/lib/store";
import { PLANS, type PlanId } from "@/lib/types";
import { InviteGenerator } from "@/components/InviteGenerator";
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
import { LogIn, Search, Power, ExternalLink } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

export const Route = createFileRoute("/super/tiendas")({
  component: TenantsPage,
});

const planVariant: Record<PlanId, "secondary" | "default" | "outline"> = {
  semilla: "secondary",
  emprendedor: "outline",
  pro: "default",
  ilimitado: "default",
};

function TenantsPage() {
  const stores = useApp((s) => s.stores);
  const setPlan = useApp((s) => s.setPlan);
  const toggleActive = useApp((s) => s.toggleStoreActive);
  const startImpersonation = useApp((s) => s.startImpersonation);
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const filtered = stores.filter(
    (s) =>
      s.name.toLowerCase().includes(q.toLowerCase()) ||
      s.phone.includes(q) ||
      s.id.includes(q)
  );

  const impersonate = (id: string) => {
    startImpersonation(id);
    toast.success("Modo soporte activado");
    navigate({ to: "/admin/dashboard" });
  };

  return (
    <div className="space-y-4 max-w-6xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tiendas (Ver. Actualizada)</h1>
          <p className="text-sm text-muted-foreground">
            {stores.length} tiendas registradas
          </p>
        </div>
        <div className="relative w-72 max-w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre, teléfono, ID..."
            className="pl-9"
          />
        </div>
      </div>

      <InviteGenerator />

      <div className="border rounded-xl bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Tienda</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Creada</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-mono text-xs">{s.id}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {s.logo && (
                      <img src={s.logo} alt="" className="h-7 w-7 rounded-full object-cover" />
                    )}
                    <div>
                      <p className="font-medium">{s.name}</p>
                      <Link
                        to="/t/$slug"
                        params={{ slug: s.slug }}
                        className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1"
                      >
                        /t/{s.slug} <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm">+{s.phone}</TableCell>
                <TableCell>
                  <Select
                    value={s.plan}
                    onValueChange={(v) => setPlan(s.id, v as PlanId)}
                  >
                    <SelectTrigger className="h-8 w-36">
                      <SelectValue>
                        <Badge variant={planVariant[s.plan]}>{PLANS[s.plan].name}</Badge>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="semilla">Semilla</SelectItem>
                      <SelectItem value="emprendedor">Emprendedor</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                      <SelectItem value="ilimitado">Ilimitado</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {s.createdAt}
                </TableCell>
                <TableCell>
                  {s.active ? (
                    <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                      Activa
                    </Badge>
                  ) : (
                    <Badge variant="destructive">Suspendida</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleActive(s.id)}
                    className="mr-1"
                  >
                    <Power className="h-3 w-3 mr-1" />
                    {s.active ? "Suspender" : "Activar"}
                  </Button>
                  <Button size="sm" onClick={() => impersonate(s.id)}>
                    <LogIn className="h-3 w-3 mr-1" />
                    Acceder como cliente
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">
                  Sin resultados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
