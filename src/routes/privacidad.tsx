import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { site } from "@/data/site";

export const Route = createFileRoute("/privacidad")({
  head: () => ({
    meta: [
      { title: "Política de privacidad — Lucía Rojas Studio" },
      { name: "description", content: "Política de privacidad de Lucía Rojas Studio." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PrivacidadPage,
});

function PrivacidadPage() {
  const lastUpdate = "19 de junio de 2026";

  return (
    <PublicLayout>
      <section className="border-b border-border bg-gradient-cream py-12 sm:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h1 className="font-serif text-3xl text-balance sm:text-4xl">Política de privacidad</h1>
          <p className="mt-3 text-sm text-muted-foreground">Última actualización: {lastUpdate}</p>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-3xl space-y-8 px-4 text-sm leading-relaxed text-foreground/90 sm:px-6 lg:px-8">
          <div>
            <h2 className="font-serif text-xl">1. Responsable del tratamiento</h2>
            <p className="mt-2">
              {site.name} ({site.admin}) es responsable del tratamiento de los datos personales que se recogen
              a través del sitio <strong>luciarojasstudio.com</strong> y sus subdominios. Para consultas relacionadas
              con privacidad podés escribir a{" "}
              <a href={`mailto:${site.email}`} className="text-primary hover:underline">{site.email}</a>.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-xl">2. Datos que recolectamos</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li><strong>Datos de cuenta:</strong> nombre, email, contraseña (hasheada) y país.</li>
              <li><strong>Datos de pago:</strong> procesados por Pagopar. No almacenamos números de tarjeta.</li>
              <li><strong>Datos de uso:</strong> cursos vistos, progreso, sesiones activas, marcas de agua y eventos
                  de seguridad del reproductor (pausa por pérdida de foco, capturas detectadas).</li>
              <li><strong>Datos técnicos:</strong> dirección IP, tipo de dispositivo, navegador y cookies esenciales
                  para mantener la sesión iniciada.</li>
              <li><strong>Comunicaciones:</strong> mensajes que nos enviás por formulario, email o WhatsApp.</li>
            </ul>
          </div>

          <div>
            <h2 className="font-serif text-xl">3. Para qué usamos tus datos</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Brindarte acceso a los cursos y la membresía contratada.</li>
              <li>Procesar pagos y emitir comprobantes.</li>
              <li>Emitir certificados a tu nombre al completar un curso.</li>
              <li>Proteger el contenido (marca de agua personalizada, control de sesiones simultáneas).</li>
              <li>Enviarte notificaciones operativas (recuperación de contraseña, actualizaciones de tu cuenta).</li>
              <li>Soporte y atención al alumno.</li>
            </ul>
          </div>

          <div>
            <h2 className="font-serif text-xl">4. Proveedores que procesan tus datos</h2>
            <p className="mt-2">Compartimos datos estrictamente necesarios con los siguientes proveedores:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li><strong>Supabase</strong> — base de datos y autenticación.</li>
              <li><strong>Pagopar</strong> — procesamiento de pagos.</li>
              <li><strong>Dyntube</strong> — entrega de video protegido.</li>
              <li><strong>Cloudinary</strong> — alojamiento de imágenes.</li>
              <li><strong>Vercel</strong> — alojamiento de la aplicación web.</li>
            </ul>
            <p className="mt-2">No vendemos ni alquilamos tus datos personales a terceros.</p>
          </div>

          <div>
            <h2 className="font-serif text-xl">5. Plazo de conservación</h2>
            <p className="mt-2">
              Conservamos tus datos mientras tu cuenta esté activa. Los datos asociados a transacciones (pagos,
              facturación) se conservan por el plazo legal exigido. Podés solicitar la eliminación en cualquier
              momento desde la página de{" "}
              <Link to="/eliminar-datos" className="text-primary hover:underline">eliminación de datos</Link>.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-xl">6. Tus derechos</h2>
            <p className="mt-2">
              Tenés derecho a acceder, rectificar, oponerte al tratamiento y solicitar la eliminación de tus datos
              personales. Para ejercerlos escribinos a{" "}
              <a href={`mailto:${site.email}`} className="text-primary hover:underline">{site.email}</a>.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-xl">7. Seguridad</h2>
            <p className="mt-2">
              Aplicamos medidas técnicas y organizativas razonables: conexiones cifradas (HTTPS), hashing de
              contraseñas, control de sesiones, registro de eventos sensibles y limitación de accesos
              administrativos.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-xl">8. Menores de edad</h2>
            <p className="mt-2">
              La plataforma está dirigida a mayores de 16 años. Si sos menor de edad necesitás autorización de tu
              padre, madre o tutor para registrarte.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-xl">9. Cambios en esta política</h2>
            <p className="mt-2">
              Podemos actualizar esta política para reflejar cambios legales u operativos. La fecha de la última
              actualización siempre estará al inicio del documento.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-xl">10. Contacto</h2>
            <p className="mt-2">
              Para cualquier consulta sobre privacidad escribinos a{" "}
              <a href={`mailto:${site.email}`} className="text-primary hover:underline">{site.email}</a>.
            </p>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
