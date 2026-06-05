import { createFileRoute, Link, Navigate, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ArrowLeft, Lock, PlayCircle, CheckCircle2, Menu, X, Sparkles, FileText } from "lucide-react";
import { ProtectedVideo } from "@/components/ProtectedVideo";
import { Button } from "@/components/ui/button";
import { useCourseBySlug, saveLessonProgress, useCourseTheories } from "@/hooks/useCourses";
import { useAuth } from "@/lib/auth";

interface VerSearch { l?: string }

export const Route = createFileRoute("/ver/$slug")({
  validateSearch: (s: Record<string, unknown>): VerSearch => ({ l: typeof s.l === "string" ? s.l : undefined }),
  head: ({ params }) => ({ meta: [{ title: `Ver curso — ${params.slug}` }] }),
  component: VerPage,
});

function VerPage() {
  const { slug } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { data, isLoading } = useCourseBySlug(slug);
  const { data: theories = [] } = useCourseTheories(data?.course?.id);
  const hasTheories = theories.length > 0;
  const { user, isAuthenticated, hasAccessTo, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const allLessons = useMemo(() => {
    if (!data) return [];
    return data.modules.flatMap((m) =>
      data.lessons
        .filter((l) => l.module_id === m.id)
        .sort((a, b) => a.position - b.position)
        .map((l) => ({ ...l, moduleTitle: m.title })),
    );
  }, [data]);

  const initialId = search.l ?? allLessons[0]?.id;
  const [currentId, setCurrentId] = useState<string | undefined>(initialId);
  useEffect(() => { if (!currentId && initialId) setCurrentId(initialId); }, [currentId, initialId]);
  useEffect(() => { if (search.l) setCurrentId(search.l); }, [search.l]);

  const current = allLessons.find((l) => l.id === currentId) ?? allLessons[0];
  const currentIndex = allLessons.findIndex((l) => l.id === current?.id);

  // Guardar progreso cuando el usuario abre una lección
  useEffect(() => {
    if (!current?.id || !user?.id) return;
    saveLessonProgress(user.id, current.id, { positionSeconds: 0 });
  }, [current?.id, user?.id]);

  // DynTube no necesita token del backend — el "domain lock" lo valida el
  // propio player de DynTube en su servidor. El control de acceso se hace
  // ANTES de renderizar el video (canPlay abajo).

  if (loading || isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-300">Cargando…</div>;
  }
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (!data) throw notFound();

  const hasAccess = hasAccessTo(data.course.id, data.course.included_in_membership);
  const canPlay = !!current && (hasAccess || current.is_free_preview);

  const go = (idx: number) => {
    const l = allLessons[idx]; if (!l) return;
    setCurrentId(l.id);
    navigate({ to: "/ver/$slug", params: { slug }, search: { l: l.id } });
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100">
      {/* Topbar */}
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-900 px-4">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="sm" asChild className="text-zinc-300 hover:bg-zinc-800 hover:text-zinc-50">
            <Link to="/curso/$slug" params={{ slug }}><ArrowLeft className="h-4 w-4" /> Salir</Link>
          </Button>
          <div className="hidden h-5 w-px bg-zinc-800 sm:block" />
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">{data.course.category}</p>
            <p className="truncate text-sm font-medium">{data.course.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {hasTheories && (
            <Button variant="ghost" size="sm" asChild className="text-zinc-300 hover:bg-zinc-800 hover:text-zinc-50">
              <Link to="/curso/$slug/teoria" params={{ slug }}>
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Teoría</span>
              </Link>
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen((v) => !v)} className="text-zinc-300 hover:bg-zinc-800 hover:text-zinc-50">
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            <span className="hidden sm:inline">{sidebarOpen ? "Ocultar" : "Lecciones"}</span>
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Player area */}
        <main className="flex flex-1 flex-col overflow-y-auto">
          <div className={"mx-auto w-full px-4 py-6 sm:px-6 " + (sidebarOpen ? "max-w-6xl" : "max-w-5xl")}>
            {/* Sticky para que el video quede visible al scrollear.
                El sizing del player (aspect-ratio 16:9 + max-height) lo
                maneja el componente ProtectedVideo. */}
            <div className="sticky top-0 z-10 mx-auto w-full overflow-hidden rounded-xl shadow-2xl">
              {canPlay && current ? (
                current.video_path ? (
                  <ProtectedVideo
                    key={current.id}
                    videoKey={current.video_path}
                    title={current.title}
                  />
                ) : (
                  <div className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-black p-12 text-center" style={{ aspectRatio: "16 / 9", maxHeight: "min(70vh, 720px)" }}>
                    <Sparkles className="h-8 w-8 text-primary" />
                    <p className="font-serif text-base">Video todavía no disponible</p>
                    <p className="text-xs text-zinc-400">La profe está cargando esta clase. Volvé pronto.</p>
                  </div>
                )
              ) : (
                <div className="flex w-full flex-col items-center justify-center gap-3 rounded-xl border border-zinc-800 bg-black p-6 text-center" style={{ aspectRatio: "16 / 9", maxHeight: "min(70vh, 720px)" }}>
                  <Lock className="h-10 w-10 text-primary" />
                  <p className="font-serif text-xl">Esta clase es exclusiva</p>
                  <p className="max-w-md text-sm text-zinc-400">Activá tu membresía o comprá el curso para acceder a todas las clases.</p>
                  <div className="flex flex-wrap justify-center gap-2 pt-2">
                    <Button variant="hero" asChild><Link to="/planes">Ver planes</Link></Button>
                    <Button variant="outline" asChild className="border-zinc-700 bg-transparent text-zinc-100 hover:bg-zinc-800 hover:text-zinc-50">
                      <Link to="/curso/$slug" params={{ slug }}>Volver al curso</Link>
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Info debajo del video */}
            {current && (
              <div className="mt-5">
                <p className="text-[11px] uppercase tracking-wider text-primary">{current.moduleTitle}</p>
                <h1 className="mt-1 font-serif text-2xl sm:text-3xl">{current.title}</h1>
              </div>
            )}

            {/* Prev / Next */}
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800 pt-6">
              <Button
                variant="ghost"
                onClick={() => go(currentIndex - 1)}
                disabled={currentIndex <= 0}
                className="text-zinc-300 hover:bg-zinc-800 hover:text-zinc-50 disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" /> Anterior
              </Button>
              <p className="text-xs text-zinc-500">
                Clase {currentIndex + 1} de {allLessons.length}
              </p>
              {currentIndex >= allLessons.length - 1 ? (
                <Button variant="gold" asChild>
                  <Link to="/curso/$slug" params={{ slug }}>
                    Ver curso completo <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <Button variant="gold" onClick={() => go(currentIndex + 1)}>
                  Siguiente <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </main>

        {/* Sidebar de lecciones */}
        {sidebarOpen && (
          <aside className="hidden w-80 shrink-0 overflow-y-auto border-l border-zinc-800 bg-zinc-900 lg:block">
            <div className="sticky top-0 border-b border-zinc-800 bg-zinc-900/95 px-5 py-4 backdrop-blur">
              <p className="text-[11px] uppercase tracking-wider text-zinc-500">Contenido del curso</p>
              <p className="mt-1 text-sm font-medium">{data.modules.length} módulos · {data.lessons.length} clases</p>
            </div>
            <div className="space-y-4 p-3">
              {data.modules.map((mod, mi) => (
                <div key={mod.id}>
                  <p className="px-2 text-[11px] font-medium uppercase tracking-wider text-primary">
                    Módulo {mi + 1} · {mod.title}
                  </p>
                  <ul className="mt-2 space-y-0.5">
                    {data.lessons
                      .filter((l) => l.module_id === mod.id)
                      .sort((a, b) => a.position - b.position)
                      .map((l) => {
                        const locked = !hasAccess && !l.is_free_preview;
                        const active = l.id === currentId;
                        return (
                          <li key={l.id}>
                            <button
                              onClick={() => {
                                setCurrentId(l.id);
                                navigate({ to: "/ver/$slug", params: { slug }, search: { l: l.id } });
                              }}
                              className={
                                "flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors " +
                                (active ? "bg-zinc-800 text-zinc-50" : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100")
                              }
                            >
                              <span className="flex min-w-0 items-center gap-2">
                                {locked ? (
                                  <Lock className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                                ) : active ? (
                                  <PlayCircle className="h-3.5 w-3.5 shrink-0 text-primary" />
                                ) : (
                                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
                                )}
                                <span className="truncate">{l.title}</span>
                              </span>
                              {l.is_free_preview && !hasAccess && (
                                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] text-primary">Gratis</span>
                              )}
                            </button>
                          </li>
                        );
                      })}
                  </ul>
                </div>
              ))}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
