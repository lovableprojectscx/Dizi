import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  LifeBuoy,
  Rocket,
  Package,
  Image as ImageIcon,
  Palette,
  Link2,
  Settings,
  Share2,
  Star,
  Wrench,
  MessageCircle,
  ChevronDown,
  Lightbulb,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/ayuda")({
  head: () => ({
    meta: [
      { title: "Centro de Ayuda — Dizi | Manual de uso" },
      {
        name: "description",
        content:
          "Manual completo de Dizi: cómo crear tu catálogo digital, subir productos, elegir diseño, configurar tu Link en Bio y compartirlo por WhatsApp. Paso a paso, sin tecnicismos.",
      },
      { name: "robots", content: "index, follow" },
      { rel: "canonical", href: "https://dizi.idenza.site/ayuda" },
    ],
  }),
  component: AyudaPage,
});

const WSP =
  "https://wa.me/51925176472?text=" +
  encodeURIComponent("Hola, necesito ayuda con mi catálogo Dizi");

/* ---------------------------------- UI ---------------------------------- */

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm my-3">
      <Lightbulb className="w-4 h-4 text-primary shrink-0 mt-0.5" />
      <div className="text-muted-foreground [&_strong]:text-foreground">{children}</div>
    </div>
  );
}

function Warn({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-sm my-3">
      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
      <div className="text-amber-900 [&_strong]:font-semibold">{children}</div>
    </div>
  );
}

function Steps({ items }: { items: React.ReactNode[] }) {
  return (
    <ol className="space-y-2.5 my-3">
      {items.map((it, i) => (
        <li key={i} className="flex items-start gap-3 text-sm">
          <span className="shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center mt-px">
            {i + 1}
          </span>
          <span className="text-muted-foreground [&_strong]:text-foreground pt-0.5">{it}</span>
        </li>
      ))}
    </ol>
  );
}

function Chapter({
  id,
  icon: Icon,
  title,
  subtitle,
  children,
  open,
  onToggle,
}: {
  id: string;
  icon: React.ElementType;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <section id={id} className="scroll-mt-4 bg-background rounded-2xl border shadow-sm overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-5 text-left hover:bg-muted/40 transition-colors"
        aria-expanded={open}
      >
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-foreground leading-tight">{title}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="px-5 pb-6 pt-1 border-t text-muted-foreground leading-relaxed text-sm space-y-2 [&_h3]:font-bold [&_h3]:text-foreground [&_h3]:mt-5 [&_h3]:mb-1 [&_h3]:text-[15px] [&_strong]:text-foreground [&_code]:text-xs [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded">
          {children}
        </div>
      )}
    </section>
  );
}

/* -------------------------------- Contenido -------------------------------- */

const CHAPTERS = [
  { id: "empezar", icon: Rocket, title: "1. Empezar de cero", subtitle: "Tu catálogo listo en menos de 30 minutos" },
  { id: "productos", icon: Package, title: "2. Cargar tus productos", subtitle: "Precios, categorías, ofertas y orden" },
  { id: "imagenes", icon: ImageIcon, title: "3. Las fotos", subtitle: "Qué medida usar para que se vean bien" },
  { id: "diseno", icon: Palette, title: "4. Elegir el diseño", subtitle: "Modelos, colores y portada" },
  { id: "bio", icon: Link2, title: "5. Link en Bio", subtitle: "Tu perfil para Instagram y TikTok" },
  { id: "config", icon: Settings, title: "6. Configuración del negocio", subtitle: "Nombre, WhatsApp, enlace y Libro de Reclamaciones" },
  { id: "compartir", icon: Share2, title: "7. Compartir y vender", subtitle: "Cómo llega el pedido y qué hacer con él" },
  { id: "plan", icon: Star, title: "8. Tu plan y la renovación", subtitle: "Vencimientos, límites y referidos" },
  { id: "problemas", icon: Wrench, title: "9. Si algo no funciona", subtitle: "Los cinco problemas más comunes" },
];

function AyudaPage() {
  const [open, setOpen] = useState<string | null>("empezar");
  const toggle = (id: string) => setOpen((cur) => (cur === id ? null : id));

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-background border-b">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" asChild className="gap-2">
            <Link to="/">
              <ArrowLeft className="w-4 h-4" /> Volver al inicio
            </Link>
          </Button>
          <img src="/images/Icono.png" alt="Dizi" className="h-8 w-8 object-contain" />
        </div>
      </div>

      {/* Hero */}
      <div className="bg-background border-b">
        <div className="max-w-3xl mx-auto px-4 py-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <LifeBuoy className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Centro de Ayuda</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Todo lo que necesitas saber para usar Dizi
              </p>
            </div>
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed">
            No hace falta saber de tecnología ni de diseño. Si sabes usar WhatsApp, sabes usar Dizi.
            Abre el capítulo que necesites — o léelo todo de corrido la primera vez, son 10 minutos.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Índice */}
        <div className="bg-background rounded-2xl border shadow-sm p-5 mb-6">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">
            Contenido
          </p>
          <div className="grid sm:grid-cols-2 gap-1.5">
            {CHAPTERS.map((c) => (
              <a
                key={c.id}
                href={`#${c.id}`}
                onClick={() => setOpen(c.id)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary py-1 transition-colors"
              >
                <c.icon className="w-3.5 h-3.5 shrink-0" />
                {c.title}
              </a>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {/* 1 */}
          <Chapter {...CHAPTERS[0]} open={open === "empezar"} onToggle={() => toggle("empezar")}>
            <p>
              Cuando te registras, tu catálogo ya existe y ya funciona. Viene con productos de
              ejemplo para que veas cómo se ve. <strong>Esos ejemplos desaparecen solos</strong> en
              cuanto cargas tu primer producto real, y no ocupan lugar en el límite de tu plan.
            </p>
            <h3>Los tres pasos que importan el primer día</h3>
            <Steps
              items={[
                <>
                  <strong>Configuración</strong> → pon el nombre de tu negocio, tu número de WhatsApp
                  y elige tu enlace. El enlace es la dirección de tu catálogo, algo como{" "}
                  <code>dizi.idenza.site/t/tu-negocio</code>.
                </>,
                <>
                  <strong>Productos</strong> → carga al menos 5 productos con foto y precio. Con
                  menos de eso el catálogo se ve vacío y no convence.
                </>,
                <>
                  <strong>Diseño</strong> → elige el modelo que mejor le quede a lo que vendes y
                  ajusta el color de tu marca.
                </>,
              ]}
            />
            <Tip>
              Empieza por <strong>Configuración</strong>, no por Diseño. Si primero eliges el diseño
              y después cambias de rubro, vas a tener que rehacer las fotos.
            </Tip>
          </Chapter>

          {/* 2 */}
          <Chapter {...CHAPTERS[1]} open={open === "productos"} onToggle={() => toggle("productos")}>
            <h3>Agregar un producto</h3>
            <p>
              Entra a <strong>Productos</strong> y pulsa <strong>Nuevo Producto</strong>. Lo único
              obligatorio es el <strong>nombre</strong>, el <strong>precio</strong> y la{" "}
              <strong>categoría</strong>. La foto y la descripción son opcionales, pero un producto
              sin foto se vende mucho menos.
            </p>
            <Tip>
              Si el precio depende del pedido, <strong>deja el precio vacío</strong>. El catálogo
              mostrará "A consultar" en lugar de un número.
            </Tip>

            <h3>Crear una categoría sin salir del formulario</h3>
            <p>
              Al lado del selector de categoría hay un botón <code>+</code>. Púlsalo, escribe el
              nombre y presiona Enter. La categoría queda creada y seleccionada al instante — no
              necesitas ir a otra pantalla.
            </p>

            <h3>Ofertas</h3>
            <p>
              Activa el interruptor <strong>En oferta</strong> y aparecerán dos campos: el precio
              original (tachado en el catálogo) y el precio de oferta. Úsalo de verdad: si todo está
              "en oferta", el cliente deja de creerlo.
            </p>

            <h3>Destacar productos</h3>
            <p>
              El interruptor <strong>Destacar</strong> pone el producto en el carrusel superior del
              catálogo. Destaca entre 3 y 6 productos, los que mejor se venden o los de mayor margen.
            </p>

            <h3>Ordenar tus productos</h3>
            <p>
              En la tabla (o en las tarjetas si estás en el celular) cada producto tiene flechas{" "}
              <strong>▲</strong> y <strong>▼</strong>. El orden que armes es exactamente el que verá
              tu cliente. Puedes pulsar varias veces rápido: el orden se guarda solo, un segundo
              después de que dejas de tocar.
            </p>

            <h3>Ocultar sin borrar</h3>
            <p>
              El interruptor <strong>Visible</strong> saca el producto del catálogo público pero lo
              conserva en tu panel. Perfecto para lo que se te agotó y va a volver.
            </p>

            <h3>El límite de tu plan</h3>
            <p>
              Cada plan permite una cantidad de productos. Al llegar al tope, el botón{" "}
              <strong>Nuevo Producto</strong> se bloquea con un candado. Los productos de ejemplo no
              cuentan.
            </p>
          </Chapter>

          {/* 3 */}
          <Chapter {...CHAPTERS[2]} open={open === "imagenes"} onToggle={() => toggle("imagenes")}>
            <p>
              Esta es la parte que más cambia cómo se ve tu catálogo.{" "}
              <strong>Cada modelo de diseño usa una proporción distinta</strong>, y el panel te
              muestra siempre la que corresponde al modelo que tienes activo.
            </p>

            <h3>Las medidas según el diseño</h3>
            <div className="overflow-x-auto my-3">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b text-foreground">
                    <th className="text-left py-2 pr-3 font-semibold">Si tu diseño es…</th>
                    <th className="text-left py-2 pr-3 font-semibold">Proporción</th>
                    <th className="text-left py-2 font-semibold">Medida sugerida</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Minimalista, Clásico, Elite, Eco", "Cuadrada 1:1", "1000 × 1000 px"],
                    ["Vibrante, Nocturno, Sunset Glow", "Vertical 3:4", "900 × 1200 px"],
                    ["Corporativo, Boutique", "Horizontal 4:3", "1200 × 900 px"],
                    ["Aurora", "Vertical 2:3", "800 × 1200 px"],
                    ["Dark Fashion", "Panorámica 21:9", "2100 × 900 px"],
                    ["Portada con Banner", "Panorámica 16:7", "1600 × 700 px"],
                  ].map(([a, b, c], i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2 pr-3">{a}</td>
                      <td className="py-2 pr-3">{b}</td>
                      <td className="py-2 font-mono text-[11px]">{c}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3>Logo</h3>
            <p>
              <strong>Cuadrado, 500 × 500 px.</strong> Se muestra recortado en círculo, así que deja
              aire alrededor: si tu logo llega hasta el borde, se va a cortar.
            </p>

            <h3>Portada / banner</h3>
            <p>
              <strong>Mínimo 1920 × 700 px, proporción 16:7.</strong> No pongas texto importante en
              los extremos: en celular se recortan los costados.
            </p>

            <h3>Peso máximo</h3>
            <p>
              10 MB por imagen. Si tu foto pesa más, o si el catálogo carga lento, comprímela gratis
              en{" "}
              <a
                href="https://squoosh.app"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                squoosh.app
              </a>
              . Bajar una foto de 4 MB a 300 KB no se nota en calidad y sí se nota en velocidad.
            </p>

            <Tip>
              Foto con <strong>luz natural</strong> y <strong>fondo liso</strong> gana a cualquier
              filtro. Y usa siempre el mismo fondo para todos los productos: eso es lo que hace que
              un catálogo se vea profesional.
            </Tip>
          </Chapter>

          {/* 4 */}
          <Chapter {...CHAPTERS[3]} open={open === "diseno"} onToggle={() => toggle("diseno")}>
            <h3>El Panel Unificado de Diseño</h3>
            <p>
              En la pantalla <strong>Diseño</strong> de tu panel encuentras 15 estructuras visuales y todas las opciones para personalizar la apariencia de tu catálogo en un solo lugar, divididas en tres pestañas principales:
            </p>

            <ul className="space-y-2 my-3">
              <li className="flex gap-2 text-sm">
                <span className="text-primary font-bold shrink-0">•</span>
                <span>
                  <strong>1. Estructura:</strong> Elige entre 15 diseños visuales únicos (Grilla, Overlay, Hero, Spotlight, Editorial, Tiles, Magazine, Diagonal, Arch, Bloom, Bite, Nature, Lookbook, etc.). Todos los diseños están abiertos para que elijas la estructura que mejor se adapte a tu marca.
                </span>
              </li>
              <li className="flex gap-2 text-sm">
                <span className="text-primary font-bold shrink-0">•</span>
                <span>
                  <strong>2. Tema & Colores:</strong> Puedes aplicar uno de los 7 presets cromáticos (Claro, Cálido, Menta, Bosque, Nocturno, Atardecer, Vibrante) o ajustar individualmente el color primario de marca, fondo de catálogo, fondo de tarjetas, esquinas, tipografía, modo oscuro y los textos de portada (Título, Subtítulo y Etiqueta Inferior del banner).
                </span>
              </li>
              <li className="flex gap-2 text-sm">
                <span className="text-primary font-bold shrink-0">•</span>
                <span>
                  <strong>3. Módulos & Funcionalidades:</strong> Administra funciones avanzadas como la marca de agua, portadas múltiples en carrusel, buscador en tiempo real, exportación a PDF, estadísticas y el filtro táctil de etiquetas. Cada módulo cuenta con botones de acción rápida o enlaces para ampliar tu plan si la función lo requiere.
                </span>
              </li>
            </ul>

            <h3>Previsualizador en Vivo y Selector de Dispositivo</h3>
            <p>
              El panel incluye una vista previa en tiempo real. Al pulsar el botón <strong>↗ Expandir</strong> (o en el botón flotante de tu celular), se abrirá una ventana interactiva con el conmutador <strong>[ 📱 Móvil ]</strong> y <strong>[ 💻 Escritorio (PC) ]</strong> para que compruebes cómo verán tu catálogo tanto tus clientes que navegan desde su Smartphone como desde una computadora.
            </p>

            <Tip>
              Recuerda pulsar siempre <strong>Guardar cambios</strong> en la esquina superior para publicar las modificaciones en tu catálogo en vivo.
            </Tip>

            <Warn>
              Si cambiaste algo en Diseño y no lo ves en tu catálogo público, verifica que hayas pulsado <strong>Guardar cambios</strong>.
            </Warn>
          </Chapter>

          {/* 5 */}
          <Chapter {...CHAPTERS[4]} open={open === "bio"} onToggle={() => toggle("bio")}>
            <p>
              El <strong>Link en Bio</strong> es un perfil aparte de tu catálogo, pensado para poner
              en la biografía de Instagram o TikTok. Vive en{" "}
              <code>dizi.idenza.site/bio/tu-negocio</code>.
            </p>
            <h3>Qué muestra</h3>
            <p>
              Tu foto o logo, el nombre del negocio, una descripción corta, botón directo de
              WhatsApp, tus redes sociales, tu ubicación y enlaces rápidos que tú defines. Y un
              acceso a tu catálogo completo.
            </p>
            <h3>Cuándo usar cuál</h3>
            <ul className="space-y-1 my-2">
              <li className="flex gap-2 text-sm">
                <span className="text-primary font-bold shrink-0">•</span>
                <span>
                  <strong>Link en Bio</strong> → en la bio de tus redes. Es tu tarjeta de
                  presentación.
                </span>
              </li>
              <li className="flex gap-2 text-sm">
                <span className="text-primary font-bold shrink-0">•</span>
                <span>
                  <strong>Catálogo</strong> → cuando alguien ya te preguntó por precios. Es tu
                  vitrina.
                </span>
              </li>
            </ul>
            <p>
              La cantidad de enlaces rápidos y las opciones de personalización del fondo dependen de
              tu plan.
            </p>
          </Chapter>

          {/* 6 */}
          <Chapter {...CHAPTERS[5]} open={open === "config"} onToggle={() => toggle("config")}>
            <h3>Nombre comercial</h3>
            <p>
              Aparece en la cabecera de tu catálogo y en el mensaje de WhatsApp que recibe el pedido.
              Pon el nombre con el que te conocen tus clientes.
            </p>

            <h3>WhatsApp</h3>
            <p>
              Código de país más número, sin espacios ni guiones. Para Perú es <code>51</code> y
              luego tus 9 dígitos. <strong>Este es el número que va a recibir todos los pedidos</strong>
              , revísalo dos veces.
            </p>

            <h3>Tu enlace</h3>
            <p>
              Es único en toda la plataforma y el sistema te avisa en el momento si está libre.
              Elígelo corto, fácil de dictar por teléfono y sin números raros.
            </p>
            <Warn>
              Tu enlace es tuyo <strong>mientras tu cuenta esté en uso</strong>. Una cuenta sin
              actividad real por más de 15 días puede pausarse y liberar el enlace para otro negocio
              — te avisamos por WhatsApp antes. Está en los{" "}
              <Link to="/terminos" className="underline font-medium">
                Términos y Condiciones
              </Link>
              , sección 7.
            </Warn>

            <h3>Filtro de precios</h3>
            <p>
              Activa un control de rango de precios en tu catálogo. Sirve si vendes cosas de precios
              muy distintos; si todo cuesta parecido, déjalo apagado.
            </p>

            <h3>Libro de Reclamaciones</h3>
            <p>
              Si lo activas, aparece un formulario de reclamos en tu catálogo y una sección{" "}
              <strong>Reclamaciones</strong> en tu panel para verlos. Para activarlo necesitas
              cargar <strong>RUC, razón social y dirección</strong>, porque esos datos van en el
              encabezado de cada reclamo.
            </p>
            <p>
              Ojo: la herramienta es de Dizi, pero <strong>la obligación legal de tener y atender
              el Libro de Reclamaciones es de tu negocio</strong>, según la normativa de INDECOPI.
            </p>
          </Chapter>

          {/* 7 */}
          <Chapter {...CHAPTERS[6]} open={open === "compartir"} onToggle={() => toggle("compartir")}>
            <h3>Dónde poner tu enlace</h3>
            <Steps
              items={[
                <>
                  En la <strong>bio de Instagram, TikTok y Facebook</strong> (usa el Link en Bio ahí).
                </>,
                <>
                  En tu <strong>estado de WhatsApp</strong> y en el mensaje de bienvenida de WhatsApp
                  Business.
                </>,
                <>
                  Como <strong>respuesta rápida guardada</strong>: cuando alguien pregunte "¿qué
                  tienes?", mandas el enlace en un segundo.
                </>,
                <>
                  Impreso con un <strong>código QR</strong> en tu local, tu tarjeta o la bolsa del
                  producto.
                </>,
              ]}
            />

            <h3>Cómo te llega un pedido</h3>
            <p>
              Tu cliente agrega productos al carrito, pulsa el botón de pedir, y{" "}
              <strong>se abre WhatsApp con el pedido ya escrito</strong>: los productos, las
              cantidades y el total. Él solo tiene que darle Enviar. Le aparece también una pantalla
              de confirmación recordándoselo, porque a veces el navegador bloquea la ventana.
            </p>
            <Warn>
              El pedido llega a tu WhatsApp como <strong>un mensaje, no como una venta cerrada</strong>.
              Dizi no cobra ni gestiona el envío: la coordinación del pago y la entrega la haces tú
              en el chat, como siempre.
            </Warn>

            <h3>Catálogo en PDF</h3>
            <p>
              En los planes de pago puedes descargar tu catálogo en PDF. Útil para mandarlo a
              clientes mayoristas o a quien te pide "una lista".
            </p>
          </Chapter>

          {/* 8 */}
          <Chapter {...CHAPTERS[7]} open={open === "plan"} onToggle={() => toggle("plan")}>
            <h3>Ver tu plan</h3>
            <p>
              En <strong>Mi Plan</strong> ves qué plan tienes, cuántos productos te quedan
              disponibles y la fecha de vencimiento. Si estás en un período de prueba, te muestra
              cuántos días faltan.
            </p>

            <h3>Qué pasa si vence</h3>
            <p>
              <strong>No se borra nada.</strong> Hay unos días de gracia y después tu catálogo pasa a
              funcionar con las condiciones del plan gratuito: los productos que exceden ese límite
              se dejan de mostrar al público, pero siguen guardados y vuelven a aparecer en cuanto
              renuevas. El modelo de diseño premium también vuelve al modelo básico después de un
              tiempo.
            </p>

            <h3>Cómo renovar</h3>
            <p>
              Hoy la renovación se coordina <strong>por WhatsApp</strong> con nuestro equipo — no hay
              pago automático con tarjeta todavía. Nos escribes, confirmas el pago y activamos el
              plan en tu cuenta.
            </p>

            <h3>Gana meses invitando</h3>
            <p>
              En <strong>Mi Plan</strong> tienes tu enlace personal de invitación. Si un negocio se
              registra con tu enlace y activa un plan de pago,{" "}
              <strong>los dos reciben 30 días premium gratis</strong>. Si estás en el plan gratuito,
              se te sube el plan por esos 30 días; si ya pagas, se te suman al vencimiento.
            </p>
            <p>La recompensa es siempre tiempo de servicio, no dinero.</p>
          </Chapter>

          {/* 9 */}
          <Chapter {...CHAPTERS[8]} open={open === "problemas"} onToggle={() => toggle("problemas")}>
            <h3>"Cambié el diseño y no se actualiza"</h3>
            <p>
              Revisa que hayas pulsado <strong>Guardar cambios</strong> en la barra flotante. Si ya
              lo hiciste, recarga tu catálogo con la página completamente cerrada y vuelta a abrir —
              el navegador guarda copias.
            </p>

            <h3>"No puedo escribir espacios / no me deja subir más productos"</h3>
            <p>
              Si el botón de nuevo producto tiene un candado, llegaste al límite de tu plan. Puedes
              borrar productos que ya no vendes u subir de plan.
            </p>

            <h3>"Mi cliente dice que no ve el catálogo"</h3>
            <p>
              Verifica que le mandaste el enlace completo (con <code>https://</code>) y que tu cuenta
              no esté pausada. Si tu suscripción venció hace mucho, el catálogo puede estar
              limitado.
            </p>

            <h3>"El pedido no me llega a WhatsApp"</h3>
            <p>
              Casi siempre es el número mal cargado en Configuración: revisa que tenga el código de
              país <code>51</code> adelante y ningún espacio ni guion.
            </p>

            <h3>"Subí una foto y se ve cortada"</h3>
            <p>
              La foto no tiene la proporción que pide tu modelo de diseño. Mira la tabla del capítulo
              3 y recorta la imagen a esa medida antes de subirla.
            </p>

            <h3>"No aparecen mis productos, veo otros"</h3>
            <p>
              Son los productos de ejemplo con los que nace toda cuenta nueva. Desaparecen solos al
              cargar tu primer producto real.
            </p>
          </Chapter>
        </div>

        {/* Cierre */}
        <div className="mt-8 rounded-2xl border bg-primary/5 p-6 text-center">
          <h3 className="font-bold text-foreground mb-1">¿No encontraste tu respuesta?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Escríbenos por WhatsApp y te ayudamos con tu catálogo directamente.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button asChild>
              <a href={WSP} target="_blank" rel="noopener noreferrer" className="gap-2">
                <MessageCircle className="w-4 h-4" /> Hablar por WhatsApp
              </a>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/novedades">Novedades y preguntas frecuentes</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-6 text-xs text-muted-foreground border-t bg-background">
        &copy; {new Date().getFullYear()} Dizi &mdash; Idenza &middot; dizi.idenza.site &middot;{" "}
        <Link to="/" className="hover:underline text-primary">
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
