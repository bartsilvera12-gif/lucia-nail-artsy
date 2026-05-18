import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { SectionHeader } from "@/components/SectionHeader";
import { FAQAccordion } from "@/components/FAQAccordion";
import { Button } from "@/components/ui/button";
import { faqs } from "@/data/site";

const extra = [
  { q: "¿Las clases tienen protección contra grabación?", a: "Sí. Las clases se reproducen en un visor protegido con marca de agua personalizada con tu email, bloqueo de menú contextual, detección de captura de pantalla y pausa automática al perder el foco. La difusión de contenido está prohibida y rastreable." },
  { q: "¿Puedo descargar las clases?", a: "No. Las clases se ven exclusivamente en línea desde la plataforma para proteger el contenido de las alumnas y mantener el valor de la academia." },
  { q: "¿Qué pasa si la academia se actualiza?", a: "Las alumnas con membresía activa reciben todas las actualizaciones y nuevos cursos sin costo adicional mientras dure su suscripción." },
  { q: "¿Cómo es el soporte?", a: "Tenés soporte por email y un canal interno en la comunidad. Respondemos de lunes a viernes en menos de 24 horas hábiles." },
];

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "Preguntas frecuentes — Lucía Rojas Studio" },
      { name: "description", content: "Resolvemos tus dudas sobre los cursos, la membresía y la academia." },
    ],
  }),
  component: FaqPage,
});

function FaqPage() {
  return (
    <PublicLayout>
      <section className="bg-gradient-cream py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <SectionHeader eyebrow="Preguntas frecuentes" title="Resolvemos tus dudas" />
        </div>
      </section>
      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <FAQAccordion items={[...faqs, ...extra]} />
          <div className="mt-12 rounded-xl border border-border bg-card p-8 text-center shadow-soft">
            <h3 className="font-serif text-xl">¿No encontraste tu respuesta?</h3>
            <p className="mt-2 text-sm text-muted-foreground">Escribinos y te respondemos en menos de 24 hs hábiles.</p>
            <Button variant="gold" className="mt-5" asChild>
              <Link to="/contacto">Ir a contacto <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
