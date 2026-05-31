import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Shield, Mail, MapPin, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/privacidad")({
  head: () => ({
    meta: [
      { title: "Política de Privacidad — Dizi" },
      { name: "description", content: "Conoce cómo Dizi recopila, usa y protege tus datos personales conforme a la Ley 29733 de Protección de Datos Personales del Perú." },
      { name: "robots", content: "index, follow" },
      { rel: "canonical", href: "https://dizi.idenza.site/privacidad" },
    ],
  }),
  component: PrivacidadPage,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
        <span className="w-1 h-5 bg-primary rounded-full inline-block" />
        {title}
      </h2>
      <div className="text-muted-foreground leading-relaxed space-y-2 pl-3">
        {children}
      </div>
    </section>
  );
}

function PrivacidadPage() {
  const lastUpdated = "Mayo 2026";

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
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Política de Privacidad</h1>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                <Calendar className="w-3.5 h-3.5" /> Última actualización: {lastUpdated}
              </p>
            </div>
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed">
            En <strong>Dizi</strong> nos tomamos en serio la protección de tus datos personales.
            Esta política explica qué información recopilamos, cómo la usamos y cuáles son tus derechos,
            conforme a la <strong>Ley N° 29733 — Ley de Protección de Datos Personales del Perú</strong> y su reglamento.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="bg-background rounded-2xl border shadow-sm p-6 md:p-8 space-y-2">

          <Section title="1. Responsable del tratamiento">
            <p>
              El responsable del tratamiento de tus datos personales es <strong>Idenza</strong>,
              empresa de desarrollo de software con sede en Perú, propietaria de la plataforma Dizi.
            </p>
            <p className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-primary shrink-0" />
              Contacto: <a href="mailto:contacto@idenza.site" className="text-primary hover:underline">contacto@idenza.site</a>
            </p>
            <p className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-primary shrink-0" />
              Perú
            </p>
          </Section>

          <Section title="2. Datos que recopilamos">
            <p>Recopilamos los siguientes datos cuando usas Dizi:</p>
            <ul className="space-y-1 mt-2">
              {[
                "Nombre y apellidos del titular de la cuenta",
                "Correo electrónico (usado para autenticación)",
                "Número de teléfono/WhatsApp del negocio",
                "Nombre comercial, logo e imágenes del catálogo",
                "Información de productos: nombre, precio, descripción e imágenes",
                "Datos de uso: páginas visitadas, clics en WhatsApp, fecha de acceso",
                "Dirección IP y tipo de dispositivo (recopilados automáticamente)",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-primary font-bold mt-0.5">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </Section>

          <Section title="3. Finalidad del tratamiento">
            <p>Usamos tus datos exclusivamente para:</p>
            <ul className="space-y-1 mt-2">
              {[
                "Crear y gestionar tu cuenta en Dizi",
                "Publicar y mostrar tu catálogo digital a tus clientes",
                "Enviarte comunicaciones sobre tu cuenta, plan y vencimientos",
                "Mejorar el funcionamiento y las funcionalidades de la plataforma",
                "Cumplir con obligaciones legales y prevenir fraudes",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-primary font-bold mt-0.5">•</span>
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm font-medium text-foreground">
              No vendemos, alquilamos ni compartimos tus datos personales con terceros con fines comerciales.
            </p>
          </Section>

          <Section title="4. Almacenamiento y seguridad">
            <p>
              Tus datos se almacenan en <strong>Supabase</strong>, plataforma de base de datos en la nube
              con servidores en la región de América del Norte, que cumple con estándares
              internacionales de seguridad (cifrado en tránsito y en reposo, autenticación segura).
            </p>
            <p>
              Las imágenes de tu catálogo se guardan en <strong>Supabase Storage</strong>.
              Aplicamos medidas técnicas y organizativas para proteger tus datos contra acceso
              no autorizado, pérdida o alteración.
            </p>
          </Section>

          <Section title="5. Conservación de datos">
            <p>
              Conservamos tus datos mientras tu cuenta esté activa en Dizi. Si cancelas tu cuenta,
              tus datos serán eliminados en un plazo máximo de <strong>30 días</strong>,
              salvo que la ley exija conservarlos por un período mayor.
            </p>
          </Section>

          <Section title="6. Tus derechos (Ley 29733)">
            <p>Como titular de tus datos personales, tienes derecho a:</p>
            <ul className="space-y-1 mt-2">
              {[
                "Acceder a los datos que tenemos sobre ti",
                "Rectificar datos incorrectos o desactualizados",
                "Cancelar o eliminar tus datos de nuestra base",
                "Oponerte al tratamiento de tus datos para fines específicos",
                "Revocar el consentimiento otorgado en cualquier momento",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-primary font-bold mt-0.5">•</span>
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm">
              Para ejercer cualquiera de estos derechos, escríbenos a{" "}
              <a href="mailto:contacto@idenza.site" className="text-primary hover:underline">
                contacto@idenza.site
              </a>{" "}
              indicando tu nombre, correo registrado y el derecho que deseas ejercer.
              Responderemos en un plazo máximo de <strong>15 días hábiles</strong>.
            </p>
          </Section>

          <Section title="7. Cookies">
            <p>
              Dizi utiliza cookies técnicas esenciales para el funcionamiento de la plataforma
              (autenticación de sesión, preferencias de usuario). No utilizamos cookies de
              rastreo publicitario de terceros dentro de la plataforma.
            </p>
          </Section>

          <Section title="8. Servicios de terceros">
            <p>Para operar, Dizi utiliza los siguientes servicios de terceros que pueden procesar datos:</p>
            <ul className="space-y-1 mt-2">
              {[
                "Supabase — base de datos y autenticación (supabase.com)",
                "Vercel — hosting y entrega de la aplicación (vercel.com)",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-primary font-bold mt-0.5">•</span>
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-sm">
              Cada uno de estos servicios tiene sus propias políticas de privacidad que puedes
              consultar en sus sitios web oficiales.
            </p>
          </Section>

          <Section title="9. Menores de edad">
            <p>
              Dizi está dirigido a personas mayores de 18 años. No recopilamos intencionalmente
              datos de menores de edad. Si detectamos que un menor ha creado una cuenta sin
              autorización, procederemos a eliminarla.
            </p>
          </Section>

          <Section title="10. Cambios a esta política">
            <p>
              Podemos actualizar esta política en cualquier momento. Cuando lo hagamos,
              actualizaremos la fecha en la parte superior. Si los cambios son significativos,
              te notificaremos por correo electrónico.
            </p>
          </Section>

          {/* Footer CTA */}
          <div className="mt-8 pt-6 border-t text-center">
            <p className="text-sm text-muted-foreground mb-4">
              ¿Tienes preguntas sobre el manejo de tus datos?
            </p>
            <a
              href="mailto:contacto@idenza.site"
              className="inline-flex items-center gap-2 bg-primary text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors"
            >
              <Mail className="w-4 h-4" />
              Escribenos a contacto@idenza.site
            </a>
          </div>

        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-6 text-xs text-muted-foreground border-t bg-background">
        © {new Date().getFullYear()} Dizi — Idenza · dizi.idenza.site ·{" "}
        <Link to="/" className="hover:underline text-primary">Volver al inicio</Link>
      </div>
    </div>
  );
}
