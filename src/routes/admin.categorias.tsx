import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, Plus, Check, X, Loader2, LayoutGrid } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/categorias")({
  component: CategoriesPage,
});

function CategoriesPage() {
  const id = useApp((s) => s.currentStoreId);
  const store = useApp((s) => s.stores.find((st) => st.id === id));

  if (!store) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-muted-foreground animate-pulse">Cargando categorias...</p>
        </div>
      </div>
    );
  }

  const upsert = useApp((s) => s.upsertCategory);
  const del = useApp((s) => s.deleteCategory);
  const [newName, setNewName] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const add = async () => {
    if (!newName.trim()) return;
    setIsAdding(true);
    try {
      await upsert(store.id, { id: "", name: newName.trim() });
      setNewName("");
      setOpen(false);
      toast.success("Categoria creada con exito");
    } catch (e) {
      toast.error("Hubo un error al crear la categoria");
    } finally {
      setIsAdding(false);
    }
  };

  const saveEdit = async (cId: string) => {
    if (!editName.trim()) return;
    setIsEditing(true);
    try {
      await upsert(store.id, { id: cId, name: editName.trim() });
      setEditId(null);
      toast.success("Categoria actualizada");
    } catch (e) {
      toast.error("Error al actualizar");
    } finally {
      setIsEditing(false);
    }
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Categorias</h1>
        <p className="text-sm text-muted-foreground">
          Organiza tus productos por categorias para que tus clientes encuentren mas rapido.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/30 p-4 rounded-2xl border">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <LayoutGrid className="h-5 w-5" />
          </div>
          <div>
            <p className="font-bold text-sm">Gestionar Categorias</p>
            <p className="text-[11px] text-muted-foreground">{store.categories.length} categorias registradas</p>
          </div>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="font-bold gap-2 shadow-lg shadow-primary/20 w-full sm:w-auto">
              <Plus className="h-4 w-4" /> Nueva Categoria
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] max-h-[90dvh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Crear Categoria</DialogTitle>
              <DialogDescription>
                Asigna un nombre a tu categoria para organizar tus productos.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Nombre de la categoria
                </label>
                <Input
                  id="name"
                  placeholder="Ej: Menu del dia, Bebidas, Postres..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && add()}
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter className="flex-row gap-2 sm:justify-end">
              <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button className="flex-1 sm:flex-none" onClick={add} disabled={isAdding || !newName.trim()}>
                {isAdding ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                {isAdding ? "Guardando..." : "Crear Categoria"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-xl divide-y bg-card">
        {store.categories.length === 0 && (
          <p className="p-6 text-sm text-muted-foreground text-center">
            Aun no tienes categorias.
          </p>
        )}
        {store.categories.map((c) => {
          const count = store.products.filter((p) => p.categoryId === c.id).length;
          const isEdit = editId === c.id;
          return (
            <div key={c.id} className="flex items-center gap-3 p-3">
              {isEdit ? (
                <Input
                  className="flex-1"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  autoFocus
                />
              ) : (
                <div className="flex-1">
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{count} productos</p>
                </div>
              )}
              {isEdit ? (
                <>
                  <Button size="icon" variant="ghost" disabled={isEditing} onClick={() => saveEdit(c.id)}>
                    {isEditing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => setEditId(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setEditId(c.id);
                      setEditName(c.name);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      if (count > 0) {
                        toast.error("Mueve los productos antes de eliminar");
                        return;
                      }
                      if (confirm("Eliminar " + c.name + "?")) del(store.id, c.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
