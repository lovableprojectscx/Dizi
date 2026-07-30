import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, FileText, Mail, MapPin, Calendar, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/terminos")({
  head: () => ({
    meta: [
      { title: "Términos y Condiciones — Dizi" },
      {
        name: "description",
        content:
          "Términos y Condiciones de uso de Dizi, plataforma de catálogos digitales para MYPEs en Perú. Planes, suscripciones, responsabilidades y política de inactividad.",
      },
      { name: "robots", content: "index, follow" },
      { rel: "canonical", href: "https://dizi.idenza.site/terminos" },
    ],
  }),
  component: TerminosPage,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
        <span className="w-1 h-5 bg-primary rounded-full inline-block" />
        {title}
      </h2>
      <div className="text-muted-foreground leading-relaxed space-y-2 pl-3">{children}</div>
    </section>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1 mt-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm">
          <span className="text-primary font-bold mt-0.5">•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function TerminosPage() {
  const lastUpdated = "Julio 2026";

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
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Términos y Condiciones</h1>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                <Calendar className="w-3.5 h-3.5" /> Última actualización: {lastUpdated}
              </p>
            </div>
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Estos Términos y Condiciones regulan el uso de <strong>Dizi</strong>, la plataforma de
            catálogos digitales operada por <strong>Idenza</strong> en Perú. Al crear una cuenta o
            usar la plataforma, aceptas lo que se describe a continuación. Te recomendamos leerlos
            con calma: están escritos para que se entiendan sin ser abogado.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="bg-background rounded-2xl border shadow-sm p-6 md:p-8 space-y-2">
          <Section title="1. Quiénes somos">
            <p>
              <strong>Dizi</strong> es una plataforma de catálogos digitales de propiedad y operación
              de <strong>Idenza</strong>, empresa de desarrollo de software con sede en Perú.
              Accesible en <strong>dizi.idenza.site</strong>.
            </p>
            <p className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-primary shrink-0" />
              Contacto:{" "}
              <a href="mailto:contacto@idenza.site" className="text-primary hover:underline">
                contacto@idenza.site
              </a>
            </p>
            <p className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-primary shrink-0" />
              Perú
            </p>
          </Section>

          <Section title="2. Qué es el servicio">
            <p>
              Dizi te permite crear un catálogo digital de tus productos, publicarlo en un enlace
              propio y recibir pedidos por WhatsApp. El servicio incluye, según tu plan:
            </p>
            <Bullets
              items={[
                "Catálogo público en un enlace personalizado (dizi.idenza.site/t/tu-negocio)",
                "Link en Bio: perfil del negocio con botones de contacto y redes",
                "Modelos de diseño y personalización de colores, logo y portada",
                "Carrito que genera el pedido como mensaje de WhatsApp",
                "Descarga del catálogo en PDF (planes de pago)",
                "Libro de Reclamaciones digital, si decides activarlo",
              ]}
            />
            <p className="mt-3">
              <strong>Dizi es una herramienta de exhibición y contacto, no un intermediario de
              venta.</strong>{" "}
              No procesamos pagos entre tú y tus clientes, no gestionamos envíos, no cobramos
              comisión por tus ventas y no somos parte de la relación comercial entre tu negocio y
              quien te compra.
            </p>
          </Section>

          <Section title="3. Tu cuenta">
            <Bullets
              items={[
                "Debes ser mayor de 18 años y tener capacidad legal para contratar.",
                "Los datos que registras deben ser verdaderos y estar actualizados.",
                "Eres responsable de tu contraseña y de todo lo que ocurra en tu cuenta.",
                "Una cuenta corresponde a un negocio. No se comparte ni se revende el acceso.",
                "Si detectas un uso no autorizado de tu cuenta, avísanos de inmediato.",
              ]}
            />
          </Section>

          <Section title="4. Planes, precios y pagos">
            <p>
              Dizi funciona con un plan gratuito y planes de suscripción mensual. Los límites y
              precios vigentes se publican en la página de inicio.
            </p>
            <div className="mt-3 rounded-xl border bg-muted/40 p-4 text-sm space-y-2">
              <p className="font-medium text-foreground">Cómo se cobra hoy</p>
              <p>
                Actualmente <strong>Dizi no procesa pagos en línea</strong>: no hay pasarela de pago
                integrada. El pago de la suscripción se coordina de forma directa con nuestro equipo
                por WhatsApp, y la activación o renovación del plan se aplica manualmente en tu
                cuenta una vez confirmado.
              </p>
            </div>
            <Bullets
              items={[
                "Los precios están expresados en soles (S/) e incluyen los impuestos que correspondan.",
                "Los precios promocionales de lanzamiento son temporales y pueden cambiar. Cualquier cambio se avisará con al menos 30 días de anticipación y no afecta un período ya pagado.",
                "La suscripción no se renueva automáticamente: se renueva cuando confirmas el pago del siguiente período.",
                "El plan gratuito (Semilla) muestra una marca de agua de Dizi en tu catálogo.",
                "Si tu plan vence, tu catálogo entra en un período de gracia breve antes de aplicar las restricciones del plan gratuito. Tus productos no se borran por vencimiento.",
              ]}
            />
            <p className="mt-3">
              <strong>Devoluciones:</strong> si el servicio no funcionó como se describe y no
              logramos resolverlo, puedes solicitar la devolución proporcional del período no
              utilizado escribiendo a contacto@idenza.site. No hay devolución por falta de uso del
              servicio.
            </p>
          </Section>

          <Section title="5. Período de prueba e invitaciones">
            <p>
              Podemos otorgar períodos de prueba de planes de pago (habitualmente 15 días) mediante
              enlaces de invitación. Al terminar la prueba, si no se activa un plan pagado, la
              cuenta pasa al plan gratuito conservando tus datos, con las limitaciones que ese plan
              implique.
            </p>
          </Section>

          <Section title="6. Programa de referidos">
            <p>
              Si invitas a otro negocio con tu enlace personal y este activa un plan de pago, ambos
              reciben <strong>30 días de suscripción premium gratis</strong>. La recompensa es
              siempre <strong>tiempo de servicio, nunca dinero en efectivo</strong>: no es canjeable,
              transferible ni reembolsable.
            </p>
            <p>
              Nos reservamos el derecho de anular recompensas obtenidas mediante cuentas falsas,
              duplicadas o cualquier práctica destinada a inflar el programa artificialmente.
            </p>
          </Section>

          <Section title="7. Tu enlace personalizado y la política de inactividad">
            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 mb-3">
              <p className="flex items-start gap-2 text-sm text-amber-900">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  <strong>Lee esta sección con atención.</strong> Es la única que puede hacer que
                  pierdas tu enlace público.
                </span>
              </p>
            </div>
            <p>
              Al registrarte eliges un enlace único (por ejemplo{" "}
              <code className="text-xs">dizi.idenza.site/t/mi-negocio</code>). Ese enlace se te
              asigna mientras tu cuenta esté en uso, pero <strong>no es de tu propiedad</strong>: es
              un recurso limitado de la plataforma.
            </p>
            <p className="mt-2">
              Para evitar que enlaces atractivos queden acaparados sin uso real, aplicamos una
              política de inactividad:
            </p>
            <Bullets
              items={[
                "Se considera inactiva una cuenta sin actividad real (visitas mínimas y ningún pedido por WhatsApp) durante al menos 15 días, estando en plan gratuito o con la suscripción vencida hace más de 15 días.",
                "Antes de cualquier medida intentamos contactarte por WhatsApp al número registrado.",
                "Si no hay respuesta ni reactivación, la cuenta puede pausarse y el enlace liberarse para que otro negocio pueda usarlo.",
                "Tus datos y productos no se eliminan al pausar la cuenta: puedes solicitar la reactivación, aunque el enlace original podría ya estar tomado por otro negocio.",
              ]}
            />
            <p className="mt-3 text-sm">
              También podemos rechazar o cambiar enlaces que suplanten marcas ajenas, induzcan a
              confusión o contengan términos ofensivos.
            </p>
          </Section>

          <Section title="8. Tu contenido y tus responsabilidades">
            <p>
              <strong>El contenido que subes es tuyo.</strong> Conservas todos los derechos sobre tus
              fotos, textos, logo, precios y datos de productos. Nos otorgas únicamente la licencia
              necesaria para alojarlos y mostrarlos al público como parte del servicio, y para
              mostrar tu catálogo como ejemplo en materiales de difusión si nos das tu autorización
              previa.
            </p>
            <p className="mt-2">Como responsable de tu negocio, te comprometes a:</p>
            <Bullets
              items={[
                "Publicar únicamente productos y servicios de venta legal en Perú.",
                "Tener derecho sobre las imágenes y textos que subes (no usar fotos ni marcas de terceros sin permiso).",
                "Mostrar precios e información veraces y no engañosos, conforme al Código de Protección y Defensa del Consumidor.",
                "Cumplir tú mismo con las obligaciones frente a tus clientes: entrega, garantía, devoluciones, comprobantes de pago y atención de reclamos.",
                "Cumplir con tus obligaciones tributarias y de formalización, que son ajenas a Dizi.",
              ]}
            />
            <p className="mt-3">
              <strong>Contenido prohibido.</strong> No se permite usar Dizi para ofrecer armas,
              drogas, productos falsificados, material sexual explícito, servicios sexuales,
              contenido que involucre menores de edad, esquemas de estafa o pirámide, ni cualquier
              contenido que incite al odio o a la violencia. Tampoco se permite intentar vulnerar la
              seguridad de la plataforma, acceder a datos de otras tiendas, ni automatizar el
              registro masivo de cuentas.
            </p>
          </Section>

          <Section title="9. Libro de Reclamaciones">
            <p>
              Dizi ofrece un módulo de Libro de Reclamaciones digital que puedes activar en tu
              catálogo. Es una herramienta puesta a tu disposición: la obligación legal de contar con
              un Libro de Reclamaciones y de atender los reclamos que recibas{" "}
              <strong>corresponde a tu negocio</strong>, conforme a la normativa de INDECOPI. Idenza
              no responde por reclamos dirigidos a tu negocio ni por la falta de atención de estos.
            </p>
            <p className="mt-2">
              Si tienes un reclamo sobre <strong>Dizi como servicio</strong>, escríbenos a
              contacto@idenza.site.
            </p>
          </Section>

          <Section title="10. Disponibilidad del servicio">
            <p>
              Trabajamos para que Dizi esté disponible de forma continua, pero{" "}
              <strong>no garantizamos un funcionamiento libre de interrupciones</strong>. El servicio
              se apoya en proveedores de infraestructura externos (Supabase para base de datos y
              almacenamiento, Vercel para el alojamiento) y depende de WhatsApp para el flujo de
              pedidos. Una falla o un cambio de política en cualquiera de ellos puede afectar
              temporalmente el servicio.
            </p>
            <p className="mt-2">
              Podemos realizar mantenimientos, actualizar funcionalidades o modificar modelos de
              diseño. Cuando un cambio sea significativo, lo avisaremos por los canales habituales o
              en la página de Novedades.
            </p>
          </Section>

          <Section title="11. Suspensión y cierre de cuenta">
            <p>
              <strong>Puedes irte cuando quieras.</strong> Solicita la eliminación de tu cuenta
              escribiendo a contacto@idenza.site; tus datos se eliminan según lo indicado en la
              Política de Privacidad.
            </p>
            <p className="mt-2">
              Podemos suspender o cerrar una cuenta cuando: se incumplan estos Términos, se publique
              contenido prohibido, se detecte un uso que ponga en riesgo la plataforma o a otros
              usuarios, o se aplique la política de inactividad de la sección 7. Salvo casos graves
              o de riesgo inmediato, avisaremos antes y daremos oportunidad de corregir.
            </p>
          </Section>

          <Section title="12. Límite de responsabilidad">
            <p>
              Dizi se ofrece <strong>tal como está</strong>. En la medida que la ley peruana lo
              permita, Idenza no responde por lucro cesante, pérdida de ventas, pérdida de
              oportunidades comerciales ni daños indirectos derivados del uso o la imposibilidad de
              uso de la plataforma.
            </p>
            <p className="mt-2">
              En cualquier caso, la responsabilidad total de Idenza frente a un usuario se limita al{" "}
              <strong>monto efectivamente pagado por ese usuario en los últimos 3 meses</strong> de
              suscripción. Nada de lo aquí dispuesto excluye los derechos que la normativa de
              protección al consumidor te reconoce de forma irrenunciable.
            </p>
            <p className="mt-2">
              Te recomendamos mantener tu propia copia de las fotos y la información de tus
              productos. Hacemos respaldos, pero no podemos garantizar la recuperación total de
              datos en todos los escenarios.
            </p>
          </Section>

          <Section title="13. Propiedad intelectual de Dizi">
            <p>
              La marca Dizi, su logo, el diseño de la plataforma, los modelos de catálogo y el código
              fuente son propiedad de Idenza. Tu suscripción te da derecho a usar el servicio, no a
              copiar, revender, redistribuir ni crear un producto derivado de la plataforma.
            </p>
          </Section>

          <Section title="14. Protección de datos">
            <p>
              El tratamiento de datos personales se rige por nuestra{" "}
              <Link to="/privacidad" className="text-primary hover:underline font-medium">
                Política de Privacidad
              </Link>
              , elaborada conforme a la <strong>Ley N° 29733</strong> — Ley de Protección de Datos
              Personales del Perú y su reglamento.
            </p>
            <p className="mt-2">
              Cuando tus clientes te dejan datos a través de tu catálogo o de tu Libro de
              Reclamaciones, <strong>tú eres responsable de esos datos</strong> y de darles el uso
              que corresponde. Dizi actúa únicamente como encargado del tratamiento por cuenta tuya.
            </p>
          </Section>

          <Section title="15. Cambios en estos Términos">
            <p>
              Podemos actualizar estos Términos para reflejar cambios en el servicio o en la
              normativa. La fecha de última actualización siempre figura al inicio de esta página.
              Si el cambio es sustancial, lo avisaremos con al menos 30 días de anticipación por
              correo o por WhatsApp. Seguir usando Dizi después de esa fecha implica aceptar la
              versión actualizada.
            </p>
          </Section>

          <Section title="16. Ley aplicable y controversias">
            <p>
              Estos Términos se rigen por las leyes de la <strong>República del Perú</strong>.
              Cualquier controversia se intentará resolver primero de buena fe entre las partes.
              De no lograrse, será competente la jurisdicción ordinaria del domicilio del
              consumidor, sin perjuicio de tu derecho de acudir a <strong>INDECOPI</strong>.
            </p>
          </Section>

          {/* Contacto */}
          <div className="mt-10 rounded-2xl border bg-primary/5 p-6 text-center">
            <h3 className="font-bold text-foreground mb-1">¿Alguna duda sobre estos Términos?</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Preguntar antes es mejor que asumir. Te respondemos.
            </p>
            <a
              href="mailto:contacto@idenza.site"
              className="text-primary hover:underline font-medium text-sm"
            >
              Escríbenos a contacto@idenza.site
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-6 text-xs text-muted-foreground border-t bg-background">
        © {new Date().getFullYear()} Dizi — Idenza · dizi.idenza.site ·{" "}
        <Link to="/" className="hover:underline text-primary">
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
