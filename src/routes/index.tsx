import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Zap,
  Search,
  MessageCircle,
  Smartphone,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Store,
  FileDown,
  Palette,
  Menu,
  X,
} from "lucide-react";

const IconFriction3D = () => (
  <svg viewBox="0 0 100 100" className="w-16 h-16" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="docBg" x1="0" y1="0" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffab91"/>
        <stop offset="100%" stopColor="#d84315"/>
      </linearGradient>
      <linearGradient id="docFold" x1="0" y1="0" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffccbc"/>
        <stop offset="100%" stopColor="#ff8a65"/>
      </linearGradient>
      <linearGradient id="arrowGrad" x1="0" y1="0" x2="0" y2="100%">
        <stop offset="0%" stopColor="#ffffff"/>
        <stop offset="100%" stopColor="#ffccbc"/>
      </linearGradient>
      <filter id="shadow" x="-10%" y="-10%" width="130%" height="130%">
        <feDropShadow dx="2" dy="8" stdDeviation="4" floodColor="#000" floodOpacity="0.25"/>
      </filter>
      <filter id="arrowGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#ff7043" floodOpacity="0.5"/>
      </filter>
    </defs>
    <rect x="25" y="15" width="50" height="70" rx="6" fill="#000" opacity="0.1" transform="rotate(-5 50 50) translate(0, 4)"/>
    <path d="M25 20 C25 17, 27 15, 30 15 L60 15 L75 30 L75 80 C75 83, 73 85, 70 85 L30 85 C27 85, 25 83, 25 80 Z" fill="url(#docBg)" filter="url(#shadow)"/>
    <path d="M60 15 L75 30 L63 30 C61 30, 60 29, 60 27 Z" fill="url(#docFold)" filter="url(#shadow)"/>
    <line x1="35" y1="40" x2="65" y2="40" stroke="#ffccbc" strokeWidth="3" strokeLinecap="round" opacity="0.6"/>
    <line x1="35" y1="48" x2="55" y2="48" stroke="#ffccbc" strokeWidth="3" strokeLinecap="round" opacity="0.6"/>
    <g filter="url(#arrowGlow)">
      <path d="M50 35 L50 63 M42 55 L50 63 L58 55" stroke="url(#arrowGrad)" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round"/>
    </g>
    <rect x="38" y="68" width="24" height="4" rx="2" fill="#ffffff" opacity="0.95"/>
  </svg>
);

const IconSpeed3D = () => (
  <svg viewBox="0 0 100 100" className="w-16 h-16" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="clockOuter" x1="0" y1="0" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ef5350"/>
        <stop offset="100%" stopColor="#9b1c1c"/>
      </linearGradient>
      <linearGradient id="clockGlass" x1="0" y1="0" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8"/>
        <stop offset="100%" stopColor="#ef9a9a" stopOpacity="0.2"/>
      </linearGradient>
      <linearGradient id="neonHands" x1="0" y1="0" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff"/>
        <stop offset="100%" stopColor="#ffcdd2"/>
      </linearGradient>
      <filter id="shadowClock" x="-10%" y="-10%" width="130%" height="130%">
        <feDropShadow dx="3" dy="9" stdDeviation="4" floodColor="#000" floodOpacity="0.3"/>
      </filter>
      <filter id="handsGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#ef5350" floodOpacity="0.8"/>
      </filter>
    </defs>
    <circle cx="50" cy="50" r="38" fill="url(#clockOuter)" filter="url(#shadowClock)"/>
    <circle cx="50" cy="50" r="35" fill="none" stroke="#ef9a9a" strokeWidth="2" opacity="0.3"/>
    <circle cx="48" cy="48" r="34" fill="url(#clockGlass)"/>
    <g filter="url(#handsGlow)">
      <line x1="50" y1="50" x2="50" y2="28" stroke="url(#neonHands)" strokeWidth="4.5" strokeLinecap="round"/>
      <line x1="50" y1="50" x2="68" y2="50" stroke="url(#neonHands)" strokeWidth="4" strokeLinecap="round"/>
    </g>
    <circle cx="50" cy="50" r="4.5" fill="#ffffff" filter="url(#shadowClock)"/>
  </svg>
);

const IconSearch3D = () => (
  <svg viewBox="0 0 100 100" className="w-16 h-16" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="cardBg" x1="0" y1="0" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#e57373"/>
        <stop offset="100%" stopColor="#b71c1c"/>
      </linearGradient>
      <linearGradient id="lensGlass" x1="0" y1="0" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9"/>
        <stop offset="100%" stopColor="#ffcdd2" stopOpacity="0.15"/>
      </linearGradient>
      <linearGradient id="lensFrame" x1="0" y1="0" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff"/>
        <stop offset="100%" stopColor="#ffab91"/>
      </linearGradient>
    </defs>
    <rect x="25" y="25" width="45" height="55" rx="6" fill="url(#cardBg)" opacity="0.8" filter="drop-shadow(2px 5px 6px rgba(0,0,0,0.2))" transform="rotate(-10 47 52)"/>
    <line x1="33" y1="40" x2="58" y2="35" stroke="#ffcdd2" strokeWidth="3" strokeLinecap="round" opacity="0.6" transform="rotate(-10 47 52)"/>
    <line x1="33" y1="48" x2="50" y2="45" stroke="#ffcdd2" strokeWidth="3" strokeLinecap="round" opacity="0.6" transform="rotate(-10 47 52)"/>
    <rect x="58" y="58" width="10" height="26" rx="5" fill="url(#lensFrame)" filter="drop-shadow(4px 6px 5px rgba(0,0,0,0.3))" transform="rotate(-40 63 71)"/>
    <circle cx="48" cy="48" r="22" fill="none" stroke="url(#lensFrame)" strokeWidth="4.5" filter="drop-shadow(3px 5px 8px rgba(0,0,0,0.35))"/>
    <circle cx="48" cy="48" r="19.5" fill="url(#lensGlass)"/>
    <path d="M37 37 Q42 33 48 35" stroke="#ffffff" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.8"/>
  </svg>
);

const IconVisibility3D = () => (
  <svg viewBox="0 0 100 100" className="w-16 h-16" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="chartBase" x1="0" y1="0" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#e57373"/>
        <stop offset="100%" stopColor="#880e4f"/>
      </linearGradient>
      <linearGradient id="bar1" x1="0" y1="0" x2="0" y2="100%">
        <stop offset="0%" stopColor="#ffb74d"/>
        <stop offset="100%" stopColor="#ff7043"/>
      </linearGradient>
      <linearGradient id="bar2" x1="0" y1="0" x2="0" y2="100%">
        <stop offset="0%" stopColor="#ffffff"/>
        <stop offset="100%" stopColor="#ffccbc"/>
      </linearGradient>
      <filter id="shadowChart" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="3" dy="8" stdDeviation="4" floodColor="#000" floodOpacity="0.25"/>
      </filter>
      <filter id="lineGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#ff8a65" floodOpacity="0.6"/>
      </filter>
    </defs>
    <rect x="18" y="22" width="64" height="56" rx="10" fill="url(#chartBase)" filter="url(#shadowChart)"/>
    <rect x="28" y="52" width="8" height="18" rx="2" fill="url(#bar1)" opacity="0.8" filter="url(#shadowChart)"/>
    <rect x="28" y="50" width="8" height="3" rx="1.5" fill="#ffffff" opacity="0.9"/>
    <rect x="42" y="40" width="8" height="30" rx="2" fill="url(#bar2)" opacity="0.9" filter="url(#shadowChart)"/>
    <rect x="42" y="38" width="8" height="3" rx="1.5" fill="#ffffff"/>
    <rect x="56" y="30" width="8" height="40" rx="2" fill="url(#bar1)" filter="url(#shadowChart)"/>
    <rect x="56" y="28" width="8" height="3" rx="1.5" fill="#ffffff"/>
    <path d="M26 62 L41 48 L56 34 L72 26" fill="none" stroke="#ffffff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" filter="url(#lineGlow)"/>
    <circle cx="72" cy="26" r="4.5" fill="#ffffff" filter="url(#lineGlow)"/>
  </svg>
);

const MOCKUPS = [
  { name: "Boutique Luna", path: "/images/mockups/boutique.png", tag: "Moda & Accesorios" },
  { name: "Tech Andina", path: "/images/mockups/tech.png", tag: "Tecnología" },
  { name: "Restaurante Don Pepe", path: "/images/mockups/restaurant.png", tag: "Comida & Postres" },
  { name: "Eco Nature", path: "/images/mockups/eco.png", tag: "Eco & Natural" },
  { name: "Luxury Gold", path: "/images/mockups/luxury.png", tag: "Joyería Fina" },
  { name: "Pastel Sweet", path: "/images/mockups/pastel.png", tag: "Pastelería" }
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dizi — Catálogos Digitales para MYPEs | Vende por WhatsApp" },
      {
        name: "description",
        content: "Crea tu catálogo digital gratis en 2 minutos. Vende por WhatsApp sin descargas. Plataforma 100% móvil para MYPEs peruanas. Planes desde S/ 0.00.",
      },
      {
        name: "keywords",
        content: "catálogo digital gratis, tienda virtual WhatsApp, MYPE Perú, catálogo online Perú, vender por WhatsApp, catálogo web interactivo, digitalizar tienda Perú",
      },
      { property: "og:url", content: "https://dizi.idenza.site/" },
      { property: "og:title", content: "Dizi — Catálogos Digitales para MYPEs | Vende por WhatsApp" },
      {
        property: "og:description",
        content: "Crea tu catálogo digital gratis en 2 minutos. Vende por WhatsApp sin descargas. Plataforma 100% móvil para MYPEs peruanas.",
      },
      { property: "og:image", content: "https://dizi.idenza.site/images/og-image.png" },
    ],
    links: [
      { rel: "canonical", href: "https://dizi.idenza.site/" },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <img src="/images/Logo.png" alt="Dizi" className="h-10 w-auto object-contain" />
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#beneficios" className="hover:text-foreground transition-colors">Beneficios</a>
            <a href="#solucion" className="hover:text-foreground transition-colors">Solución</a>
            <a href="#modelos" className="hover:text-foreground transition-colors">Modelos</a>
            <a href="#precios" className="hover:text-foreground transition-colors">Precios</a>
            <Link to="/novedades" className="hover:text-foreground transition-colors">Novedades</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Button variant="outline" asChild className="hidden md:flex">
              <Link to="/login">Iniciar Sesión</Link>
            </Button>
            <Button asChild className="hidden md:flex shadow-lg shadow-primary/20 transition-all hover:scale-105">
              <Link to="/register">Crear Tienda</Link>
            </Button>
            {/* Hamburguesa mobile */}
            <button
              className="md:hidden flex items-center justify-center h-9 w-9 rounded-lg hover:bg-muted transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menú"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Menú mobile desplegable */}
        {menuOpen && (
          <div className="md:hidden border-t bg-background/95 backdrop-blur-md px-4 py-4 space-y-1">
            <a
              href="#beneficios"
              className="block px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Beneficios
            </a>
            <a
              href="#solucion"
              className="block px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Solución
            </a>
            <a
              href="#modelos"
              className="block px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Modelos
            </a>
            <a
              href="#precios"
              className="block px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Precios
            </a>
            <Link
              to="/novedades"
              className="block px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Novedades
            </Link>
            <div className="pt-2 border-t space-y-2">
              <Button variant="outline" asChild className="w-full">
                <Link to="/login" onClick={() => setMenuOpen(false)}>Iniciar Sesión</Link>
              </Button>
              <Button asChild className="w-full shadow-lg shadow-primary/20">
                <Link to="/register" onClick={() => setMenuOpen(false)}>Crear Tienda</Link>
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Botón flotante 30 días gratis */}
      <a
        href="https://wa.me/51925176472?text=Hola%2C%20me%20interesa%20probar%20Dizi%20para%20mi%20negocio"
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-6 right-5 z-50 flex flex-col items-center gap-1 group"
        style={{ filter: "drop-shadow(0 4px 16px rgba(0,0,0,0.25))" }}
      >
        <div className="w-14 h-14 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 active:scale-95" style={{ background: "#0f172a", border: "2.5px solid #4ade80" }}>
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="#4ade80" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 12v10H4V12"/>
            <path d="M22 7H2v5h20V7z"/>
            <path d="M12 22V7"/>
            <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/>
            <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/>
          </svg>
        </div>
        <span className="text-[9px] font-black px-2 py-0.5 rounded-full whitespace-nowrap tracking-wider" style={{ background: "#4ade80", color: "#052e16" }}>
          30 DIAS GRATIS
        </span>
      </a>

      <main className="overflow-hidden">
        {/* Hero Section */}
        <section className="relative pt-20 pb-20 lg:pt-32 lg:pb-24 overflow-hidden bg-gradient-to-b from-[#fffaf7] via-background to-background">
          {/* Animated Background Mesh Gradients */}
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[60%] rounded-full bg-primary/10 blur-[120px] animate-morph pointer-events-none" />
          <div className="absolute top-[10%] right-[-15%] w-[45%] h-[55%] rounded-full bg-lavender/10 blur-[120px] animate-morph pointer-events-none" style={{ animationDelay: '-4s' }} />
          <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[50%] rounded-full bg-emerald-200/10 blur-[100px] animate-morph pointer-events-none" style={{ animationDelay: '-8s' }} />
          
          {/* Light Grid Overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

          {/* Floating clay-styled graphic elements */}
          <div className="absolute left-[8%] top-[25%] hidden xl:block animate-float-slow opacity-80 pointer-events-none">
            <svg viewBox="0 0 100 100" className="w-20 h-20" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="30" fill="url(#clayPrimary)" filter="drop-shadow(2px 8px 12px rgba(255,130,58,0.3))"/>
              <circle cx="45" cy="45" r="28" fill="none" stroke="#fff" strokeWidth="1.5" opacity="0.4"/>
              <defs>
                <radialGradient id="clayPrimary" cx="30%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="#ffb085"/>
                  <stop offset="50%" stopColor="#ff823a"/>
                  <stop offset="100%" stopColor="#c74900"/>
                </radialGradient>
              </defs>
            </svg>
          </div>
          <div className="absolute right-[8%] top-[30%] hidden xl:block animate-float-reverse opacity-80 pointer-events-none">
            <svg viewBox="0 0 120 120" className="w-24 h-24" xmlns="http://www.w3.org/2000/svg">
              <path d="M20,50 C20,30 40,20 60,20 C80,20 100,30 100,50 C100,70 80,100 60,100 C40,100 20,70 20,50 Z" fill="url(#clayPurple)" filter="drop-shadow(2px 10px 15px rgba(188,132,238,0.3))"/>
              <defs>
                <radialGradient id="clayPurple" cx="35%" cy="30%" r="65%">
                  <stop offset="0%" stopColor="#e1c3fc"/>
                  <stop offset="60%" stopColor="#bc84ee"/>
                  <stop offset="100%" stopColor="#7535b0"/>
                </radialGradient>
              </defs>
            </svg>
          </div>

          <div className="container relative z-10 mx-auto max-w-6xl px-4 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-primary text-primary-foreground text-xs font-semibold tracking-wide uppercase mb-8 shadow-sm">
              <Zap className="w-3.5 h-3.5" />
              <span>Plataforma para MYPEs</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight mb-6">
              La Revolución del <span className="text-primary">Catálogo Web</span>
            </h1>

            <p className="text-base md:text-xl text-zinc-600 max-w-2xl mx-auto mb-10 leading-relaxed px-2">
              Digitalizando el comercio local peruano con velocidad y simplicidad.
              Crea tu tienda en 2 minutos y empieza a vender por WhatsApp.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 px-4 sm:px-0">
              <Button size="lg" asChild className="text-base h-12 sm:h-14 px-8 shadow-md transition-transform hover:-translate-y-0.5">
                <Link to="/register">
                  Comenzar Gratis <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-base h-12 sm:h-14 px-8 bg-white/80 hover:bg-white transition-colors">
                <a href="#precios">Ver Planes</a>
              </Button>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-zinc-500 font-medium">
              <span className="flex items-center gap-1.5 whitespace-nowrap"><CheckCircle2 className="w-4 h-4 text-primary" /> Sin descargas</span>
              <span className="flex items-center gap-1.5 whitespace-nowrap"><CheckCircle2 className="w-4 h-4 text-primary" /> 100% Móvil</span>
              <span className="flex items-center gap-1.5 whitespace-nowrap"><CheckCircle2 className="w-4 h-4 text-primary" /> Tiempo Real</span>
            </div>

            {/* Infinite Mockup Carousel */}
            <div className="mt-16 relative w-full overflow-hidden py-10">
              <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent z-20 pointer-events-none" />
              <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent z-20 pointer-events-none" />
              
              <div className="animate-infinite-scroll gap-6">
                {[...MOCKUPS, ...MOCKUPS].map((m, idx) => (
                  <div key={idx} className="w-52 h-80 bg-background rounded-3xl border shadow-xl flex flex-col overflow-hidden shrink-0 transform hover:-translate-y-4 hover:scale-105 transition-all duration-500 cursor-pointer relative group">
                    <div className="absolute top-2.5 left-2.5 z-20 bg-primary/90 text-primary-foreground text-[9px] font-black tracking-widest px-2.5 py-0.5 rounded-full uppercase">
                      {m.tag}
                    </div>
                    <div className="h-[250px] w-full overflow-hidden bg-muted relative">
                      <img src={m.path} alt={m.name} className="absolute inset-0 h-full w-full object-cover object-top group-hover:scale-110 transition-transform duration-700" />
                    </div>
                    <div className="p-3.5 flex-1 flex items-center justify-between border-t bg-card/50">
                      <div>
                        <div className="text-xs font-black tracking-tight">{m.name}</div>
                        <div className="text-[9px] text-muted-foreground">Catálogo Dizi</div>
                      </div>
                      <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Problem Section (El Calvario del PDF) */}
        <section id="beneficios" className="py-24 bg-muted/50 border-y relative">
          {/* Curved Transverse Line / cloud effect divide */}
          <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-background to-transparent pointer-events-none" />
          
          <div className="container mx-auto max-w-6xl px-4 relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Adiós al "Calvario" del PDF</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Los catálogos estáticos te hacen perder ventas. Es hora de evolucionar.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  icon: <IconFriction3D />,
                  title: "Fricción de Uso",
                  desc: "El cliente debe descargar archivos pesados que llenan la memoria de su celular."
                },
                {
                  icon: <IconSpeed3D />,
                  title: "Actualización Lenta",
                  desc: "Cambiar un precio implica rediseñar, exportar y volver a enviar todo."
                },
                {
                  icon: <IconSearch3D />,
                  title: "Cero Interactividad",
                  desc: "Sin buscador. Si alguien busca 'zapatillas', debe navegar 40 páginas."
                },
                {
                  icon: <IconVisibility3D />,
                  title: "Invisibilidad",
                  desc: "No sabes cuántas personas abrieron tu catálogo o qué ven más."
                }
              ].map((item, i) => (
                <div key={i} className="bg-background p-6 rounded-2xl border shadow-sm flex flex-col items-center text-center hover:border-primary/40 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                  <div className="mb-6 h-16 w-16 flex items-center justify-center">
                    {item.icon}
                  </div>
                  <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Solution Section (WhatsApp + Lupa = Ventas) */}
        <section id="solucion" className="py-24 lg:py-32">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-secondary text-secondary-foreground text-xs font-semibold tracking-wide uppercase mb-6">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Experiencia Móvil</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-black mb-6">
                  WhatsApp + Lupa = <span className="text-primary">Ventas</span>
                </h2>
                <p className="text-base md:text-lg text-muted-foreground mb-8 leading-relaxed">
                  Transformamos la forma en que tus clientes compran. Un sistema tan fácil que tu cliente no querrá comprar de otra manera.
                </p>
                
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="mt-1 flex-shrink-0">
                      <svg viewBox="0 0 100 100" className="w-12 h-12" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="lupGlass" x1="0" y1="0" x2="100%" y2="100%"><stop offset="0%" stopColor="#ffffff" stopOpacity="0.9"/><stop offset="100%" stopColor="#ffb74d" stopOpacity="0.2"/></linearGradient><linearGradient id="lupFrame" x1="0" y1="0" x2="100%" y2="100%"><stop offset="0%" stopColor="#ffb74d"/><stop offset="100%" stopColor="#ff7043"/></linearGradient></defs><rect x="52" y="52" width="10" height="24" rx="4" fill="url(#lupFrame)" filter="drop-shadow(1px 2px 2px rgba(0,0,0,0.25))" transform="rotate(-40 57 64)"/><circle cx="42" cy="42" r="18" fill="none" stroke="url(#lupFrame)" strokeWidth="4.5" filter="drop-shadow(2px 3px 4px rgba(0,0,0,0.3))"/><circle cx="42" cy="42" r="15.5" fill="url(#lupGlass)"/></svg>
                    </div>
                    <div>
                      <h4 className="text-xl font-bold mb-1">Buscador Inteligente</h4>
                      <p className="text-muted-foreground">Filtros reactivos que permiten encontrar cualquier artículo en milisegundos, eliminando el abandono por frustración.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="mt-1 flex-shrink-0">
                      <svg viewBox="0 0 100 100" className="w-12 h-12" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="bubbleGrad" cx="30%" cy="30%" r="70%"><stop offset="0%" stopColor="#a7ffeb"/><stop offset="40%" stopColor="#26a69a"/><stop offset="100%" stopColor="#00695c"/></radialGradient><filter id="shadowBubble" x="-10%" y="-10%" width="130%" height="130%"><feDropShadow dx="2" dy="5" stdDeviation="3" floodColor="#000" floodOpacity="0.3"/></filter></defs><path d="M50 18 C30 18, 16 30, 16 46 C16 53, 20 60, 26 65 L22 79 L37 73 C41 74, 45 74, 50 74 C70 74, 84 62, 84 46 C84 30, 70 18, 50 18 Z" fill="url(#bubbleGrad)" filter="url(#shadowBubble)"/><path d="M37 38 C39 37, 43 40, 44 42 C45 44, 43 46, 42 47 C44 50, 46 52, 49 54 C50 53, 52 51, 54 52 C56 53, 59 57, 58 59 C57 61, 53 62, 50 62 C42 62, 34 54, 34 46 C34 43, 35 39, 37 38 Z" fill="#ffffff" opacity="0.95"/></svg>
                    </div>
                    <div>
                      <h4 className="text-xl font-bold mb-1">Carrito hacia WhatsApp</h4>
                      <p className="text-muted-foreground">El cliente arma su pedido y te envía un mensaje estructurado. Solo tienes que responder con tus datos de pago.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Mockup visual */}
              <div className="relative mx-auto w-full max-w-sm">
                <div className="border-[8px] border-muted bg-background rounded-[3rem] overflow-hidden shadow-xl relative">
                  {/* Notch */}
                  <div className="absolute top-0 inset-x-0 h-6 bg-muted rounded-b-3xl w-1/2 mx-auto z-20" />
                  
                  {/* Fake UI */}
                  <div className="h-[600px] flex flex-col">
                    <div className="bg-primary/5 p-4 pt-8 pb-4 border-b">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20" />
                        <div>
                          <div className="w-24 h-4 bg-foreground/80 rounded mb-1" />
                          <div className="w-16 h-3 bg-muted-foreground/50 rounded" />
                        </div>
                      </div>
                      <div className="mt-4 relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <div className="h-10 bg-background border rounded-full w-full" />
                      </div>
                    </div>
                    <div className="p-4 grid grid-cols-2 gap-3 flex-1 overflow-hidden">
                      {[1,2,3,4].map(i => (
                        <div key={i} className="bg-muted/30 rounded-xl p-2 border">
                          <div className="aspect-square bg-muted rounded-lg mb-2" />
                          <div className="w-3/4 h-3 bg-foreground/60 rounded mb-2" />
                          <div className="w-1/2 h-4 bg-primary/80 rounded" />
                        </div>
                      ))}
                    </div>
                    <div className="p-4 bg-background border-t">
                      <div className="w-full h-12 bg-green-500 text-white rounded-xl flex items-center justify-center font-bold gap-2 shadow-lg shadow-green-500/20">
                        <MessageCircle className="w-5 h-5" /> Enviar a WhatsApp
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Templates Section */}
        <section id="modelos" className="py-24">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-secondary text-secondary-foreground text-xs font-semibold tracking-wide uppercase mb-6">
                <Palette className="w-3.5 h-3.5" />
                <span>Diseños Flexibles</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Modelos de Catálogo</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Tu marca es única, tu catálogo también debería serlo. Elige entre diferentes estilos visuales diseñados para maximizar tus conversiones.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Modelo Minimalista */}
              <div className="group relative overflow-hidden rounded-3xl border bg-background shadow-sm hover:shadow-xl transition-all">
                <div className="h-64 bg-gray-50 flex items-center justify-center p-0 relative overflow-hidden border-b">
                  <img src="/images/mockups/boutique.png" alt="Diseño Minimalista" className="absolute top-4 w-[200px] h-auto rounded-t-xl shadow-xl border-x border-t transition-transform group-hover:-translate-y-2 object-cover object-top" />
                </div>
                <div className="p-6 relative z-10 bg-background">
                  <h3 className="text-xl font-bold mb-2">Boutique & Moda</h3>
                  <p className="text-muted-foreground text-sm">
                    Estilo minimalista y elegante. Ideal para joyerías, moda y productos donde la fotografía debe deslumbrar.
                  </p>
                </div>
              </div>

              {/* Modelo Nocturno */}
              <div className="group relative overflow-hidden rounded-3xl border bg-background shadow-sm hover:shadow-xl transition-all">
                <div className="h-64 bg-zinc-950 flex items-center justify-center border-b border-zinc-800 p-0 relative overflow-hidden">
                  <img src="/images/mockups/tech.png" alt="Diseño Nocturno" className="absolute top-4 w-[200px] h-auto rounded-t-xl shadow-xl border-x border-t border-zinc-800 transition-transform group-hover:-translate-y-2 object-cover object-top" />
                </div>
                <div className="p-6 relative z-10 bg-background">
                  <h3 className="text-xl font-bold mb-2">Tech & Electrónica</h3>
                  <p className="text-muted-foreground text-sm">
                    Modo oscuro nativo con acentos neón. Perfecto para tecnología, gaming y marcas futuristas o de alto perfil.
                  </p>
                </div>
              </div>

              {/* Modelo Vibrante */}
              <div className="group relative overflow-hidden rounded-3xl border bg-background shadow-sm hover:shadow-xl transition-all">
                <div className="h-64 bg-orange-50 flex items-center justify-center border-b border-orange-100 p-0 relative overflow-hidden">
                  <img src="/images/mockups/restaurant.png" alt="Diseño Vibrante" className="absolute top-4 w-[200px] h-auto rounded-t-xl shadow-xl border-x border-t border-orange-200 transition-transform group-hover:-translate-y-2 object-cover object-top" />
                </div>
                <div className="p-6 relative z-10 bg-background">
                  <h3 className="text-xl font-bold mb-2">Gastronomía & Fast Food</h3>
                  <p className="text-muted-foreground text-sm">
                    Colores vivos y apetitosos. Pensado para restaurantes, comida rápida, postres y promociones dinámicas.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="precios" className="py-24 bg-muted/30 border-t">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Planes diseñados para tu crecimiento</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Precios accesibles pensados para la penetración masiva en el mercado peruano. Sin comisiones ocultas.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Plan Semilla */}
              <PricingCard 
                title="Semilla" 
                price="S/ 0.00" 
                desc="Para micro-emprendedores probando el mercado."
                features={[
                  "Hasta 7 productos",
                  "1 modelo de diseño estándar",
                  "Múltiples categorías",
                  "Link personalizado",
                  "Carrito a WhatsApp",
                  "Marca de agua Dizi visible"
                ]}
              />
              
              {/* Plan Emprendedor */}
              <PricingCard 
                title="Emprendedor" 
                price="S/ 14.90" 
                desc="Tiendas de ropa, accesorios o repuestos."
                features={[
                  "Hasta 50 productos",
                  "Modelos estándar (Clásico, Nocturno, Vibrante)",
                  "Múltiples categorías",
                  "Buscador inteligente",
                  "Soporte básico",
                  "Descarga de Catálogo en PDF",
                  "Sin marca de agua (Marca propia)"
                ]}
                highlighted
                planId="emprendedor"
              />

              {/* Plan Pro */}
              <PricingCard 
                title="Catálogo Pro" 
                price="S/ 19.90" 
                desc="Minimarkets y tiendas con stock variado."
                features={[
                  "Hasta 200 productos",
                  "Modelos estándar + Diseños Premium por Nichos",
                  "Múltiples categorías",
                  "Estadísticas básicas",
                  "Descarga de Catálogo en PDF",
                  "Sin marca de agua (Marca propia)"
                ]}
                planId="pro"
              />

              {/* Plan Ilimitado */}
              <PricingCard 
                title="Ilimitado" 
                price="S/ 34.90" 
                desc="Negocios con alta rotación y carga masiva."
                features={[
                  "Productos ilimitados",
                  "Modelos estándar + Diseños Premium por Nichos",
                  "Múltiples categorías",
                  "Carga masiva (Excel)",
                  "Soporte prioritario 24/7",
                  "Descarga de Catálogo en PDF",
                  "Sin marca de agua (Marca propia)"
                ]}
                planId="ilimitado"
              />
            </div>
          </div>
        </section>

        {/* CTA Section — Banner 30 días */}
        <section className="py-20">
          <div className="container mx-auto max-w-3xl px-4">
            <div className="rounded-3xl overflow-hidden border border-zinc-800" style={{ background: "#0f172a" }}>

              {/* Top bar */}
              <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-emerald-400 text-xs font-bold uppercase tracking-widest">Oferta de lanzamiento</span>
                </div>
                <span className="text-white/30 text-xs">Solo para nuevos usuarios</span>
              </div>

              {/* Main */}
              <div className="px-6 py-6 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                {/* Número grande */}
                <div className="shrink-0 flex items-end gap-1.5">
                  <span className="text-7xl font-black text-white leading-none">30</span>
                  <div className="mb-2">
                    <div className="text-primary text-sm font-black uppercase tracking-wider leading-tight">dias</div>
                    <div className="text-white/30 text-xs uppercase tracking-widest">gratis</div>
                  </div>
                </div>

                {/* Divider */}
                <div className="hidden sm:block w-px h-16 bg-white/10 shrink-0" />

                {/* Text */}
                <div className="flex-1">
                  <h3 className="text-white text-xl font-black leading-tight mb-1">Plan Emprendedor completo</h3>
                  <p className="text-white/50 text-sm">Escríbenos y te damos acceso. Sin tarjeta. Sin compromisos.</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {["50 productos", "Bio-Link personalizado", "Soporte directo", "Codigo QR"].map((f) => (
                      <span key={f} className="text-[11px] font-semibold border border-white/10 text-white/50 px-2.5 py-1 rounded-full">{f}</span>
                    ))}
                  </div>
                </div>

                {/* Botones */}
                <div className="flex flex-col gap-2.5 shrink-0 w-full sm:w-auto">
                  <a
                    href="https://wa.me/51925176472?text=Hola%2C%20me%20interesa%20probar%20Dizi%20para%20mi%20negocio"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] active:scale-95 text-white text-sm font-bold px-5 py-3 rounded-2xl transition-all shadow-lg shadow-green-900/40 whitespace-nowrap"
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white shrink-0" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.554 4.118 1.528 5.852L0 24l6.324-1.508A11.956 11.956 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.002-1.366l-.358-.213-3.752.894.952-3.653-.233-.374A9.818 9.818 0 1112 21.818z"/>
                    </svg>
                    Solicitar por WhatsApp
                  </a>
                  <Link
                    to="/register"
                    className="flex items-center justify-center gap-2 bg-white/8 hover:bg-white/12 border border-white/10 text-white/70 hover:text-white text-sm font-semibold px-5 py-3 rounded-2xl transition-all whitespace-nowrap"
                  >
                    Registrarme solo <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t py-12 text-center text-muted-foreground">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center mb-4">
            <img src="/images/Logo.png" alt="Dizi" className="h-9 w-auto object-contain" />
          </div>
          <div className="flex items-center justify-center gap-6 text-sm mb-3">
            <Link to="/novedades" className="hover:text-foreground transition-colors">Novedades &amp; FAQ</Link>
            <Link to="/privacidad" className="hover:text-foreground transition-colors">Privacidad</Link>
            <Link to="/login" className="hover:text-foreground transition-colors">Iniciar Sesión</Link>
            <Link to="/register" className="hover:text-foreground transition-colors">Registrarse</Link>
          </div>
          <p className="text-sm">
            © {new Date().getFullYear()} Dizi Development. Digitalizando el Perú.
          </p>
        </div>
      </footer>
    </div>
  );
}

function PricingCard({ 
  title, 
  price, 
  desc, 
  features, 
  highlighted = false,
  planId = "semilla"
}: { 
  title: string, 
  price: string, 
  desc: string, 
  features: string[],
  highlighted?: boolean,
  planId?: string
}) {
  return (
    <div className={`relative flex flex-col rounded-3xl border p-8 shadow-sm transition-all duration-300 hover:shadow-2xl glass-panel ${highlighted ? 'border-primary ring-1 ring-primary/30 shadow-primary/10 lg:scale-105 z-10' : 'hover:border-primary/50'}`}>
      {highlighted && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-[10px] font-black rounded-full uppercase tracking-wider shadow-md shadow-primary/20">
          Más Popular
        </div>
      )}
      <div className="mb-6">
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-muted-foreground text-sm h-10 leading-snug">{desc}</p>
      </div>
      <div className="mb-6">
        <div className="text-4xl font-extrabold tracking-tight text-foreground">{price}</div>
        <div className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mt-1">por mes</div>
      </div>
      <ul className="space-y-3 mb-8 flex-1">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-3 text-sm font-medium text-foreground/80">
            <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Button variant={highlighted ? "default" : "outline"} className="w-full h-11 text-sm font-bold shadow-sm" asChild>
        {planId === "semilla" ? (
          <Link to={`/register`}>Crear mi Catálogo</Link>
        ) : (
          <a href={`https://wa.me/51925176472?text=${encodeURIComponent(`Hola, me gustaría suscribirme al plan ${title} de Dizi.`)}`} target="_blank" rel="noreferrer">
            Adquirir Plan
          </a>
        )}
      </Button>
    </div>
  )
}
