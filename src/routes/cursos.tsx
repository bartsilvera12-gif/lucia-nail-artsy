import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search, BookOpen } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { CourseCard } from "@/components/CourseCard";
import { useCourses } from "@/hooks/useCourses";
import { Button } from "@/components/ui/button";

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

        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
          <div className="flex flex-col items-start">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-gold shadow-gold">
              <BookOpen className="h-5 w-5 text-foreground" strokeWidth={1.75} />
            </div>
            <div className="mt-5 flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.28em] text-primary">
              <span aria-hidden className="h-px w-8 bg-gradient-to-r from-transparent to-primary" />
              <span>Catálogo</span>
              <span aria-hidden className="h-px w-8 bg-gradient-to-l from-transparent to-primary" />
            </div>
            <h1 className="mt-4 font-serif text-3xl leading-[1.1] sm:text-4xl lg:text-5xl">
              Cursos online de uñas
            </h1>
            <p className="mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
              Aprendé a tu ritmo con cursos premium organizados por niveles.
            </p>

            {/* Buscador + filtros debajo del título, alineados a la izquierda */}
            <div className="mt-6 w-full max-w-md">
              <div className="flex items-center gap-2 rounded-full border border-border bg-card/95 px-4 py-3 shadow-soft backdrop-blur">
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
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <p className="text-center text-sm text-muted-foreground">Cargando cursos…</p>
          ) : (
            <>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filtered.map((c) => (<CourseCard key={c.id} course={c} />))}
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
