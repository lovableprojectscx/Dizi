import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import { PLANS, type Product, getEffectivePlan, getEffectiveProductLimit, isSubscriptionExpired, getImageSpec } from "@/lib/types";
import { ImageUploadGuided } from "@/components/admin/ImageUploadGuided";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pencil, Trash2, Plus, ImageIcon, Lock, Loader2, Tag, Check, LayoutGrid, X, Package, CupSoda, Pizza, IceCream, Cake, Utensils, Flower, Gift, Heart, Sprout, Leaf, Images, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/whatsapp";
import type { Category } from "@/lib/types";
import { convertImageToWebP } from "@/lib/image-utils";

export const Route = createFileRoute("/admin/productos")({
  component: ProductsPage,
});

const empty = (): Product => ({
  id: "",
  name: "",
  price: 0,
  isOnSale: false,
  visible: true,
  isSample: false,
  categoryId: "",
  image: "",
});

const parseCategoryName = (name: string) => {
  if (!name) return { label: "", iconKey: "" };
  const [label, iconKey] = name.split("|");
  return {
    label: label ? label.trim() : "",
    iconKey: iconKey ? iconKey.trim() : ""
  };
};

function CategoryIcon({ iconKey, className }: { iconKey: string; className?: string }) {
  const sizeClass = className || "h-4 w-4";
  switch (iconKey) {
    case "burger":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={sizeClass}
        >
          <path d="M3 11c0-3.3 2.7-6 6-6h6c3.3 0 6 2.7 6 6" />
          <path d="M2 13h20" />
          <path d="M4 17h16" />
          <path d="M3 17c0 2.2 1.8 4 4 4h10c2.2 0 4-1.8 4-4" />
        </svg>
      );
    case "fries":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={sizeClass}
        >
          <path d="M5 11l1.5 9h11l1.5-9" />
          <path d="M8 11V4M12 11V3M16 11V5M10 11V6M14 11V6" />
        </svg>
      );
    case "combo":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={sizeClass}
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 12h18" />
          <path d="M12 12v9" />
        </svg>
      );
    case "drink":
      return <CupSoda className={sizeClass} />;
    case "pizza":
      return <Pizza className={sizeClass} />;
    case "icecream":
      return <IceCream className={sizeClass} />;
    case "dessert":
      return <Cake className={sizeClass} />;
    case "flower":
      return <Flower className={sizeClass} />;
    case "gift":
      return <Gift className={sizeClass} />;
    case "heart":
      return <Heart className={sizeClass} />;
    case "sprout":
      return <Sprout className={sizeClass} />;
    case "leaf":
      return <Leaf className={sizeClass} />;
    case "bouquet":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={sizeClass}
        >
          <path d="M12 2a3 3 0 0 0-3 3c0 2 3 5 3 5s3-3 3-5a3 3 0 0 0-3-3z" />
          <path d="M8 6a3 3 0 0 0-3 3c0 2 3 5 3 5s3-3 3-5a3 3 0 0 0-3-3z" />
          <path d="M16 6a3 3 0 0 0-3 3c0 2 3 5 3 5s3-3 3-5a3 3 0 0 0-3-3z" />
          <path d="M12 10v12M9 14l6 6M15 14l-6 6" />
        </svg>
      );
    default:
      return <Utensils className={sizeClass} />;
  }
}

const NICHE_ICONS: Record<string, { key: string; label: string }[]> = {
  bite: [
    { key: "", label: "Ninguno" },
    { key: "burger", label: "Burgers" },
    { key: "fries", label: "Papas" },
    { key: "drink", label: "Bebidas" },
    { key: "combo", label: "Combos" },
    { key: "dessert", label: "Postres" },
    { key: "pizza", label: "Pizza" },
    { key: "icecream", label: "Helado" },
  ],
  bloom: [
    { key: "", label: "Ninguno" },
    { key: "flower", label: "Flores" },
    { key: "bouquet", label: "Arreglos" },
    { key: "gift", label: "Regalos" },
    { key: "heart", label: "Amor" },
    { key: "sprout", label: "Plantas" },
    { key: "leaf", label: "Follaje" },
  ],
};

const isPremiumModel = (model?: string) => model === "bite" || model === "bloom";

const getNicheLabel = (model?: string) => {
  if (isPremiumModel(model)) return "Ícono para Categoría (Premium)";
  return "Ícono del Nicho";
};

const getCleanCategoryName = (rawName: string) => {
  if (!rawName) return "";
  const { label } = parseCategoryName(rawName);
  return label;
};

/* ── Selector de categoría con creación inline ── */
function CategorySelect({
  value,
  categories,
  onChange,
  onCreateCategory,
  storeModel,
}: {
  value: string;
  categories: Category[];
  onChange: (id: string) => void;
  onCreateCategory: (name: string) => Promise<string | null>;
  storeModel?: string;
}) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setSaving(true);
    const newId = await onCreateCategory(trimmed);
    if (newId) {
      onChange(newId);
      setNewName("");
      setCreating(false);
    }
    setSaving(false);
  };

  if (creating) {
    return (
      <div className="flex gap-1.5">
        <Input
          autoFocus
          placeholder="Nombre de categoría..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); handleCreate(); }
            if (e.key === "Escape") { setCreating(false); setNewName(""); }
          }}
          className="h-9 text-sm"
        />
        <button
          type="button"
          onClick={handleCreate}
          disabled={saving || !newName.trim()}
          className="h-9 w-9 shrink-0 rounded-md bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50 hover:opacity-90 transition"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
        </button>
        <button
          type="button"
          onClick={() => { setCreating(false); setNewName(""); }}
          className="h-9 px-2 shrink-0 rounded-md border text-xs text-muted-foreground hover:bg-muted transition"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-1.5">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="flex-1 min-w-0">
          <SelectValue placeholder="Selecciona una..." />
        </SelectTrigger>
        <SelectContent>
          {categories.length === 0 && (
            <div className="px-3 py-2 text-xs text-muted-foreground">
              Sin categorías aún
            </div>
          )}
          {categories.map((c) => {
            const { label, iconKey } = parseCategoryName(c.name);
            return (
              <SelectItem key={c.id} value={c.id}>
                <div className="flex items-center gap-2">
                  {isPremiumModel(storeModel) && iconKey && (
                    <CategoryIcon iconKey={iconKey} className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <span>{label}</span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      <button
        type="button"
        onClick={() => setCreating(true)}
        title="Nueva categoría"
        className="h-9 w-9 shrink-0 rounded-md border border-dashed border-primary/40 text-primary flex items-center justify-center hover:bg-primary/5 transition"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

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
  const upsertCategory = useApp((s) => s.upsertCategory);
  const deleteCategory = useApp((s) => s.deleteCategory);

  const plan = PLANS[store.plan];
  const effectivePlan = PLANS[getEffectivePlan(store)];
  const effectiveLimit = getEffectiveProductLimit(store);
  const subscriptionExpired = isSubscriptionExpired(store);
  const imageSpec = getImageSpec(store);

  const visibleProducts = store.products.filter(p => p.visible);
  const hiddenByExpiry = subscriptionExpired
    ? Math.max(0, visibleProducts.length - effectiveLimit)
    : 0;

  const reachedLimit = store.products.filter(p => !p.isSample).length >= effectiveLimit;

  // Tabs routing logic
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("tab") === "categorias" ? "categorias" : "productos";
    }
    return "productos";
  });

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", val);
      window.history.replaceState(null, "", url.pathname + url.search);
    }
  };

  // Products UI state
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product>(empty());
  const [priceInput, setPriceInput] = useState("");
  const [originalPriceInput, setOriginalPriceInput] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);

  // Bulk Draft Upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [uploadingDrafts, setUploadingDrafts] = useState(false);
  const [draftsTotal, setDraftsTotal] = useState(0);
  const [draftsProcessed, setDraftsProcessed] = useState(0);

  const handleBulkButtonClick = () => {
    if (store.plan !== "ilimitado") {
      setBulkOpen(true); // Open upgrade dialog
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleBulkFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Check plan limits
    const currentCount = store.products.filter(p => !p.isSample).length;
    if (currentCount + files.length > effectiveLimit) {
      toast.error(`La subida masiva excede el límite de tu plan (${effectiveLimit} productos).`);
      return;
    }

    setBulkOpen(true);
    setUploadingDrafts(true);
    setDraftsTotal(files.length);
    setDraftsProcessed(0);

    // Make sure we have at least one category
    let catId = store.categories[0]?.id;
    if (!catId) {
      const newCatId = await handleCreateCategory("General");
      catId = newCatId || "";
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const webpDataUrl = await convertImageToWebP(file);
        const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        const cleanName = `Borrador - ${baseName.substring(0, 30)}`;

        await upsert(store.id, {
          id: "",
          name: cleanName,
          price: 0,
          categoryId: catId,
          image: webpDataUrl,
          description: "",
          visible: false, // draft
          isSample: false
        });
      } catch (err) {
        console.error("[bulk upload]", err);
      }
      setDraftsProcessed((prev) => prev + 1);
    }

    setUploadingDrafts(false);
    setBulkOpen(false);
    toast.success(`Se crearon ${files.length} borradores de productos.`);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Categories UI state
  const [newCatName, setNewCatName] = useState("");
  const [isAddingCat, setIsAddingCat] = useState(false);
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [editCatId, setEditCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState("");
  const [isEditingCat, setIsEditingCat] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedIconKey, setSelectedIconKey] = useState("");
  const [editIconKey, setEditIconKey] = useState("");

  const startEditCategory = (c: Category) => {
    setEditCatId(c.id);
    const { label, iconKey } = parseCategoryName(c.name);
    setEditCatName(label);
    setEditIconKey(iconKey);
    setEditDialogOpen(true);
  };

  const openNew = () => {
    if (reachedLimit) {
      toast.error("Has alcanzado el límite de tu plan");
      return;
    }
    setEditing({ ...empty(), categoryId: store.categories[0]?.id ?? "" });
    setPriceInput("");
    setOriginalPriceInput("");
    setIsFeatured(false);
    setOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setPriceInput(p.price === 0 ? "" : p.price.toString());
    setOriginalPriceInput(p.originalPrice ? p.originalPrice.toString() : "");
    setIsFeatured(p.description?.includes("#destacado") || p.name?.includes("#destacado") || false);
    setOpen(true);
  };

  const save = () => {
    const cleanPrice = priceInput.replace(",", ".");
    const cleanOriginalPrice = originalPriceInput.replace(",", ".");

    const parsedPrice = cleanPrice === "" ? 0 : parseFloat(cleanPrice);
    const parsedOriginalPrice = cleanOriginalPrice === "" ? 0 : parseFloat(cleanOriginalPrice);

    if (isNaN(parsedPrice) || (editing.isOnSale && isNaN(parsedOriginalPrice))) {
      toast.error("Por favor ingresa un precio válido");
      return;
    }

    if (!editing.name || parsedPrice <= 0 || !editing.categoryId) {
      toast.error("Completa los campos requeridos");
      return;
    }

    let rawDesc = (editing.description || "").replace(/#destacado/g, "").trim();
    if (isFeatured) {
      rawDesc = (rawDesc + " #destacado").trim();
    }

    const updatedProduct: Product = {
      ...editing,
      price: parsedPrice,
      originalPrice: editing.isOnSale ? parsedOriginalPrice : undefined,
      description: rawDesc,
      isSample: false,
    };

    upsert(store.id, updatedProduct);
    setOpen(false);
    toast.success("Producto guardado");
  };

  /* Crea categoría inline y devuelve el nuevo id */
  const handleCreateCategory = async (name: string): Promise<string | null> => {
    const newCat: Category = { id: crypto.randomUUID(), name };
    try {
      await upsertCategory(store.id, newCat);
      return newCat.id;
    } catch {
      toast.error("No se pudo crear la categoría");
      return null;
    }
  };

  const handleAddCategoryTab = async () => {
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    setIsAddingCat(true);
    try {
      const finalName = selectedIconKey ? `${trimmed}|${selectedIconKey}` : trimmed;
      await upsertCategory(store.id, { id: "", name: finalName });
      setNewCatName("");
      setSelectedIconKey("");
      setCatDialogOpen(false);
      toast.success("Categoría creada con éxito");
    } catch (e) {
      console.error(e);
      toast.error("No se pudo crear la categoría");
    } finally {
      setIsAddingCat(false);
    }
  };

  const handleSaveEditCategoryTab = async () => {
    if (!editCatId) return;
    const trimmed = editCatName.trim();
    if (!trimmed) return;
    setIsEditingCat(true);
    try {
      const finalName = editIconKey ? `${trimmed}|${editIconKey}` : trimmed;
      await upsertCategory(store.id, { id: editCatId, name: finalName });
      setEditCatId(null);
      setEditDialogOpen(false);
      toast.success("Categoría actualizada con éxito");
    } catch (e) {
      console.error(e);
      toast.error("No se pudo actualizar la categoría");
    } finally {
      setIsEditingCat(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent">
          Gestión de Catálogo
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Organiza, crea y edita los productos y categorías de tu catálogo digital.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="inline-flex h-10 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground max-w-md w-full grid grid-cols-2">
          <TabsTrigger value="productos" className="flex items-center justify-center gap-2">
            <Package className="h-4 w-4" />
            <span>Productos</span>
          </TabsTrigger>
          <TabsTrigger value="categorias" className="flex items-center justify-center gap-2">
            <Tag className="h-4 w-4" />
            <span>Categorías</span>
          </TabsTrigger>
        </TabsList>

        {/* ── PRODUCTS TAB CONTENT ── */}
        <TabsContent value="productos" className="space-y-4 mt-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Mis Productos</h2>
              <p className="text-sm text-muted-foreground">
                {store.products.filter(p => !p.isSample).length} de{" "}
                {effectiveLimit === Infinity ? "ilimitados" : effectiveLimit} (plan {effectivePlan.name})
                {subscriptionExpired && effectivePlan.id !== plan.id && (
                  <span className="ml-1 text-amber-600 font-semibold">
                    — suscripción vencida, límite reducido
                  </span>
                )}
              </p>
            </div>
            <div className="flex gap-2 items-center flex-wrap">
              <Button 
                variant="outline" 
                onClick={handleBulkButtonClick} 
                className="gap-1.5 font-bold text-xs h-9 sm:h-10 px-4 border-dashed border-primary/40 text-primary hover:bg-primary/5 hover:border-primary"
              >
                <Images className="h-4 w-4 text-primary shrink-0" />
                Carga Rápida por Fotos
              </Button>
              <Button onClick={openNew} disabled={reachedLimit} className="font-bold text-xs h-9 sm:h-10 px-4 gap-1.5">
                {reachedLimit ? <Lock className="h-4 w-4 shrink-0" /> : <Plus className="h-4 w-4 shrink-0" />}
                Nuevo Producto
              </Button>
            </div>
          </div>

          {/* Banner: productos ocultos por vencimiento */}
          {hiddenByExpiry > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
              <div className="text-amber-500 mt-0.5 shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-amber-800 text-sm">
                  {hiddenByExpiry} producto{hiddenByExpiry > 1 ? "s" : ""} oculto{hiddenByExpiry > 1 ? "s" : ""} en tu catálogo público
                </p>
                <p className="text-sm text-amber-700 mt-0.5">
                  Tu suscripción venció. El plan Semilla permite hasta {effectiveLimit} productos visibles.
                  Tus productos están guardados — renueva para mostrarlos todos de nuevo.
                </p>
                <a
                  href={`https://wa.me/51925176472?text=${encodeURIComponent(`Hola Dizi, quiero renovar mi plan de la tienda "${store.name}".`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex mt-2 h-8 items-center justify-center rounded-md bg-amber-600 px-4 text-xs font-semibold text-white hover:bg-amber-700 transition-colors"
                >
                  Renovar plan por WhatsApp
                </a>
              </div>
            </div>
          )}

          {/* Tabla desktop */}
          <div className="hidden md:block border rounded-xl bg-card overflow-x-auto">
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
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span>{p.name}</span>
                        {isPremiumModel(store.model) && p.description?.includes("#destacado") && (
                          <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-orange-500 text-orange-600 bg-orange-50 shrink-0">
                            ⭐ Destacado
                          </Badge>
                        )}
                        {!p.visible && (
                          <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-amber-300 text-amber-700 bg-amber-50 dark:border-amber-900/50 dark:text-amber-400 dark:bg-amber-950/20 shrink-0">
                            Borrador
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold">{formatPrice(p.price)}</span>
                        {p.isOnSale && p.originalPrice && p.originalPrice > p.price && (
                          <span className="text-[10px] text-muted-foreground line-through">
                            {formatPrice(p.originalPrice)}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {(() => {
                        const cat = store.categories.find((c) => c.id === p.categoryId);
                        if (!cat) return "sin categoría";
                        const { label, iconKey } = parseCategoryName(cat.name);
                        return (
                          <div className="flex items-center gap-2">
                            {isPremiumModel(store.model) && iconKey && (
                              <CategoryIcon iconKey={iconKey} className="h-4 w-4 shrink-0 text-muted-foreground" />
                            )}
                            <span>{label}</span>
                          </div>
                        );
                      })()}
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
                          if (confirm("¿Eliminar " + p.name + "?")) del(store.id, p.id);
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

          {/* Cards móvil */}
          <div className="flex flex-col gap-3 md:hidden">
            {store.products.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">
                Aún no tienes productos. Crea el primero.
              </p>
            )}
            {store.products.map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-3 border rounded-xl bg-card">
                {p.image ? (
                  <img src={p.image} alt="" className="h-14 w-14 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                    <p className="font-semibold text-sm truncate">{p.name}</p>
                    {isPremiumModel(store.model) && p.description?.includes("#destacado") && (
                      <span className="shrink-0 text-[9px] font-bold text-orange-600 bg-orange-50 border border-orange-200 px-1 rounded">
                        ⭐ Destacado
                      </span>
                    )}
                    {!p.visible && (
                      <span className="shrink-0 text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1 rounded dark:text-amber-400 dark:bg-amber-950/20 dark:border-amber-900/50">
                        Borrador
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {(() => {
                      const cat = store.categories.find((c) => c.id === p.categoryId);
                      if (!cat) return "Sin categoría";
                      const { label, iconKey } = parseCategoryName(cat.name);
                      return (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {isPremiumModel(store.model) && iconKey && (
                            <CategoryIcon iconKey={iconKey} className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          )}
                          <span>{label}</span>
                        </div>
                      );
                    })()}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-sm font-bold text-primary">{formatPrice(p.price)}</span>
                    {p.isOnSale && p.originalPrice && p.originalPrice > p.price && (
                      <span className="text-[11px] text-muted-foreground line-through">
                        {formatPrice(p.originalPrice)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <Switch checked={p.visible} onCheckedChange={() => toggle(store.id, p.id)} />
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        if (confirm("¿Eliminar " + p.name + "?")) del(store.id, p.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* ── CATEGORIES TAB CONTENT ── */}
        <TabsContent value="categorias" className="space-y-4 mt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/30 p-4 rounded-2xl border">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <LayoutGrid className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold text-sm">Gestionar Categorías</h2>
                <p className="text-[11px] text-muted-foreground">{store.categories.length} categorías registradas</p>
              </div>
            </div>

            <Dialog open={catDialogOpen} onOpenChange={(val) => { setCatDialogOpen(val); if (!val) { setNewCatName(""); setSelectedIconKey(""); } }}>
              <DialogTrigger asChild>
                <Button className="font-bold gap-2 shadow-lg shadow-primary/20 w-full sm:w-auto">
                  <Plus className="h-4 w-4" /> Nueva Categoría
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] max-h-[90dvh] flex flex-col">
                <DialogHeader>
                  <DialogTitle>Crear Categoría</DialogTitle>
                  <DialogDescription>
                    Asigna un nombre e ícono a tu categoría para organizar tus productos.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4 overflow-y-auto">
                  <div className="grid gap-2">
                    <label htmlFor="cat-name" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      Nombre de la categoría
                    </label>
                    <Input
                      id="cat-name"
                      placeholder="Ej: Menú del día, Bebidas, Postres..."
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddCategoryTab()}
                      autoFocus
                    />
                  </div>

                  {isPremiumModel(store.model) && (
                    <div className="grid gap-2 mt-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        {getNicheLabel(store.model)}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {((store.model ? NICHE_ICONS[store.model] : []) || []).map((item) => {
                          const active = selectedIconKey === item.key;
                          return (
                            <button
                              key={item.key}
                              type="button"
                              onClick={() => setSelectedIconKey(item.key)}
                              className={cn(
                                "flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all",
                                active
                                  ? "bg-orange-500 border-orange-500 text-white shadow-md scale-105"
                                  : "bg-secondary hover:bg-accent border-border text-muted-foreground"
                              )}
                              title={item.label}
                            >
                              {item.key === "" ? (
                                <X className="h-4 w-4 shrink-0" />
                              ) : (
                                <CategoryIcon iconKey={item.key} className={cn("h-4 w-4 shrink-0", active ? "text-white" : "text-orange-500")} />
                              )}
                              <span className="text-[10px]">{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
                <DialogFooter className="flex-row gap-2 sm:justify-end">
                  <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => setCatDialogOpen(false)}>Cancelar</Button>
                  <Button className="flex-1 sm:flex-none" onClick={handleAddCategoryTab} disabled={isAddingCat || !newCatName.trim()}>
                    {isAddingCat ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    {isAddingCat ? "Guardando..." : "Crear Categoría"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="border rounded-xl divide-y bg-card max-w-2xl">
            {store.categories.length === 0 && (
              <p className="p-6 text-sm text-muted-foreground text-center">
                Aún no tienes categorías creadas.
              </p>
            )}
            {store.categories.map((c) => {
              const count = store.products.filter((p) => p.categoryId === c.id).length;
              return (
                <div key={c.id} className="flex items-center gap-3 p-3">
                  <div className="flex-1">
                    <div className="font-medium text-sm sm:text-base flex items-center gap-2">
                      {(() => {
                        const { label, iconKey } = parseCategoryName(c.name);
                        return (
                          <>
                            {isPremiumModel(store.model) && iconKey && (
                              <CategoryIcon iconKey={iconKey} className="h-4 w-4 shrink-0 text-muted-foreground" />
                            )}
                            <span>{label}</span>
                          </>
                        );
                      })()}
                    </div>
                    <p className="text-xs text-muted-foreground">{count} producto{count !== 1 ? "s" : ""}</p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => startEditCategory(c)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      if (count > 0) {
                        toast.error("Mueve o elimina los productos antes de eliminar esta categoría");
                        return;
                      }
                      if (confirm(`¿Eliminar la categoría "${getCleanCategoryName(c.name)}"?`)) {
                        deleteCategory(store.id, c.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              );
            })}
          </div>

          {/* Dialog Editar Categoría */}
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent className="sm:max-w-[425px] max-h-[90dvh] flex flex-col">
              <DialogHeader>
                <DialogTitle>Editar Categoría</DialogTitle>
                <DialogDescription>
                  Modifica el nombre y el ícono de la categoría seleccionada.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4 overflow-y-auto">
                <div className="grid gap-2">
                  <label htmlFor="edit-cat-name" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Nombre de la categoría
                  </label>
                  <Input
                    id="edit-cat-name"
                    value={editCatName}
                    onChange={(e) => setEditCatName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSaveEditCategoryTab()}
                    autoFocus
                  />
                </div>

                {isPremiumModel(store.model) && (
                  <div className="grid gap-2 mt-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      {getNicheLabel(store.model)}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {((store.model ? NICHE_ICONS[store.model] : []) || []).map((item) => {
                        const active = editIconKey === item.key;
                        return (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => setEditIconKey(item.key)}
                            className={cn(
                              "flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all",
                              active
                                ? "bg-orange-500 border-orange-500 text-white shadow-md scale-105"
                                : "bg-secondary hover:bg-accent border-border text-muted-foreground"
                            )}
                            title={item.label}
                          >
                            {item.key === "" ? (
                              <X className="h-4 w-4 shrink-0" />
                            ) : (
                              <CategoryIcon iconKey={item.key} className={cn("h-4 w-4 shrink-0", active ? "text-white" : "text-orange-500")} />
                            )}
                            <span className="text-[10px]">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter className="flex-row gap-2 sm:justify-end">
                <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
                <Button className="flex-1 sm:flex-none" onClick={handleSaveEditCategoryTab} disabled={isEditingCat || !editCatName.trim()}>
                  {isEditingCat ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  {isEditingCat ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>

      {/* Dialog formulario de producto */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90dvh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-5 pt-5 pb-3 border-b shrink-0">
            <DialogTitle>{editing.id ? "Editar producto" : "Nuevo producto"}</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
            <ImageUploadGuided
              value={editing.image}
              onChange={(image) => setEditing({ ...editing, image })}
              spec={imageSpec}
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
                <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                  <label className="flex items-center gap-2 text-sm cursor-pointer font-medium text-primary">
                    <Switch
                      checked={!!editing.isOnSale}
                      onCheckedChange={(v) => setEditing({ ...editing, isOnSale: v })}
                    />
                    Este producto está en oferta?
                  </label>

                  {isPremiumModel(store.model) && (
                    <label className="flex items-center gap-2 text-sm cursor-pointer font-medium text-orange-600">
                      <Switch
                        checked={isFeatured}
                        onCheckedChange={setIsFeatured}
                      />
                      Destacar producto (Premium)?
                    </label>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {editing.isOnSale ? (
                    <>
                      <div>
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Precio Original</Label>
                        <Input
                          type="text"
                          inputMode="decimal"
                          placeholder="50.00"
                          value={originalPriceInput}
                          onChange={(e) => {
                            let val = e.target.value.replace(",", ".");
                            val = val.replace(/[^0-9.]/g, "");
                            const parts = val.split(".");
                            if (parts.length > 2) return;
                            setOriginalPriceInput(val);
                          }}
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] uppercase font-bold text-primary">Precio Oferta</Label>
                        <Input
                          type="text"
                          inputMode="decimal"
                          placeholder="35.00"
                          value={priceInput}
                          onChange={(e) => {
                            let val = e.target.value.replace(",", ".");
                            val = val.replace(/[^0-9.]/g, "");
                            const parts = val.split(".");
                            if (parts.length > 2) return;
                            setPriceInput(val);
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
                          placeholder="0.00"
                          value={priceInput}
                          onChange={(e) => {
                            let val = e.target.value.replace(",", ".");
                            val = val.replace(/[^0-9.]/g, "");
                            const parts = val.split(".");
                            if (parts.length > 2) return;
                            setPriceInput(val);
                          }}
                        />
                      </div>
                      <div>
                        <Label className="flex items-center gap-1">
                          <Tag className="h-3 w-3" /> Categoría
                        </Label>
                        <CategorySelect
                          value={editing.categoryId}
                          categories={store.categories}
                          onChange={(v) => setEditing({ ...editing, categoryId: v })}
                          onCreateCategory={handleCreateCategory}
                          storeModel={store.model}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {editing.isOnSale && (
                <div className="col-span-2">
                  <Label className="flex items-center gap-1">
                    <Tag className="h-3 w-3" /> Categoría
                  </Label>
                  <CategorySelect
                    value={editing.categoryId}
                    categories={store.categories}
                    onChange={(v) => setEditing({ ...editing, categoryId: v })}
                    onCreateCategory={handleCreateCategory}
                    storeModel={store.model}
                  />
                </div>
              )}

              <div className="col-span-2">
                <Label>Descripción (opcional)</Label>
                <Textarea
                  rows={3}
                  value={(editing.description ?? "").replace(/#destacado/g, "").trim()}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="px-5 py-4 border-t shrink-0 flex-row gap-2 sm:justify-end">
            <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button className="flex-1 sm:flex-none" onClick={save}>Guardar producto</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Input oculto para carga masiva por fotos */}
      <input
        type="file"
        multiple
        accept="image/*"
        ref={fileInputRef}
        onChange={handleBulkFileChange}
        className="hidden"
      />

      {/* Dialog Carga Rápida / Upgrade */}
      <Dialog open={bulkOpen} onOpenChange={(val) => { if (!uploadingDrafts) setBulkOpen(val); }}>
        <DialogContent className="max-w-md max-h-[90dvh] flex flex-col p-6 text-center space-y-6">
          {uploadingDrafts ? (
            <div className="space-y-4 py-6">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
              <div className="space-y-2">
                <DialogTitle className="text-xl font-extrabold text-foreground">Creando borradores masivos</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground leading-normal">
                  Procesando e ingresando imagen <strong>{draftsProcessed + 1}</strong> de <strong>{draftsTotal}</strong>...
                </DialogDescription>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2 overflow-hidden mt-4">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(draftsProcessed / draftsTotal) * 100}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mt-2">
                Optimizando imágenes a WebP e insertando en catálogo
              </p>
            </div>
          ) : (
            // Upgrade screen
            <div className="space-y-4">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-orange-500/10 text-orange-500 border border-orange-500/20">
                <Sparkles className="h-8 w-8 animate-pulse" />
              </div>
              <div className="space-y-2">
                <DialogTitle className="text-xl font-extrabold text-foreground">Carga Rápida por Fotos ⚡</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
                  ¿Tienes muchos productos por registrar? Toma fotos de todo tu stock con tu celular, súbelas juntas en un solo paso y crearemos borradores automáticamente.
                </DialogDescription>
              </div>
              <div className="p-4 border rounded-xl bg-zinc-50 dark:bg-zinc-900 border-zinc-200/60 dark:border-zinc-800 text-left space-y-2 text-xs">
                <p className="font-bold text-foreground">Beneficios del Plan Ilimitado:</p>
                <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                  <li><strong>Ahorro de tiempo</strong>: Crea hasta 30 borradores a la vez.</li>
                  <li><strong>Edición posterior</strong>: Rellena precios y nombres con calma.</li>
                  <li><strong>Productos Ilimitados</strong> en el catálogo.</li>
                </ul>
              </div>
              <p className="text-xs text-muted-foreground">
                Tu tienda actual se encuentra en el plan <strong>{store.plan.toUpperCase()}</strong>.
              </p>
              <div className="flex flex-col gap-2 pt-2">
                <a
                  href={`https://wa.me/51925176472?text=${encodeURIComponent(`Hola Dizi, quiero actualizar mi plan a Ilimitado para desbloquear la Carga Rápida por Fotos.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-orange-500 hover:bg-orange-600 px-6 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition-all active:scale-95 cursor-pointer"
                >
                  Actualizar a Plan Ilimitado por WhatsApp
                </a>
                <Button variant="ghost" onClick={() => setBulkOpen(false)} className="rounded-xl">
                  Tal vez más tarde
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
