import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, Award, Users, Sparkles, ArrowRight } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { SectionHeader } from "@/components/SectionHeader";
import { GoldBadge } from "@/components/Badge";
import { Button } from "@/components/ui/button";
import aboutImg from "@/assets/about-studio.jpg";

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
      <section className="bg-gradient-cream py-16 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
          <div>
            <GoldBadge>Sobre Lucía Rojas Studio</GoldBadge>
            <h1 className="mt-6 font-serif text-4xl text-balance sm:text-5xl">
              Formación premium para futuras profesionales de las uñas
            </h1>
            <p className="mt-6 text-base leading-relaxed text-muted-foreground">
              Lucía Rojas Studio nació para llenar un vacío: enseñar uñas con técnica real, criterio estético y mirada de negocio.
              Hoy es una comunidad privada con cientos de alumnas que aprenden a su ritmo desde cualquier lugar.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button variant="gold" asChild>
                <Link to="/cursos">Ver cursos <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button variant="outlineGold" asChild>
                <Link to="/comunidad">Conocer la comunidad</Link>
              </Button>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-2xl shadow-elegant">
            <img src={aboutImg} alt="Estudio Lucía Rojas" className="h-full w-full object-cover" />
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <SectionHeader eyebrow="Misión" title="Educación que transforma carreras" description="Creemos que con la formación correcta cualquier alumna puede convertir su pasión en una profesión rentable." />
          <div className="mt-14 grid gap-6 sm:grid-cols-3">
            {[
              { icon: Heart, t: "Vocación primero", d: "Enseñamos desde la práctica real con foco en lo que funciona." },
              { icon: Users, t: "Comunidad activa", d: "Aprendés con otras alumnas, no sola frente a un video." },
              { icon: Award, t: "Estándares premium", d: "Resultados que se notan, se ven y se cobran mejor." },
            ].map(({ icon: Icon, t, d }) => (
              <div key={t} className="rounded-xl border border-border bg-card p-6 shadow-soft">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-gold">
                  <Icon className="h-5 w-5 text-foreground" />
                </div>
                <h3 className="mt-5 font-serif text-lg">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-secondary/40 py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <Sparkles className="mx-auto h-6 w-6 text-primary" />
          <h2 className="mt-4 font-serif text-3xl sm:text-4xl">Administrada por HorizontesWebIA</h2>
          <p className="mt-4 text-base text-muted-foreground">
            La plataforma técnica está desarrollada y mantenida por HorizontesWebIA, garantizando una experiencia segura, rápida y estable para vos y tus clases.
          </p>
        </div>
      </section>
    </PublicLayout>
  );
}
