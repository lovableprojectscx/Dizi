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
  Zap,
  TrendingUp,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dizi — Plataforma N°1 de Catálogos Digitales para MYPEs | Vende por WhatsApp" },
      {
        name: "description",
        content:
          "Crea tu catálogo digital web interactivo en 2 minutos y vende por WhatsApp sin comisiones. 15 modelos de diseño profesional. Prueba 15 días gratis.",
      },
      {
        name: "keywords",
        content:
          "catálogo digital, catálogo web, vender por WhatsApp, catálogo gratis, MYPE Perú, tienda virtual, catálogo PDF, link en bio",
      },
      { property: "og:title", content: "Dizi — Catálogos Digitales Interactivos para MYPEs" },
      {
        property: "og:description",
        content:
          "Crea tu catálogo web en 2 minutos. Tus clientes exploran productos y te envían pedidos armados directo a tu WhatsApp.",
      },
      { property: "og:image", content: "https://dizi.idenza.site/images/dizi-logo-principal-color.png" },
    ],
    links: [{ rel: "canonical", href: "https://dizi.idenza.site/" }],
  }),
  component: LandingPage,
});

function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeNiche, setActiveNiche] = useState<string>("all");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const showcaseModels = [
    {
      id: "bite",
      name: "Bite Gastronómico",
      niche: "Gastronomía / Restobar",
      desc: "Categorías táctiles, badges de especialidades y pedidos inmediatos a cocina.",
      badge: "Popular",
      category: "gastronomia",
      image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80",
      accent: "border-orange-500/30 text-orange-600 dark:text-orange-400 bg-orange-500/10",
    },
    {
      id: "bloom_floral",
      name: "Bloom Floral",
      niche: "Florerías / Regalos",
      desc: "Estética delicada con esquinas suaves para florerías, arreglos y detalles.",
      badge: "Romántico",
      category: "boutique",
      image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80",
      accent: "border-pink-500/30 text-pink-600 dark:text-pink-400 bg-pink-500/10",
    },
    {
      id: "nature",
      name: "Nature Orgánico",
      niche: "Salud / Cosmética / Eco",
      desc: "Paleta verde salvia refrescante para cosmética artesanal y productos naturales.",
      badge: "Ecológico",
      category: "eco",
      image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80",
      accent: "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
    },
    {
      id: "overlay",
      name: "Overlay Visual",
      niche: "Moda / Calzado",
      desc: "Formato 3:4 vertical inspirado en catálogos de moda con fotos de alta calidad.",
      badge: "Tendencia",
      category: "boutique",
      image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=600&q=80",
      accent: "border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10",
    },
    {
      id: "editorial",
      name: "Estilo Editorial",
      niche: "Corporativo / Luxe",
      desc: "Lista horizontal minimalista Net-a-Porter para marcas exclusivas.",
      badge: "Lujo",
      category: "luxe",
      image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=600&q=80",
      accent: "border-slate-500/30 text-slate-700 dark:text-slate-300 bg-slate-500/10",
    },
    {
      id: "tiles",
      name: "Mosaico Tiles",
      niche: "Tecnología / Accesorios",
      desc: "Bloques asimétricos interactivos en cuadrícula para gadgets y tecnología.",
      badge: "Moderno",
      category: "tech",
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80",
      accent: "border-purple-500/30 text-purple-600 dark:text-purple-400 bg-purple-500/10",
    },
  ];

  const filteredModels =
    activeNiche === "all"
      ? showcaseModels
      : showcaseModels.filter((m) => m.category === activeNiche);

  const faqs = [
    {
      q: "¿Cómo reciben mis clientes los pedidos en WhatsApp?",
      a: "Tus clientes agregan sus productos al carrito y presionan 'Enviar Pedido'. Dizi abre automáticamente su app de WhatsApp con la lista de compra detallada y el total en Soles.",
    },
    {
      q: "¿Cobran comisiones por venta?",
      a: "Cero comisiones. Todo el dinero de tus ventas ingresa directamente a tu cuenta bancaria o Yape/Plin sin intermediarios.",
    },
    {
      q: "¿Mis clientes tienen que descargar alguna app?",
      a: "No. Tu catálogo es una página web ultrarrápida. Tus clientes acceden mediante un enlace único desde Instagram, TikTok o Facebook.",
    },
    {
      q: "¿Puedo exportar mi catálogo en PDF?",
      a: "Sí. Todos los planes pagados generan en 1 clic un PDF vectorial con tu logotipo y lista de precios oficial para clientes mayoristas.",
    },
    {
      q: "¿Cómo funciona la prueba gratis de 15 días?",
      a: "Al registrarte inicias con 15 días completos del Plan Pro gratis, sin ingresar tarjeta de crédito.",
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
              Módulos Pro
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
              className="hidden md:flex font-bold text-xs rounded-xl h-10 px-4 text-foreground hover:bg-muted"
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
              Diseños Premium (15)
            </a>
            <a
              href="#modulos"
              className="block px-4 py-2.5 rounded-xl text-xs font-bold text-foreground hover:bg-muted transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Módulos Pro
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
              Novedades
            </Link>
            <div className="pt-3 border-t border-border/40 grid grid-cols-2 gap-2">
              <Button variant="outline" asChild className="w-full font-bold text-xs rounded-xl h-10 text-foreground">
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

      {/* ── 2. SECCIÓN HERO BALANCEADA PARA PC Y MÓVIL (SIN HUECOS VACÍOS) ── */}
      <section className="relative overflow-hidden pt-10 sm:pt-16 pb-16 sm:pb-24 bg-gradient-to-b from-primary/[0.04] via-background to-background border-b border-border/30">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* LADO IZQUIERDO: SEO & ACCIONES CONTEXTUALES */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Badge Principal */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider shadow-xs">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Catálogos Digitales Web para MYPEs</span>
              </div>

              {/* Título SEO Directo */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.12]">
                Crea tu Catálogo Web y Vende por{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-orange-500 to-amber-500">
                  WhatsApp en 2 Minutos
                </span>
              </h1>

              {/* Subtítulo Conciso (SEO & GEO) */}
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Digitaliza tus productos en una tienda interactiva sin comisiones. Tus clientes arman su carrito y te envían el pedido directo a tu WhatsApp.
              </p>

              {/* Botones de Acción (Alto Contraste Garantizado) */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                <Button
                  asChild
                  size="lg"
                  className="w-full sm:w-auto h-13 px-8 rounded-2xl font-black text-sm bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/30 transition-all hover:scale-105 gap-2"
                >
                  <Link to="/register">
                    Crear Mi Catálogo Gratis <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto h-13 px-7 rounded-2xl font-bold text-sm border-border text-foreground hover:bg-muted gap-2 shadow-xs"
                >
                  <a href="/t/grano-miga" target="_blank" rel="noopener noreferrer">
                    <Smartphone className="h-4 w-4 text-primary" /> Ver Tienda de Ejemplo
                    <ExternalLink className="h-3.5 w-3.5 opacity-60" />
                  </a>
                </Button>
              </div>

              {/* 3 Tarjetas de Beneficios Rápidos (Llenan el espacio en PC) */}
              <div className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-card border border-border/50 flex items-center gap-3 text-left">
                  <div className="h-8 w-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                    <Zap className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">2 Minutos</p>
                    <p className="text-[10px] text-muted-foreground">Configuración rápida</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-card border border-border/50 flex items-center gap-3 text-left">
                  <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <MessageCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">0% Comisiones</p>
                    <p className="text-[10px] text-muted-foreground">Cobras a tu cuenta</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-card border border-border/50 flex items-center gap-3 text-left">
                  <div className="h-8 w-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">15 Días Gratis</p>
                    <p className="text-[10px] text-muted-foreground">Prueba Plan Pro</p>
                  </div>
                </div>
              </div>
            </div>

            {/* LADO DERECHO: SIMULADOR DE MÓVIL DENSE Y COMPLETO (SIN ESPACIOS VACÍOS) */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <div className="relative w-full max-w-[320px] sm:max-w-[340px] h-[550px] rounded-[2.8rem] bg-zinc-950 p-3 shadow-2xl ring-1 ring-zinc-800 border-4 border-zinc-900 overflow-hidden">
                {/* Altavoz y Cámara de iPhone */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 h-5 w-28 bg-zinc-950 rounded-b-2xl z-40 flex items-center justify-center">
                  <div className="h-2 w-10 bg-zinc-800 rounded-full"></div>
                </div>

                {/* Pantalla Simulada de Tienda */}
                <div className="h-full w-full rounded-[2.2rem] bg-card overflow-hidden flex flex-col justify-between pt-5 pb-3 px-3 text-left relative z-10 font-sans border border-border/30">
                  {/* Banner de Portada de Tienda */}
                  <div className="relative h-20 -mx-3 -mt-5 mb-2 overflow-hidden bg-muted">
                    <img
                      src="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=500&q=80"
                      alt="Grano & Miga Cover"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                    <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
                      <span className="text-[11px] font-extrabold text-white tracking-wide truncate">
                        Grano & Miga · Café
                      </span>
                      <span className="text-[8px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded-full shadow-xs">
                        Abierto
                      </span>
                    </div>
                  </div>

                  {/* Buscador y Pestañas */}
                  <div className="space-y-1.5 mb-1.5">
                    <div className="flex items-center gap-1 bg-muted/60 p-1.5 rounded-xl border text-[10px] text-muted-foreground">
                      <ShoppingBag className="h-3 w-3 text-primary shrink-0" />
                      <span className="truncate">¿Qué deseas pedir hoy?</span>
                    </div>
                    <div className="flex gap-1 overflow-x-auto no-scrollbar">
                      <span className="px-2 py-0.5 text-[9.5px] font-bold rounded-lg bg-primary text-primary-foreground shrink-0">
                        Cafetería
                      </span>
                      <span className="px-2 py-0.5 text-[9.5px] font-bold rounded-lg bg-muted text-muted-foreground shrink-0">
                        Panadería
                      </span>
                      <span className="px-2 py-0.5 text-[9.5px] font-bold rounded-lg bg-muted text-muted-foreground shrink-0">
                        Postres
                      </span>
                    </div>
                  </div>

                  {/* Grilla 2x2 Completa de Productos (Ocupa todo el espacio de forma densa) */}
                  <div className="grid grid-cols-2 gap-1.5 flex-1 my-1 overflow-hidden">
                    <div className="bg-muted/40 border border-border/40 rounded-xl p-1.5 flex flex-col justify-between">
                      <div className="h-16 w-full rounded-lg bg-muted relative overflow-hidden">
                        <img
                          src="https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=300&q=80"
                          alt="Café Latte"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="mt-1 space-y-0.5">
                        <p className="text-[10px] font-bold text-foreground truncate">Latte Especial</p>
                        <p className="text-[9.5px] font-black text-primary">S/ 12.00</p>
                      </div>
                    </div>

                    <div className="bg-muted/40 border border-border/40 rounded-xl p-1.5 flex flex-col justify-between">
                      <div className="h-16 w-full rounded-lg bg-muted relative overflow-hidden">
                        <img
                          src="https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=300&q=80"
                          alt="Croissant"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="mt-1 space-y-0.5">
                        <p className="text-[10px] font-bold text-foreground truncate">Croissant Almendras</p>
                        <p className="text-[9.5px] font-black text-primary">S/ 16.00</p>
                      </div>
                    </div>

                    <div className="bg-muted/40 border border-border/40 rounded-xl p-1.5 flex flex-col justify-between">
                      <div className="h-16 w-full rounded-lg bg-muted relative overflow-hidden">
                        <img
                          src="https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=300&q=80"
                          alt="Cheesecake"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="mt-1 space-y-0.5">
                        <p className="text-[10px] font-bold text-foreground truncate">Cheesecake Berries</p>
                        <p className="text-[9.5px] font-black text-primary">S/ 18.00</p>
                      </div>
                    </div>

                    <div className="bg-muted/40 border border-border/40 rounded-xl p-1.5 flex flex-col justify-between">
                      <div className="h-16 w-full rounded-lg bg-muted relative overflow-hidden">
                        <img
                          src="https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=300&q=80"
                          alt="Espresso"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="mt-1 space-y-0.5">
                        <p className="text-[10px] font-bold text-foreground truncate">Espresso Doble</p>
                        <p className="text-[9.5px] font-black text-primary">S/ 9.00</p>
                      </div>
                    </div>
                  </div>

                  {/* Botón Flotante Carrito WhatsApp en Móvil ajustado al fondo */}
                  <div className="bg-[#25D366] text-white p-2.5 rounded-xl font-extrabold text-xs flex items-center justify-between shadow-md shrink-0 mt-1">
                    <div className="flex items-center gap-1.5">
                      <MessageCircle className="h-4 w-4 fill-white" />
                      <span>Pedir por WhatsApp</span>
                    </div>
                    <span className="bg-white/20 px-2 py-0.5 rounded-md text-[10px]">S/ 55.00</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. COMPARACIÓN DIRETA TRADICIONAL VS DIZI ── */}
      <section id="beneficios" className="py-16 sm:py-24 bg-card border-b border-border/40">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto space-y-2 mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              Comparación de Método
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Venta por Chat vs Catálogo Web Dizi
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 sm:p-8 rounded-3xl bg-red-500/[0.02] border border-red-500/20 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 font-bold text-xs uppercase tracking-wider">
                <XCircle className="h-4 w-4" /> Venta Tradicional por Fotos / PDFs
              </div>
              <ul className="space-y-3 text-xs sm:text-sm text-muted-foreground pt-2">
                <li className="flex items-start gap-2.5">
                  <XCircle className="h-4.5 w-4.5 text-red-500 shrink-0 mt-0.5" />
                  <span>Fotos sueltas enviadas por chat que saturan el celular del cliente.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <XCircle className="h-4.5 w-4.5 text-red-500 shrink-0 mt-0.5" />
                  <span>PDFs pesados en Canva desactualizados y lentos de cargar en móvil.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <XCircle className="h-4.5 w-4.5 text-red-500 shrink-0 mt-0.5" />
                  <span>Comisiones de hasta 30% en plataformas de delivery.</span>
                </li>
              </ul>
            </div>

            <div className="p-6 sm:p-8 rounded-3xl bg-emerald-500/[0.02] border border-emerald-500/30 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
                <CheckCircle2 className="h-4 w-4" /> Plataforma Web Dizi
              </div>
              <ul className="space-y-3 text-xs sm:text-sm text-foreground/90 font-medium pt-2">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Enlace web único para tu bio de Instagram, TikTok o código QR.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Carrito interactivo que calcula el total y envía el pedido a WhatsApp.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>0% comisiones por venta. Cobras directo a tu Yape, Plin o cuenta bancaria.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. SHOWCASE DE 15 DISEÑOS CON TARJETAS VISUALES ── */}
      <section id="modelos" className="py-16 sm:py-24 bg-background">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto space-y-2 mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              Modelos de Interfaz
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              15 Estructuras de Diseño Adaptables
            </h2>

            <div className="flex items-center justify-center gap-2 pt-4 flex-wrap">
              <button
                onClick={() => setActiveNiche("all")}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                  activeNiche === "all"
                    ? "bg-primary border-primary text-primary-foreground shadow-sm"
                    : "bg-muted/50 border-border text-muted-foreground hover:text-foreground",
                )}
              >
                Todos los Diseños (15)
              </button>
              <button
                onClick={() => setActiveNiche("gastronomia")}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                  activeNiche === "gastronomia"
                    ? "bg-primary border-primary text-primary-foreground shadow-sm"
                    : "bg-muted/50 border-border text-muted-foreground hover:text-foreground",
                )}
              >
                Gastronomía
              </button>
              <button
                onClick={() => setActiveNiche("boutique")}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                  activeNiche === "boutique"
                    ? "bg-primary border-primary text-primary-foreground shadow-sm"
                    : "bg-muted/50 border-border text-muted-foreground hover:text-foreground",
                )}
              >
                Moda & Boutique
              </button>
              <button
                onClick={() => setActiveNiche("eco")}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                  activeNiche === "eco"
                    ? "bg-primary border-primary text-primary-foreground shadow-sm"
                    : "bg-muted/50 border-border text-muted-foreground hover:text-foreground",
                )}
              >
                Orgánico & Eco
              </button>
              <button
                onClick={() => setActiveNiche("tech")}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                  activeNiche === "tech"
                    ? "bg-primary border-primary text-primary-foreground shadow-sm"
                    : "bg-muted/50 border-border text-muted-foreground hover:text-foreground",
                )}
              >
                Tecnología
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredModels.map((model) => (
              <div
                key={model.id}
                className="group rounded-3xl border border-border/60 bg-card overflow-hidden transition-all duration-300 hover:shadow-xl flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-44 w-full overflow-hidden bg-muted">
                    <img
                      src={model.image}
                      alt={model.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute top-3 right-3">
                      <span className={cn("text-[9.5px] font-black uppercase tracking-widest px-3 py-1 rounded-full border shadow-md backdrop-blur-md", model.accent)}>
                        {model.badge}
                      </span>
                    </div>
                    <div className="absolute bottom-3 left-4 right-4">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">
                        {model.niche}
                      </span>
                      <h3 className="text-lg font-bold text-white leading-tight">{model.name}</h3>
                    </div>
                  </div>
                  <div className="p-4 space-y-1">
                    <p className="text-xs text-muted-foreground leading-relaxed">{model.desc}</p>
                  </div>
                </div>

                <div className="px-4 pb-4 pt-2 border-t border-border/30 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Semántico & Móvil
                  </span>
                  <Button asChild size="sm" variant="outline" className="h-8 rounded-xl text-xs font-bold gap-1 text-primary border-primary/30 hover:bg-primary/10">
                    <Link to="/register">
                      Probar Modelo <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. MÓDULOS DE FUNCIONALIDAD ── */}
      <section id="modulos" className="py-16 sm:py-24 bg-muted/30 border-y border-border/40">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto space-y-2 mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              Módulos Pro
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Herramientas Integradas de Plataforma
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-card border border-border/50 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                <Flame className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm text-foreground">Cintillo Promocional</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Anuncia envíos gratis u ofertas relámpago con animación Marquesina.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border/50 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                <Layers className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm text-foreground">Banners Multi-Imagen</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Carrusel deslizante de hasta 5 portadas promocionales en cabecera.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border/50 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                <FileDown className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm text-foreground">Exportador Catálogo PDF</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Genera en 1 clic un PDF vectorial con el logo y lista de precios oficial.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border/50 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm text-foreground">Protección In-App Browser</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Garantiza el flujo correcto del pedido desde TikTok e Instagram hacia WhatsApp.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. PLANES & PRECIOS (TEXTO DE ALTO CONTRASATE GARANTIZADO) ── */}
      <section id="precios" className="py-16 sm:py-24 bg-background">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto space-y-2 mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              Precios Claros
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Planes Transparentes sin Sorpresas
            </h2>
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
              <Button asChild variant="outline" className="w-full font-bold text-xs rounded-xl h-10 text-foreground hover:bg-muted">
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
              <Button asChild variant="outline" className="w-full font-bold text-xs rounded-xl h-10 text-foreground hover:bg-muted">
                <Link to="/register">Elegir Emprendedor</Link>
              </Button>
            </div>

            {/* PLAN PRO (MÁS POPULAR CON LISTÓN) */}
            <div className="p-6 rounded-3xl border-2 border-primary bg-primary/[0.02] flex flex-col justify-between space-y-6 relative shadow-xl shadow-primary/10">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground font-extrabold text-[10px] uppercase tracking-widest px-3 py-1 rounded-full shadow-md">
                MÁS POPULAR ⭐
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
                <ul className="space-y-2.5 text-xs text-foreground pt-2">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Productos Ilimitados</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Carrusel 5 Banners</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Atributos de Marca Pro</span>
                  </li>
                </ul>
              </div>
              <Button asChild variant="outline" className="w-full font-bold text-xs rounded-xl h-10 text-foreground hover:bg-muted">
                <Link to="/register">Elegir Ilimitado</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. PREGUNTAS FRECUENTES (FAQ ACORDEÓN) ── */}
      <section className="py-16 sm:py-24 bg-card border-t border-border/40">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6">
          <div className="text-center space-y-2 mb-10">
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
          <div className="pt-2">
            <Button
              asChild
              size="lg"
              className="h-13 px-9 rounded-2xl font-black text-sm bg-white text-primary hover:bg-white/90 shadow-2xl transition-all hover:scale-105 gap-2"
            >
              <Link to="/register">
                Crear Mi Catálogo Gratis <ArrowRight className="h-4 w-4" />
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
            © {new Date().getFullYear()} Dizi · Todos los derechos reservados. Hecho para emprendedores peruanos por Idenza.
          </div>
        </div>
      </footer>
    </div>
  );
}
