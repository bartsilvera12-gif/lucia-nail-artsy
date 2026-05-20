import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, Star, Calendar, BookOpen, MessageCircle, Heart, Pin, Sparkles, Crown, ArrowRight, CheckCircle2 } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { GoldBadge } from "@/components/Badge";
import { Button } from "@/components/ui/button";
import { courses } from "@/data/courses";
import aboutImg from "@/assets/about-studio.jpg";

export const Route = createFileRoute("/comunidad")({
  head: () => ({
    meta: [
      { title: "Comunidad Lucía Rojas Studio — Academia privada de uñas" },
      { name: "description", content: "Una comunidad privada con cursos exclusivos, sesiones en vivo y soporte para alumnas." },
    ],
  }),
  component: ComunidadPage,
});

function ComunidadPage() {
  return (
    <PublicLayout>
      <section className="relative isolate overflow-hidden border-b border-border bg-gradient-cream py-12">
        <div aria-hidden className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-gradient-gold opacity-25 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -right-32 -bottom-32 h-96 w-96 rounded-full bg-gradient-gold opacity-20 blur-3xl" />
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-elegant">
            <div className="relative aspect-[16/6] w-full bg-gradient-gold">
              <img src={aboutImg} alt="Comunidad" className="absolute inset-0 h-full w-full object-cover opacity-60 mix-blend-overlay" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between gap-4 text-white">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-white/80">Comunidad privada</p>
                  <h1 className="font-serif text-2xl sm:text-3xl">Lucía Rojas Studio</h1>
                </div>
                <Stat label="Miembros" value="2.4k" />
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

                <h2 className="mt-5 font-serif text-2xl sm:text-3xl">Aprendé uñas profesionales con una comunidad que te acompaña</h2>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  Una comunidad privada para futuras profesionales del mundo de las uñas. Cursos en video, recursos descargables,
                  sesiones en vivo con Lucía y un espacio para compartir tus trabajos y resolver dudas con otras alumnas.
                </p>

                <div className="mt-6 grid gap-2 sm:grid-cols-2">
                  {[
                    "6 cursos exclusivos paso a paso",
                    "Comunidad privada activa",
                    "Sesiones en vivo con Lucía",
                    "Bonos descargables y plantillas",
                    "Certificados al completar",
                    "Soporte real y novedades internas",
                  ].map((f) => (
                    <p key={f} className="inline-flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" /> {f}
                    </p>
                  ))}
                </div>
              </div>

              <aside className="rounded-xl border border-border bg-secondary/40 p-5">
                <p className="font-serif text-lg">Membresía privada</p>
                <p className="mt-1 text-xs text-muted-foreground">Acceso completo a cursos, comunidad y bonos.</p>
                <div className="mt-4 flex items-end gap-1">
                  <span className="font-serif text-3xl">USD 29</span>
                  <span className="pb-1 text-xs text-muted-foreground">/ mes</span>
                </div>
                <Button variant="gold" className="mt-5 w-full" asChild>
                  <Link to="/registro?plan=monthly"><Crown className="h-4 w-4" /> Unirme ahora</Link>
                </Button>
                <Button variant="ghost" className="mt-2 w-full" asChild>
                  <Link to="/planes">Ver todos los planes</Link>
                </Button>
                <p className="mt-3 text-center text-[10px] text-muted-foreground">7 días de garantía · Cancelás cuando quieras</p>
              </aside>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto grid max-w-5xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_320px] lg:px-8">
          <div>
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="font-serif text-xl">Adentro de la comunidad</h2>
              <span className="text-xs text-muted-foreground">3 publicaciones recientes</span>
            </div>
            <div className="mt-5 space-y-4">
              <Post pinned category="Anuncios" title="Nuevo curso disponible: Manicura Rusa" author="Lucía Rojas" snippet="Ya está online el módulo completo de manicura rusa con torno y fresas. Las alumnas con membresía ya pueden empezar." likes={132} comments={24} />
              <Post category="Trabajos de alumnas" title="Mi primer baby boomer" author="Camila F." snippet="Después de practicar durante una semana, comparto mi primer trabajo terminado. ¡Acepto feedback!" likes={86} comments={18} />
              <Post category="Dudas" title="¿Cómo evitar levantamientos en el borde libre?" author="Macarena R." snippet="Me pasa con dos clientas en particular, alguien tiene tip que le haya funcionado?" likes={42} comments={9} />
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
              <p className="font-serif text-base">Tu host</p>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-gold font-serif text-foreground">LR</div>
                <div>
                  <p className="text-sm font-medium">Lucía Rojas</p>
                  <p className="text-xs text-muted-foreground">Fundadora · Nail master</p>
                </div>
              </div>
              <p className="mt-4 text-xs leading-relaxed text-muted-foreground">+10 años formando alumnas. Especialista en técnica rusa y nail art premium.</p>
            </div>

            <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
              <p className="font-serif text-base">Cursos en la comunidad</p>
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
                <Link to="/cursos">Ver todos <ArrowRight className="h-3.5 w-3.5" /></Link>
              </Button>
            </div>

            <div className="rounded-xl border border-primary/40 bg-card p-5 shadow-elegant">
              <Sparkles className="h-5 w-5 text-primary" />
              <p className="mt-3 font-serif text-base">Próxima sesión en vivo</p>
              <p className="mt-1 text-xs text-muted-foreground">Jueves 22 · 19:00 hs · Solo membresía</p>
              <p className="mt-3 text-sm">Q&amp;A en vivo: cómo cobrar tu trabajo y subir precios sin perder clientas.</p>
            </div>
          </aside>
        </div>
      </section>

      <section className="bg-secondary/40 py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <GoldBadge><Sparkles className="h-3 w-3" /> Empezá hoy</GoldBadge>
          <h2 className="mt-5 font-serif text-3xl sm:text-4xl">Sumate a la comunidad privada</h2>
          <p className="mt-4 text-base text-muted-foreground">Acceso inmediato a cursos, bonos y sesiones en vivo.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button variant="hero" size="xl" asChild>
              <Link to="/registro?plan=monthly">Unirme ahora <ArrowRight className="h-4 w-4" /></Link>
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

function Post({ pinned, category, title, author, snippet, likes, comments }: { pinned?: boolean; category: string; title: string; author: string; snippet: string; likes: number; comments: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        {pinned && <Pin className="h-3 w-3 text-primary" />}
        <span className="uppercase tracking-wider text-primary">{category}</span>
        <span>•</span>
        <span>{author}</span>
      </div>
      <p className="mt-2 font-serif text-base">{title}</p>
      <p className="mt-2 text-sm text-muted-foreground">{snippet}</p>
      <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1"><Heart className="h-3.5 w-3.5" /> {likes}</span>
        <span className="inline-flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" /> {comments}</span>
      </div>
    </div>
  );
}
