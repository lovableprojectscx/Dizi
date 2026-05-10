import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, Plus, Check, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/categorias")({
  component: CategoriesPage,
});

function CategoriesPage() {
  const id = useApp((s) => s.currentStoreId)!;
  const store = useApp((s) => s.stores.find((st) => st.id === id))!;
  const upsert = useApp((s) => s.upsertCategory);
  const del = useApp((s) => s.deleteCategory);
  const [newName, setNewName] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const add = () => {
    if (!newName.trim()) return;
    upsert(store.id, { id: "", name: newName.trim() });
    setNewName("");
    toast.success("Categoría creada");
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Categorías</h1>
        <p className="text-sm text-muted-foreground">
          Organiza tus productos por categorías para que tus clientes encuentren más rápido.
        </p>
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="Nueva categoría..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <Button onClick={add}>
          <Plus className="h-4 w-4 mr-1" /> Agregar
        </Button>
      </div>
      <div className="border rounded-xl divide-y bg-card">
        {store.categories.length === 0 && (
          <p className="p-6 text-sm text-muted-foreground text-center">
            Aún no tienes categorías.
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
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      upsert(store.id, { id: c.id, name: editName });
                      setEditId(null);
                    }}
                  >
                    <Check className="h-4 w-4" />
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
                      if (confirm(`¿Eliminar "${c.name}"?`)) del(store.id, c.id);
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
