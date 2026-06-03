import { createFileRoute } from "@tanstack/react-router";
import { useApp } from "@/lib/store";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Sparkles, Palette, Image, Utensils, Check, Flame, Coffee, AlertTriangle, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { PublicCatalog } from "@/components/public/PublicCatalog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/diseno-premium")({
  component: DisenoPremiumPage,
});

/* ─────────────────────────────────────────────────────────
   COLOR SWATCH FOR RESTAURANT
   ───────────────────────────────────────────────────────── */
function ColorSwatch({
  colors, selected, onSelect, allowCustom = false, customLabel = "Personalizado",
}: {
  colors: { id: string; name: string; hex: string; display: string }[];
  selected: string;
  onSelect: (hex: string) => void;
  allowCustom?: boolean;
  customLabel?: string;
}) {
  return (
    <div className="flex flex-wrap gap-2.5 items-center">
      {colors.map((c) => {
        const active = selected === c.hex;
        return (
          <button
            key={c.id}
            type="button"
            title={c.name}
            onClick={() => onSelect(c.hex)}
            className={cn(
              "relative h-9 w-9 rounded-full border-2 transition-all hover:scale-110",
              active
                ? "border-foreground ring-2 ring-foreground/20 scale-110 shadow-lg"
                : "border-transparent shadow-sm"
            )}
            style={{ backgroundColor: c.display }}
          >
            {active && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Check className="h-3.5 w-3.5 text-white drop-shadow" />
              </div>
            )}
          </button>
        );
      })}

      {allowCustom && (
        <div className="flex items-center gap-2 border-l pl-2.5 ml-0.5" style={{ borderColor: "var(--border)" }}>
          <div
            className={cn(
              "relative h-9 w-9 rounded-full overflow-hidden transition-all hover:scale-110 shrink-0 shadow-sm border-2",
              selected && !colors.find(c => c.hex === selected)
                ? "border-foreground ring-2 ring-foreground/20 scale-110 shadow-lg"
                : "border-dashed border-border"
            )}
            title={customLabel}
          >
            <input
              type="color"
              value={selected || "#000000"}
              onChange={(e) => onSelect(e.target.value)}
              className="absolute -inset-4 h-20 w-20 cursor-pointer"
            />
            {selected && !colors.find(c => c.hex === selected) && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <Check className="h-3.5 w-3.5 drop-shadow text-white mix-blend-difference" />
              </div>
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold">{customLabel}</span>
            {selected && !colors.find(c => c.hex === selected) && (
              <span className="text-[10px] font-mono text-muted-foreground uppercase">{selected}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const PREMIUM_TEMPLATES: Record<string, { id: string; name: string; description: string; image: string; defaultColor: string }[]> = {
  hamburgueseria: [
    {
      id: "bite",
      name: "Bite Burger",
      description: "Diseño premium oscuro con carrusel de destacados superior, grilla de productos 1:1, selector de categorías con iconos vectoriales y banner panorámico.",
      image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=300&q=80",
      defaultColor: "#ea580c"
    }
  ],
  floreria: [
    {
      id: "bloom",
      name: "Bloom Floral",
      description: "Diseño premium ligero y sumamente elegante para florerías y florerías boutique. Cuenta con carrusel de arreglos destacados, grilla de productos con bordes suaves de arco orgánico, selector de categorías con iconos botánicos y una paleta de colores primaveral y sofisticada.",
      image: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=300&q=80",
      defaultColor: "#be185d"
    }
  ]
};

/* ─────────────────────────────────────────────────────────
   PAGE COMPONENT
   ───────────────────────────────────────────────────────── */
function DisenoPremiumPage() {
  const id = useApp((s) => s.currentStoreId);
  const store = useApp((s) => s.stores.find((st) => st.id === id));
  const update = useApp((s) => s.updateStore);

  if (!store) return null;

  // ── PLAN VERIFICATION ──
  const isPremiumPlan = store.plan === "pro" || store.plan === "ilimitado";
  if (!isPremiumPlan) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-16 text-center space-y-8 animate-in fade-in duration-300">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-orange-500/10 text-orange-500 border border-orange-500/20">
          <Sparkles className="h-10 w-10 animate-pulse" />
        </div>
        <div className="max-w-xl mx-auto space-y-3">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Diseños Premium Exclusivos</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Los diseños premium de alta costura optimizados para rubros específicos (como <strong>Florerías - Bloom</strong> y <strong>Hamburgueserías - Bite</strong>), carruseles multi-banner y botoneras duales son exclusivos para el <strong>Plan Catálogo Pro</strong> e <strong>Ilimitado</strong>.
          </p>
        </div>
        <div className="p-6 border rounded-2xl bg-zinc-50 dark:bg-zinc-900 border-zinc-200/60 dark:border-zinc-800 max-w-md mx-auto shadow-sm">
          <p className="text-xs text-muted-foreground leading-normal">
            Tu tienda actual se encuentra en el plan <strong>{store.plan.toUpperCase()}</strong>. Actualiza ahora para desbloquear toda la potencia visual del sistema.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <a
            href="https://wa.me/51925176472?text=Hola%20Dizi%2C%20quiero%20actualizar%20mi%20tienda%20al%20Plan%20Pro%20para%20desbloquear%20los%20dise%C3%B1os%20premium"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-orange-500 hover:bg-orange-600 px-6 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition-all active:scale-95 cursor-pointer"
          >
            Actualizar mi Plan por WhatsApp
          </a>
        </div>
      </div>
    );
  }

  const maxBanners = store.plan === "ilimitado" ? 5 : 3;

  const [selectedTemplate, setSelectedTemplate] = useState(() => {
    if (store.model && store.model !== "default") return store.model;
    return store.niche === "floreria" ? "bloom" : "bite";
  });
  const [premiumModel, setPremiumModel] = useState<"hamburgueseria" | "floreria">(() => {
    return (store.niche as any) === "floreria" ? "floreria" : "hamburgueseria";
  });
  const [brandColor, setBrandColor] = useState(store.brandColor || "#ea580c");
  const [bannerImages, setBannerImages] = useState<string[]>(() => {
    const raw = (store as any).bannerImage || "";
    return raw ? (raw.includes("|||") ? raw.split("|||") : [raw]) : [];
  });
  const [bannerTitle, setBannerTitle] = useState((store as any).bannerTitle || "");
  const [isInitializing, setIsInitializing] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (store && !isLoaded) {
      setBrandColor(store.brandColor || (store.niche === "floreria" ? "#be185d" : "#ea580c"));
      const raw = (store as any).bannerImage || "";
      setBannerImages(raw ? (raw.includes("|||") ? raw.split("|||") : [raw]) : []);
      setBannerTitle((store as any).bannerTitle || "");
      const activeNiche = store.niche === "floreria" ? "floreria" : "hamburgueseria";
      const activeModel = store.model && store.model !== "default" ? store.model : (activeNiche === "floreria" ? "bloom" : "bite");
      setSelectedTemplate(activeModel);
      setPremiumModel(activeNiche);
      setIsLoaded(true);
    }
  }, [store, isLoaded]);

  const expectedBgColor = selectedTemplate === "bite" ? "#09090b" : selectedTemplate === "bloom" ? "#fffaf8" : "#fafaf9";
  const isDirty =
    store.model !== selectedTemplate ||
    brandColor !== (store.brandColor || "") ||
    (store as any).bgColor !== expectedBgColor ||
    bannerImages.filter(Boolean).join("|||") !== ((store as any).bannerImage || "") ||
    bannerTitle !== ((store as any).bannerTitle || "") ||
    store.niche !== premiumModel;

  const handleInitializeDemo = async () => {
    setIsInitializing(true);
    const names: Record<string, string> = {
      hamburgueseria: "menú de hamburguesería"
    };
    const toastId = toast.loading(`Inicializando ${names[premiumModel]}...`);
    try {
      // Limpiar productos
      const { error: cleanProdErr } = await supabase.from("products").delete().eq("store_id", store.id);
      if (cleanProdErr) throw cleanProdErr;

      // Limpiar categorías
      const { error: cleanCatErr } = await supabase.from("categories").delete().eq("store_id", store.id);
      if (cleanCatErr) throw cleanCatErr;

      let demoCats: { name: string }[] = [];
      let demoProds: any[] = [];
      let defaultColor = "#ea580c";
      let defaultTitle = "";

      if (premiumModel === "hamburgueseria") {
        defaultColor = "#ea580c";
        defaultTitle = "BITE Burger Co.";
        demoCats = [
          { name: "Hamburguesas|burger" },
          { name: "Papas Fritas|fries" },
          { name: "Bebidas|drink" },
          { name: "Combos|combo" },
          { name: "Postres|dessert" },
        ];
        demoProds = [
          {
            name: "Double Smokin' Burger",
            price: 14.99,
            originalPrice: 19.99,
            categoryName: "Hamburguesas|burger",
            image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
            description: "Doble carne premium de res angus, queso cheddar fundido, tocino ahumado crocante, aros de cebolla caramelizados y salsa secreta artesanal en pan brioche.",
            isOnSale: true,
            visible: true,
            isSample: false,
          },
          {
            name: "Classic Cheese & Bacon",
            price: 11.99,
            categoryName: "Hamburguesas|burger",
            image: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80",
            description: "Carne de res seleccionada a la parrilla, tiras de tocino ahumado, queso cheddar americano, lechuga fresca, tomate y pepinillos.",
            isOnSale: false,
            visible: true,
            isSample: false,
          },
          {
            name: "Bacon & Mushroom Burger",
            price: 13.49,
            categoryName: "Hamburguesas|burger",
            image: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=800&q=80",
            description: "Carne angus, champiñones salteados a las finas hierbas, tocino crocante, queso suizo derretido y alioli de ajo asado.",
            isOnSale: false,
            visible: true,
            isSample: false,
          },
          {
            name: "Spicy BBQ Fries",
            price: 6.49,
            originalPrice: 8.49,
            categoryName: "Papas Fritas|fries",
            image: "https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=800&q=80",
            description: "Crujientes papas fritas rústicas bañadas en nuestra salsa BBQ picante artesanal, cebollín fresco y un toque de ají panca.",
            isOnSale: true,
            visible: true,
            isSample: false,
          },
          {
            name: "Truffle Parmesan Fries",
            price: 7.99,
            categoryName: "Papas Fritas|fries",
            image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=800&q=80",
            description: "Papas fritas al estilo francés perfumadas con aceite de trufa blanca de alba y abundante queso parmesano rallado.",
            isOnSale: false,
            visible: true,
            isSample: false,
          },
          {
            name: "Craft Soda Cola",
            price: 3.99,
            categoryName: "Bebidas|drink",
            image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=800&q=80",
            description: "Bebida artesanal de cola helada, elaborada con jarabe de caña pura y notas cítricas.",
            isOnSale: false,
            visible: true,
            isSample: false,
          },
          {
            name: "Chilled Shake Fudge",
            price: 4.99,
            categoryName: "Bebidas|drink",
            image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&q=80",
            description: "Batido cremoso de helado de vainilla francesa y fudge de chocolate belga, coronado con crema batida.",
            isOnSale: false,
            visible: true,
            isSample: false,
          },
          {
            name: "Bite Megabox Combo",
            price: 18.99,
            originalPrice: 24.99,
            categoryName: "Combos|combo",
            image: "https://images.unsplash.com/photo-1606755962773-d324e0a13086?auto=format&fit=crop&w=800&q=80",
            description: "Double Smokin' Burger + Papas Fritas Truffle + Bebida a elección. Ahorra más de 20% con este combo.",
            isOnSale: true,
            visible: true,
            isSample: false,
          },
          {
            name: "Warm Chocolate Brownie",
            price: 5.99,
            categoryName: "Postres|dessert",
            image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80",
            description: "Brownie de chocolate tibio, con centro húmedo y trozos de nueces pecanas, acompañado de fudge caliente.",
            isOnSale: false,
            visible: true,
            isSample: false,
          },
        ];
      } else if (premiumModel === "restaurante") {
        defaultColor = "#d97706";
        defaultTitle = "La Bistro Gourmet";
        demoCats = [
          { name: "Platos Fuertes|burger" },
          { name: "Entradas|combo" },
          { name: "Pizzas Artesanales|pizza" },
          { name: "Vinos & Bebidas|drink" },
          { name: "Postres Gourmet|dessert" },
        ];
        demoProds = [
          {
            name: "Fettuccine Alfredo con Pollo",
            price: 18.90,
            categoryName: "Platos Fuertes|burger",
            image: "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?auto=format&fit=crop&w=800&q=80",
            description: "Pasta artesanal italiana en salsa Alfredo cremosa con champiñones frescos y pechuga de pollo a la plancha.",
            isOnSale: false,
            visible: true,
            isSample: false,
          },
          {
            name: "Lomo Saltado Criollo",
            price: 22.50,
            originalPrice: 28.50,
            categoryName: "Platos Fuertes|burger",
            image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
            description: "Jugosos trozos de lomo de res salteados al wok con cebolla morada, tomate fresco, ají amarillo y un toque de pisco, servido con papas crujientes y arroz.",
            isOnSale: true,
            visible: true,
            isSample: false,
          },
          {
            name: "Pizza Prosciutto di Parma",
            price: 24.90,
            categoryName: "Pizzas Artesanales|pizza",
            image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80",
            description: "Salsa de tomate casera, queso mozzarella fior di latte, láminas finas de prosciutto de Parma madurado, rúcula fresca y un toque de aceite de oliva virgen extra.",
            isOnSale: false,
            visible: true,
            isSample: false,
          },
          {
            name: "Carpaccio de Lomo",
            price: 14.90,
            categoryName: "Entradas|combo",
            image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
            description: "Finas láminas de lomo de res marinado, alcaparras selectas, abundante queso parmesano laminado y emulsión de vinagreta de limón.",
            isOnSale: false,
            visible: true,
            isSample: false,
          },
          {
            name: "Copa de Vino Tinto Reserva",
            price: 9.50,
            categoryName: "Vinos & Bebidas|drink",
            image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80",
            description: "Selección especial de la cava de la casa, Malbec de gran cuerpo con intensas notas a frutos rojos.",
            isOnSale: false,
            visible: true,
            isSample: false,
          },
          {
            name: "Tiramisú de la Casa",
            price: 6.90,
            categoryName: "Postres Gourmet|dessert",
            image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=800&q=80",
            description: "Postre italiano artesanal con capas de crema de mascarpone, bizcotelas impregnadas en café espresso intenso y notas de licor de Amaretto.",
            isOnSale: false,
            visible: true,
            isSample: false,
          },
        ];
      } else if (premiumModel === "cafeteria") {
        defaultColor = "#b45309";
        defaultTitle = "Sweet & Coffee Co.";
        demoCats = [
          { name: "Cafetería|drink" },
          { name: "Pastelería|dessert" },
          { name: "Helados|icecream" },
          { name: "Sándwiches|burger" },
          { name: "Acompañamientos|combo" },
        ];
        demoProds = [
          {
            name: "Latte Caramel Macchiato",
            price: 4.50,
            categoryName: "Cafetería|drink",
            image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=800&q=80",
            description: "Café espresso seleccionado de origen, leche cremosa vaporizada y un hilo abundante de jarabe de caramelo artesanal dulce.",
            isOnSale: false,
            visible: true,
            isSample: false,
          },
          {
            name: "Cappuccino Tradicional",
            price: 3.80,
            categoryName: "Cafetería|drink",
            image: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=800&q=80",
            description: "Taza de espresso doble, leche vaporizada a la perfección y abundante espuma, espolvoreada con polvo de cacao belga fino.",
            isOnSale: false,
            visible: true,
            isSample: false,
          },
          {
            name: "Torta Selva Negra",
            price: 5.50,
            originalPrice: 7.00,
            categoryName: "Pastelería|dessert",
            image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80",
            description: "Esponjosas capas de bizcocho húmedo de chocolate, abundante crema chantilly, mermelada de cerezas y lluvia de virutas de chocolate.",
            isOnSale: true,
            visible: true,
            isSample: false,
          },
          {
            name: "Copa Gelato Vainilla & Chocolate",
            price: 4.90,
            categoryName: "Helados|icecream",
            image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=800&q=80",
            description: "Dos generosas bolas de helado artesanal súper cremoso, bañado en salsa de fudge de chocolate caliente y coronado con oblea crujiente.",
            isOnSale: false,
            visible: true,
            isSample: false,
          },
          {
            name: "Croissant de Jamón y Queso",
            price: 4.20,
            categoryName: "Sándwiches|burger",
            image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80",
            description: "Masa hojaldrada crujiente elaborada con mantequilla pura, rellena con jamón de pierna y queso edam fundido caliente.",
            isOnSale: false,
            visible: true,
            isSample: false,
          },
          {
            name: "Muffin de Arándanos",
            price: 3.00,
            categoryName: "Acompañamientos|combo",
            image: "https://images.unsplash.com/photo-1607958996333-41aef7caefaa?auto=format&fit=crop&w=800&q=80",
            description: "Bizcocho esponjoso perfumado con vainilla de vaina y arándanos silvestres frescos horneados en su punto.",
            isOnSale: false,
            visible: true,
            isSample: false,
          },
        ];
      }

      const insertedCats: Record<string, string> = {};
      for (const catData of demoCats) {
        const { data, error } = await supabase
          .from("categories")
          .insert({ store_id: store.id, name: catData.name })
          .select()
          .single();
        if (error) throw error;
        insertedCats[catData.name] = data.id;
      }

      const productsToInsert = demoProds.map((dP) => ({
        store_id: store.id,
        category_id: insertedCats[dP.categoryName],
        name: dP.name,
        price: dP.price,
        original_price: dP.originalPrice || null,
        image: dP.image,
        description: dP.description,
        is_on_sale: dP.isOnSale || false,
        visible: dP.visible,
        is_sample: dP.isSample,
      }));

      const { error: prodErr } = await supabase.from("products").insert(productsToInsert);
      if (prodErr) throw prodErr;

      let defaultModel = "bite";
      let expectedBg = "#09090b";

      // Guardar localmente y en BD la configuración de la tienda
      await update(store.id, {
        model: defaultModel,
        brandColor: defaultColor,
        bgColor: expectedBg,
        bannerTitle: defaultTitle,
        niche: premiumModel,
      } as any);

      // Recargar datos
      await useApp.getState().fetchData();

      setBrandColor(defaultColor);
      setBannerTitle(defaultTitle);
      setBannerImage("");

      toast.success(`Demo de ${names[premiumModel]} inicializado con éxito`, { id: toastId });
    } catch (err) {
      console.error("[inicializar demo]", err);
      toast.error("Error al inicializar la demo. Revisa la consola.", { id: toastId });
    } finally {
      setIsInitializing(false);
    }
  };

  const save = async () => {
    const toastId = toast.loading("Guardando diseño...");
    try {
      const serialized = bannerImages.filter(Boolean).join("|||") || null;
      await update(store.id, {
        model: selectedTemplate,
        brandColor: brandColor || null,
        bgColor: selectedTemplate === "bite" ? "#09090b" : selectedTemplate === "bloom" ? "#fffaf8" : "#fafaf9",
        bannerImage: serialized,
        bannerTitle: bannerTitle || null,
        niche: premiumModel,
      } as any);

      const updatedStore = useApp.getState().stores.find((st) => st.id === store.id);
      if (updatedStore) {
        const raw = (updatedStore as any).bannerImage ?? "";
        setBannerImages(raw ? (raw.includes("|||") ? raw.split("|||") : [raw]) : []);
      }

      toast.success("Diseño de diseñador aplicado con éxito", { id: toastId });
    } catch (err) {
      console.error("[save diseño]", err);
      toast.error("Error al guardar. Revisa la consola.", { id: toastId });
    }
  };

  const PREMIUM_COLORS = {
    hamburgueseria: [
      { id: "orange",  name: "Naranja Fuego",     hex: "#ea580c", display: "#ea580c" },
      { id: "amber",   name: "Ámbar Cálido",      hex: "#d97706", display: "#d97706" },
      { id: "yellow",  name: "Amarillo Mostaza",  hex: "#eab308", display: "#eab308" },
      { id: "red",     name: "Rojo Salsa",        hex: "#dc2626", display: "#dc2626" },
    ],
    floreria: [
      { id: "rose",     name: "Rosa Silvestre",    hex: "#be185d", display: "#be185d" },
      { id: "pink",     name: "Rosa Pastel",       hex: "#ec4899", display: "#ec4899" },
      { id: "emerald",  name: "Verde Follaje",     hex: "#059669", display: "#059669" },
      { id: "burgundy", name: "Rojo Borgoña",      hex: "#881337", display: "#881337" },
    ]
  };

  const selectedNicheColors = PREMIUM_COLORS[premiumModel] || PREMIUM_COLORS.hamburgueseria;

  const previewStore = {
    ...store,
    model: selectedTemplate,
    brandColor: brandColor,
    bgColor: selectedTemplate === "bite" ? "#09090b" : selectedTemplate === "bloom" ? "#fffaf8" : "#fafaf9",
    bannerImage: bannerImages.filter(Boolean).join("|||"),
    bannerTitle: bannerTitle,
    niche: premiumModel,
  };

  const premiumModelNames: Record<string, string> = {
    hamburgueseria: "Hamburguesería",
    floreria: "Florería & Regalos",
    restaurante: "Restaurante Gourmet",
    cafeteria: "Cafetería & Pastelería",
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b pb-5 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-orange-500" />
            Personalizador de Diseños Premium
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Diseña un catálogo premium autogestionable optimizado para el nicho comercial de tu negocio.
          </p>
        </div>
        <Badge className="bg-orange-500/10 text-orange-500 border border-orange-500/20 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
          {store.model && store.model !== "default" ? `Diseño ${store.model.toUpperCase()} Activo` : "Diseño Estándar Activo"}
        </Badge>
      </div>

      <div className="flex flex-col lg:flex-row gap-10 items-start">
        {/* Left Side: Configuration Controls */}
        <div className="flex-1 w-full max-w-2xl space-y-8">

          {/* Card 1: Available Premium Templates */}
          <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
                <Sparkles className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-zinc-900">1. Seleccionar Diseño Premium</h3>
                <p className="text-xs text-zinc-500">Selecciona el diseño premium que deseas aplicar y previsualizar en el simulador móvil.</p>
              </div>
            </div>

            {/* Nicho Selection Tabs */}
            <div className="flex gap-2 p-1 bg-zinc-100 rounded-2xl w-full max-w-sm mb-4">
              <button
                type="button"
                onClick={() => {
                  setPremiumModel("hamburgueseria");
                  setSelectedTemplate("bite");
                  setBrandColor("#ea580c");
                }}
                className={cn(
                  "flex-grow py-2 rounded-xl text-xs font-bold transition-all",
                  premiumModel === "hamburgueseria"
                    ? "bg-white text-zinc-950 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-900"
                )}
              >
                Hamburguesería
              </button>
              <button
                type="button"
                onClick={() => {
                  setPremiumModel("floreria");
                  setSelectedTemplate("bloom");
                  setBrandColor("#be185d");
                }}
                className={cn(
                  "flex-grow py-2 rounded-xl text-xs font-bold transition-all",
                  premiumModel === "floreria"
                    ? "bg-white text-zinc-950 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-900"
                )}
              >
                Florería Boutique
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(PREMIUM_TEMPLATES[premiumModel] || []).map((tpl) => {
                const active = selectedTemplate === tpl.id;
                const isCurrentInProduction = store.model === tpl.id && store.niche === premiumModel;
                return (
                  <div
                    key={tpl.id}
                    onClick={() => {
                      setSelectedTemplate(tpl.id);
                      setPremiumModel(premiumModel);
                      setBrandColor(tpl.defaultColor);
                    }}
                    className={cn(
                      "cursor-pointer flex flex-col rounded-2xl border-2 overflow-hidden transition-all hover:scale-[1.01] bg-zinc-50/20",
                      active
                        ? "border-orange-600 bg-orange-50/10 shadow-sm"
                        : "border-zinc-100 hover:border-zinc-200"
                    )}
                  >
                    {/* Thumbnail Image */}
                    <div className="h-32 bg-zinc-100 relative overflow-hidden">
                      <img src={tpl.image} alt={tpl.name} className="w-full h-full object-cover" />
                      {isCurrentInProduction ? (
                        <div className="absolute top-2 right-2 bg-green-600 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-md">
                          Activo en Producción
                        </div>
                      ) : active ? (
                        <div className="absolute top-2 right-2 bg-orange-600 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-md animate-pulse">
                          Previsualizando
                        </div>
                      ) : (
                        <div className="absolute top-2 right-2 bg-zinc-800/80 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-md">
                          Click para Previsualizar
                        </div>
                      )}
                    </div>
                    {/* Details */}
                    <div className="p-4 space-y-1 text-left flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-extrabold text-sm text-zinc-800">{tpl.name}</h4>
                        <p className="text-[11px] text-zinc-500 leading-normal mt-1">{tpl.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>


          {/* Card 2: Brand Color Selection */}
          <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
                <Palette className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-zinc-900">Color de Acento</h3>
                <p className="text-xs text-zinc-500">Destaca botones, insignias de oferta y elementos interactivos.</p>
              </div>
            </div>

            <ColorSwatch
              colors={selectedNicheColors}
              selected={brandColor}
              onSelect={setBrandColor}
              allowCustom
              customLabel="Color personalizado"
            />
          </div>

          {/* Card 3: Banner Image & Banner Title */}
          <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
                <Image className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-zinc-900">Banner de Portada del Restaurante</h3>
                <p className="text-xs text-zinc-500">Imagen panorámica superior que define la identidad de tu cocina.</p>
              </div>
            </div>

            {/* Banner live preview in uploader */}
            {/* Banner list in uploader */}
            {bannerImages.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-zinc-700 uppercase tracking-wider">Imágenes de Portada Activas ({bannerImages.length}/{maxBanners})</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {bannerImages.map((imgUrl, index) => (
                    <div key={index} className="relative aspect-[21/9] rounded-xl overflow-hidden border border-zinc-200 bg-zinc-100 group">
                      <img src={imgUrl} alt={`Banner ${index + 1}`} className="w-full h-full object-cover animate-in fade-in duration-300" />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <button
                        type="button"
                        onClick={() => {
                          setBannerImages(prev => prev.filter((_, i) => i !== index));
                        }}
                        className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-all shadow-md text-xs font-bold z-10"
                      >
                        ✕
                      </button>
                      <span className="absolute bottom-1 left-1.5 bg-black/60 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                        Banner {index + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Specs notice */}
            <div className="flex items-start gap-3 rounded-2xl bg-zinc-50 border border-zinc-100 p-4">
              <svg className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-zinc-700">Dimensión sugerida: 21:9 panorámico (Soporta carrusel de hasta {maxBanners} portadas)</p>
                <p className="text-[11px] text-zinc-500 leading-normal">
                  Puedes subir múltiples imágenes. En el catálogo público, se mostrarán como un carrusel premium con deslizamiento automático.
                </p>
              </div>
            </div>

            {/* Drag and Drop Zone */}
            {bannerImages.length < maxBanners ? (
              <label className={cn(
                "flex flex-col items-center justify-center gap-2 py-8 border-2 border-dashed rounded-2xl cursor-pointer transition-all hover:bg-orange-50/20 hover:border-orange-500/50 border-zinc-200"
              )}>
                <Plus className="h-8 w-8 text-zinc-400" />
                <span className="text-sm font-bold text-zinc-700">Agregar Imagen de Portada</span>
                <span className="text-xs text-zinc-400">Formatos JPG, PNG, WEBP de hasta 10 MB ({bannerImages.length}/{maxBanners})</span>
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 10 * 1024 * 1024) { toast.error("La imagen supera el límite de 10 MB"); return; }
                    try {
                      const { convertImageToWebP } = await import("@/lib/image-utils");
                      const webp = await convertImageToWebP(file);
                      setBannerImages(prev => [...prev, webp]);
                    } catch { toast.error("Error al procesar la imagen."); }
                  }}
                />
              </label>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 py-6 border border-dashed rounded-2xl border-zinc-200 bg-zinc-50 text-zinc-400">
                <span className="text-xs font-bold uppercase tracking-wider">Límite de Banners Alcanzado (5/5)</span>
                <p className="text-[11px] text-center px-4 leading-normal">
                  Elimina uno de tus banners actuales para poder subir una nueva imagen.
                </p>
              </div>
            )}

            {/* Banner Title Input */}
            {selectedTemplate !== "bite" && (
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-zinc-700 uppercase tracking-wider">Título del Banner (Opcional)</label>
                <input
                  type="text"
                  value={bannerTitle}
                  onChange={(e) => setBannerTitle(e.target.value)}
                  placeholder={`Catálogo ${store.name}`}
                  className="flex h-11 w-full rounded-2xl border border-zinc-200 bg-transparent px-4 py-2 text-sm shadow-2xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-orange-500"
                />
              </div>
            )}
          </div>

          {/* Card 4: Demo Menu Initialization (Only for empty stores to prevent data loss) */}
          {store.products.filter((p) => !p.isSample).length === 0 && (
            <div className="rounded-3xl border-2 border-dashed border-zinc-200 bg-zinc-50/50 p-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-2xl bg-zinc-200 flex items-center justify-center shrink-0">
                  <Utensils className="h-6 w-6 text-zinc-500" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-extrabold text-base text-zinc-800 flex items-center gap-1.5">
                    Herramienta de Prueba: Carga de Catálogo Demo <span className="text-[10px] bg-zinc-200 text-zinc-600 px-2 py-0.5 rounded-full font-bold">Opcional</span>
                  </h3>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Crea automáticamente categorías de muestra e íconos temáticos del nicho {premiumModelNames[premiumModel]} y carga productos demo con fotos reales para que puedas probar el catálogo.
                  </p>
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mt-3 flex items-start gap-2.5">
                    <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                    <div className="text-[11px] text-red-800 leading-normal">
                      <p className="font-bold">¡Atención comerciante!</p>
                      <p className="mt-0.5">
                        Si ya tienes tus productos reales creados, <strong>NO utilices este botón</strong>. Esta acción borrará todas tus categorías y productos actuales para reemplazarlos por los de muestra.
                      </p>
                      <p className="mt-1 font-semibold text-red-700">
                        Para cambiar solo el diseño visual de tus productos existentes, selecciona el nicho y el color de acento arriba, luego haz clic en "Guardar Cambios".
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex pt-2">
                <Button
                  type="button"
                  disabled={isInitializing}
                  onClick={async () => {
                    if (window.confirm(`¿Seguro que deseas inicializar el catálogo demo de ${premiumModelNames[premiumModel]}? Esto ELIMINARÁ permanentemente tus categorías y productos actuales.`)) {
                      await handleInitializeDemo();
                    }
                  }}
                  className="w-full bg-zinc-800 hover:bg-zinc-950 text-white rounded-2xl font-bold py-3.5 shadow-sm transition-all active:scale-[0.99] border-none"
                >
                  {isInitializing ? (
                    <>
                      <span className="animate-spin inline-block mr-2 border-2 border-white border-t-transparent rounded-full h-4 w-4" />
                      Creando catálogo demo...
                    </>
                  ) : (
                    `Inicializar Demo de ${premiumModelNames[premiumModel]}`
                  )}
                </Button>
              </div>
            </div>
          )}

        </div>

        {/* Right Side: Smartphone Mockup Frame */}
        <div className="lg:sticky lg:top-6 w-full lg:w-[380px] flex flex-col items-center shrink-0">
          <div className="relative w-[360px] h-[720px] bg-zinc-950 rounded-[48px] p-3.5 border-[6px] border-zinc-800 ring-1 ring-zinc-700/50 flex flex-col overflow-hidden select-none" style={{
            boxShadow: `0 25px 60px -15px ${brandColor ? brandColor + "25" : "rgba(234, 88, 12, 0.15)"}`
          }}>
            {/* Notch / Dynamic Island */}
            <div className="absolute top-4.5 left-1/2 -translate-x-1/2 w-28 h-5.5 bg-black rounded-full z-40 flex items-center justify-center">
              <div className="w-10 h-1 bg-zinc-900 rounded-full" />
            </div>

            {/* Status Bar */}
            <div className="h-6 bg-[#09090b] w-full shrink-0 flex items-center justify-between px-6 pt-1 text-[10px] text-zinc-400 font-bold z-30">
              <span>9:41</span>
              <div className="flex items-center gap-1.5">
                <span>5G</span>
                <div className="w-4 h-2 border border-zinc-700 rounded-xs p-0.5 flex items-center">
                  <div className="w-full h-full bg-zinc-400 rounded-3xs" />
                </div>
              </div>
            </div>

            {/* Simulated Live Frame */}
            <div className="flex-grow overflow-y-auto no-scrollbar rounded-[34px] border border-zinc-900 bg-[#09090b] relative">
              <PublicCatalog store={previewStore as any} mode="catalog" isMockup={true} />
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground text-center mt-4 max-w-[320px] leading-relaxed">
            <strong>Simulador Interactivo:</strong> Puedes hacer scroll, navegar categorías y agregar productos en tiempo real.
          </p>
        </div>
      </div>

      {/* Floating Save Banner */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex gap-3 items-center">
        <div className="bg-white dark:bg-zinc-900 rounded-full shadow-2xl border px-4 py-2.5 flex items-center gap-4 animate-in slide-in-from-bottom-4 duration-300">
          {isDirty ? (
            <>
              <span className="text-xs font-semibold text-zinc-500">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-500 mr-2 animate-pulse" />
                Cambios sin guardar
              </span>
              <Button onClick={save} className="rounded-full bg-orange-600 hover:bg-orange-700 text-white font-bold px-6 py-2 shadow-lg transition-transform active:scale-95 border-none">
                <Check className="h-4 w-4 mr-1.5" />
                Guardar Cambios
              </Button>
            </>
          ) : (
            <span className="text-xs text-zinc-500 flex items-center gap-2 px-2.5 py-1">
              <Sparkles className="h-4 w-4 text-orange-500" />
              Diseño guardado y en producción
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
