import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, Award, Users, ArrowRight } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { SectionHeader } from "@/components/SectionHeader";
import { GoldBadge } from "@/components/Badge";
import { Button } from "@/components/ui/button";
import aboutImg from "@/assets/about-studio.jpg";
import { AnimateIn } from "@/components/AnimateIn";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre Lucía Rojas — Academia de uñas online" },
      { name: "description", content: "Conocé la historia, la misión y el método detrás de Lucía Rojas Studio." },
    ],
  }),
  component: SobrePage,
});

function SobrePage() {
  return (
    <PublicLayout>
      <section className="relative isolate overflow-hidden border-b border-border bg-gradient-cream py-16 sm:py-24">
        <div aria-hidden className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-gradient-gold opacity-15 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -right-32 -bottom-32 h-96 w-96 rounded-full bg-[var(--nude)] opacity-25 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
        <div aria-hidden className="absolute inset-x-0 bottom-0 mx-auto h-px max-w-3xl gold-divider" />

        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
          <AnimateIn direction="right">
          <div>
            <GoldBadge>Sobre Lucía Rojas Studio</GoldBadge>
            <h1 className="mt-6 font-serif text-4xl text-balance sm:text-5xl">
              Formación premium para futuras profesionales de las uñas
            </h1>
            <p className="mt-6 text-base leading-relaxed text-muted-foreground">
              Lucía Rojas Studio nació para llenar un vacío: enseñar uñas con técnica real, criterio estético y mirada de negocio.
              Hoy es una academia privada con cientos de alumnas que aprenden a su ritmo desde cualquier lugar.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button variant="gold" asChild>
                <Link to="/cursos">Ver cursos <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button variant="outlineGold" asChild>
                <Link to="/comunidad">Espacio de Alumnos</Link>
              </Button>
            </div>
          </div>
          </AnimateIn>
          <AnimateIn direction="left" delay={150} duration={800}>
            <div className="relative overflow-hidden rounded-2xl shadow-elegant">
              <img src={aboutImg} alt="Estudio Lucía Rojas" className="h-full w-full object-cover" />
            </div>
          </AnimateIn>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <AnimateIn direction="up">
            <SectionHeader eyebrow="Misión" title="Educación que transforma carreras" description="Creemos que con la formación correcta cualquier alumna puede convertir su pasión en una profesión rentable." />
          </AnimateIn>
          <div className="mt-14 grid gap-6 sm:grid-cols-3">
            {[
              { icon: Heart, t: "Vocación primero", d: "Enseñamos desde la práctica real con foco en lo que funciona." },
              { icon: Users, t: "Acompañamiento real", d: "Aprendés con soporte de Lucía y otras alumnas, no sola frente a un video." },
              { icon: Award, t: "Estándares premium", d: "Resultados que se notan, se ven y se cobran mejor." },
            ].map(({ icon: Icon, t, d }, i) => (
              <AnimateIn key={t} direction="up" delay={i * 100}>
              <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-gold">
                  <Icon className="h-5 w-5 text-foreground" />
                </div>
                <h3 className="mt-5 font-serif text-lg">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{d}</p>
              </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

    </PublicLayout>
  );
}
