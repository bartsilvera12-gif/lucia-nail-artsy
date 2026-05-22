import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, HelpCircle, Search, BookOpen, Crown, ShieldCheck, MessageCircle, Mail, Instagram } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { PageHero } from "@/components/PageHero";
import { FAQAccordion } from "@/components/FAQAccordion";
import { Button } from "@/components/ui/button";
import { faqs } from "@/data/site";
import { site } from "@/data/site";

interface FaqItem { q: string; a: string; category: "general" | "cursos" | "pagos" | "seguridad" }

const all: FaqItem[] = [
  { q: faqs[0].q, a: faqs[0].a, category: "cursos" },
  { q: faqs[1].q, a: faqs[1].a, category: "pagos" },
  { q: faqs[2].q, a: faqs[2].a, category: "general" },
  { q: faqs[3].q, a: faqs[3].a, category: "cursos" },
  { q: faqs[4].q, a: faqs[4].a, category: "pagos" },
  { q: faqs[5].q, a: faqs[5].a, category: "pagos" },
  { q: "¿Las clases tienen protección contra grabación?", a: "Sí. Las clases se reproducen en un visor protegido con marca de agua personalizada con tu email, bloqueo de menú contextual, detección de captura de pantalla y pausa automática al perder el foco. La difusión de contenido está prohibida y rastreable.", category: "seguridad" },
  { q: "¿Puedo descargar las clases?", a: "No. Las clases se ven exclusivamente en línea desde la plataforma para proteger el contenido de las alumnas y mantener el valor de la academia.", category: "seguridad" },
  { q: "¿Qué pasa si la academia se actualiza?", a: "Las alumnas con membresía activa reciben todas las actualizaciones y nuevos cursos sin costo adicional mientras dure su suscripción.", category: "general" },
  { q: "¿Cómo es el soporte?", a: "Tenés soporte por email y acceso al Espacio de Alumnos donde podés hacer preguntas sobre tus clases. Respondemos de lunes a viernes en menos de 24 horas hábiles.", category: "general" },
];

const categories = [
  { id: "todas",     label: "Todas",      icon: HelpCircle },
  { id: "general",   label: "General",    icon: BookOpen },
  { id: "cursos",    label: "Cursos",     icon: BookOpen },
  { id: "pagos",     label: "Pagos",      icon: Crown },
  { id: "seguridad", label: "Seguridad",  icon: ShieldCheck },
] as const;

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
  const [cat, setCat] = useState<typeof categories[number]["id"]>("todas");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    return all.filter((f) =>
      (cat === "todas" || f.category === cat) &&
      (f.q.toLowerCase().includes(q.toLowerCase()) || f.a.toLowerCase().includes(q.toLowerCase())),
    );
  }, [cat, q]);

  return (
    <PublicLayout>
      <PageHero
        eyebrow="Preguntas frecuentes"
        title="Resolvemos tus dudas"
        description="Todo lo que te ayuda a decidir antes de empezar tu camino con nosotras."
        icon={<div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-gold shadow-gold"><HelpCircle className="h-5 w-5 text-foreground" strokeWidth={1.75} /></div>}
      >
        {/* Buscador dentro del hero */}
        <div className="mx-auto flex max-w-xl items-center gap-2 rounded-full border border-border bg-card/95 px-4 py-2.5 shadow-soft backdrop-blur">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar en las preguntas…" className="flex-1 bg-transparent text-sm outline-none" />
        </div>
      </PageHero>

      <section className="py-12 sm:py-16">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[260px_1fr] lg:gap-12 lg:px-8">
          {/* Sidebar: categorías + contacto */}
          <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-primary">Categorías</p>
              <nav className="mt-4 space-y-1.5">
                {categories.map(({ id, label, icon: Icon }) => {
                  const active = cat === id;
                  return (
                    <button
                      key={id}
                      onClick={() => setCat(id)}
                      className={
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-all " +
                        (active
                          ? "bg-gradient-gold text-foreground shadow-gold"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground")
                      }
                    >
                      <Icon className="h-4 w-4" />
                      <span className="flex-1">{label}</span>
                      <span className={"text-[10px] " + (active ? "text-foreground/70" : "text-muted-foreground")}>
                        {id === "todas" ? all.length : all.filter((x) => x.category === id).length}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="rounded-2xl border border-primary/30 bg-gradient-cream p-5 shadow-soft">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-gold shadow-gold">
                <MessageCircle className="h-5 w-5 text-foreground" strokeWidth={1.75} />
              </div>
              <p className="mt-4 font-serif text-base">¿Necesitás ayuda?</p>
              <p className="mt-1 text-xs text-muted-foreground">Te respondemos en menos de 24 hs hábiles.</p>
              <div className="mt-4 space-y-2">
                <a href={`mailto:${site.email}`} className="flex items-center gap-2 text-xs text-foreground hover:text-primary">
                  <Mail className="h-3.5 w-3.5" /> {site.email}
                </a>
                <a href={site.social.instagram} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs text-foreground hover:text-primary">
                  <Instagram className="h-3.5 w-3.5" /> @luciarojasstudio
                </a>
              </div>
              <Button variant="gold" size="sm" asChild className="mt-4 w-full">
                <Link to="/contacto">Escribirnos <ArrowRight className="h-3.5 w-3.5" /></Link>
              </Button>
            </div>
          </aside>

          {/* Contenido */}
          <div>
            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
                <Search className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-4 font-serif text-lg">No encontramos resultados</p>
                <p className="mt-1 text-sm text-muted-foreground">Probá con otra búsqueda o categoría.</p>
              </div>
            ) : (
              <FAQAccordion items={filtered.map(({ q, a }) => ({ q, a }))} />
            )}

            <div className="mt-10 overflow-hidden rounded-2xl border border-border bg-card p-8 shadow-soft">
              <div className="relative grid items-center gap-6 sm:grid-cols-[1fr_auto]">
                <div aria-hidden className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-gold opacity-30 blur-2xl" />
                <div className="relative">
                  <p className="font-serif text-xl">¿No encontraste tu respuesta?</p>
                  <p className="mt-1 text-sm text-muted-foreground">Escribinos y te respondemos a la brevedad.</p>
                </div>
                <Button variant="gold" asChild className="relative justify-self-start sm:justify-self-end">
                  <Link to="/contacto">Ir a contacto <ArrowRight className="h-4 w-4" /></Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
