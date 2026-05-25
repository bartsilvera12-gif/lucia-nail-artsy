import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { ArrowLeft, BookOpen, Lock } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { RichTextView } from "@/components/RichTextEditor";
import { useCourseBySlug } from "@/hooks/useCourses";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/curso/$slug/teoria")({
  head: ({ params }) => ({ meta: [{ title: `Teoría — ${params.slug} — Lucía Rojas Studio` }] }),
  component: TeoriaPage,
});

function TeoriaPage() {
  const { slug } = Route.useParams();
  const { user, isAuthenticated, hasAccessTo, loading } = useAuth();
  const { data, isLoading } = useCourseBySlug(slug);
  void user;

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
  const theory = (course.theory_content ?? "").trim();

  return (
    <PublicLayout>
      <article className="bg-gradient-cream">
        {/* Hero */}
        <header className="border-b border-border/60">
          <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
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
              Contenido teórico
            </div>
          </div>
        </header>

        {/* Body */}
        <section className="py-10 sm:py-14">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
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
            ) : !theory ? (
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
              <div className="rounded-2xl border border-border bg-card px-6 py-8 shadow-soft sm:px-10 sm:py-12">
                <RichTextView html={theory} className="text-base leading-relaxed text-foreground" />

                <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
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
