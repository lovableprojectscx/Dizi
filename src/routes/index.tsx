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
  Globe,
  TrendingUp,
  Award,
  Star,
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
      desc: "Navegación por categorías de comida, badges de sugerencias del chef y pedidos directos a cocina.",
      badge: "Más Popular",
      category: "gastronomia",
      image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80",
      accent: "border-orange-500/30 text-orange-600 dark:text-orange-400 bg-orange-500/10",
      demoSlug: "bite-demo",
    },
    {
      id: "bloom_floral",
      name: "Bloom Floral",
      niche: "Florerías / Regalos",
      desc: "Estética delicada con detalles botánicos, esquinas suaves y tipografía elegante para florerías y detalles.",
      badge: "Edición Especial",
      category: "boutique",
      image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80",
      accent: "border-pink-500/30 text-pink-600 dark:text-pink-400 bg-pink-500/10",
      demoSlug: "bloom-demo",
    },
    {
      id: "nature",
      name: "Nature Orgánico",
      niche: "Salud / Cosmética / Eco",
      desc: "Paleta verde salvia refrescante con tarjetas limpias en diagonal para cosmética artesanal y productos naturales.",
      badge: "Ecológico",
      category: "eco",
      image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80",
      accent: "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
      demoSlug: "nature-demo",
    },
    {
      id: "overlay",
      name: "Overlay Visual",
      niche: "Moda / Calzado",
      desc: "Formato 3:4 vertical inspirado en catálogos ZARA con tipografía superpuesta sobre fotografías de alta resolución.",
      badge: "Tendencia",
      category: "boutique",
      image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=600&q=80",
      accent: "border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10",
      demoSlug: "overlay-demo",
    },
    {
      id: "editorial",
      name: "Estilo Editorial",
      niche: "Corporativo / Luxe",
      desc: "Lista horizontal minimalista Net-a-Porter con descripciones detalladas para marcas exclusivas y artículos de lujo.",
      badge: "Nivel Pro",
      category: "luxe",
      image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=600&q=80",
      accent: "border-slate-500/30 text-slate-700 dark:text-slate-300 bg-slate-500/10",
      demoSlug: "editorial-demo",
    },
    {
      id: "tiles",
      name: "Mosaico Tiles",
      niche: "Tecnología / Accesorios",
      desc: "Diseño asimétrico interactivo en cuadrícula estilo Apple Store para tecnología, gadgets y accesorios.",
      badge: "Moderno",
      category: "tech",
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80",
      accent: "border-purple-500/30 text-purple-600 dark:text-purple-400 bg-purple-500/10",
      demoSlug: "tiles-demo",
    },
  ];

  const filteredModels =
    activeNiche === "all"
      ? showcaseModels
      : showcaseModels.filter((m) => m.category === activeNiche);

  const faqs = [
    {
      q: "¿Cómo reciben mis clientes los pedidos en WhatsApp?",
      a: "Tus clientes exploran tu catálogo web, eligen sus productos, agregan cantidades a su carrito y presionan 'Enviar Pedido'. La plataforma abre instantáneamente su app de WhatsApp con la lista de compra formateada, datos de entrega y total a pagar.",
    },
    {
      q: "¿Cobran comisiones por las ventas realizadas?",
      a: "No. A diferencia de las plataformas de delivery tradicionales que cobran hasta un 30% por transacción, en Dizi tus ventas son 100% tuyas. Todo el dinero ingresa directamente a tu cuenta bancaria o Yape/Plin.",
    },
    {
      q: "¿Mis clientes deben descargar alguna aplicación?",
      a: "Ninguna. Tu catálogo funciona como un sitio web ultrarrápido optimizado para teléfonos móviles. Se accede mediante un enlace web único que puedes colocar en tu bio de Instagram, TikTok o Facebook.",
    },
    {
      q: "¿Puedo exportar mi catálogo en PDF para clientes mayoristas?",
      a: "Sí. Todos los planes de pago incluyen el módulo de Exportación PDF Vectorial. Con un solo clic se genera un catálogo imprimible con tu logotipo, información de contacto y lista de precios oficial.",
    },
    {
      q: "¿Cómo funciona la prueba gratuita de 15 días?",
      a: "Al registrarte inicias inmediatamente un período de prueba de 15 días con acceso completo a las funciones del Plan Pro, sin necesidad de ingresar tarjeta de crédito. Al finalizar la prueba puedes elegir el plan que mejor se adapte a tu negocio.",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased selection:bg-primary selection:text-primary-foreground">
      {/* ── 0. BARRA SUPERIOR PROMACIONAL (RIBBON BAR) ── */}
      <div className="bg-gradient-to-r from-zinc-900 via-primary to-zinc-900 text-white text-[11px] font-bold py-2 px-4 text-center flex items-center justify-center gap-2 border-b border-white/10 shadow-xs">
        <span className="bg-white/20 text-white px-2 py-0.5 rounded-full uppercase tracking-wider text-[9px] font-black shrink-0">
          PROMO MUNDIAL DIZI
        </span>
        <span className="truncate">
          ¡Consigue tu Plan Emprendedor a solo <strong>S/. 9.90 / mes</strong> con diseño gratis!
        </span>
        <a
          href="https://wa.me/51925176472?text=Hola%2C%20quiero%20la%20Promo%20Mundial%20de%20Dizi"
          target="_blank"
          rel="noreferrer"
          className="hidden sm:inline-flex items-center gap-1 underline hover:text-amber-300 transition-colors shrink-0 ml-2"
        >
          Reclamar por WhatsApp <ChevronRight className="h-3.5 w-3.5" />
        </a>
      </div>

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

      {/* ── 2. SECCIÓN HERO DE ALTO IMPACTO (DISPOSITIVO Y BADGES PROFESIONALES) ── */}
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
                Digitaliza tu negocio sin comisiones por venta. Transforma tus productos en una tienda interactiva
                móvil con carrito de compras, exportador PDF y pedidos directos a tu teléfono.
              </p>

              {/* Botones Primarios de Acción */}
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
                  className="w-full sm:w-auto h-13 px-7 rounded-2xl font-bold text-sm border-border/80 hover:bg-muted gap-2 shadow-xs"
                >
                  <a href="/t/grano-miga" target="_blank" rel="noopener noreferrer">
                    <Smartphone className="h-4 w-4 text-primary" /> Ver Tienda de Ejemplo
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

            {/* LADO DERECHO: MOCKUP INTERACTIVO DE TELÉFONO CON MARCO PROFESIONAL */}
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
                      Cafetería
                    </span>
                    <span className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-muted text-muted-foreground shrink-0">
                      Panadería
                    </span>
                    <span className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-muted text-muted-foreground shrink-0">
                      Postres
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

      {/* ── 3. SECCIÓN MÓDULO COMPARATIVO (TRADICIONAL VS DIZI) ── */}
      <section id="beneficios" className="py-16 sm:py-24 bg-card border-y border-border/40">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-12 sm:mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              Eficiencia Comercial Digital
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              La diferencia entre vender por fotos o con una Tienda Web
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Optimiza el tiempo de atención de tu equipo y brinda una experiencia fluida a tus compradores.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* TARJETA 1: ANTES (MÉTODOS TRADICIONALES) */}
            <div className="p-6 sm:p-8 rounded-3xl bg-red-500/[0.02] border border-red-500/20 space-y-5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 font-bold text-xs uppercase tracking-wider">
                  <XCircle className="h-4 w-4" /> Venta por Chat Convencional
                </div>
                <h3 className="text-xl font-bold text-foreground">El desgaste del proceso manual</h3>
                <ul className="space-y-3.5 pt-2 text-xs sm:text-sm text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <XCircle className="h-4.5 w-4.5 text-red-500 shrink-0 mt-0.5" />
                    <span>Envío recurrente de imágenes sueltas que llenan la memoria de tus clientes.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <XCircle className="h-4.5 w-4.5 text-red-500 shrink-0 mt-0.5" />
                    <span>PDFs pesados en Canva que no se adaptan correctamente a pantallas pequeñas.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <XCircle className="h-4.5 w-4.5 text-red-500 shrink-0 mt-0.5" />
                    <span>Pérdida de márgenes por comisiones de hasta 30% en aplicaciones de delivery.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <XCircle className="h-4.5 w-4.5 text-red-500 shrink-0 mt-0.5" />
                    <span>Tiempo invertido en responder precios y detalles de productos uno por uno.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* TARJETA 2: CON DIZI (SOLUCIÓN INTELIGENTE) */}
            <div className="p-6 sm:p-8 rounded-3xl bg-emerald-500/[0.02] border border-emerald-500/30 space-y-5 flex flex-col justify-between relative overflow-hidden group shadow-sm">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
                  <CheckCircle2 className="h-4 w-4" /> Plataforma Digital Dizi
                </div>
                <h3 className="text-xl font-bold text-foreground">Experiencia web automatizada y limpia</h3>
                <ul className="space-y-3.5 pt-2 text-xs sm:text-sm text-foreground/90 font-medium">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Enlace web único para tu perfil de Instagram, TikTok o código QR físico.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Carrito interactivo que calcula el total y envía el pedido listo a WhatsApp.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>0% comisiones por transacción. Cobras directo por Yape, Plin o transferencia.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Descarga instantánea de catálogo PDF profesional para ventas al por mayor.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. SHOWCASE DE LAS 15 ESTRUCTURAS DE DISEÑO CON FOTOS REALES Y TARJETAS VISUALES ── */}
      <section id="modelos" className="py-16 sm:py-28 bg-background">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-10 sm:mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              Diseño de Interfaz adaptable
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              15 Estructuras de Diseño para cada Tipo de Negocio
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Explora las plantillas prediseñadas para tu rubro. Personaliza colores de acento, fondos y tipografías en segundos.
            </p>

            {/* Selector de Pestañas de Rubro */}
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

          {/* Grilla de Tarjetas Visuales con Imágenes y Listones */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredModels.map((model) => (
              <div
                key={model.id}
                className="group rounded-3xl border border-border/60 bg-card overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col justify-between"
              >
                <div>
                  {/* Vista Previa Visual (Fotografía con Listón Ribbon) */}
                  <div className="relative h-48 w-full overflow-hidden bg-muted">
                    <img
                      src={model.image}
                      alt={model.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"></div>

                    {/* Listón Ribbon Posicionado */}
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

                  {/* Descripción y Contenido */}
                  <div className="p-5 space-y-2">
                    <p className="text-xs text-muted-foreground leading-relaxed">{model.desc}</p>
                  </div>
                </div>

                {/* Acciones */}
                <div className="px-5 pb-5 pt-2 border-t border-border/30 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Semántico & Móvil
                  </span>
                  <Button asChild size="sm" variant="outline" className="h-8 rounded-xl text-xs font-bold gap-1 text-primary border-primary/20 hover:bg-primary/10">
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

      {/* ── 5. SECCIÓN TARJETA PROMO MUNDIAL DESTACADA (RIBBON CARD) ── */}
      <section className="py-12 bg-background">
        <div className="container mx-auto max-w-5xl px-4 sm:px-6">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-primary/30 p-8 sm:p-10 shadow-2xl text-white">
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-3 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs uppercase tracking-wider border border-emerald-500/30">
                  <Award className="h-4 w-4" /> Campaña Especial Dizi
                </div>
                <h3 className="text-2xl sm:text-4xl font-extrabold text-white">
                  ¡Llévate tu Plan Emprendedor a S/. 9.90!
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 max-w-xl">
                  Incluye la configuración inicial y el diseño personalizado de tu tienda sin costo adicional realizado por nuestro equipo.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
                <a
                  href="https://wa.me/51925176472?text=Hola%2C%20quiero%20la%20Promo%20Mundial%20de%20Dizi"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white text-xs font-extrabold px-6 py-3.5 rounded-2xl transition-all shadow-lg shadow-[#25D366]/30"
                >
                  <MessageCircle className="h-4 w-4 fill-white" />
                  Solicitar por WhatsApp
                </a>
                <Button asChild variant="outline" className="h-11 px-6 rounded-2xl font-bold text-xs border-white/20 text-white hover:bg-white/10">
                  <Link to="/register">Crear Cuenta Solo</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. MÓDULOS & FUNCIONALIDADES ENTERPRISE ── */}
      <section id="modulos" className="py-16 sm:py-24 bg-muted/30 border-y border-border/40">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-12 sm:mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              Funcionalidades de Plataforma
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Herramientas diseñadas para acelerar tus conversiones
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-card border border-border/50 shadow-xs space-y-3">
              <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                <Flame className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm text-foreground">Cintillo Promocional</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Destaca avisos de envío gratis o promociones relámpago con animación Marquesina.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border/50 shadow-xs space-y-3">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                <Layers className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm text-foreground">Banners Multi-Imagen</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Carrusel de hasta 5 portadas en la cabecera para resaltar campañas o colecciones de temporada.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border/50 shadow-xs space-y-3">
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                <FileDown className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm text-foreground">Exportador Catálogo PDF</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Genera en 1 clic un PDF vectorial con el logo y colores de tu tienda para compras mayoristas.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border/50 shadow-xs space-y-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm text-foreground">Protección In-App Browser</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Garantiza que los clics desde los navegadores de TikTok e Instagram redirijan sin errores a WhatsApp.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. PLANES & PRECIOS TRANSPARENTES CON RIBBON ── */}
      <section id="precios" className="py-16 sm:py-28 bg-background">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-12 sm:mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              Suscripciones Transparentes
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Planes a la medida de tu crecimiento
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Comienza gratis hoy. Cancela o cambia de plan en cualquier momento sin compromisos.
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

            {/* PLAN PRO (MÁS POPULAR CON LISTÓN RIBBON) */}
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

      {/* ── 8. PREGUNTAS FRECUENTES (FAQ ACORDEÓN ELEGANTE) ── */}
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

      {/* ── 9. BANNER FINAL CTA ── */}
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
              className="h-13 px-9 rounded-2xl font-black text-sm bg-white text-primary hover:bg-white/90 shadow-2xl transition-all hover:scale-105 gap-2"
            >
              <Link to="/register">
                Crear Mi Catálogo Gratis <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── 10. FOOTER INSTITUCIONAL ── */}
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
