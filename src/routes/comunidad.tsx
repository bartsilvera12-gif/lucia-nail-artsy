import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, Star, Calendar, BookOpen, MessageCircle, Heart, Pin, Crown, ArrowRight, CheckCircle2, Bell } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { GoldBadge } from "@/components/Badge";
import { Button } from "@/components/ui/button";
import { courses } from "@/data/courses";
import aboutImg from "@/assets/about-studio.jpg";
import { AnimateIn } from "@/components/AnimateIn";

export const Route = createFileRoute("/comunidad")({
  head: () => ({
    meta: [
      { title: "Espacio de Alumnos — Lucía Rojas Studio" },
      { name: "description", content: "Un espacio exclusivo para alumnas con membresía: novedades del instructor, preguntas sobre clases y compartí tus avances." },
    ],
  }),
  component: EspacioAlumnasPage,
});

function EspacioAlumnasPage() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative isolate overflow-hidden border-b border-border bg-gradient-cream py-12">
        <div aria-hidden className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-gradient-gold opacity-25 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -right-32 -bottom-32 h-96 w-96 rounded-full bg-gradient-gold opacity-20 blur-3xl" />
        <AnimateIn direction="up" className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-elegant">
            <div className="relative aspect-[16/6] w-full bg-gradient-gold">
              <img src={aboutImg} alt="Espacio de Alumnos" className="absolute inset-0 h-full w-full object-cover opacity-60 mix-blend-overlay" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between gap-4 text-white">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-white/80">Acceso exclusivo · Alumnas activas</p>
                  <h1 className="font-serif text-2xl sm:text-3xl">Espacio de Alumnos</h1>
                </div>
                <Stat label="Alumnas" value="2.4k" />
              </div>
            </div>

            <div className="grid gap-6 p-6 sm:grid-cols-[1fr_300px] sm:p-8">
              <div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> 2,431 alumnas</span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-primary text-primary" /> 4.9 / 5</span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> 6 cursos</span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Sesiones semanales</span>
                </div>

                <h2 className="mt-5 font-serif text-2xl sm:text-3xl">Tu espacio de aprendizaje acompañado</h2>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  Un área privada para alumnas con membresía activa. Aquí encontrás novedades del instructor,
                  podés hacer preguntas sobre tus clases, compartir tus avances y recibir orientación real durante todo tu aprendizaje.
                </p>

                <div className="mt-6 grid gap-2 sm:grid-cols-2">
                  {[
                    "Novedades y avisos del instructor",
                    "Hacé preguntas sobre tus clases",
                    "Compartí tus avances y trabajos",
                    "Materiales y recursos exclusivos",
                    "Sesiones en vivo periódicas",
                    "Acompañamiento durante todo el proceso",
                  ].map((f) => (
                    <p key={f} className="inline-flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" /> {f}
                    </p>
                  ))}
                </div>
              </div>

              <aside className="rounded-xl border border-border bg-secondary/40 p-5">
                <p className="font-serif text-lg">Membresía activa</p>
                <p className="mt-1 text-xs text-muted-foreground">Acceso completo al espacio de alumnos, cursos y materiales.</p>
                <div className="mt-4 flex items-end gap-1">
                  <span className="font-serif text-3xl">USD 29</span>
                  <span className="pb-1 text-xs text-muted-foreground">/ mes</span>
                </div>
                <Button variant="gold" className="mt-5 w-full" asChild>
                  <Link to="/registro?plan=monthly"><Crown className="h-4 w-4" /> Activar membresía</Link>
                </Button>
                <Button variant="ghost" className="mt-2 w-full" asChild>
                  <Link to="/planes">Ver todos los planes</Link>
                </Button>
                <p className="mt-3 text-center text-[10px] text-muted-foreground">Cancelás cuando quieras</p>
              </aside>
            </div>
          </div>
        </AnimateIn>
      </section>

      {/* Actividad del espacio */}
      <section className="py-16">
        <div className="mx-auto grid max-w-5xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_320px] lg:px-8">
          <AnimateIn direction="up">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="font-serif text-xl">Actividad del espacio</h2>
              <span className="text-xs text-muted-foreground">Publicaciones recientes</span>
            </div>
            <div className="mt-5 space-y-4">
              <Publicacion
                pinned
                tipo="Aviso del instructor"
                titulo="Nuevo módulo disponible: Preparación profesional"
                autor="Lucía Rojas"
                texto="Ya está disponible el módulo completo de preparación con torno y fresas para las alumnas con membresía activa. Pueden empezar desde el panel."
                reacciones={48}
                respuestas={12}
              />
              <Publicacion
                tipo="Avance de alumna"
                titulo="Mi primer baby boomer completo"
                autor="Camila F."
                texto="Después de practicar durante una semana, comparto mi primer trabajo terminado. Cualquier sugerencia es bienvenida, especialmente en la parte del borde libre."
                reacciones={34}
                respuestas={9}
              />
              <Publicacion
                tipo="Consulta sobre clases"
                titulo="¿Cómo evitar el levantamiento en el borde libre?"
                autor="Macarena R."
                texto="Me pasa con dos clientas en particular. Ya revisé el módulo de preparación pero sigo teniendo el mismo resultado. ¿Alguien tiene algún tip?"
                reacciones={18}
                respuestas={6}
              />
            </div>
          </AnimateIn>

          <AnimateIn direction="left" delay={100} className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
              <p className="font-serif text-base">Tu instructora</p>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-gold font-serif text-foreground">LR</div>
                <div>
                  <p className="text-sm font-medium">Lucía Rojas</p>
                  <p className="text-xs text-muted-foreground">Fundadora · Nail master</p>
                </div>
              </div>
              <p className="mt-4 text-xs leading-relaxed text-muted-foreground">+10 años formando alumnas. Especialista en técnica rusa y nail art premium. Responde consultas de lunes a viernes.</p>
            </div>

            <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
              <p className="font-serif text-base">Cursos del programa</p>
              <ul className="mt-4 space-y-3">
                {courses.slice(0, 4).map((c) => (
                  <li key={c.slug} className="flex items-center gap-3">
                    <img src={c.image} alt="" className="h-10 w-14 rounded object-cover" />
                    <div className="min-w-0 flex-1">
                      <Link to="/curso/$slug" params={{ slug: c.slug }} className="block truncate text-sm hover:text-primary">{c.title}</Link>
                      <p className="text-[10px] text-muted-foreground">{c.modules} módulos · {c.duration}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <Button variant="ghost" size="sm" className="mt-3 w-full" asChild>
                <Link to="/cursos">Ver todos los cursos <ArrowRight className="h-3.5 w-3.5" /></Link>
              </Button>
            </div>

            <div className="rounded-xl border border-primary/40 bg-card p-5 shadow-elegant">
              <Bell className="h-5 w-5 text-primary" />
              <p className="mt-3 font-serif text-base">Próxima sesión en vivo</p>
              <p className="mt-1 text-xs text-muted-foreground">Exclusivo para alumnas con membresía activa</p>
              <p className="mt-3 text-sm">Consultas en vivo: cómo cobrar tu trabajo y subir precios sin perder clientas.</p>
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-secondary/40 py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <GoldBadge><Crown className="h-3 w-3" /> Acceso exclusivo</GoldBadge>
          <h2 className="mt-5 font-serif text-3xl sm:text-4xl">Sumate al espacio de alumnos</h2>
          <p className="mt-4 text-base text-muted-foreground">Acceso inmediato a cursos, materiales y acompañamiento real de la instructora.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button variant="hero" size="xl" asChild>
              <Link to="/registro?plan=monthly">Activar membresía <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button variant="outlineGold" size="xl" asChild>
              <Link to="/planes">Ver planes</Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-black/40 px-3 py-2 text-right backdrop-blur">
      <p className="font-serif text-xl leading-none">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-white/70">{label}</p>
    </div>
  );
}

function Publicacion({
  pinned, tipo, titulo, autor, texto, reacciones, respuestas,
}: {
  pinned?: boolean; tipo: string; titulo: string; autor: string; texto: string; reacciones: number; respuestas: number;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        {pinned && <Pin className="h-3 w-3 text-primary" />}
        <span className="uppercase tracking-wider text-primary">{tipo}</span>
        <span>•</span>
        <span>{autor}</span>
      </div>
      <p className="mt-2 font-serif text-base">{titulo}</p>
      <p className="mt-2 text-sm text-muted-foreground">{texto}</p>
      <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1"><Heart className="h-3.5 w-3.5" /> {reacciones}</span>
        <span className="inline-flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" /> {respuestas} respuestas</span>
      </div>
    </div>
  );
}
