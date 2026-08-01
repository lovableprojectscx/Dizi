import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ShoppingBag,
  MessageCircle,
  Smartphone,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Store,
  FileDown,
  Menu,
  X,
  Sparkles,
  ShieldCheck,
  Layers,
  ChevronRight,
  ExternalLink,
  ChevronDown,
  Check,
  Flame,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dizi — Plataforma N°1 de Catálogos Digitales para MYPEs | Vende por WhatsApp" },
      {
        name: "description",
        content:
          "Crea tu catálogo digital web interactivo en 2 minutos y vende por WhatsApp sin comisiones ni intermediarios. 15 modelos de diseño profesional (Bite, Bloom, Nature, Overlay, Editorial). Prueba 15 días gratis.",
      },
      {
        name: "keywords",
        content:
          "catálogo digital, catálogo web, vender por WhatsApp, catálogo gratis, MYPE Perú, tienda virtual, catálogo PDF, link en bio, catálogo restaurantes, catálogo ropa",
      },
      { property: "og:title", content: "Dizi — Catálogos Digitales Interactivos para MYPEs" },
      {
        property: "og:description",
        content:
          "Crea tu catálogo web en 2 minutos. Tus clientes exploran productos y te envían pedidos armados directo a tu WhatsApp. Sin comisiones.",
      },
      { property: "og:image", content: "https://dizi.idenza.site/images/dizi-logo-principal-color.png" },
    ],
    links: [{ rel: "canonical", href: "https://dizi.idenza.site/" }],
  }),
  component: LandingPage,
});

function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTabNiche, setActiveTabNiche] = useState<string>("all");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const showcaseModels = [
    {
      id: "bite",
      name: "Bite Gastronómico",
      niche: "Gastronomía / Restobar",
      desc: "Carrusel de categorías táctiles, badges de dieta y pedidos inmediatos.",
      badge: "Más Popular",
      textColor: "text-red-600 dark:text-red-400",
      borderColor: "border-red-200 dark:border-red-900/40",
      category: "gastronomia",
    },
    {
      id: "bloom_floral",
      name: "Bloom Floral",
      niche: "Florerías / Regalos",
      desc: "Estética romántica de esquinas suaves y detalles curvos botánicos.",
      badge: "Romántico",
      textColor: "text-rose-600 dark:text-rose-400",
      borderColor: "border-rose-200 dark:border-rose-900/40",
      category: "boutique",
    },
    {
      id: "nature",
      name: "Nature Orgánico",
      niche: "Salud / Cosmética / Eco",
      desc: "Verde salvia refrescante con tipografía serif y tarjetas en diagonal.",
      badge: "Ecológico",
      textColor: "text-emerald-600 dark:text-emerald-400",
      borderColor: "border-emerald-200 dark:border-emerald-900/40",
      category: "eco",
    },
    {
      id: "overlay",
      name: "Overlay Visual",
      niche: "Moda / Calzado",
      desc: "Tarjetas 3:4 verticales con texto luminoso superpuesto estilo ZARA.",
      badge: "Tendencia",
      textColor: "text-amber-600 dark:text-amber-400",
      borderColor: "border-amber-200 dark:border-amber-900/40",
      category: "boutique",
    },
    {
      id: "editorial",
      name: "Estilo Editorial",
      niche: "Corporativo / Luxe",
      desc: "Lista horizontal minimalista Net-a-Porter con imágenes y descripciones.",
      badge: "Lujo",
      textColor: "text-slate-700 dark:text-slate-300",
      borderColor: "border-slate-200 dark:border-slate-800",
      category: "luxe",
    },
    {
      id: "tiles",
      name: "Mosaico Tiles",
      niche: "Tecnología / Accesorios",
      desc: "Bloques asimétricos interconectados inspirados en tiendas Apple.",
      badge: "Moderno",
      textColor: "text-purple-600 dark:text-purple-400",
      borderColor: "border-purple-200 dark:border-purple-900/40",
      category: "tech",
    },
  ];

  const filteredModels =
    activeTabNiche === "all"
      ? showcaseModels
      : showcaseModels.filter((m) => m.category === activeTabNiche);

  const faqs = [
    {
      q: "¿Cómo reciben mis clientes los pedidos en WhatsApp?",
      a: "Tus clientes navegan por tu catálogo web, agregan los productos que desean a su carrito y al presionar 'Enviar Pedido', el sistema abre su aplicación de WhatsApp con la lista detallada del pedido formateada con nombres, cantidades y precio total.",
    },
    {
      q: "¿Cobran alguna comisión por mis ventas?",
      a: "¡Cero comisiones! A diferencia de plataformas como Rappi o PedidosYa, en Dizi todas las ventas y pagos se realizan directamente entre tú y tu cliente. No cobramos comisiones por transacción.",
    },
    {
      q: "¿Mis clientes tienen que descargar alguna aplicación?",
      a: "No. Tu catálogo funciona como una página web ultra-rápida y ligera. Tus clientes simplemente hacen clic en tu enlace público y el catálogo se abre al instante en el navegador de su teléfono.",
    },
    {
      q: "¿Puedo exportar mi catálogo en formato PDF?",
      a: "Sí. Los planes pagados incluyen el módulo de Exportador PDF Vectorial. Con un solo clic se genera un documento profesional con el diseño y colores de tu tienda, listo para enviar o imprimir.",
    },
    {
      q: "¿Cómo funciona el período de prueba gratuito de 15 días?",
      a: "Al registrarte comienzas inmediatamente con 15 días de acceso total al Plan Pro sin pagar nada ni ingresar tarjeta de crédito. Al finalizar los 15 días puedes elegir continuar con un plan pagado o quedarte con el Plan Semilla Gratuito.",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased selection:bg-primary selection:text-primary-foreground">
      {/* ── 1. HEADER / NAVBAR DE NAVEGACIÓN ── */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/90 backdrop-blur-md transition-all">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <img
              src="/images/dizi-logo-principal-color.png"
              alt="Dizi Catálogos Digitales"
              className="h-9 sm:h-11 w-auto object-contain transition-transform group-hover:scale-105"
            />
          </Link>

          {/* Navegación Desktop */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <a href="#beneficios" className="hover:text-primary transition-colors">
              Beneficios
            </a>
            <a href="#modelos" className="hover:text-primary transition-colors">
              Diseños (15)
            </a>
            <a href="#modulos" className="hover:text-primary transition-colors">
              Funciones
            </a>
            <a href="#precios" className="hover:text-primary transition-colors">
              Planes & Precios
            </a>
            <Link to="/novedades" className="hover:text-primary transition-colors">
              Novedades
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              asChild
              className="hidden md:flex font-bold text-xs rounded-xl h-10 px-4"
            >
              <Link to="/login">Iniciar Sesión</Link>
            </Button>
            <Button
              asChild
              className="hidden md:flex font-extrabold text-xs rounded-xl h-10 px-5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:scale-105"
            >
              <Link to="/register">
                Crear Catálogo Gratis <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            {/* Botón Hamburguesa Móvil */}
            <button
              className="md:hidden flex items-center justify-center h-10 w-10 rounded-xl bg-muted/60 border border-border/40 transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menú de Navegación"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Menú Desplegable Móvil */}
        {menuOpen && (
          <div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur-md px-4 py-5 space-y-3 animate-in slide-in-from-top duration-200">
            <a
              href="#beneficios"
              className="block px-4 py-2.5 rounded-xl text-xs font-bold text-foreground hover:bg-muted transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Beneficios Clave
            </a>
            <a
              href="#modelos"
              className="block px-4 py-2.5 rounded-xl text-xs font-bold text-foreground hover:bg-muted transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Modelos de Diseño (15)
            </a>
            <a
              href="#modulos"
              className="block px-4 py-2.5 rounded-xl text-xs font-bold text-foreground hover:bg-muted transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Módulos Avanzados
            </a>
            <a
              href="#precios"
              className="block px-4 py-2.5 rounded-xl text-xs font-bold text-foreground hover:bg-muted transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Planes & Precios
            </a>
            <Link
              to="/novedades"
              className="block px-4 py-2.5 rounded-xl text-xs font-bold text-foreground hover:bg-muted transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Novedades & Actualizaciones
            </Link>
            <div className="pt-3 border-t border-border/40 grid grid-cols-2 gap-2">
              <Button variant="outline" asChild className="w-full font-bold text-xs rounded-xl h-10">
                <Link to="/login" onClick={() => setMenuOpen(false)}>
                  Iniciar Sesión
                </Link>
              </Button>
              <Button asChild className="w-full font-extrabold text-xs rounded-xl h-10 shadow-md">
                <Link to="/register" onClick={() => setMenuOpen(false)}>
                  Crear Gratis
                </Link>
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* ── 2. SECCIÓN HERO DE ALTO IMPACTO (SEO OPTIMIZADO) ── */}
      <section className="relative overflow-hidden pt-12 sm:pt-20 pb-16 sm:pb-28 bg-gradient-to-b from-primary/[0.04] via-background to-background">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* LADO IZQUIERDO: TEXTOS SEO & ACCIONES */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Badge de Plataforma */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider shadow-xs">
                <Sparkles className="h-3.5 w-3.5" />
                <span>La Plataforma N°1 de Catálogos Web para MYPEs</span>
              </div>

              {/* Título Principal SEO */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.12]">
                Crea tu Catálogo Web y Vende por{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-orange-500 to-amber-500">
                  WhatsApp en 2 Minutos
                </span>
              </h1>

              {/* Subtítulo Descriptivo */}
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Digitaliza tu negocio sin comisiones. Tus clientes exploran productos en una experiencia
                móvil ultra-rápida, arman su carrito y te envían el pedido directo a tu teléfono.
              </p>

              {/* Botones Primarios de Acción */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                <Button
                  asChild
                  size="lg"
                  className="w-full sm:w-auto h-13 px-8 rounded-2xl font-black text-sm bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/30 transition-all hover:scale-105 gap-2"
                >
                  <Link to="/register">
                    🚀 Crear Mi Catálogo Gratis
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto h-13 px-7 rounded-2xl font-bold text-sm border-border/80 hover:bg-muted gap-2 shadow-xs"
                >
                  <a href="/t/grano-miga" target="_blank" rel="noopener noreferrer">
                    <Smartphone className="h-4 w-4 text-primary" /> Probar Demo en Vivo
                    <ExternalLink className="h-3.5 w-3.5 opacity-60" />
                  </a>
                </Button>
              </div>

              {/* Garantías y Requisitos */}
              <div className="pt-4 flex items-center justify-center lg:justify-start gap-6 text-xs text-muted-foreground font-semibold flex-wrap">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Sin descargas de apps</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>100% Móvil & Responsivo</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>15 Días de Prueba Premium</span>
                </div>
              </div>
            </div>

            {/* LADO DERECHO: MOCKUP INTERACTIVO DE TELÉFONO */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <div className="relative w-full max-w-[320px] sm:max-w-[360px] aspect-[9/18] rounded-[2.8rem] bg-zinc-950 p-3 shadow-2xl ring-1 ring-zinc-800 border-4 border-zinc-900 overflow-hidden group">
                {/* Altavoz y Cámara de iPhone */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 h-5 w-28 bg-zinc-950 rounded-b-2xl z-40 flex items-center justify-center">
                  <div className="h-2 w-10 bg-zinc-800 rounded-full"></div>
                </div>

                {/* Pantalla Simulada del Catálogo */}
                <div className="h-full w-full rounded-[2.2rem] bg-card overflow-hidden flex flex-col justify-between pt-6 pb-4 px-3 text-left relative z-10 font-sans border border-border/30">
                  {/* Header de Tienda en Móvil */}
                  <div className="space-y-2 border-b border-border/40 pb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                        Grano & Miga · Café
                      </span>
                      <span className="text-[9px] font-extrabold bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        Abierto
                      </span>
                    </div>
                    <div className="flex items-center gap-1 bg-muted/60 p-1.5 rounded-xl border text-[11px] text-muted-foreground">
                      <ShoppingBag className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">¿Qué deseas pedir hoy?</span>
                    </div>
                  </div>

                  {/* Pestañas de Categoría */}
                  <div className="flex gap-1.5 py-2 overflow-x-auto no-scrollbar">
                    <span className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-primary text-primary-foreground shrink-0">
                      ☕ Cafetería
                    </span>
                    <span className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-muted text-muted-foreground shrink-0">
                      🥐 Panadería
                    </span>
                    <span className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-muted text-muted-foreground shrink-0">
                      🍰 Postres
                    </span>
                  </div>

                  {/* Grid de Productos Simulado */}
                  <div className="grid grid-cols-2 gap-2 flex-1 my-1 overflow-hidden">
                    <div className="bg-muted/40 border border-border/40 rounded-xl p-2 flex flex-col justify-between">
                      <div className="h-16 w-full rounded-lg bg-muted relative overflow-hidden">
                        <img
                          src="https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=300&q=80"
                          alt="Café Latte"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="mt-1 space-y-0.5">
                        <p className="text-[11px] font-bold text-foreground truncate">Latte Especial</p>
                        <p className="text-[10px] font-black text-primary">S/ 12.00</p>
                      </div>
                    </div>

                    <div className="bg-muted/40 border border-border/40 rounded-xl p-2 flex flex-col justify-between">
                      <div className="h-16 w-full rounded-lg bg-muted relative overflow-hidden">
                        <img
                          src="https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=300&q=80"
                          alt="Croissant"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="mt-1 space-y-0.5">
                        <p className="text-[11px] font-bold text-foreground truncate">Croissant Almendras</p>
                        <p className="text-[10px] font-black text-primary">S/ 16.00</p>
                      </div>
                    </div>
                  </div>

                  {/* Botón Flotante Carrito WhatsApp en Móvil */}
                  <div className="bg-[#25D366] text-white p-2.5 rounded-xl font-extrabold text-xs flex items-center justify-between shadow-lg shadow-[#25D366]/20">
                    <div className="flex items-center gap-1.5">
                      <MessageCircle className="h-4 w-4 fill-white" />
                      <span>Pedir por WhatsApp</span>
                    </div>
                    <span className="bg-white/20 px-2 py-0.5 rounded-md text-[10px]">S/ 28.00</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. SECCIÓN EL PROBLEMA vs LA SOLUCIÓN DIZI ── */}
      <section id="beneficios" className="py-16 sm:py-24 bg-card border-y border-border/40">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-12 sm:mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              La Evolución del Comercio Digital
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Deja atrás el caos de vender con fotos sueltas
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Dizi transforma la manera en que tus clientes eligen tus productos y te envían sus pedidos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* TARJETA 1: ANTES (MÉTODOS TRADICIONALES) */}
            <div className="p-6 sm:p-8 rounded-3xl bg-red-500/[0.02] border border-red-500/20 space-y-5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 font-bold text-xs uppercase tracking-wider">
                  <XCircle className="h-4 w-4" /> Métodos Tradicionales Rígidos
                </div>
                <h3 className="text-xl font-bold text-foreground">El caos de vender por chat o PDFs</h3>
                <ul className="space-y-3 pt-2 text-xs sm:text-sm text-muted-foreground">
                  <li className="flex items-start gap-2.5">
                    <XCircle className="h-4.5 w-4.5 text-red-500 shrink-0 mt-0.5" />
                    <span>Fotos sueltas enviadas por chat que saturan la memoria del cliente.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <XCircle className="h-4.5 w-4.5 text-red-500 shrink-0 mt-0.5" />
                    <span>PDFs pesados creados en Canva que tardan en abrir y se desactualizan rápido.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <XCircle className="h-4.5 w-4.5 text-red-500 shrink-0 mt-0.5" />
                    <span>Comisiones de hasta 30% cobradas por aplicaciones de delivery.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <XCircle className="h-4.5 w-4.5 text-red-500 shrink-0 mt-0.5" />
                    <span>Preguntas repetitivas por precios y disponibilidad en cada mensaje.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* TARJETA 2: CON DIZI (SOLUCIÓN INTELIGENTE) */}
            <div className="p-6 sm:p-8 rounded-3xl bg-emerald-500/[0.02] border border-emerald-500/30 space-y-5 flex flex-col justify-between relative overflow-hidden group shadow-sm">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
                  <CheckCircle2 className="h-4 w-4" /> La Experiencia Dizi
                </div>
                <h3 className="text-xl font-bold text-foreground">Tu catálogo web rápido, limpio y sin comisiones</h3>
                <ul className="space-y-3 pt-2 text-xs sm:text-sm text-foreground/90 font-medium">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Enlace único y profesional para tu bio de Instagram, TikTok o Facebook.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Carrito de compras que suma automáticamente y envía el pedido a tu WhatsApp.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>100% libre de comisiones por venta. Todo el dinero va a tu cuenta.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Exportación instantánea en PDF vectorial para clientes corporativos.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. SHOWCASE INTERACTIVO DE LAS 15 ESTRUCTURAS DE DISEÑO ── */}
      <section id="modelos" className="py-16 sm:py-28 bg-background">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-10 sm:mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              Personalización Total sin Código
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              15 Estructuras de Diseño para cada Rubro
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Elige el estilo que mejor representa la personalidad de tu marca. Cambia colores, tipografía y módulos con un solo clic.
            </p>

            {/* Selector de Pestañas de Rubro */}
            <div className="flex items-center justify-center gap-1.5 pt-4 flex-wrap">
              <button
                onClick={() => setActiveTabNiche("all")}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                  activeTabNiche === "all"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:text-foreground",
                )}
              >
                Todos los Diseños (15)
              </button>
              <button
                onClick={() => setActiveTabNiche("gastronomia")}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                  activeTabNiche === "gastronomia"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:text-foreground",
                )}
              >
                🍔 Gastronomía
              </button>
              <button
                onClick={() => setActiveTabNiche("boutique")}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                  activeTabNiche === "boutique"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:text-foreground",
                )}
              >
                🌸 Moda & Boutique
              </button>
              <button
                onClick={() => setActiveTabNiche("eco")}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                  activeTabNiche === "eco"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:text-foreground",
                )}
              >
                🌿 Orgánico & Eco
              </button>
              <button
                onClick={() => setActiveTabNiche("tech")}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                  activeTabNiche === "tech"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:text-foreground",
                )}
              >
                🧱 Tecnología
              </button>
            </div>
          </div>

          {/* Grilla de Tarjetas de Modelo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredModels.map((model) => (
              <div
                key={model.id}
                className={cn(
                  "p-6 rounded-3xl border bg-card transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col justify-between space-y-4",
                  model.borderColor,
                )}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={cn("text-xs font-black uppercase tracking-wider", model.textColor)}>
                      {model.niche}
                    </span>
                    <span className="text-[9.5px] font-extrabold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                      {model.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-foreground">{model.name}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{model.desc}</p>
                </div>

                <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    ✨ 100% Semántico & Adaptable
                  </span>
                  <Button asChild size="sm" variant="ghost" className="h-8 rounded-lg text-xs font-bold gap-1 text-primary hover:bg-primary/10">
                    <Link to="/register">
                      Probar <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. MÓDULOS & FUNCIONALIDADES AVANZADAS ── */}
      <section id="modulos" className="py-16 sm:py-24 bg-muted/30 border-y border-border/40">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-12 sm:mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              Módulos Integrados de Plataforma
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Todo lo que necesitas para potenciar tus ventas
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Herramientas diseñadas para maximizar la conversión de tus clientes desde su primer clic.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-card border border-border/50 shadow-xs space-y-3">
              <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                <Flame className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm text-foreground">Cintillo Promocional</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Anuncia envíos gratis, ofertas relámpago o cupones de descuento con animación Marquesina.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border/50 shadow-xs space-y-3">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                <Layers className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm text-foreground">Banners Multi-Imagen</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Carrusel deslizante automático de hasta 5 banners promocionales para destacar campañas.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border/50 shadow-xs space-y-3">
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                <FileDown className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm text-foreground">Exportador Catálogo PDF</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Genera en 1 clic un PDF vectorial con el logo y colores de tu negocio para clientes mayoristas.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border/50 shadow-xs space-y-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm text-foreground">Protección In-App Browser</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Detección inteligente para navegadores de TikTok e Instagram garantizando la llegada del pedido a WhatsApp.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. PLANES & PRECIOS TRANSPARENTES ── */}
      <section id="precios" className="py-16 sm:py-28 bg-background">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-12 sm:mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              Suscripción Transparente
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Planes diseñados para cada etapa de tu negocio
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Comienza gratis hoy. Puedes cambiar o cancelar tu plan en cualquier momento sin penalizaciones.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {/* PLAN SEMILLA */}
            <div className="p-6 rounded-3xl border border-border/60 bg-card flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  Gratuito
                </span>
                <h3 className="text-xl font-bold text-foreground">Plan Semilla</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-foreground">S/ 0</span>
                  <span className="text-xs text-muted-foreground">/mes</span>
                </div>
                <p className="text-xs text-muted-foreground">Para emprendedores que están iniciando su negocio.</p>
                <ul className="space-y-2.5 text-xs text-foreground pt-2">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Hasta 20 Productos</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Plantilla Minimalista</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Carrito a WhatsApp</span>
                  </li>
                </ul>
              </div>
              <Button asChild variant="outline" className="w-full font-bold text-xs rounded-xl h-10">
                <Link to="/register">Crear Cuenta Gratis</Link>
              </Button>
            </div>

            {/* PLAN EMPRENDEDOR */}
            <div className="p-6 rounded-3xl border border-border/60 bg-card flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <span className="text-xs font-bold text-primary uppercase tracking-widest">
                  Crecimiento
                </span>
                <h3 className="text-xl font-bold text-foreground">Emprendedor</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-foreground">S/ 29</span>
                  <span className="text-xs text-muted-foreground">/mes</span>
                </div>
                <p className="text-xs text-muted-foreground">Ideal para negocios activos con flujo de ventas diario.</p>
                <ul className="space-y-2.5 text-xs text-foreground pt-2">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Hasta 100 Productos</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Todas las 15 Estructuras</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Exportación Catálogo PDF</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Sin Marca de Agua Dizi</span>
                  </li>
                </ul>
              </div>
              <Button asChild variant="outline" className="w-full font-bold text-xs rounded-xl h-10">
                <Link to="/register">Elegir Emprendedor</Link>
              </Button>
            </div>

            {/* PLAN PRO (MÁS POPULAR) */}
            <div className="p-6 rounded-3xl border-2 border-primary bg-primary/[0.02] flex flex-col justify-between space-y-6 relative shadow-xl shadow-primary/10">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground font-extrabold text-[10px] uppercase tracking-widest px-3 py-1 rounded-full">
                Más Popular ⭐
              </div>
              <div className="space-y-4 pt-1">
                <span className="text-xs font-bold text-primary uppercase tracking-widest">
                  Recomendado
                </span>
                <h3 className="text-xl font-bold text-foreground">Plan Pro</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-foreground">S/ 49</span>
                  <span className="text-xs text-muted-foreground">/mes</span>
                </div>
                <p className="text-xs text-muted-foreground">Para tiendas en expansión con alto volumen de inventario.</p>
                <ul className="space-y-2.5 text-xs text-foreground pt-2 font-medium">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Hasta 500 Productos</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Carrusel 3 Banners</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Página Link en Bio</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Estadísticas Clics & Visitas</span>
                  </li>
                </ul>
              </div>
              <Button asChild className="w-full font-extrabold text-xs rounded-xl h-10 shadow-md">
                <Link to="/register">Comenzar Prueba Pro</Link>
              </Button>
            </div>

            {/* PLAN ILIMITADO */}
            <div className="p-6 rounded-3xl border border-border/60 bg-card flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">
                  Empresarial
                </span>
                <h3 className="text-xl font-bold text-foreground">Plan Ilimitado</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-foreground">S/ 79</span>
                  <span className="text-xs text-muted-foreground">/mes</span>
                </div>
                <p className="text-xs text-muted-foreground">Potencia máxima sin restricciones de capacidad.</p>
                <ul className="space-y-2.5 text-xs text-foreground pt-2">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Productos Ilimitados ($\infty$)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Carrusel 5 Banners</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Atributos de Marca Pro</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Soporte Prioritario</span>
                  </li>
                </ul>
              </div>
              <Button asChild variant="outline" className="w-full font-bold text-xs rounded-xl h-10">
                <Link to="/register">Elegir Ilimitado</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. PREGUNTAS FRECUENTES (FAQ CON SEO SCHEMA) ── */}
      <section className="py-16 sm:py-24 bg-card border-t border-border/40">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6">
          <div className="text-center space-y-3 mb-10 sm:mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              Resolviendo tus Dudas
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Preguntas Frecuentes sobre Dizi
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="border border-border/60 rounded-2xl bg-background overflow-hidden transition-colors"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-5 text-left font-bold text-sm sm:text-base text-foreground flex items-center justify-between gap-4"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-primary shrink-0 transition-transform duration-200",
                      openFaq === idx && "rotate-180",
                    )}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-5 pt-0 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-border/20 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. BANNER FINAL CTA ── */}
      <section className="py-16 sm:py-20 bg-gradient-to-r from-primary via-orange-600 to-amber-600 text-white text-center">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 space-y-6">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
            ¿Listo para digitalizar tu catálogo hoy?
          </h2>
          <p className="text-sm sm:text-base opacity-90 max-w-xl mx-auto font-medium">
            Regístrate gratis en 2 minutos y comienza a vender por WhatsApp de forma profesional.
          </p>
          <div className="pt-2">
            <Button
              asChild
              size="lg"
              className="h-13 px-9 rounded-2xl font-black text-sm bg-white text-primary hover:bg-white/90 shadow-2xl transition-all hover:scale-105"
            >
              <Link to="/register">
                🚀 Crear Mi Catálogo Gratis
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── 9. FOOTER INSTITUCIONAL ── */}
      <footer className="border-t border-border/40 bg-background py-12 text-xs text-muted-foreground">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 space-y-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col items-center md:items-start gap-2">
              <img
                src="/images/dizi-logo-principal-color.png"
                alt="Dizi Logo"
                className="h-8 w-auto object-contain"
              />
              <p className="text-[11px] text-muted-foreground">
                Plataforma de Catálogos Web para MYPEs en Perú. Operado por <strong>Idenza</strong>.
              </p>
            </div>

            <div className="flex items-center gap-6 font-bold text-foreground">
              <Link to="/ayuda" className="hover:text-primary transition-colors">
                Centro de Ayuda
              </Link>
              <Link to="/novedades" className="hover:text-primary transition-colors">
                Novedades
              </Link>
              <Link to="/terminos" className="hover:text-primary transition-colors">
                Términos
              </Link>
              <Link to="/privacidad" className="hover:text-primary transition-colors">
                Privacidad
              </Link>
            </div>
          </div>

          <div className="border-t border-border/40 pt-6 text-center text-[10px] text-muted-foreground">
            © {new Date().getFullYear()} Dizi · Todos los derechos reservados. Hecho con ❤️ para emprendedores peruanos.
          </div>
        </div>
      </footer>
    </div>
  );
}
