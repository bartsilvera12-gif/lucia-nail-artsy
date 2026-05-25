import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { ArrowLeft, BookOpen, Lock, ChevronUp } from "lucide-react";
import { useEffect, useRef } from "react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { RichTextView } from "@/components/RichTextEditor";
import { useCourseBySlug, useCourseTheories } from "@/hooks/useCourses";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/curso/$slug_/teoria")({
  head: ({ params }) => ({ meta: [{ title: `Teoría — ${params.slug} — Lucía Rojas Studio` }] }),
  component: TeoriaPage,
});

function TeoriaPage() {
  const { slug } = Route.useParams();
  const { isAuthenticated, hasAccessTo, loading } = useAuth();
  const { data, isLoading } = useCourseBySlug(slug);
  const { data: theories = [], isLoading: loadingTheories } = useCourseTheories(data?.course?.id);
  const topRef = useRef<HTMLDivElement | null>(null);

  // Si llega con hash en la URL, intentar scrollear al elemento
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash.slice(1);
    if (hash) {
      const el = document.getElementById(hash);
      if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 200);
    }
  }, [theories]);

  if (loading || isLoading) {
    return (
      <PublicLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-sm text-muted-foreground">Cargando…</p>
        </div>
      </PublicLayout>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (!data?.course) {
    return (
      <PublicLayout>
        <div className="mx-auto max-w-xl px-4 py-20 text-center">
          <p className="font-serif text-2xl">Curso no encontrado</p>
          <Button asChild variant="outlineGold" className="mt-6">
            <Link to="/cursos">Ver todos los cursos</Link>
          </Button>
        </div>
      </PublicLayout>
    );
  }

  const course = data.course;
  const hasAccess = hasAccessTo(course.id, course.included_in_membership);

  return (
    <PublicLayout>
      <article className="bg-gradient-cream" ref={topRef}>
        {/* Hero */}
        <header className="border-b border-border/60">
          <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
            <Button asChild variant="ghost" size="sm" className="mb-6 -ml-2">
              <Link to="/curso/$slug" params={{ slug }}>
                <ArrowLeft className="h-4 w-4" /> Volver al curso
              </Link>
            </Button>

            <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-primary">
              {course.category} · Teoría
            </p>
            <h1 className="mt-3 font-serif text-3xl leading-tight sm:text-4xl">
              {course.title}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Material teórico completo del curso.
            </p>

            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-card px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              <BookOpen className="h-3.5 w-3.5" />
              {theories.length > 0
                ? `${theories.length} ${theories.length === 1 ? "teoría" : "teorías"}`
                : "Contenido teórico"}
            </div>
          </div>
        </header>

        {/* Body */}
        <section className="py-10 sm:py-14">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            {!hasAccess ? (
              <div className="rounded-2xl border-2 border-primary/30 bg-card p-10 text-center shadow-soft">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-gold">
                  <Lock className="h-6 w-6 text-foreground" />
                </div>
                <h2 className="mt-5 font-serif text-2xl">Esta teoría es para alumnas del curso</h2>
                <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
                  El material teórico está disponible para quienes ya compraron el curso.
                  Comprá el curso para acceder a todo el contenido.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  <Button variant="gold" asChild>
                    <Link to="/curso/$slug" params={{ slug }} hash="comprar">
                      Comprar curso
                    </Link>
                  </Button>
                  <Button variant="outlineGold" asChild>
                    <Link to="/curso/$slug" params={{ slug }}>Volver al curso</Link>
                  </Button>
                </div>
              </div>
            ) : loadingTheories ? (
              <p className="text-center text-sm text-muted-foreground">Cargando teorías…</p>
            ) : theories.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
                <BookOpen className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-4 font-serif text-lg">Material teórico en preparación</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  La docente todavía no cargó el contenido teórico de este curso. Volvé pronto.
                </p>
                <Button asChild variant="outlineGold" className="mt-6">
                  <Link to="/curso/$slug" params={{ slug }}>Volver al curso</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Tabla de contenido — si hay 2+ teorías */}
                {theories.length > 1 && (
                  <nav className="rounded-2xl border border-border bg-card p-5 shadow-soft">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                      Contenido
                    </p>
                    <ol className="mt-3 space-y-1.5 text-sm">
                      {theories.map((t, i) => (
                        <li key={t.id}>
                          <a
                            href={`#teoria-${t.id}`}
                            className="inline-flex items-center gap-2 text-foreground transition-colors hover:text-primary"
                          >
                            <span className="font-mono text-xs text-muted-foreground">
                              {String(i + 1).padStart(2, "0")}.
                            </span>
                            <span>{t.title}</span>
                          </a>
                        </li>
                      ))}
                    </ol>
                  </nav>
                )}

                {/* Lista de teorías */}
                {theories.map((t, i) => (
                  <section
                    key={t.id}
                    id={`teoria-${t.id}`}
                    className="scroll-mt-24 rounded-2xl border border-border bg-card px-6 py-8 shadow-soft sm:px-10 sm:py-10"
                  >
                    <header className="mb-5 border-b border-border pb-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-primary">
                        Teoría {String(i + 1).padStart(2, "0")}
                      </p>
                      <h2 className="mt-2 font-serif text-2xl sm:text-3xl">{t.title}</h2>
                    </header>

                    {t.content ? (
                      <RichTextView html={t.content} className="text-base leading-relaxed text-foreground" />
                    ) : (
                      <p className="italic text-muted-foreground">Sin contenido cargado todavía.</p>
                    )}

                    {/* Botón volver al tope si hay tabla de contenidos */}
                    {theories.length > 1 && (
                      <div className="mt-6 flex justify-end">
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                          }}
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary"
                        >
                          <ChevronUp className="h-3 w-3" />
                          Volver arriba
                        </a>
                      </div>
                    )}
                  </section>
                ))}

                {/* Footer de la página */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
                  <Button asChild variant="outlineGold">
                    <Link to="/curso/$slug" params={{ slug }}>
                      <ArrowLeft className="h-4 w-4" /> Volver al curso
                    </Link>
                  </Button>
                  <Button asChild variant="gold">
                    <Link to="/ver/$slug" params={{ slug }}>
                      Ir a las clases en video
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </section>
      </article>
    </PublicLayout>
  );
}
