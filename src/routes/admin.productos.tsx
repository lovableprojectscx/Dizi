import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useApp } from "@/lib/store";
import { PLANS, type Product } from "@/lib/types";
import { convertImageToWebP } from "@/lib/image-utils";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, Trash2, Plus, ImageIcon, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/whatsapp";

export const Route = createFileRoute("/admin/productos")({
  component: ProductsPage,
});

const empty = (): Product => ({
  id: "",
  name: "",
  price: 0,
  categoryId: "",
  image: "",
  visible: true,
  isOnSale: false,
  originalPrice: 0,
  description: "",
});

function ProductsPage() {
  const id = useApp((s) => s.currentStoreId);
  const store = useApp((s) => s.stores.find((st) => st.id === id));
  
  if (!store) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-muted-foreground animate-pulse">Cargando productos...</p>
        </div>
      </div>
    );
  }

  const upsert = useApp((s) => s.upsertProduct);
  const del = useApp((s) => s.deleteProduct);
  const toggle = useApp((s) => s.toggleProductVisible);
  const plan = PLANS[store.plan];
  const reachedLimit = store.products.length >= plan.productLimit;

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product>(empty());

  const openNew = () => {
    if (reachedLimit) {
      toast.error("Has alcanzado el límite de tu plan");
      return;
    }
    setEditing({ ...empty(), categoryId: store.categories[0]?.id ?? "" });
    setOpen(true);
  };
  const openEdit = (p: Product) => {
    setEditing(p);
    setOpen(true);
  };
  const save = () => {
    if (!editing.name || editing.price <= 0 || !editing.categoryId) {
      toast.error("Completa los campos requeridos");
      return;
    }
    upsert(store.id, editing);
    setOpen(false);
    toast.success("Producto guardado");
  };

  return (
    <div className="space-y-4 max-w-6xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mis Productos</h1>
          <p className="text-sm text-muted-foreground">
            {store.products.length} de{" "}
            {plan.productLimit === Infinity ? "ilimitados" : plan.productLimit} (plan{" "}
            {plan.name})
          </p>
        </div>
        <Button onClick={openNew} disabled={reachedLimit}>
          {reachedLimit ? <Lock className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
          Nuevo Producto
        </Button>
      </div>

      <div className="border rounded-xl bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Foto</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Visible</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {store.products.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  {p.image ? (
                    <img src={p.image} alt="" className="h-10 w-10 rounded-lg object-cover" />
                  ) : (
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-bold">{formatPrice(p.price)}</span>
                    {p.isOnSale && p.originalPrice && (
                      <span className="text-[10px] text-muted-foreground line-through">
                        {formatPrice(p.originalPrice)}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {store.categories.find((c) => c.id === p.categoryId)?.name ?? "—"}
                </TableCell>
                <TableCell>
                  <Switch checked={p.visible} onCheckedChange={() => toggle(store.id, p.id)} />
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm(`¿Eliminar "${p.name}"?`)) del(store.id, p.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {store.products.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                  Aún no tienes productos. Crea el primero.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing.id ? "Editar producto" : "Nuevo producto"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <ImageDrop
              value={editing.image}
              onChange={(image) => setEditing({ ...editing, image })}
            />
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Nombre del producto</Label>
                <Input
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                />
              </div>

              <div className="col-span-2 bg-muted/30 p-3 rounded-xl space-y-3">
                <label className="flex items-center gap-2 text-sm cursor-pointer font-medium text-primary">
                  <Switch
                    checked={!!editing.isOnSale}
                    onCheckedChange={(v) => setEditing({ ...editing, isOnSale: v })}
                  />
                  ¿Este producto está en oferta?
                </label>

                <div className="grid grid-cols-2 gap-3">
                  {editing.isOnSale ? (
                    <>
                      <div>
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Precio Original (Tachado)</Label>
                        <Input
                          type="text"
                          inputMode="decimal"
                          placeholder="Ej: 50.00"
                          value={editing.originalPrice || ""}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9.]/g, "");
                            if (val.split(".").length > 2) return;
                            setEditing({ ...editing, originalPrice: val === "" ? 0 : parseFloat(val) });
                          }}
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] uppercase font-bold text-primary">Precio de Oferta</Label>
                        <Input
                          type="text"
                          inputMode="decimal"
                          placeholder="Ej: 35.00"
                          value={editing.price}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9.]/g, "");
                            if (val.split(".").length > 2) return;
                            setEditing({ ...editing, price: val === "" ? 0 : parseFloat(val) });
                          }}
                          className="border-primary/50 bg-primary/5"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <Label>Precio (S/)</Label>
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={editing.price}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9.]/g, "");
                            if (val.split(".").length > 2) return;
                            setEditing({ ...editing, price: val === "" ? 0 : parseFloat(val) });
                          }}
                        />
                      </div>
                      <div>
                        <Label>Categoría</Label>
                        <Select
                          value={editing.categoryId}
                          onValueChange={(v) => setEditing({ ...editing, categoryId: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona" />
                          </SelectTrigger>
                          <SelectContent>
                            {store.categories.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {editing.isOnSale && (
                <div className="col-span-2">
                  <Label>Categoría</Label>
                  <Select
                    value={editing.categoryId}
                    onValueChange={(v) => setEditing({ ...editing, categoryId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona" />
                    </SelectTrigger>
                    <SelectContent>
                      {store.categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="col-span-2">
                <Label>Descripción (opcional)</Label>
                <Textarea
                  rows={3}
                  value={editing.description ?? ""}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={save}>Guardar producto</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ImageDrop({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [drag, setDrag] = useState(false);
  const [converting, setConverting] = useState(false);

  const handleFile = async (file: File) => {
    // Límite aumentado a 10 MB
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Imagen muy grande (máx 10 MB)");
      return;
    }
    setConverting(true);
    try {
      const webpDataUrl = await convertImageToWebP(file);
      onChange(webpDataUrl);
    } catch {
      toast.error("No se pudo procesar la imagen. Intenta con otro archivo.");
    } finally {
      setConverting(false);
    }
  };

  return (
    <div>
      <Label>Imagen del producto</Label>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          const f = e.dataTransfer.files[0];
          if (f) handleFile(f);
        }}
        className={`relative mt-1 border-2 border-dashed rounded-xl p-4 flex items-center gap-4 transition ${
          drag ? "border-primary bg-primary/5" : "border-border"
        }`}
      >
        {converting ? (
          <div className="h-20 w-20 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : value ? (
          <img src={value} alt="" className="h-20 w-20 rounded-lg object-cover shrink-0" />
        ) : (
          <div className="h-20 w-20 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <ImageIcon className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
        <div className="flex-1 text-sm">
          <p className="font-medium">
            {converting ? "Optimizando imagen..." : "Arrastra una imagen aquí"}
          </p>
          <p className="text-muted-foreground text-xs">
            {converting
              ? "Convirtiendo a WebP de alta calidad"
              : "JPG, PNG, WEBP, HEIC — hasta 10 MB · se optimiza automáticamente"}
          </p>
        </div>
        {!converting && (
          <input
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        )}
      </div>
      <Input
        className="mt-2"
        placeholder="https://..."
        value={value.startsWith("data:") ? "" : value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
