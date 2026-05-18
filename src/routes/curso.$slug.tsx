import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Clock, BookOpen, Crown, Lock, PlayCircle, Check, ArrowRight, Sparkles, ShieldCheck, ShoppingCart } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { GoldBadge } from "@/components/Badge";
import { Button } from "@/components/ui/button";
import { ProtectedVideo } from "@/components/ProtectedVideo";
import { Paywall } from "@/components/Paywall";
import { getCourseBySlug } from "@/data/courses";
import { useAuth } from "@/lib/auth";

const SAMPLE_VIDEO = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";

export const Route = createFileRoute("/curso/$slug")({
  validateSearch: (s: Record<string, unknown>) => ({ buy: s.buy === "1" || s.buy === 1 ? true : undefined }),
  loader: ({ params }) => {
    const course = getCourseBySlug(params.slug);
    if (!course) throw notFound();
    return { course };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.course.title ?? "Curso"} — Lucía Rojas Studio` },
      { name: "description", content: loaderData?.course.shortDescription },
    ],
  }),
  component: CursoDetailPage,
});

function CursoDetailPage() {
  const { course } = Route.useLoaderData();
  const search = Route.useSearch();
  const { user, isAuthenticated, hasAccessTo, purchaseCourse } = useAuth();
  const hasAccess = hasAccessTo(course.slug, course.includedInMembership);

  // Si vuelve del registro con ?buy=1, cerramos la compra individual automáticamente.
  useEffect(() => {
    if (search.buy && isAuthenticated && !user?.individualCourses.includes(course.slug)) {
      purchaseCourse(course.slug);
    }
  }, [search.buy, isAuthenticated, user, course.slug, purchaseCourse]);

  const allLessons = useMemo(
    () => course.curriculum.flatMap((m, mi) => m.lessons.map((l, li) => ({ id: `${mi}-${li}`, module: m.title, title: l, free: mi === 0 && li === 0 }))),
    [course],
  );
  const [currentId, setCurrentId] = useState(allLessons[0]?.id);
  const current = allLessons.find((l) => l.id === currentId) ?? allLessons[0];
  const canPlay = hasAccess || current?.free;

  return (
    <PublicLayout>
      <section className="border-b border-border bg-gradient-cream py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="text-xs text-muted-foreground">
            <Link to="/cursos" className="hover:text-foreground">Cursos</Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">{course.title}</span>
          </nav>
          <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_320px]">
            <div>
              <GoldBadge>{course.category} · {course.level}</GoldBadge>
              <h1 className="mt-4 font-serif text-3xl text-balance sm:text-4xl">{course.title}</h1>
              <p className="mt-4 max-w-2xl text-sm text-muted-foreground sm:text-base">{course.description}</p>
              <div className="mt-5 flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><BookOpen className="h-4 w-4 text-primary" /> {course.modules} módulos · {course.lessons} clases</span>
                <span className="inline-flex items-center gap-1"><Clock className="h-4 w-4 text-primary" /> {course.duration}</span>
                {course.includedInMembership && (
                  <span className="inline-flex items-center gap-1 text-primary"><Crown className="h-4 w-4" /> Incluido en la membresía</span>
                )}
              </div>
            </div>

            <aside className="rounded-xl border border-border bg-card p-6 shadow-elegant">
              <div className="flex items-end gap-1">
                <span className="font-serif text-3xl">USD {course.price}</span>
                <span className="pb-1 text-xs text-muted-foreground">pago único</span>
              </div>
              {hasAccess ? (
                <div className="mt-5 flex items-center gap-2 rounded-lg bg-secondary/60 px-3 py-2 text-xs">
                  <Check className="h-4 w-4 text-primary" /> Ya tenés acceso
                </div>
              ) : (
                <div className="mt-5 space-y-2" id="comprar">
                  {course.includedInMembership && (
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
                      purchaseCourse(course.slug);
                    }}
                  >
                    <ShoppingCart className="h-4 w-4" /> Comprar individual
                  </Button>
                </div>
              )}
              <ul className="mt-6 space-y-2 text-xs text-muted-foreground">
                <li className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-primary" /> 7 días de garantía</li>
                <li className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary" /> Acceso inmediato</li>
                <li className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary" /> Certificado al completar</li>
              </ul>
            </aside>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
          <div>
            {canPlay ? (
              <ProtectedVideo
                src={SAMPLE_VIDEO}
                userEmail={user?.email ?? "preview@invitado"}
                title={current?.title}
              />
            ) : (
              <Paywall
                courseSlug={course.slug}
                courseTitle={course.title}
                price={course.price}
                includedInMembership={course.includedInMembership}
                authenticated={isAuthenticated}
              />
            )}

            <div className="mt-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-primary">{current?.module}</p>
                <h2 className="mt-1 font-serif text-xl">{current?.title}</h2>
              </div>
              {current?.free && !hasAccess && (
                <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-[11px]"><Sparkles className="h-3 w-3 text-primary" /> Clase de muestra</span>
              )}
            </div>

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

          <aside className="rounded-xl border border-border bg-card p-5 shadow-soft lg:sticky lg:top-24 lg:self-start">
            <p className="font-serif text-base">Contenido del curso</p>
            <p className="mt-1 text-xs text-muted-foreground">{course.modules} módulos · {course.lessons} clases</p>
            <div className="mt-4 max-h-[600px] space-y-4 overflow-y-auto pr-1">
              {course.curriculum.map((mod, mi) => (
                <div key={mod.title}>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-primary">Módulo {mi + 1} · {mod.title}</p>
                  <ul className="mt-2 space-y-1">
                    {mod.lessons.map((l, li) => {
                      const id = `${mi}-${li}`;
                      const free = mi === 0 && li === 0;
                      const locked = !canPlay && !free && !hasAccess;
                      const active = id === currentId;
                      return (
                        <li key={id}>
                          <button
                            onClick={() => setCurrentId(id)}
                            className={"flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors " + (active ? "bg-primary/15 text-foreground" : "hover:bg-secondary/60")}
                          >
                            <span className="flex items-center gap-2 truncate">
                              {locked ? (
                                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                              ) : (
                                <PlayCircle className="h-3.5 w-3.5 text-primary" />
                              )}
                              <span className="truncate">{l}</span>
                            </span>
                            {free && !hasAccess && (
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
