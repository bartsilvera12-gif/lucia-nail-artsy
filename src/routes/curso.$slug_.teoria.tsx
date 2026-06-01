import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, BookOpen, Lock, ChevronLeft, ChevronRight, List, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { RichTextView } from "@/components/RichTextEditor";
import { useCourseBySlug, useCourseTheories } from "@/hooks/useCourses";
import { useAuth } from "@/lib/auth";

interface TeoriaSearch { n?: number }

export const Route = createFileRoute("/curso/$slug_/teoria")({
  validateSearch: (s: Record<string, unknown>): TeoriaSearch => {
    const n = Number(s.n);
    return Number.isFinite(n) && n > 0 ? { n } : {};
  },
  head: ({ params }) => ({ meta: [{ title: `Teoría — ${params.slug} — Lucía Rojas Studio` }] }),
  component: TeoriaPage,
});

function TeoriaPage() {
  const { slug } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { isAuthenticated, hasAccessTo, loading } = useAuth();
  const { data, isLoading } = useCourseBySlug(slug);
  const { data: theories = [], isLoading: loadingTheories } = useCourseTheories(data?.course?.id);

  // n es 1-indexed (1, 2, 3...). Default a 1.
  const total = theories.length;
  const currentIdx = Math.min(Math.max(0, (search.n ?? 1) - 1), Math.max(0, total - 1));
  const current = theories[currentIdx];
  const [showToc, setShowToc] = useState(false);

  // Scroll al tope cuando cambia la teoría
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentIdx]);

  // Navegación con teclado (← → para anterior/siguiente)
  useEffect(() => {
    if (total < 2) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && /INPUT|TEXTAREA|SELECT/i.test(e.target.tagName)) return;
      if (e.key === "ArrowLeft" && currentIdx > 0) {
        navigate({ to: "/curso/$slug/teoria", params: { slug }, search: { n: currentIdx } });
      }
      if (e.key === "ArrowRight" && currentIdx < total - 1) {
        navigate({ to: "/curso/$slug/teoria", params: { slug }, search: { n: currentIdx + 2 } });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [currentIdx, total, slug, navigate]);

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

  const goToTheory = (idx: number) => {
    if (idx < 0 || idx >= total) return;
    navigate({ to: "/curso/$slug/teoria", params: { slug }, search: { n: idx + 1 } });
    setShowToc(false);
  };

  return (
    <PublicLayout>
      <article className="bg-gradient-cream">
        {/* Hero compacto */}
        <header className="border-b border-border/60">
          <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
            <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
              <Link to="/curso/$slug" params={{ slug }}>
                <ArrowLeft className="h-4 w-4" /> Volver al curso
              </Link>
            </Button>

            <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-primary">
              {course.category} · Teoría
            </p>
            <h1 className="mt-2 font-serif text-2xl leading-tight sm:text-3xl">
              {course.title}
            </h1>
          </div>
        </header>

        <section className="py-8 sm:py-12">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            {!hasAccess ? (
              <div className="rounded-2xl border-2 border-primary/30 bg-card p-10 text-center shadow-soft">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-gold">
                  <Lock className="h-6 w-6 text-foreground" />
                </div>
                <h2 className="mt-5 font-serif text-2xl">Esta teoría es para alumnas del curso</h2>
                <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
                  El material teórico está disponible para quienes ya compraron el curso.
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
            ) : total === 0 ? (
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
            ) : !current ? null : (
              <>
                {/* Barra de navegación superior */}
                <nav className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-soft">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-gold text-sm font-medium text-foreground shadow-gold">
                      {String(currentIdx + 1).padStart(2, "0")}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Teoría {currentIdx + 1} de {total}
                      </p>
                      <p className="truncate text-sm font-medium text-foreground">{current.title}</p>
                    </div>
                  </div>

                  {/* Botón índice */}
                  {total > 1 && (
                    <Button variant="ghost" size="sm" onClick={() => setShowToc((v) => !v)}>
                      <List className="h-4 w-4" />
                      <span className="hidden sm:inline">{showToc ? "Cerrar índice" : "Índice"}</span>
                    </Button>
                  )}
                </nav>

                {/* Índice expandible */}
                {showToc && total > 1 && (
                  <div className="mb-6 rounded-xl border border-border bg-card p-4 shadow-soft">
                    <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                      Índice de teorías
                    </p>
                    <ol className="space-y-1.5">
                      {theories.map((t, i) => (
                        <li key={t.id}>
                          <button
                            onClick={() => goToTheory(i)}
                            className={
                              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors " +
                              (i === currentIdx
                                ? "bg-primary/15 font-medium text-foreground"
                                : "text-foreground hover:bg-secondary")
                            }
                          >
                            <span className="font-mono text-xs text-muted-foreground">
                              {String(i + 1).padStart(2, "0")}.
                            </span>
                            <span className="truncate">{t.title}</span>
                          </button>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Contenido de la teoría actual */}
                <article className="rounded-2xl border border-border bg-card px-6 py-8 shadow-soft sm:px-10 sm:py-12">
                  <header className="mb-6 border-b border-border pb-5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-primary">
                      Teoría {String(currentIdx + 1).padStart(2, "0")}
                    </p>
                    <h2 className="mt-2 font-serif text-2xl leading-tight sm:text-3xl">
                      {current.title}
                    </h2>
                  </header>

                  {current.content ? (
                    <RichTextView html={current.content} className="text-base leading-relaxed text-foreground" />
                  ) : !current.pdf_url ? (
                    <p className="italic text-muted-foreground">Sin contenido cargado todavía.</p>
                  ) : null}

                  {current.pdf_url && (() => {
                    // URL del visor: pasamos por proxy /material-teoria si tenemos
                    // pdf_path (evita ad blockers sobre el subdominio api.* de Supabase).
                    // Fallback al pdf_url directo para teorías legacy sin pdf_path.
                    const viewerUrl = current.pdf_path
                      ? `/material-teoria?ref=${encodeURIComponent(current.pdf_path)}`
                      : current.pdf_url;
                    const viewerUrlWithHash = `${viewerUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`;

                    return (
                      <div className={current.content ? "mt-8" : ""}>
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary" />
                            <span className="font-medium">{current.pdf_name || "Material en PDF"}</span>
                          </div>
                          {/* Fallback explícito: si el visor embebido lo bloquea el
                              navegador (Opera GX adblock, Edge SmartScreen, etc.),
                              la alumna igual puede abrirlo en pestaña aparte. */}
                          <a
                            href={viewerUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-primary underline hover:opacity-80"
                          >
                            ¿No se ve? Abrir en pestaña nueva
                          </a>
                        </div>

                        {/* Usamos <object> en vez de <iframe>: tiene mejor compatibilidad
                            con visores nativos de PDF y los browsers lo tratan distinto
                            que a un iframe genérico (menos probable que SmartScreen o
                            tracking prevention lo bloqueen). Si falla, el child <p>
                            queda visible con el link de fallback. */}
                        <div
                          className="overflow-hidden rounded-xl border border-border bg-secondary/30"
                          onContextMenu={(e) => e.preventDefault()}
                        >
                          <object
                            data={viewerUrlWithHash}
                            type="application/pdf"
                            className="block h-[80vh] w-full"
                            aria-label={current.pdf_name || current.title}
                          >
                            <div className="flex h-[80vh] flex-col items-center justify-center gap-3 p-8 text-center">
                              <FileText className="h-10 w-10 text-muted-foreground" />
                              <p className="text-sm text-muted-foreground">
                                Tu navegador no puede mostrar el PDF acá.
                              </p>
                              <a
                                href={viewerUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-md border border-primary bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20"
                              >
                                Abrir PDF en pestaña nueva
                              </a>
                            </div>
                          </object>
                        </div>
                      </div>
                    );
                  })()}
                </article>

                {/* Navegación inferior — Anterior / Siguiente */}
                <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                  <Button
                    variant="outlineGold"
                    onClick={() => goToTheory(currentIdx - 1)}
                    disabled={currentIdx === 0}
                    className="min-w-[140px]"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>

                  <span className="text-xs text-muted-foreground">
                    {currentIdx + 1} / {total}
                  </span>

                  {currentIdx < total - 1 ? (
                    <Button
                      variant="gold"
                      onClick={() => goToTheory(currentIdx + 1)}
                      className="min-w-[140px]"
                    >
                      Siguiente
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button asChild variant="gold" className="min-w-[140px]">
                      <Link to="/ver/$slug" params={{ slug }}>
                        Ir a las clases
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </div>

                {/* Footer con link al curso */}
                <div className="mt-8 flex justify-center">
                  <Button asChild variant="ghost" size="sm">
                    <Link to="/curso/$slug" params={{ slug }}>
                      <ArrowLeft className="h-4 w-4" /> Volver al detalle del curso
                    </Link>
                  </Button>
                </div>
              </>
            )}
          </div>
        </section>
      </article>
    </PublicLayout>
  );
}
