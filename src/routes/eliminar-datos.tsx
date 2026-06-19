import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { site } from "@/data/site";

export const Route = createFileRoute("/eliminar-datos")({
  head: () => ({
    meta: [
      { title: "Eliminación de datos — Lucía Rojas Studio" },
      { name: "description", content: "Cómo solicitar la eliminación de tus datos personales." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: EliminarDatosPage,
});

function EliminarDatosPage() {
  const subject = encodeURIComponent("Solicitud de eliminación de datos");
  const body = encodeURIComponent(
    [
      "Hola,",
      "",
      "Solicito la eliminación de mi cuenta y de todos los datos personales asociados en Lucía Rojas Studio.",
      "",
      "Email registrado: ",
      "Nombre completo: ",
      "",
      "Gracias.",
    ].join("\n"),
  );

  return (
    <PublicLayout>
      <section className="border-b border-border bg-gradient-cream py-12 sm:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h1 className="font-serif text-3xl text-balance sm:text-4xl">Eliminación de datos</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Solicitá la eliminación de tu cuenta y de los datos personales asociados.
          </p>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-3xl space-y-8 px-4 text-sm leading-relaxed text-foreground/90 sm:px-6 lg:px-8">
          <div>
            <h2 className="font-serif text-xl">1. Qué datos se eliminan</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Tu cuenta de acceso (email, contraseña, perfil).</li>
              <li>Tu progreso en cursos, sesiones activas y marcas de agua.</li>
              <li>Tus mensajes y consultas enviadas a la plataforma.</li>
              <li>Tu suscripción a comunicaciones operativas.</li>
            </ul>
          </div>

          <div>
            <h2 className="font-serif text-xl">2. Qué datos podemos conservar</h2>
            <p className="mt-2">
              Por obligación legal o contable conservamos por el plazo exigido la siguiente información mínima:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Comprobantes de pago y facturación.</li>
              <li>Certificados emitidos (registro histórico).</li>
              <li>Logs técnicos anonimizados de seguridad.</li>
            </ul>
          </div>

          <div>
            <h2 className="font-serif text-xl">3. Cómo solicitarla</h2>
            <p className="mt-2">
              Enviá un email a <strong>{site.email}</strong> desde la dirección con la que te registraste, indicando:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Tu nombre completo.</li>
              <li>El email con el que te registraste.</li>
              <li>Una breve confirmación de que solicitás la eliminación.</li>
            </ul>
            <p className="mt-3">
              Procesamos las solicitudes en un plazo máximo de <strong>30 días hábiles</strong> y te confirmamos por email
              una vez completadas.
            </p>

            <div className="mt-4">
              <Button asChild variant="gold">
                <a href={`mailto:${site.email}?subject=${subject}&body=${body}`}>
                  Enviar solicitud por email
                </a>
              </Button>
            </div>
          </div>

          <div>
            <h2 className="font-serif text-xl">4. Importante</h2>
            <p className="mt-2">
              La eliminación es <strong>irreversible</strong>. Si tenés una membresía activa, te recomendamos cancelarla
              antes para evitar nuevos cobros. Una vez eliminada la cuenta no podrás recuperar el acceso a los cursos
              ni a tu progreso.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-xl">5. Más información</h2>
            <p className="mt-2">
              Consultá nuestra{" "}
              <Link to="/privacidad" className="text-primary hover:underline">política de privacidad</Link>{" "}
              para conocer en detalle cómo tratamos tus datos.
            </p>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
