import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, ArrowRight, ShoppingCart } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { SectionHeader } from "@/components/SectionHeader";
import { FAQAccordion } from "@/components/FAQAccordion";
import { Button } from "@/components/ui/button";
import { faqs } from "@/data/site";
import manoImg from "@/assets/manoesmalte2.png";
import { AnimateIn } from "@/components/AnimateIn";

export const Route = createFileRoute("/planes")({
  head: () => ({
    meta: [
      { title: "Cursos — Lucía Rojas Studio" },
      { name: "description", content: "Comprá el curso que necesitás con acceso permanente. Sin suscripciones ni cargos automáticos." },
    ],
  }),
  component: PlanesPage,
});

const beneficios = [
  "Acceso inmediato tras el pago",
  "Clases grabadas — ve a tu ritmo",
  "Certificado digital al completar",
  "Bonos descargables incluidos",
  "Sin suscripción ni cargos automáticos",
  "Acceso permanente — tuyo para siempre",
];

function PlanesPage() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative isolate overflow-hidden border-b border-border bg-gradient-cream">
        <div aria-hidden className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-gradient-gold opacity-15 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -right-32 top-1/3 h-96 w-96 rounded-full bg-[var(--nude)] opacity-25 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
        <div aria-hidden className="absolute inset-x-0 bottom-0 mx-auto h-px max-w-3xl gold-divider" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-6 px-4 py-8 sm:px-6 sm:py-10 lg:min-h-[320px] lg:grid-cols-[1fr_1fr] lg:gap-0 lg:px-8">
          <AnimateIn direction="up" className="flex flex-col items-center text-center">
            <div className="flex w-full flex-col items-center gap-2">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-gold shadow-gold">
                <ShoppingCart className="h-5 w-5 text-foreground" strokeWidth={1.75} />
              </div>
              <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-primary">— Cursos individuales —</p>
            </div>
            <h1 className="mt-4 font-serif text-xl leading-[1.1] sm:text-2xl lg:text-3xl">
              Comprá el curso que necesitás
            </h1>
            <p className="mt-3 max-w-xl text-xs text-muted-foreground sm:text-sm">
              Pago único, acceso permanente. Sin suscripciones ni cargos automáticos.
            </p>
            <Button variant="gold" size="lg" className="mt-6" asChild>
              <Link to="/cursos">Ver todos los cursos <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </AnimateIn>

          <div className="absolute inset-y-0 right-0 hidden w-1/2 lg:flex lg:items-center lg:justify-center">
            <AnimateIn direction="fade" duration={900} delay={200} className="relative flex h-full w-full items-center justify-center">
              <div aria-hidden className="absolute h-[65%] w-[65%] bg-gradient-nude opacity-35" style={{ borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%" }} />
              <div aria-hidden className="absolute h-[72%] w-[72%] border border-[var(--nude)]/50 bg-transparent" style={{ borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%" }} />
              <AnimateIn direction="left" delay={350} duration={800} className="relative h-full w-full">
                <img src={manoImg} alt="" className="h-full w-full object-contain object-center" />
              </AnimateIn>
            </AnimateIn>
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <SectionHeader eyebrow="Así de simple" title="¿Cómo funciona?" />
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {[
              { n: "1", title: "Elegís tu curso", desc: "Navegá el catálogo y elegí el curso que necesitás para tu carrera.", delay: 100 },
              { n: "2", title: "Pagás una vez", desc: "Pago único en Guaraníes. Sin suscripciones ni cargos automáticos.", delay: 200 },
              { n: "3", title: "Aprendés a tu ritmo", desc: "Acceso inmediato y permanente. Volvé a verlo las veces que necesites.", delay: 300 },
            ].map(({ n, title, desc, delay }) => (
              <AnimateIn key={n} direction="up" delay={delay}>
                <div className="rounded-2xl border border-border bg-card p-6 shadow-soft text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-gold shadow-gold">
                    <span className="font-serif text-xl text-foreground">{n}</span>
                  </div>
                  <h3 className="mt-4 font-serif text-lg">{title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* Beneficios */}
      <section className="border-y border-border bg-gradient-cream py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <SectionHeader eyebrow="Incluido en cada curso" title="Todo lo que recibís" />
          <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {beneficios.map((b) => (
              <li key={b} className="flex items-center gap-3 text-sm">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-gold shadow-gold">
                  <Check className="h-3.5 w-3.5 text-foreground" strokeWidth={3} />
                </span>
                {b}
              </li>
            ))}
          </ul>
          <div className="mt-10 text-center">
            <Button variant="gold" size="lg" asChild>
              <Link to="/cursos">Ver cursos disponibles <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <SectionHeader eyebrow="Preguntas frecuentes" title="Lo que más nos preguntan" />
          <div className="mt-10"><FAQAccordion items={faqs} /></div>
          <div className="mt-8 text-center">
            <Button variant="gold" asChild>
              <Link to="/cursos">Empezar ahora <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
