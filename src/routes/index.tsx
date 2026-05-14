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

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dizi — La Revolución del Catálogo Web" },
      {
        name: "description",
        content: "Crea tu tienda en 2 minutos. Digitalizando el comercio local con velocidad y simplicidad.",
      },
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

      <main className="overflow-hidden">
        {/* Hero Section */}
        <section className="relative pt-24 pb-32 lg:pt-40 lg:pb-48 overflow-hidden">
          {/* Boutique Background */}
          <div 
            className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url('/images/hero-boutique.jpg.png')" }}
          />
          {/* Professional Overlay (Solid and clean) */}
          <div className="absolute inset-0 z-0 bg-white/70 backdrop-blur-[1px]" />
          
          <div className="container relative z-10 mx-auto max-w-6xl px-4 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-primary text-primary-foreground text-xs font-semibold tracking-wide uppercase mb-8 shadow-sm">
              <Zap className="w-3.5 h-3.5" />
              <span>Plataforma para MYPEs</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight mb-6">
              La Revolución del <span className="text-primary">Catálogo Web</span>
            </h1>
            
            <p className="text-base md:text-xl text-zinc-800 max-w-2xl mx-auto mb-10 leading-relaxed px-2 font-medium">
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
                <a href="#precios">
                  Ver Planes
                </a>
              </Button>
            </div>
            
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-zinc-700 font-bold">
              <span className="flex items-center gap-1.5 whitespace-nowrap"><CheckCircle2 className="w-4 h-4 text-primary" /> Sin descargas</span>
              <span className="flex items-center gap-1.5 whitespace-nowrap"><CheckCircle2 className="w-4 h-4 text-primary" /> 100% Móvil</span>
              <span className="flex items-center gap-1.5 whitespace-nowrap"><CheckCircle2 className="w-4 h-4 text-primary" /> Tiempo Real</span>
            </div>
          </div>
        </section>

        {/* Problem Section (El Calvario del PDF) */}
        <section id="beneficios" className="py-24 bg-muted/50 border-y">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Adiós al "Calvario" del PDF</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Los catálogos estáticos te hacen perder ventas. Es hora de evolucionar.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  icon: <FileDown className="w-8 h-8 text-destructive" />,
                  title: "Fricción de Uso",
                  desc: "El cliente debe descargar archivos pesados que llenan la memoria de su celular."
                },
                {
                  icon: <Clock className="w-8 h-8 text-destructive" />,
                  title: "Actualización Lenta",
                  desc: "Cambiar un precio implica rediseñar, exportar y volver a enviar todo."
                },
                {
                  icon: <Search className="w-8 h-8 text-destructive" />,
                  title: "Cero Interactividad",
                  desc: "Sin buscador. Si alguien busca 'zapatillas', debe navegar 40 páginas."
                },
                {
                  icon: <TrendingUp className="w-8 h-8 text-destructive" />,
                  title: "Invisibilidad",
                  desc: "No sabes cuántas personas abrieron tu catálogo o qué ven más."
                }
              ].map((item, i) => (
                <div key={i} className="bg-background p-6 rounded-2xl border shadow-sm flex flex-col items-center text-center hover:border-destructive/50 transition-colors">
                  <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
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
                    <div className="mt-1 bg-primary/10 p-2 rounded-lg text-primary h-fit">
                      <Search className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold mb-1">Buscador Inteligente</h4>
                      <p className="text-muted-foreground">Filtros reactivos que permiten encontrar cualquier artículo en milisegundos, eliminando el abandono por frustración.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="mt-1 bg-green-500/10 p-2 rounded-lg text-green-500 h-fit">
                      <MessageCircle className="w-6 h-6" />
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
                  "1 modelo de diseño",
                  "3 nichos (Comida, Bisutería, General)",
                  "Link personalizado",
                  "Carrito a WhatsApp"
                ]}
              />
              
              {/* Plan Emprendedor */}
              <PricingCard 
                title="Emprendedor" 
                price="S/ 14.90" 
                desc="Tiendas de ropa, accesorios o repuestos."
                features={[
                  "Hasta 50 productos",
                  "Modelos y nichos ilimitados",
                  "Buscador inteligente",
                  "Soporte básico",
                  "Descarga de Catálogo en PDF"
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
                  "Modelos y nichos ilimitados",
                  "Estadísticas básicas",
                  "Múltiples categorías",
                  "Descarga de Catálogo en PDF"
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
                  "Modelos y nichos ilimitados",
                  "Carga masiva (Excel)",
                  "Soporte prioritario 24/7",
                  "Descarga de Catálogo en PDF"
                ]}
                planId="ilimitado"
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/5 -z-10" />
          <div className="container mx-auto max-w-4xl px-4 text-center">
            <h2 className="text-4xl font-bold mb-6">¿Listo para modernizar tu negocio?</h2>
            <p className="text-xl text-muted-foreground mb-10">
              Únete a Dizi y lidera la transformación digital en tu sector.
            </p>
            <Button size="lg" asChild className="w-full sm:w-auto text-base sm:text-lg h-14 px-10 shadow-sm transition-transform hover:-translate-y-0.5">
              <Link to="/register">Crear mi Catálogo Ahora</Link>
            </Button>
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
    <div className={`relative flex flex-col bg-background rounded-3xl border p-8 shadow-sm transition-all hover:shadow-xl ${highlighted ? 'border-primary ring-1 ring-primary shadow-primary/10 lg:scale-105 z-10' : 'hover:border-primary/50'}`}>
      {highlighted && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full uppercase tracking-wider">
          Más Popular
        </div>
      )}
      <div className="mb-6">
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-muted-foreground text-sm h-10">{desc}</p>
      </div>
      <div className="mb-6">
        <div className="text-4xl font-extrabold tracking-tight">{price}</div>
        <div className="text-muted-foreground text-sm font-medium mt-1">por mes</div>
      </div>
      <ul className="space-y-3 mb-8 flex-1">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-3 text-sm font-medium">
            <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Button variant={highlighted ? "default" : "outline"} className="w-full" asChild>
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
