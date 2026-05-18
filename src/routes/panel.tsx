import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { Crown, BookOpen, Award, Settings, LogOut, ArrowRight, PlayCircle } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { GoldBadge } from "@/components/Badge";
import { useAuth } from "@/lib/auth";
import { courses } from "@/data/courses";

export const Route = createFileRoute("/panel")({
  head: () => ({ meta: [{ title: "Mi panel — Lucía Rojas Studio" }] }),
  component: PanelPage,
});

function PanelPage() {
  const { user, isAuthenticated, hasMembership, hasAccessTo, logout } = useAuth();

  if (!isAuthenticated || !user) return <Navigate to="/login" />;

  const myCourses = courses.filter((c) => hasAccessTo(c.slug, c.includedInMembership));
  const lockedCourses = courses.filter((c) => !hasAccessTo(c.slug, c.includedInMembership));

  return (
    <PublicLayout>
      <section className="border-b border-border bg-gradient-cream py-12">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-gold font-serif text-foreground">
              {user.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Hola</p>
              <h1 className="font-serif text-2xl">{user.name}</h1>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasMembership ? (
              <GoldBadge><Crown className="h-3 w-3" /> Membresía {user.plan === "yearly" ? "anual" : "mensual"} activa</GoldBadge>
            ) : (
              <Button variant="gold" size="sm" asChild>
                <Link to="/planes"><Crown className="h-4 w-4" /> Activar membresía</Link>
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4" /> Salir
            </Button>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_280px] lg:px-8">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl">Mis cursos</h2>
              <Link to="/cursos" className="text-xs text-primary hover:underline">Explorar más</Link>
            </div>

            {myCourses.length === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed border-border bg-card p-10 text-center">
                <BookOpen className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-4 font-serif text-lg">Todavía no tenés cursos activos</p>
                <p className="mt-2 text-sm text-muted-foreground">Sumate a la membresía o comprá un curso individual para empezar.</p>
                <div className="mt-5 flex justify-center gap-2">
                  <Button variant="gold" asChild><Link to="/planes">Ver planes</Link></Button>
                  <Button variant="outlineGold" asChild><Link to="/cursos">Explorar cursos</Link></Button>
                </div>
              </div>
            ) : (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {myCourses.map((c) => (
                  <Link
                    key={c.slug}
                    to="/curso/$slug"
                    params={{ slug: c.slug }}
                    className="group overflow-hidden rounded-xl border border-border bg-card shadow-soft transition-all hover:shadow-elegant"
                  >
                    <div className="relative aspect-video overflow-hidden">
                      <img src={c.image} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                        <PlayCircle className="h-12 w-12 text-white" />
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="text-[10px] uppercase tracking-wider text-primary">{c.category}</p>
                      <p className="mt-1 font-serif text-base">{c.title}</p>
                      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                        <span>{c.lessons} clases · {c.duration}</span>
                        <span className="inline-flex items-center gap-1 text-primary">Continuar <ArrowRight className="h-3 w-3" /></span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {lockedCourses.length > 0 && (
              <div className="mt-12">
                <h3 className="font-serif text-lg">También podrías sumar</h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {lockedCourses.map((c) => (
                    <Link
                      key={c.slug}
                      to="/curso/$slug"
                      params={{ slug: c.slug }}
                      className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-soft transition-all hover:shadow-elegant"
                    >
                      <img src={c.image} alt="" className="h-14 w-20 rounded object-cover opacity-80" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{c.title}</p>
                        <p className="text-[11px] text-muted-foreground">{c.includedInMembership ? "Incluido con membresía" : `Solo individual · USD ${c.price}`}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-4">
            <SidebarCard icon={Award} title="Certificados" body="Completá un curso al 100% para obtener tu certificado digital." />
            <SidebarCard icon={Settings} title="Tu cuenta" body={`Plan: ${user.plan ?? "ninguno"}`}>
              <Button variant="ghost" size="sm" asChild className="mt-2 w-full">
                <Link to="/planes">Gestionar plan</Link>
              </Button>
            </SidebarCard>
            <SidebarCard icon={Crown} title="Comunidad privada" body="Compartí trabajos y resolvé dudas con otras alumnas.">
              <Button variant="outlineGold" size="sm" asChild className="mt-2 w-full">
                <Link to="/comunidad">Entrar a la comunidad</Link>
              </Button>
            </SidebarCard>
          </aside>
        </div>
      </section>
    </PublicLayout>
  );
}

function SidebarCard({ icon: Icon, title, body, children }: { icon: typeof Crown; title: string; body: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-gold">
        <Icon className="h-5 w-5 text-foreground" />
      </div>
      <p className="mt-4 font-serif text-base">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{body}</p>
      {children}
    </div>
  );
}
