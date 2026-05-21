import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, ArrowRight, Crown, ShieldCheck } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { PageHero } from "@/components/PageHero";
import { SectionHeader } from "@/components/SectionHeader";
import { PlanCard } from "@/components/PlanCard";
import { FAQAccordion } from "@/components/FAQAccordion";
import { Button } from "@/components/ui/button";
import { plans, faqs } from "@/data/site";

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
      <PageHero
        eyebrow="Planes"
        title="Elegí cómo aprender"
        description="Membresía con todo incluido o compra individual del curso que necesites."
        icon={<div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-gold shadow-gold"><Crown className="h-5 w-5 text-foreground" strokeWidth={1.75} /></div>}
      />

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-stretch gap-8 lg:grid-cols-3 lg:gap-6">
            {plans.map((plan, i) => (
              <div key={plan.id} className="animate-fade-up" style={{ animationDelay: `${i * 120}ms` }}>
                <PlanCard {...plan} to={plan.id === "individual" ? "/cursos" : `/registro?plan=${plan.id}`} />
              </div>
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
