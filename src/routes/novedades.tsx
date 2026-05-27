import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Megaphone,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Tag,
  ArrowLeft,
  Zap,
  Star,
  Wrench,
  Calendar,
} from "lucide-react";

export const Route = createFileRoute("/novedades")({
  head: () => ({
    meta: [
      { title: "Novedades y FAQ — Dizi" },
      {
        name: "description",
        content: "Últimas actualizaciones de Dizi y respuestas a las preguntas más frecuentes.",
      },
    ],
  }),
  component: NovedadesPage,
});

/* ─────────────────────────────────────────────────────────
   NOTICIAS — editar aquí para agregar nuevas
   type: "nuevo" | "mejora" | "fix"
───────────────────────────────────────────────────────── */
const NOTICIAS = [
  {
    id: 21,
    type: "nuevo" as const,
    date: "27 mayo 2026",
    title: "Filtra productos desde un cajón elegante sin perder espacio en pantalla",
    summary:
      "El catálogo ahora tiene un botón de 'Filtros' que abre un menú deslizante desde abajo. Dentro encuentras todas las categorías en cuadrícula y el control de precio — todo organizado y fácil de tocar desde el celular.",
    detail:
      "Si tienes un filtro activo, aparece una etiqueta pequeña debajo del buscador para que puedas quitarlo con un toque, sin necesidad de abrir el menú de nuevo. El botón también muestra un contador cuando hay filtros aplicados.",
  },
  {
    id: 22,
    type: "mejora" as const,
    date: "27 mayo 2026",
    title: "Las categorías ya no ocupan espacio horizontal en el catálogo",
    summary:
      "Se eliminó la barra de desplazamiento horizontal de categorías que aparecía en el catálogo. Ahora todo está limpio: solo el buscador y el botón de filtros en una sola línea.",
    detail:
      "El espacio antes ocupado por las píldoras de categorías ahora lo usan los productos, dando una vista más despejada y profesional.",
  },
  {
    id: 23,
    type: "nuevo" as const,
    date: "27 mayo 2026",
    title: "Personaliza el color de fondo de cada botón de red social",
    summary:
      "En tu Link en Bio, ahora puedes cambiar el color del botón de Instagram, Facebook, TikTok y LinkedIn de forma individual — no solo los personalizados, sino también los oficiales.",
    detail:
      "El selector de color aparece automáticamente debajo del campo de URL cuando ingresas una red social. Si no tocas nada, el botón usa el color oficial de la plataforma. Tienes un botón 'Reset' para volver al color original en cualquier momento.",
  },
  {
    id: 24,
    type: "mejora" as const,
    date: "27 mayo 2026",
    title: "Íconos profesionales en toda la vista pública del catálogo",
    summary:
      "Se reemplazaron todos los emojis que aparecían en el catálogo (carro de compras, mapa, fuego) por íconos del mismo sistema de diseño de la app — más limpios, consistentes y profesionales.",
    detail:
      "Los íconos se adaptan automáticamente al tema de colores de cada tienda y se ven perfectos tanto en fondos claros como oscuros.",
  },
  {
    id: 15,
    type: "nuevo" as const,
    date: "26 mayo 2026",
    title: "Fondo 100% personalizado en tu Link en Bio",
    summary:
      "Ahora puedes elegir el color exacto de fondo para tu página de Link en Bio, o subir una imagen propia que lo ocupe por completo. Ideal para marcas con identidad visual definida.",
    detail:
      "Al seleccionar el tema 'Personalizado', elige entre color sólido (con selector de color) o imagen de fondo. El texto se ajusta automáticamente a blanco o negro según el fondo que elijas, para que siempre sea legible.",
  },
  {
    id: 16,
    type: "nuevo" as const,
    date: "26 mayo 2026",
    title: "Panel de Link en Bio rediseñado con secciones colapsables",
    summary:
      "El panel de configuración del Link en Bio se organizó en 4 bloques que se abren y cierran: Información, Apariencia, Redes y Ubicación. Ya no es una pantalla larga y difícil de navegar.",
    detail:
      "Cada sección tiene un ícono de color propio para encontrarla de un vistazo. Puedes abrir solo lo que necesitas editar y mantener el resto cerrado.",
  },
  {
    id: 17,
    type: "mejora" as const,
    date: "26 mayo 2026",
    title: "Los iconos de redes sociales muestran su color oficial en el panel admin",
    summary:
      "En el panel de Link en Bio, el ícono de Instagram ahora aparece en rosa, Facebook en azul, LinkedIn en azul corporativo y TikTok en negro — igual que sus logos reales.",
    detail:
      "Esto hace más fácil identificar cada red social de un vistazo mientras configuras tu página, sin necesidad de leer el nombre.",
  },
  {
    id: 18,
    type: "nuevo" as const,
    date: "26 mayo 2026",
    title: "Personaliza el color de cada botón adicional en tu Link en Bio",
    summary:
      "Al agregar un botón personalizado (PDF de catálogo, web, WhatsApp, etc.), ahora puedes elegir el color de fondo y el color del texto de forma independiente para ese botón.",
    detail:
      "Cada botón puede tener su propio color, distinto al resto. Esto te permite mantener los colores de cada marca o tipo de contenido de forma visual y ordenada.",
  },
  {
    id: 19,
    type: "fix" as const,
    date: "26 mayo 2026",
    title: "La foto de perfil del Link en Bio ahora se guarda correctamente",
    summary:
      "Se corrigió un problema donde al cambiar la imagen de perfil o portada del Link en Bio, la imagen no se actualizaba de forma permanente al guardar.",
    detail:
      "Ahora al guardar, las fotos se suben correctamente y permanecen al recargar la página o entrar nuevamente al panel.",
  },
  {
    id: 20,
    type: "mejora" as const,
    date: "26 mayo 2026",
    title: "Los botones de Link en Bio tienen más variedad visual real",
    summary:
      "Se corrigió un problema donde los estilos 'Píldora' y 'Redondeado' se veían casi idénticos. Ahora la diferencia entre bordes curvos y cuadrados es claramente visible.",
    detail:
      "Los 6 estilos disponibles (Píldora Relleno, Píldora Contorno, Píldora Vidrio, Redondeado Relleno, Redondeado Contorno y Redondeado Vidrio) ahora se distinguen a simple vista en la vista previa.",
  },
  {
    id: 10,
    type: "nuevo" as const,
    date: "14 mayo 2026",
    title: "Libro de Reclamaciones en tu catálogo",
    summary:
      "Tus clientes ahora pueden dejar una reclamación directamente desde tu catálogo público. El botón aparece visible para todos y el proceso es guiado paso a paso.",
    detail:
      "El cliente completa sus datos, describe lo que pasó y recibe un número de reclamo único. Tú puedes ver todos los reclamos desde tu panel en la sección Reclamaciones.",
  },
  {
    id: 11,
    type: "mejora" as const,
    date: "14 mayo 2026",
    title: "Descarga directa del comprobante de reclamo en PDF",
    summary:
      "Al terminar de registrar un reclamo, el cliente puede descargar su comprobante en PDF al instante — sin impresoras ni ventanas extra.",
    detail:
      "El PDF incluye el número de reclamo, los datos del cliente y el detalle de lo ocurrido. Todo listo para guardar o compartir desde el celular.",
  },
  {
    id: 12,
    type: "mejora" as const,
    date: "14 mayo 2026",
    title: "Validación inteligente en el formulario de reclamos",
    summary:
      "El formulario ahora verifica que los datos ingresados sean reales antes de continuar. DNI, RUC, correo, teléfono — si algo está mal, te avisa de inmediato.",
    detail:
      "Esto evita que se registren reclamos con información falsa o incompleta, protegiendo tanto al cliente como al negocio.",
  },
  {
    id: 13,
    type: "fix" as const,
    date: "14 mayo 2026",
    title: "Catálogo carga correctamente al entrar por enlace directo",
    summary:
      "Se corrigió un problema donde al abrir el enlace del catálogo directamente (sin haber entrado antes al panel), aparecía 'Tienda no encontrada' por un momento.",
    detail:
      "Ahora el catálogo muestra un indicador de carga mientras obtiene la información y luego se muestra correctamente en todos los casos.",
  },
  {
    id: 14,
    type: "fix" as const,
    date: "14 mayo 2026",
    title: "Ya no aparecen productos de ejemplo en el catálogo público",
    summary:
      "Se corrigió un error donde algunos catálogos mostraban productos de ejemplo (zapatillas, etc.) que no pertenecían a la tienda.",
    detail:
      "Los productos de ejemplo son solo para mostrar cómo se ve el catálogo durante la configuración inicial. Ahora nunca se muestran a los clientes.",
  },
  {
    id: 1,
    type: "nuevo" as const,
    date: "13 mayo 2026",
    title: "Portada con Banner — modelo visual estrella",
    summary:
      "Ya puedes usar el modelo 'Portada con Banner': sube una imagen panorámica que ocupa toda la parte superior de tu catálogo, seguida de una grilla limpia de productos. Ideal para marcas con identidad visual fuerte.",
    detail:
      "El sistema te guía con las dimensiones recomendadas y te avisa si tu imagen no tiene la proporción ideal, para que tu catálogo siempre luzca profesional.",
  },
  {
    id: 2,
    type: "nuevo" as const,
    date: "13 mayo 2026",
    title: "Crear categorías sin salir del formulario de producto",
    summary:
      "Ahora puedes crear una categoría nueva directamente desde el modal de 'Nuevo producto'. Toca el botón + junto al selector y escribe el nombre — se guarda al instante y se selecciona automáticamente.",
    detail:
      "Ya no es necesario ir a la sección de Categorías primero. Esto reduce los pasos para publicar un producto de 4 a 2.",
  },
  {
    id: 3,
    type: "mejora" as const,
    date: "13 mayo 2026",
    title: "Guías de proporción de imagen en tiempo real",
    summary:
      "El sistema ahora te dice exactamente qué tamaño de imagen usar según el modelo de catálogo que tienes activo. Si subes una imagen con proporción incorrecta, aparece una advertencia específica.",
    detail:
      "Al elegir un modelo y subir una imagen, el sistema te dice si el tamaño es el ideal o si necesitas ajustarlo — sin necesidad de saberlo de memoria.",
  },
  {
    id: 4,
    type: "nuevo" as const,
    date: "13 mayo 2026",
    title: "Sistema de suscripciones con períodos y gracia",
    summary:
      "Los planes ahora tienen fecha de vencimiento real. Al expirar: 3 días de gracia antes de reducir productos, 15 días para mantener el diseño premium, luego baja automáticamente al modelo semilla.",
    detail:
      "Los productos que excedan el límite del plan semilla (7) se ocultan del catálogo público pero no se eliminan. Al renovar, vuelven a aparecer automáticamente. Los invites también se generan con duración definida: 1, 3, 6 o 12 meses.",
  },
  {
    id: 5,
    type: "mejora" as const,
    date: "13 mayo 2026",
    title: "Badges de proporción en el selector de modelos",
    summary:
      "Cada tarjeta de modelo en la pantalla de Diseño ahora muestra un badge con la proporción de imagen recomendada para sus productos (Cuadrada 1:1, Vertical 3:4, Panorámica 21:9, etc.).",
    detail:
      "Así puedes elegir el modelo sabiendo de antemano qué tipo de fotos necesitas preparar para tus productos.",
  },
  {
    id: 6,
    type: "fix" as const,
    date: "13 mayo 2026",
    title: "Correcciones de estabilidad en el panel admin",
    summary:
      "Se corrigieron varios errores internos que podían provocar pantallas en blanco en el panel de administración bajo ciertas condiciones.",
    detail:
      "Revisamos y estabilizamos varias secciones del panel para que la experiencia sea más fluida y sin interrupciones.",
  },
];

/* ─────────────────────────────────────────────────────────
   FAQ — editar aquí para agregar preguntas
───────────────────────────────────────────────────────── */
const FAQ = [
  {
    q: "¿Cómo consigo mi catálogo digital?",
    a: "Entra a dizi.idenza.site y toca 'Crear Tienda'. En menos de 2 minutos registras tu negocio y tu catálogo queda activo al instante con tu link personalizado (dizi.idenza.site/t/tu-tienda).",
  },
  {
    q: "¿Necesito saber de tecnología o diseño?",
    a: "Para nada. El panel está diseñado para que cualquier persona pueda usarlo. Subes tu logo, agregas tus productos con foto y precio, eliges el diseño que más te gusta y listo. Si tienes dudas, te ayudamos por WhatsApp.",
  },
  {
    q: "¿Cuántos productos puedo subir?",
    a: "Depende de tu plan: Semilla (gratis) permite hasta 7 productos, Emprendedor hasta 50, Pro hasta 200, e Ilimitado sin límite. Puedes cambiar de plan en cualquier momento.",
  },
  {
    q: "¿Qué pasa si mi suscripción vence?",
    a: "Tienes 3 días de gracia donde todo sigue igual. Luego, los productos que excedan el límite del plan gratuito (7) se ocultan del catálogo público, pero no se borran. Tu diseño premium se mantiene 15 días más, y después cambia al modelo básico. Al renovar, todo vuelve a la normalidad automáticamente.",
  },
  {
    q: "¿Cómo realizan el pedido mis clientes?",
    a: "Tus clientes visitan tu catálogo, agregan los productos que quieren a su carrito y al finalizar se abre WhatsApp con el mensaje del pedido ya redactado. Tú recibes el pedido directamente en tu teléfono, sin comisiones ni intermediarios.",
  },
  {
    q: "¿Las fotos de mis productos se ven en buena calidad?",
    a: "Sí. El sistema convierte automáticamente todas las imágenes a formato WebP, que mantiene excelente calidad visual con el menor peso posible para que el catálogo cargue rápido en el celular de tus clientes.",
  },
  {
    q: "¿Puedo personalizar los colores y el diseño?",
    a: "Sí. Tienes más de 15 modelos de diseño y puedes cambiar el color de acento y el fondo del catálogo. Los planes superiores desbloquean modelos premium como Luxury Gold, Dark Fashion, Portada con Banner, entre otros.",
  },
  {
    q: "¿Puedo cambiar mi link personalizado después?",
    a: "Sí, puedes cambiarlo desde la sección Configuración en cualquier momento. El sistema verifica en tiempo real que el nuevo link esté disponible antes de dejarte guardarlo.",
  },
  {
    q: "¿Funciona en celular?",
    a: "Completamente. Tanto el panel de administración como el catálogo público están optimizados para móvil. Tus clientes verán el catálogo perfecto desde su teléfono sin necesidad de hacer zoom ni desplazarse horizontalmente.",
  },
  {
    q: "¿Cómo renuevo o cambio mi plan?",
    a: "Escríbenos por WhatsApp al +51 925 176 472 y lo gestionamos en minutos. También puedes ver el estado de tu suscripción en la sección 'Mi Plan' dentro de tu panel.",
  },
];

/* ─────────────────────────────────────────────────────────
   Tipos y helpers visuales
───────────────────────────────────────────────────────── */
const TYPE_CONFIG = {
  nuevo:  { label: "Nuevo",   color: "bg-blue-100 text-blue-700",   icon: Star },
  mejora: { label: "Mejora",  color: "bg-emerald-100 text-emerald-700", icon: Zap },
  fix:    { label: "Fix",     color: "bg-amber-100 text-amber-700", icon: Wrench },
};

function NewsCard({ noticia, defaultOpen = false }: { noticia: typeof NOTICIAS[0]; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const cfg = TYPE_CONFIG[noticia.type];
  const Icon = cfg.icon;

  return (
    <div className={`rounded-2xl border bg-card transition-all duration-200 ${open ? "shadow-md" : "hover:shadow-sm"}`}>
      <button
        className="w-full text-left p-5 flex items-start gap-4"
        onClick={() => setOpen(!open)}
      >
        {/* Icono tipo */}
        <div className={`shrink-0 h-9 w-9 rounded-xl flex items-center justify-center ${cfg.color.replace("text-", "bg-").replace("-700", "-100").replace("bg-bg-", "bg-")}`} style={{backgroundColor: undefined}}>
          <Icon className={`h-4 w-4 ${cfg.color.split(" ")[1]}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${cfg.color}`}>
              {cfg.label}
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />{noticia.date}
            </span>
          </div>
          <h3 className="font-bold text-base text-foreground leading-snug">{noticia.title}</h3>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{noticia.summary}</p>
        </div>

        <div className="shrink-0 mt-1 text-muted-foreground">
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 pt-0">
          <div className="ml-13 border-t pt-3 mt-0">
            <p className="text-sm text-muted-foreground leading-relaxed pl-[52px]">
              {noticia.detail}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function FaqItem({ item, idx }: { item: typeof FAQ[0]; idx: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`rounded-xl border transition-all duration-200 ${open ? "bg-primary/5 border-primary/20 shadow-sm" : "bg-card hover:border-primary/20"}`}>
      <button
        className="w-full text-left px-5 py-4 flex items-center gap-3"
        onClick={() => setOpen(!open)}
      >
        <span className="shrink-0 h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-black">
          {idx + 1}
        </span>
        <span className="flex-1 font-semibold text-sm text-foreground leading-snug">{item.q}</span>
        <span className="shrink-0 text-muted-foreground">
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </span>
      </button>
      {open && (
        <div className="px-5 pb-4 pt-0">
          <p className="text-sm text-muted-foreground leading-relaxed pl-9">{item.a}</p>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PÁGINA PRINCIPAL
───────────────────────────────────────────────────────── */
function NovedadesPage() {
  const [filter, setFilter] = useState<"todo" | "nuevo" | "mejora" | "fix">("todo");

  const filtered = filter === "todo"
    ? NOTICIAS
    : NOTICIAS.filter((n) => n.type === filter);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Link>
          <div className="flex items-center">
            <img src="/images/Logo.png" alt="Dizi" className="h-10 w-auto object-contain" />
          </div>
          <Link
            to="/login"
            className="text-sm font-medium text-primary hover:underline"
          >
            Iniciar Sesión
          </Link>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl px-4 py-12 space-y-16">

        {/* ── HERO ───────────────────────────────────── */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-primary text-primary-foreground text-xs font-semibold uppercase tracking-wide mb-2">
            <Megaphone className="h-3.5 w-3.5" />
            Novedades y Ayuda
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
            Lo que hay de <span className="text-primary">nuevo en Dizi</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Actualizaciones recientes de la plataforma y respuestas a las dudas más comunes.
          </p>
        </div>

        {/* ── NOTICIAS ───────────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Megaphone className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">Actualizaciones</h2>
              <p className="text-xs text-muted-foreground">Cambios y mejoras más recientes</p>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap gap-2 mb-5">
            {(["todo", "nuevo", "mejora", "fix"] as const).map((f) => {
              const labels = { todo: "Todas", nuevo: "Nuevas funciones", mejora: "Mejoras", fix: "Correcciones" };
              const active = filter === f;
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {labels[f]}
                  {f !== "todo" && (
                    <span className="ml-1 opacity-60">
                      ({NOTICIAS.filter((n) => n.type === f).length})
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="space-y-3">
            {filtered.map((n, i) => (
              <NewsCard key={n.id} noticia={n} defaultOpen={i === 0} />
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-12 text-muted-foreground text-sm">
                No hay actualizaciones en esta categoría.
              </div>
            )}
          </div>
        </section>

        {/* ── FAQ ────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-9 w-9 rounded-xl bg-emerald-100 flex items-center justify-center">
              <HelpCircle className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">Preguntas Frecuentes</h2>
              <p className="text-xs text-muted-foreground">Todo lo que necesitas saber antes de empezar</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {FAQ.map((item, i) => (
              <FaqItem key={i} item={item} idx={i} />
            ))}
          </div>
        </section>

        {/* ── CTA FINAL ──────────────────────────────── */}
        <section className="rounded-2xl bg-primary/5 border border-primary/15 p-8 text-center space-y-4">
          <Tag className="h-8 w-8 text-primary mx-auto" />
          <h3 className="text-2xl font-black">¿Tu pregunta no está aquí?</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Escríbenos por WhatsApp y te respondemos en minutos.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <a
              href="https://wa.me/51925176472?text=Hola%20Dizi%2C%20tengo%20una%20consulta"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition shadow-lg shadow-primary/20"
            >
              Escribir por WhatsApp
            </a>
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border font-bold text-sm hover:bg-muted transition"
            >
              Crear mi catálogo gratis
            </Link>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t py-8 mt-8 text-center text-sm text-muted-foreground">
        <div className="flex items-center justify-center mb-2">
          <img src="/images/Logo.png" alt="Dizi" className="h-8 w-auto object-contain" />
        </div>
        © {new Date().getFullYear()} Dizi Development · Digitalizando el Perú
      </footer>
    </div>
  );
}
