import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Clock, BookOpen, Crown, Lock, PlayCircle, Check, ArrowRight, Sparkles, ShoppingCart } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { GoldBadge } from "@/components/Badge";
import { Button } from "@/components/ui/button";
import { ProtectedVideo } from "@/components/ProtectedVideo";
import { Paywall } from "@/components/Paywall";
import { useCourseBySlug, resolveCourseImage, getVdoCipherOtp } from "@/hooks/useCourses";
import { useAuth } from "@/lib/auth";

interface CursoSearch { buy?: boolean }

export const Route = createFileRoute("/curso/$slug")({
  validateSearch: (s: Record<string, unknown>): CursoSearch => ({
    buy: s.buy === "1" || s.buy === 1 || s.buy === true ? true : undefined,
  }),
  head: ({ params }) => ({ meta: [{ title: `${params.slug} — Lucía Rojas Studio` }] }),
  component: CursoDetailPage,
});

function CursoDetailPage() {
  const { slug } = Route.useParams();
  const search = Route.useSearch();
  const { data, isLoading } = useCourseBySlug(slug);
  const { user, isAuthenticated, hasAccessTo, purchaseCourse } = useAuth();
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null);

  const allLessons = useMemo(() => {
    if (!data) return [];
    return data.modules.flatMap((m) =>
      data.lessons
        .filter((l) => l.module_id === m.id)
        .map((l) => ({ ...l, moduleTitle: m.title })),
    );
  }, [data]);

  useEffect(() => {
    if (!currentLessonId && allLessons[0]) setCurrentLessonId(allLessons[0].id);
  }, [allLessons, currentLessonId]);

  useEffect(() => {
    if (!data) return;
    const courseId = data.course.id;
    if (search.buy && isAuthenticated && user && !user.individualCourses.includes(courseId)) {
      purchaseCourse(courseId, Number(data.course.price));
    }
  }, [search.buy, isAuthenticated, user, data, purchaseCourse]);

  // Pedir OTP de VdoCipher para la lección actual
  const [vdo, setVdo] = useState<{ otp: string; playbackInfo: string } | null>(null);
  const [vdoError, setVdoError] = useState<string | null>(null);
  const currentForVideo = allLessons.find((l) => l.id === currentLessonId);
  const currentVideoPath = currentForVideo?.video_path ?? null;

  useEffect(() => {
    let cancelled = false;
    setVdo(null);
    setVdoError(null);
    if (!currentLessonId || !currentVideoPath) return;
    getVdoCipherOtp(currentLessonId).then((res) => {
      if (cancelled) return;
      if (res) setVdo(res);
      else setVdoError("No pudimos cargar este video. Verificá tu acceso o intentá de nuevo.");
    });
    return () => { cancelled = true; };
  }, [currentLessonId, currentVideoPath]);

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-sm text-muted-foreground">Cargando curso…</p>
        </div>
      </PublicLayout>
    );
  }
  if (!data) throw notFound();

  const { course, modules, lessons } = data;
  const hasAccess = hasAccessTo(course.id, course.included_in_membership);
  const current = allLessons.find((l) => l.id === currentLessonId) ?? allLessons[0];
  const canPlay = !!current && (hasAccess || current.is_free_preview);
  const heroImg = resolveCourseImage(course.image_path);

  return (
    <PublicLayout>
      <section className="relative isolate overflow-hidden border-b border-border bg-gradient-cream py-12 sm:py-16">
        {/* Decoración */}
        <div aria-hidden className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-gradient-gold opacity-25 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -right-32 top-1/4 h-96 w-96 rounded-full bg-gradient-gold opacity-20 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
        <div aria-hidden className="absolute inset-x-0 bottom-0 mx-auto h-px max-w-3xl gold-divider" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link to="/cursos" className="hover:text-foreground">Cursos</Link>
            <span>›</span>
            <span className="text-foreground">{course.title}</span>
          </nav>

          <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_360px]">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-gold px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-foreground shadow-gold">
                  <Sparkles className="h-3 w-3" /> {course.category}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-foreground/80">
                  Nivel {course.level}
                </span>
              </div>

              <h1 className="mt-5 font-serif text-4xl leading-[1.1] text-balance sm:text-5xl lg:text-6xl">
                {course.title}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground">{course.description}</p>

              <div className="mt-7 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1.5 text-xs shadow-soft backdrop-blur">
                  <BookOpen className="h-3.5 w-3.5 text-primary" /> {modules.length} módulos · {lessons.length} clases
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1.5 text-xs shadow-soft backdrop-blur">
                  <Clock className="h-3.5 w-3.5 text-primary" /> {course.duration}
                </span>
                {course.included_in_membership && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-gradient-gold px-3 py-1.5 text-xs text-foreground shadow-soft">
                    <Crown className="h-3.5 w-3.5" /> Incluido en la membresía
                  </span>
                )}
              </div>
            </div>

            <aside className="relative">
              <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-elegant transition-transform hover:-translate-y-0.5">
                {/* Halo dorado decorativo */}
                <div aria-hidden className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-gold opacity-30 blur-2xl" />

                {heroImg && (
                  <div className="relative aspect-video overflow-hidden">
                    <img src={heroImg} alt="" className="h-full w-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-card to-transparent" />
                  </div>
                )}

                <div className="relative p-4">
                  <div className="flex items-end gap-1">
                    <span className="font-serif text-2xl tracking-tight">USD {course.price}</span>
                    <span className="pb-0.5 text-xs text-muted-foreground">pago único</span>
                  </div>

                  {hasAccess ? (
                    <>
                      <div className="mt-3 flex items-center gap-2 rounded-lg bg-gradient-gold px-3 py-2.5 text-xs font-medium text-foreground shadow-gold">
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-foreground/15">
                          <Check className="h-2.5 w-2.5 text-foreground" strokeWidth={3} />
                        </span>
                        Ya tenés acceso
                      </div>
                      <ul className="mt-3 space-y-2 text-xs">
                        <li className="flex items-center gap-2 text-muted-foreground">
                          <Check className="h-3.5 w-3.5 text-primary" strokeWidth={3} /> Acceso inmediato
                        </li>
                        <li className="flex items-center gap-2 text-muted-foreground">
                          <Check className="h-3.5 w-3.5 text-primary" strokeWidth={3} /> Certificado al completar
                        </li>
                        <li className="flex items-center gap-2 text-muted-foreground">
                          <Check className="h-3.5 w-3.5 text-primary" strokeWidth={3} /> Soporte por WhatsApp
                        </li>
                      </ul>
                    </>
                  ) : (
                    <>
                      <div className="mt-3 space-y-2" id="comprar">
                        {course.included_in_membership && (
                          <Button variant="hero" className="w-full" asChild>
                            <Link to="/planes"><Crown className="h-4 w-4" /> Acceder con membresía</Link>
                          </Button>
                        )}
                        <Button
                          variant="outlineGold"
                          className="w-full"
                          onClick={() => {
                            if (!isAuthenticated) {
                              window.location.href = `/registro?next=${encodeURIComponent(`/curso/${course.slug}?buy=1`)}`;
                              return;
                            }
                            purchaseCourse(course.id, Number(course.price));
                          }}
                        >
                          <ShoppingCart className="h-4 w-4" /> Comprar individual
                        </Button>
                      </div>
                      <div aria-hidden className="my-4 h-px w-full bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                      <ul className="space-y-2 text-xs">
                        <li className="flex items-center gap-2 text-muted-foreground">
                          <Check className="h-3.5 w-3.5 text-primary" strokeWidth={3} /> Acceso inmediato
                        </li>
                        <li className="flex items-center gap-2 text-muted-foreground">
                          <Check className="h-3.5 w-3.5 text-primary" strokeWidth={3} /> Certificado al completar
                        </li>
                        <li className="flex items-center gap-2 text-muted-foreground">
                          <Check className="h-3.5 w-3.5 text-primary" strokeWidth={3} /> Soporte por WhatsApp
                        </li>
                      </ul>
                    </>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
          <div>
            <div>
            {canPlay && current ? (
              vdo ? (
                <ProtectedVideo
                  otp={vdo.otp}
                  playbackInfo={vdo.playbackInfo}
                  userEmail={user?.email ?? "preview@invitado"}
                  title={current.title}
                />
              ) : currentVideoPath ? (
                <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-border bg-black text-center text-sm text-white/70">
                  {vdoError ?? "Cargando video…"}
                </div>
              ) : (
                <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-secondary/40 text-center text-sm text-muted-foreground">
                  <p className="font-serif text-base text-foreground">Video todavía no disponible</p>
                  <p>La profe está cargando esta clase. Volvé pronto.</p>
                </div>
              )
            ) : (
              <Paywall
                courseSlug={course.slug}
                courseTitle={course.title}
                price={Number(course.price)}
                includedInMembership={course.included_in_membership}
                authenticated={isAuthenticated}
              />
            )}
            </div>

            {current && (
              <div className="mt-4 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-primary">{current.moduleTitle}</p>
                  <h2 className="mt-1 font-serif text-xl">{current.title}</h2>
                </div>
                {current.is_free_preview && !hasAccess && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-[11px]"><Sparkles className="h-3 w-3 text-primary" /> Clase de muestra</span>
                )}
              </div>
            )}

            <div className="mt-10 grid gap-8 md:grid-cols-2">
              <div>
                <h3 className="font-serif text-lg">¿Qué vas a aprender?</h3>
                <ul className="mt-4 space-y-2 text-sm">
                  {course.learnings.map((l) => (
                    <li key={l} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {l}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-serif text-lg">Para quién es</h3>
                <ul className="mt-4 space-y-2 text-sm">
                  {course.audience.map((l) => (
                    <li key={l} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {l}</li>
                  ))}
                </ul>
              </div>
            </div>

            {course.bonuses.length > 0 && (
              <div className="mt-10 rounded-xl border border-primary/30 bg-gradient-cream p-6">
                <p className="text-xs uppercase tracking-wider text-primary">Bonos incluidos</p>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {course.bonuses.map((b) => (
                    <li key={b} className="inline-flex items-center gap-2 text-sm"><Sparkles className="h-4 w-4 text-primary" /> {b}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <aside className="self-start rounded-xl border border-border bg-card p-5 shadow-soft">
            <p className="font-serif text-base">Contenido del curso</p>
            <p className="mt-1 text-xs text-muted-foreground">{modules.length} módulos · {lessons.length} clases</p>
            <div className="mt-4 space-y-4">
              {modules.map((mod, mi) => (
                <div key={mod.id}>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-primary">Módulo {mi + 1} · {mod.title}</p>
                  <ul className="mt-2 space-y-1">
                    {lessons.filter((l) => l.module_id === mod.id).map((l) => {
                      const locked = !hasAccess && !l.is_free_preview;
                      const active = l.id === currentLessonId;
                      return (
                        <li key={l.id}>
                          <button
                            onClick={() => setCurrentLessonId(l.id)}
                            className={"flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors " + (active ? "bg-primary/15 text-foreground" : "hover:bg-secondary/60")}
                          >
                            <span className="flex items-center gap-2 truncate">
                              {locked ? <Lock className="h-3.5 w-3.5 text-muted-foreground" /> : <PlayCircle className="h-3.5 w-3.5 text-primary" />}
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

            {!hasAccess && (
              <Button variant="gold" className="mt-5 w-full" asChild>
                <Link to="/planes">Desbloquear todo <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            )}
          </aside>
        </div>
      </section>
    </PublicLayout>
  );
}
