import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { SectionHeader } from "@/components/SectionHeader";
import { CourseCard } from "@/components/CourseCard";
import { courses } from "@/data/courses";
import { Button } from "@/components/ui/button";

const filters = ["Todos", "Principiante", "Intermedio", "Avanzado", "Negocio", "Nail Art"] as const;

export const Route = createFileRoute("/cursos")({
  head: () => ({ meta: [{ title: "Cursos online de uñas — Lucía Rojas Studio" }, { name: "description", content: "Catálogo completo de cursos online de uñas, manicura rusa, semipermanente, nail art y negocio." }] }),
  component: CursosPage,
});

function CursosPage() {
  const [filter, setFilter] = useState<typeof filters[number]>("Todos");
  const [q, setQ] = useState("");
  const filtered = courses.filter((c) => (filter === "Todos" || c.category === filter) && c.title.toLowerCase().includes(q.toLowerCase()));
  return (
    <PublicLayout>
      <section className="bg-gradient-cream py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader eyebrow="Catálogo" title="Cursos online de uñas" description="Aprendé a tu ritmo con cursos premium organizados por niveles." />
          <div className="mx-auto mt-10 flex max-w-xl items-center gap-2 rounded-full border border-border bg-card px-4 py-2 shadow-soft">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar curso…" className="flex-1 bg-transparent text-sm outline-none" />
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {filters.map((f) => (
              <Button key={f} variant={filter === f ? "gold" : "outlineGold"} size="sm" onClick={() => setFilter(f)}>{f}</Button>
            ))}
          </div>
        </div>
      </section>
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((c) => (<CourseCard key={c.slug} course={c} />))}
          </div>
          {filtered.length === 0 && (
            <div className="rounded-xl border border-border bg-card p-12 text-center">
              <p className="text-muted-foreground">No encontramos cursos con ese filtro.</p>
              <Link to="/cursos" className="mt-4 inline-block text-sm text-primary underline">Ver todos</Link>
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}