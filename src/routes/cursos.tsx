import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search, BookOpen } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { CourseCard } from "@/components/CourseCard";
import { useCourses } from "@/hooks/useCourses";
import { Button } from "@/components/ui/button";
import manoImg from "@/assets/manicure_line_art_transparent_4x.png";
import { AnimateIn } from "@/components/AnimateIn";

const filters = ["Todos", "Principiante", "Intermedio", "Avanzado", "Negocio", "Nail Art"] as const;

export const Route = createFileRoute("/cursos")({
  head: () => ({ meta: [{ title: "Cursos online de uñas — Lucía Rojas Studio" }, { name: "description", content: "Catálogo completo de cursos online de uñas, manicura rusa, semipermanente, nail art y negocio." }] }),
  component: CursosPage,
});

function CursosPage() {
  const { data: courses = [], isLoading } = useCourses();
  const [filter, setFilter] = useState<typeof filters[number]>("Todos");
  const [q, setQ] = useState("");
  const filtered = courses.filter((c) =>
    (filter === "Todos" || c.category === filter) &&
    c.title.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <PublicLayout>
      <section className="relative isolate overflow-hidden border-b border-border bg-gradient-cream">
        {/* Decoración */}
        <div aria-hidden className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-gradient-gold opacity-25 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -right-32 top-1/3 h-96 w-96 rounded-full bg-gradient-gold opacity-20 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
        <div aria-hidden className="absolute inset-x-0 bottom-0 mx-auto h-px max-w-3xl gold-divider" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-6 px-4 py-8 sm:px-6 sm:py-10 lg:min-h-[320px] lg:grid-cols-[1fr_1fr] lg:gap-0 lg:px-8">
          {/* Izquierda: ícono + título + buscador */}
          <AnimateIn direction="up" className="flex flex-col items-center text-center">
            <div className="flex w-full flex-col items-center gap-2">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-gold shadow-gold">
                <BookOpen className="h-5 w-5 text-foreground" strokeWidth={1.75} />
              </div>
              <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-primary">— Catálogo —</p>
            </div>
            <h1 className="mt-4 font-serif text-xl leading-[1.1] sm:text-2xl lg:text-3xl">
              Cursos online de uñas
            </h1>
            <p className="mt-3 max-w-xl text-xs text-muted-foreground sm:text-sm">
              Aprendé a tu ritmo con cursos premium organizados por niveles.
            </p>
            <div className="mt-6 w-full max-w-md">
              <div className="flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2 shadow-soft">
                <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar curso…"
                  className="flex-1 bg-transparent text-sm outline-none"
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {filters.map((f) => (
                  <Button key={f} variant={filter === f ? "gold" : "outlineGold"} size="sm" onClick={() => setFilter(f)}>
                    {f}
                  </Button>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {isLoading ? "Cargando…" : `${filtered.length} curso${filtered.length === 1 ? "" : "s"} disponibles`}
              </p>
            </div>
          </AnimateIn>

          {/* Derecha: imagen centrada */}
          <div className="absolute inset-y-0 right-0 hidden w-1/2 lg:flex lg:items-center lg:justify-center">
            <AnimateIn direction="fade" duration={900} delay={200} className="relative flex h-full w-full items-center justify-center">
              <div aria-hidden className="absolute h-[65%] w-[65%] bg-gradient-gold opacity-40" style={{ borderRadius: "40% 60% 70% 30% / 30% 50% 50% 70%" }} />
              <div aria-hidden className="absolute h-[72%] w-[72%] border border-primary/40 bg-transparent" style={{ borderRadius: "40% 60% 70% 30% / 30% 50% 50% 70%" }} />
              <AnimateIn direction="left" delay={350} duration={800} className="relative h-full w-full">
                <img src={manoImg} alt="" className="h-full w-full object-contain object-center" />
              </AnimateIn>
            </AnimateIn>
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <p className="text-center text-sm text-muted-foreground">Cargando cursos…</p>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {filtered.map((c, i) => (
                  <AnimateIn key={c.id} direction="up" delay={i * 60}>
                    <CourseCard course={c} />
                  </AnimateIn>
                ))}
              </div>
              {filtered.length === 0 && (
                <div className="rounded-xl border border-border bg-card p-12 text-center">
                  <p className="text-muted-foreground">No encontramos cursos con ese filtro.</p>
                  <Link to="/cursos" className="mt-4 inline-block text-sm text-primary underline">Ver todos</Link>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
