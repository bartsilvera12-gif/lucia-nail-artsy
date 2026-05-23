import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, ArrowRight, Crown, ShieldCheck } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { SectionHeader } from "@/components/SectionHeader";
import { PlanCard } from "@/components/PlanCard";
import { FAQAccordion } from "@/components/FAQAccordion";
import { Button } from "@/components/ui/button";
import { plans, faqs } from "@/data/site";
import manoImg from "@/assets/manoesmalte2.png";
import { AnimateIn } from "@/components/AnimateIn";

export const Route = createFileRoute("/planes")({
  head: () => ({
    meta: [
      { title: "Planes y precios — Lucía Rojas Studio" },
      { name: "description", content: "Membresía mensual, anual o compra individual. Elegí cómo aprender uñas profesionales online." },
    ],
  }),
  component: PlanesPage,
});

function PlanesPage() {
  return (
    <PublicLayout>
      <section className="relative isolate overflow-hidden border-b border-border bg-gradient-cream">
        <div aria-hidden className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-gradient-gold opacity-15 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -right-32 top-1/3 h-96 w-96 rounded-full bg-[var(--nude)] opacity-25 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
        <div aria-hidden className="absolute inset-x-0 bottom-0 mx-auto h-px max-w-3xl gold-divider" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-6 px-4 py-8 sm:px-6 sm:py-10 lg:min-h-[320px] lg:grid-cols-[1fr_1fr] lg:gap-0 lg:px-8">
          <AnimateIn direction="up" className="flex flex-col items-center text-center">
            <div className="flex w-full flex-col items-center gap-2">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-gold shadow-gold">
                <Crown className="h-5 w-5 text-foreground" strokeWidth={1.75} />
              </div>
              <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-primary">— Planes —</p>
            </div>
            <h1 className="mt-4 font-serif text-xl leading-[1.1] sm:text-2xl lg:text-3xl">
              Elegí cómo aprender
            </h1>
            <p className="mt-3 max-w-xl text-xs text-muted-foreground sm:text-sm">
              Membresía con todo incluido o compra individual del curso que necesites.
            </p>
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

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-stretch gap-8 lg:grid-cols-3 lg:gap-6">
            {plans.map((plan, i) => (
              <AnimateIn key={plan.id} direction="up" delay={i * 120}>
                <PlanCard {...plan} to={plan.id === "individual" ? "/cursos" : `/registro?plan=${plan.id}`} />
              </AnimateIn>
            ))}
          </div>
          <p className="mt-10 text-center text-xs text-muted-foreground">Precios en USD. Podés cancelar la membresía cuando quieras desde tu panel.</p>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <SectionHeader eyebrow="Comparación" title="¿Qué incluye cada plan?" />
          <div className="mt-12 overflow-hidden rounded-xl border border-border bg-card shadow-soft">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60">
                <tr>
                  <th className="px-4 py-3 text-left font-serif text-base">Beneficio</th>
                  <th className="px-4 py-3 text-center">Mensual</th>
                  <th className="px-4 py-3 text-center">Anual</th>
                  <th className="px-4 py-3 text-center">Individual</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Cursos incluidos", true, true, "1"],
                  ["Comunidad privada", true, true, false],
                  ["Bonos descargables", true, true, "Del curso"],
                  ["Certificado digital", true, true, true],
                  ["Sesiones en vivo", false, true, false],
                  ["Bonos premium", false, true, false],
                  ["Cancelación flexible", true, true, "Pago único"],
                ].map(([label, m, y, i], idx) => (
                  <tr key={idx} className="border-t border-border">
                    <td className="px-4 py-3 font-medium">{label as string}</td>
                    {[m, y, i].map((v, j) => (
                      <td key={j} className="px-4 py-3 text-center">
                        {typeof v === "boolean" ? (
                          v ? <Check className="mx-auto h-4 w-4 text-primary" /> : <span className="text-muted-foreground/40">—</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">{v}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <SectionHeader eyebrow="Preguntas frecuentes" title="Lo que más nos preguntan" />
          <div className="mt-10"><FAQAccordion items={faqs.slice(0, 4)} /></div>
          <div className="mt-8 text-center">
            <Button variant="gold" asChild>
              <Link to="/registro">Empezar ahora <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
