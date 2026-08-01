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
  BookOpen,
  Link2,
  TrendingUp,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dizi — Tu negocio, ordenado y presentable en un solo link | Catálogos Digitales Perú" },
      {
        name: "description",
        content:
          "Dizi convierte cada consulta de redes sociales en un pedido ordenado directo a tu WhatsApp. Catálogo web, Link en Bio y Libro de Reclamaciones desde S/ 9.90. Prueba 15 días gratis.",
      },
      {
        name: "keywords",
        content:
          "catálogo digital, catálogo web, vender por WhatsApp, Dizi, catálogo gratis, MYPE Perú, tienda virtual, catálogo PDF, link en bio, libro de reclamaciones",
      },
      { property: "og:title", content: "Dizi — Tu negocio, ordenado y presentable en un solo link" },
      {
        property: "og:description",
        content:
          "Tú ya sabes vender. Dizi solo hace que se note. Crea tu catálogo web en 2 minutos y recibe pedidos organizados por WhatsApp sin comisiones.",
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
      desc: "Categorías táctiles, especialidades de cocina y pedidos directos a tu WhatsApp.",
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
      a: "Tus clientes exploran tu catálogo web, agregan los productos que desean a su carrito y presionan 'Enviar Pedido'. Dizi abre instantáneamente su app de WhatsApp con la lista de compra detallada, precios y total a pagar.",
    },
    {
      q: "¿Cobran comisiones por venta?",
      a: "Cero comisiones. Todo el dinero de tus ventas ingresa directamente a tu cuenta bancaria o Yape/Plin sin intermediarios ni retenciones.",
    },
    {
      q: "¿Mis clientes tienen que descargar alguna app?",
      a: "No. Tu catálogo es una página web ultrarrápida que abre al instante en el celular del cliente a través de tu enlace personalizado.",
    },
    {
      q: "¿Puedo exportar mi catálogo en PDF para ventas mayoristas?",
      a: "Sí. Todos los planes de pago incluyen el módulo de Exportación PDF Vectorial. Con un solo clic generas un catálogo profesional imprimible con tu logotipo.",
    },
    {
      q: "¿Cómo funciona el Libro de Reclamaciones Digital?",
      a: "Dizi integra el formulario legal conforme a la normativa INDECOPI del Perú. Tus clientes pueden registrar reclamos o quejas y tú los gestionas desde tu panel administrativo.",
    },
  ];

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-background text-foreground font-sans antialiased selection:bg-primary selection:text-primary-foreground pb-16 md:pb-0">
      {/* ── 1. HEADER / NAVBAR CON IDENTIDAD DE MARCA ── */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/90 backdrop-blur-md transition-all">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <img
              src="/images/dizi-logo-principal-color.png"
              alt="Dizi Catálogos Digitales"
              className="h-8 sm:h-11 w-auto object-contain transition-transform group-hover:scale-105"
            />
          </Link>

          {/* Navegación Desktop */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-wider text-muted-foreground font-sans">
            <a href="#beneficios" className="hover:text-primary transition-colors">
              Beneficios
            </a>
            <a href="#modelos" className="hover:text-primary transition-colors">
              Diseños (15)
            </a>
            <a href="#pasos" className="hover:text-primary transition-colors">
              Cómo Funciona
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
              className="hidden md:flex font-bold text-xs rounded-xl h-10 px-4 text-foreground hover:bg-muted font-sans"
            >
              <Link to="/login">Iniciar Sesión</Link>
            </Button>
            <Button
              asChild
              className="hidden md:flex font-extrabold text-xs rounded-xl h-10 px-5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:scale-105 active:scale-95 font-sans"
            >
              <Link to="/register">
                Crear Catálogo Gratis <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>

            {/* Botón Hamburguesa Móvil */}
            <button
              className="md:hidden flex items-center justify-center h-10 w-10 rounded-xl bg-muted/60 border border-border/40 transition-all active:scale-95"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menú de Navegación"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Menú Desplegable Móvil */}
        {menuOpen && (
          <div className="md:hidden border-t border-border/40 bg-background/98 backdrop-blur-xl px-4 py-5 space-y-3 animate-in fade-in slide-in-from-top duration-200 shadow-xl font-sans">
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
              Diseños (15)
            </a>
            <a
              href="#pasos"
              className="block px-4 py-2.5 rounded-xl text-xs font-bold text-foreground hover:bg-muted transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Cómo Funciona
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
              <Button variant="outline" asChild className="w-full font-bold text-xs rounded-xl h-10 text-foreground active:scale-95">
                <Link to="/login" onClick={() => setMenuOpen(false)}>
                  Iniciar Sesión
                </Link>
              </Button>
              <Button asChild className="w-full font-extrabold text-xs rounded-xl h-10 shadow-md active:scale-95">
                <Link to="/register" onClick={() => setMenuOpen(false)}>
                  Crear Gratis
                </Link>
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* ── 2. SECCIÓN HERO DE ALTO IMPACTO (ESENCIA DE MARCA OFICIAL) ── */}
      <section className="relative overflow-hidden pt-8 sm:pt-16 pb-12 sm:pb-20 bg-gradient-to-b from-primary/[0.04] via-background to-background border-b border-border/30">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* LADO IZQUIERDO: ESENCIA DE MARCA */}
            <div className="lg:col-span-7 space-y-5 text-center lg:text-left animate-in fade-in slide-in-from-bottom duration-500">
              {/* Badge Oficial */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider shadow-xs font-sans">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Catálogo Web · Link en Bio · Pedidos por WhatsApp</span>
              </div>

              {/* Título Principal SEO + Frase de Marca */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.12]">
                Tu negocio, ordenado y presentable en{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-orange-500 to-amber-500">
                  un solo link
                </span>
              </h1>

              {/* Subtítulo de Marca Empoderador */}
              <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Tú ya sabes vender. Dizi solo hace que se note. Transforma las consultas de tus redes sociales en pedidos organizados directo a tu WhatsApp. Sin comisiones.
              </p>

              {/* Botones de Acción */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
                <Button
                  asChild
                  size="lg"
                  className="w-full sm:w-auto h-12 sm:h-13 px-8 rounded-2xl font-black text-xs sm:text-sm bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/30 transition-all hover:scale-105 active:scale-95 gap-2 font-sans"
                >
                  <Link to="/register">
                    Crear Mi Catálogo Gratis <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto h-12 sm:h-13 px-7 rounded-2xl font-bold text-xs sm:text-sm border-border text-foreground hover:bg-muted active:scale-95 gap-2 shadow-xs font-sans"
                >
                  <a href="/t/grano-miga" target="_blank" rel="noopener noreferrer">
                    <Smartphone className="h-4 w-4 text-primary" /> Ver Tienda de Ejemplo
                    <ExternalLink className="h-3.5 w-3.5 opacity-60" />
                  </a>
                </Button>
              </div>

              {/* 3 Tarjetas de Beneficios Clave */}
              <div className="pt-4 grid grid-cols-3 gap-2 sm:gap-3">
                <div className="p-2.5 sm:p-3.5 rounded-2xl bg-card border border-border/50 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-2 sm:gap-3">
                  <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                    <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </div>
                  <div>
                    <p className="text-[11px] sm:text-xs font-bold text-foreground leading-tight">En 2 Minutos</p>
                    <p className="text-[9px] sm:text-[10px] text-muted-foreground">Listo sin código</p>
                  </div>
                </div>

                <div className="p-2.5 sm:p-3.5 rounded-2xl bg-card border border-border/50 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-2 sm:gap-3">
                  <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </div>
                  <div>
                    <p className="text-[11px] sm:text-xs font-bold text-foreground leading-tight">0% Comisión</p>
                    <p className="text-[9px] sm:text-[10px] text-muted-foreground">Cobro directo</p>
                  </div>
                </div>

                <div className="p-2.5 sm:p-3.5 rounded-2xl bg-card border border-border/50 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-2 sm:gap-3">
                  <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                    <ShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </div>
                  <div>
                    <p className="text-[11px] sm:text-xs font-bold text-foreground leading-tight">15 Días Free</p>
                    <p className="text-[9px] sm:text-[10px] text-muted-foreground">Prueba Plan Pro</p>
                  </div>
                </div>
              </div>
            </div>

            {/* LADO DERECHO: SIMULADOR DE MÓVIL DENSE */}
            <div className="hidden lg:flex lg:col-span-5 justify-end">
              <div className="relative w-full max-w-[340px] h-[550px] rounded-[2.8rem] bg-zinc-950 p-3 shadow-2xl ring-1 ring-zinc-800 border-4 border-zinc-900 overflow-hidden transition-transform duration-500 hover:scale-[1.02]">
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

                  {/* Grilla 2x2 Completa de Productos */}
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

                  {/* Botón Flotante Carrito WhatsApp */}
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

      {/* ── 3. FLUJO DE 3 PASOS SIMPLES DE LA MARCA ── */}
      <section id="pasos" className="py-12 sm:py-20 bg-muted/20 border-b border-border/40">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto space-y-2 mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              Simplicidad Radical
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Cómo funciona Dizi en 3 pasos
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-card border border-border/60 space-y-3 text-center sm:text-left relative overflow-hidden">
              <div className="h-10 w-10 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-black text-sm">
                1
              </div>
              <h3 className="font-bold text-base text-foreground">Sube tus productos</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Registra tus productos con fotografía, precio y descripción desde tu teléfono celular en minutos.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-card border border-border/60 space-y-3 text-center sm:text-left relative overflow-hidden">
              <div className="h-10 w-10 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-black text-sm">
                2
              </div>
              <h3 className="font-bold text-base text-foreground">Comparte tu link único</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Coloca el enlace de tu catálogo en tu bio de Instagram, TikTok o Facebook y compártelo por WhatsApp.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-card border border-border/60 space-y-3 text-center sm:text-left relative overflow-hidden">
              <div className="h-10 w-10 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-black text-sm">
                3
              </div>
              <h3 className="font-bold text-base text-foreground">Recibe pedidos en WhatsApp</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tus clientes eligen en tu tienda web y te envían el pedido armado y listo para responder por WhatsApp.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. LOS 3 COMPONENTES ÚNICOS EN UNA SOLA HERRAMIENTA ── */}
      <section id="beneficios" className="py-12 sm:py-20 bg-card border-b border-border/40">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto space-y-2 mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              Todo en Una Sola Herramienta
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Catálogo Web + Link en Bio + Libro de Reclamaciones
            </h2>
            <p className="text-sm text-muted-foreground">
              Todo lo que tu negocio necesita para vender y cumplir con la normativa del Perú desde S/ 9.90 / mes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-background border border-border/60 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-foreground">Catálogo Web Interactivo</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                15 estructuras de diseño profesional adaptables a tu rubro con carrito de compras integrado.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-background border border-border/60 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                <Link2 className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-foreground">Página Link en Bio</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Reúne tu catálogo, tus redes sociales y botones de contacto directo en una sola dirección web.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-background border border-border/60 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                <BookOpen className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-foreground">Libro de Reclamaciones Digital</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Cumple con la normativa INDECOPI del Perú sin pagar sistemas adicionales ni hojas impresas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. SHOWCASE DE 15 DISEÑOS CON TARJETAS VISUALES ── */}
      <section id="modelos" className="py-12 sm:py-24 bg-background">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto space-y-2 mb-8 sm:mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              Modelos de Interfaz
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              15 Estructuras de Diseño Adaptables
            </h2>

            <div className="flex flex-wrap items-center justify-center gap-1.5 pt-3 max-w-full px-2">
              <button
                onClick={() => setActiveNiche("all")}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shrink-0 font-sans",
                  activeNiche === "all"
                    ? "bg-primary border-primary text-primary-foreground shadow-xs"
                    : "bg-muted/50 border-border text-muted-foreground hover:text-foreground",
                )}
              >
                Todos (15)
              </button>
              <button
                onClick={() => setActiveNiche("gastronomia")}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shrink-0 font-sans",
                  activeNiche === "gastronomia"
                    ? "bg-primary border-primary text-primary-foreground shadow-xs"
                    : "bg-muted/50 border-border text-muted-foreground hover:text-foreground",
                )}
              >
                Gastronomía
              </button>
              <button
                onClick={() => setActiveNiche("boutique")}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shrink-0 font-sans",
                  activeNiche === "boutique"
                    ? "bg-primary border-primary text-primary-foreground shadow-xs"
                    : "bg-muted/50 border-border text-muted-foreground hover:text-foreground",
                )}
              >
                Moda & Boutique
              </button>
              <button
                onClick={() => setActiveNiche("eco")}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shrink-0 font-sans",
                  activeNiche === "eco"
                    ? "bg-primary border-primary text-primary-foreground shadow-xs"
                    : "bg-muted/50 border-border text-muted-foreground hover:text-foreground",
                )}
              >
                Orgánico & Eco
              </button>
              <button
                onClick={() => setActiveNiche("tech")}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shrink-0 font-sans",
                  activeNiche === "tech"
                    ? "bg-primary border-primary text-primary-foreground shadow-xs"
                    : "bg-muted/50 border-border text-muted-foreground hover:text-foreground",
                )}
              >
                Tecnología
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {filteredModels.map((model) => (
              <div
                key={model.id}
                className="group rounded-3xl border border-border/60 bg-card overflow-hidden transition-all duration-300 hover:shadow-xl active:scale-[0.99] flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-40 sm:h-44 w-full overflow-hidden bg-muted">
                    <img
                      src={model.image}
                      alt={model.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute top-3 right-3">
                      <span className={cn("text-[9.5px] font-black uppercase tracking-widest px-3 py-1 rounded-full border shadow-md backdrop-blur-md font-sans", model.accent)}>
                        {model.badge}
                      </span>
                    </div>
                    <div className="absolute bottom-3 left-4 right-4">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white/80 font-sans">
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
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-sans">
                    Semántico & Móvil
                  </span>
                  <Button asChild size="sm" variant="outline" className="h-8 rounded-xl text-xs font-bold gap-1 text-primary border-primary/30 hover:bg-primary/10 active:scale-95 font-sans">
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

      {/* ── 6. PLANES & PRECIOS REALES OFICIALES ── */}
      <section id="precios" className="py-12 sm:py-24 bg-background">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto space-y-2 mb-8 sm:mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-primary font-sans">
              Precios Oficiales
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Planes Transparentes en Soles
            </h2>
            <p className="text-sm text-muted-foreground">
              Las 15 estructuras de diseño están incluidas en todos los planes. Eliges según tus productos y marca.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 items-stretch font-sans">
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
                <ul className="space-y-2.5 text-xs text-foreground pt-1">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Hasta 20 Productos</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Las 15 Estructuras de Diseño</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Carrito a WhatsApp</span>
                  </li>
                </ul>
              </div>
              <Button asChild variant="outline" className="w-full font-bold text-xs rounded-xl h-10 text-foreground hover:bg-muted active:scale-95">
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
                  <span className="text-3xl font-black text-foreground">S/ 9.90</span>
                  <span className="text-xs text-muted-foreground">/mes</span>
                </div>
                <ul className="space-y-2.5 text-xs text-foreground pt-1">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Hasta 50 Productos</span>
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
              <Button asChild variant="outline" className="w-full font-bold text-xs rounded-xl h-10 text-foreground hover:bg-muted active:scale-95">
                <Link to="/register">Elegir Emprendedor</Link>
              </Button>
            </div>

            {/* PLAN PRO */}
            <div className="p-6 rounded-3xl border-2 border-primary bg-primary/[0.02] flex flex-col justify-between space-y-6 relative shadow-xl shadow-primary/10">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground font-extrabold text-[10px] uppercase tracking-widest px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                <span>MÁS POPULAR</span>
              </div>
              <div className="space-y-4 pt-1">
                <span className="text-xs font-bold text-primary uppercase tracking-widest">
                  Recomendado
                </span>
                <h3 className="text-xl font-bold text-foreground">Catálogo Pro</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-foreground">S/ 14.90</span>
                  <span className="text-xs text-muted-foreground">/mes</span>
                </div>
                <ul className="space-y-2.5 text-xs text-foreground pt-1 font-medium">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Hasta 200 Productos</span>
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
                    <span>Estadísticas de Clics</span>
                  </li>
                </ul>
              </div>
              <Button asChild className="w-full font-extrabold text-xs rounded-xl h-10 shadow-md active:scale-95">
                <Link to="/register">Comenzar Prueba Pro</Link>
              </Button>
            </div>

            {/* PLAN ILIMITADO */}
            <div className="p-6 rounded-3xl border border-border/60 bg-card flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">
                  Empresarial
                </span>
                <h3 className="text-xl font-bold text-foreground">Ilimitado</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-foreground">S/ 34.90</span>
                  <span className="text-xs text-muted-foreground">/mes</span>
                </div>
                <ul className="space-y-2.5 text-xs text-foreground pt-1">
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
                    <span>Soporte Prioritario 24/7</span>
                  </li>
                </ul>
              </div>
              <Button asChild variant="outline" className="w-full font-bold text-xs rounded-xl h-10 text-foreground hover:bg-muted active:scale-95">
                <Link to="/register">Elegir Ilimitado</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. PREGUNTAS FRECUENTES ── */}
      <section className="py-12 sm:py-24 bg-card border-t border-border/40">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6">
          <div className="text-center space-y-2 mb-8 sm:mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-primary font-sans">
              Resolviendo tus Dudas
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Preguntas Frecuentes sobre Dizi
            </h2>
          </div>

          <div className="space-y-3 font-sans">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="border border-border/60 rounded-2xl bg-background overflow-hidden transition-colors"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-4 sm:p-5 text-left font-bold text-xs sm:text-base text-foreground flex items-center justify-between gap-4 active:bg-muted/50"
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
                  <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-border/20 pt-3 animate-in fade-in duration-200">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. BANNER FINAL CTA (FRASE EMPODERADORA DE MARCA) ── */}
      <section className="py-12 sm:py-20 bg-gradient-to-r from-primary via-orange-600 to-amber-600 text-white text-center font-sans">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 space-y-4">
          <h2 className="text-2xl sm:text-5xl font-black tracking-tight">
            Tú ya sabes vender. Dizi solo hace que se note.
          </h2>
          <p className="text-xs sm:text-base opacity-90 max-w-xl mx-auto font-medium">
            Regístrate gratis en 2 minutos y convierte tu perfil en una vitrina profesional sin comisiones.
          </p>
          <div className="pt-2">
            <Button
              asChild
              size="lg"
              className="h-12 sm:h-13 px-8 sm:px-9 rounded-2xl font-black text-xs sm:text-sm bg-white text-primary hover:bg-white/90 shadow-2xl transition-all hover:scale-105 active:scale-95 gap-2"
            >
              <Link to="/register">
                Crear Mi Catálogo Gratis <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── 9. FOOTER INSTITUCIONAL ── */}
      <footer className="border-t border-border/40 bg-background py-10 text-xs text-muted-foreground font-sans">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col items-center md:items-start gap-2">
              <img
                src="/images/dizi-logo-principal-color.png"
                alt="Dizi Logo"
                className="h-8 w-auto object-contain"
              />
              <p className="text-[11px] text-muted-foreground text-center md:text-left">
                Plataforma de Catálogos Web para MYPEs en Perú. Operado por <strong>Idenza</strong>.
              </p>
            </div>

            <div className="flex items-center gap-5 font-bold text-foreground text-xs flex-wrap justify-center">
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

      {/* ── 10. BARRA FLOTANTE FIJA PARA MÓVILES (STICKY BOTTOM CTA) ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-xl border-t border-border/40 p-3 flex items-center justify-between gap-3 shadow-2xl font-sans">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Dizi Catálogos</span>
          <span className="text-[11px] font-extrabold text-foreground">15 Días Gratis</span>
        </div>
        <Button asChild className="h-10 px-5 rounded-xl text-xs font-extrabold bg-primary text-primary-foreground shadow-lg shadow-primary/25 active:scale-95">
          <Link to="/register">
            Crear Gratis <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
