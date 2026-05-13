import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Sparkles,
  GraduationCap,
  Users,
  Award,
  Smartphone,
  CheckCircle2,
  Crown,
  MessageCircle,
  Pin,
  Heart,
  ArrowRight,
  Play,
} from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { GoldBadge } from "@/components/Badge";
import { SectionHeader } from "@/components/SectionHeader";
import { CourseCard } from "@/components/CourseCard";
import { PlanCard } from "@/components/PlanCard";
import { TestimonialCard } from "@/components/TestimonialCard";
import { FAQAccordion } from "@/components/FAQAccordion";
import { featuredCourses } from "@/data/courses";
import { plans, testimonials, faqs } from "@/data/site";
import heroImg from "@/assets/hero-nails.jpg";
import aboutImg from "@/assets/about-studio.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lucía Rojas Studio — Academia online premium de uñas" },
      {
        name: "description",
        content:
          "Aprendé uñas profesionales con cursos exclusivos, comunidad privada y certificados. Academia administrada por HorizontesWebIA.",
      },
      { property: "og:title", content: "Lucía Rojas Studio — Academia online de uñas" },
      { property: "og:description", content: "Cursos premium, comunidad privada y certificados para futuras profesionales." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <PublicLayout>
      <Hero />
      <ValueProps />
      <SkoolStyle />
      <FeaturedCourses />
      <Benefits />
      <PlansSection />
      <Testimonials />
      <AboutSection />
      <FAQSection />
      <FinalCTA />
    </PublicLayout>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-cream">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-24">
        <div className="flex flex-col justify-center">
          <GoldBadge>
            <Sparkles className="h-3 w-3" /> Academia privada de uñas online
          </GoldBadge>
          <h1 className="mt-6 font-serif text-4xl leading-[1.05] text-balance sm:text-5xl lg:text-6xl">
            Aprendé uñas profesionales y construí tu camino en la belleza
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Accedé a cursos exclusivos, comunidad privada, recursos descargables, certificados y acompañamiento real para elevar tu técnica y tu negocio.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button variant="hero" size="xl" asChild>
              <Link to="/cursos">
                Ver cursos <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outlineGold" size="xl" asChild>
              <Link to="/registro">Unirme a la academia</Link>
            </Button>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-6 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-primary" /> Acceso inmediato</span>
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-primary" /> Certificado digital</span>
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-primary" /> Desde cualquier dispositivo</span>
          </div>
        </div>

        <div className="relative">
          <div className="relative overflow-hidden rounded-2xl shadow-elegant">
            <img src={heroImg} alt="Manicura premium" className="h-full w-full object-cover" width={1280} height={1280} />
          </div>

          <div className="absolute -bottom-6 -left-6 hidden w-64 rounded-xl border border-border bg-card p-5 shadow-elegant sm:block">
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Crown, label: "Cursos premium" },
                { icon: Users, label: "Comunidad privada" },
                { icon: Award, label: "Certificado digital" },
                { icon: Smartphone, label: "Desde celular" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="text-xs">
                  <Icon className="h-4 w-4 text-primary" />
                  <p className="mt-1 leading-tight">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ValueProps() {
  const items = [
    { icon: GraduationCap, title: "Cursos paso a paso", desc: "Estructurados por módulos para que avances con seguridad desde tu primera clase." },
    { icon: Users, title: "Comunidad privada", desc: "Compartí trabajos, resolvé dudas y crecé junto a otras alumnas." },
    { icon: Award, title: "Certificado al completar", desc: "Recibí un certificado digital con código único de validación." },
    { icon: Smartphone, title: "Acceso flexible", desc: "Mirá las clases desde celular, tablet o computadora cuando quieras." },
  ];
  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader eyebrow="Propuesta de valor" title="Todo lo que necesitás para aprender, practicar y crecer" />
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-xl border border-border bg-card p-6 shadow-soft transition-all hover:shadow-elegant">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-gold">
                <Icon className="h-5 w-5 text-foreground" />
              </div>
              <h3 className="mt-5 font-serif text-lg">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SkoolStyle() {
  return (
    <section className="bg-secondary/40 py-20 sm:py-28">
      <div className="mx-auto grid max-w-7xl gap-14 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
        <div>
          <GoldBadge><Sparkles className="h-3 w-3" /> Una comunidad privada</GoldBadge>
          <h2 className="mt-6 font-serif text-3xl text-balance sm:text-4xl lg:text-5xl">
            Mucho más que cursos: una academia viva donde aprendés con otras
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground">
            Inspirada en las mejores comunidades educativas online. Accedé a cursos exclusivos, publicaciones internas, comentarios, bonos, novedades y acompañamiento real.
          </p>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {["Cursos exclusivos","Comunidad privada","Publicaciones internas","Bonos descargables","Certificados digitales","Actualizaciones constantes"].map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-primary" /> {f}
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <Button variant="gold" asChild>
              <Link to="/planes">Conocer la membresía</Link>
            </Button>
          </div>
        </div>

        <div className="relative">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-elegant">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="font-serif text-sm">Comunidad — Lucía Rojas Studio</span>
              </div>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px]">Privada</span>
            </div>
            <div className="mt-4 space-y-3">
              <CommunityPostMock pinned category="Anuncios" title="Nuevo curso disponible: Manicura Rusa" author="Lucía" comments={24} likes={132} />
              <CommunityPostMock category="Trabajos de alumnas" title="Mi primera práctica de baby boomer" author="Camila F." comments={18} likes={86} />
              <CommunityPostMock category="Dudas" title="¿Cómo evitar levantamientos en el borde libre?" author="Macarena R." comments={9} likes={42} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CommunityPostMock({ pinned, category, title, author, comments, likes }: { pinned?: boolean; category: string; title: string; author: string; comments: number; likes: number; }) {
  return (
    <div className="rounded-lg border border-border bg-background/60 p-4">
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        {pinned && <Pin className="h-3 w-3 text-primary" />}
        <span className="uppercase tracking-wider text-primary">{category}</span>
        <span>•</span>
        <span>{author}</span>
      </div>
      <p className="mt-1.5 font-serif text-sm">{title}</p>
      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1"><Heart className="h-3 w-3" /> {likes}</span>
        <span className="inline-flex items-center gap-1"><MessageCircle className="h-3 w-3" /> {comments}</span>
      </div>
    </div>
  );
}

function FeaturedCourses() {
  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <SectionHeader eyebrow="Cursos destacados" title="Empezá por donde más te interesa" description="Una selección de los cursos favoritos de la academia para que arranques hoy." align="left" />
          <Button variant="outlineGold" asChild>
            <Link to="/cursos">Ver todos los cursos <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {featuredCourses.map((course) => (<CourseCard key={course.slug} course={course} />))}
        </div>
      </div>
    </section>
  );
}

function Benefits() {
  const items = ["Acceso inmediato después del pago","Clases organizadas por módulos","Progreso guardado automáticamente","Continuá desde la última clase vista","Comunidad privada de alumnas","Certificado con código único","Bonos descargables","Soporte y novedades internas"];
  return (
    <section className="bg-gradient-cream py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader eyebrow="Beneficios" title="Una experiencia premium pensada para alumnas que quieren avanzar" />
        <div className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((b) => (
            <div key={b} className="flex items-start gap-3 rounded-lg border border-border bg-card p-5 shadow-soft">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <p className="text-sm leading-relaxed">{b}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PlansSection() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader eyebrow="Planes" title="Elegí cómo aprender" description="Membresía con todo incluido o compra individual del curso que necesites." />
        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <PlanCard key={plan.id} {...plan} to={plan.id === "individual" ? "/cursos" : "/registro"} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="bg-secondary/40 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader eyebrow="Alumnas" title="Resultados reales de la academia" />
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (<TestimonialCard key={t.name} {...t} />))}
        </div>
      </div>
    </section>
  );
}

function AboutSection() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto grid max-w-7xl gap-14 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
        <div className="relative overflow-hidden rounded-2xl shadow-elegant">
          <img src={aboutImg} alt="Estudio Lucía Rojas" loading="lazy" width={1024} height={1024} className="h-full w-full object-cover" />
        </div>
        <div>
          <GoldBadge>Sobre Lucía Rojas Studio</GoldBadge>
          <h2 className="mt-6 font-serif text-3xl text-balance sm:text-4xl">
            Una academia creada para formar profesionales con técnica y criterio
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground">
            Lucía Rojas Studio combina formación práctica, estética premium y acompañamiento para que cada alumna pueda aprender a su ritmo y avanzar con seguridad. Creemos que la educación de calidad transforma carreras.
          </p>
          <div className="mt-8">
            <Button variant="outlineGold" asChild>
              <Link to="/sobre">Conocer más</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  return (
    <section className="bg-gradient-cream py-20 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <SectionHeader eyebrow="Preguntas frecuentes" title="Resolvemos tus dudas" />
        <div className="mt-12"><FAQAccordion items={faqs} /></div>
        <div className="mt-8 text-center">
          <Button variant="ghost" asChild>
            <Link to="/faq">Ver todas las preguntas <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-5xl rounded-3xl border border-border bg-foreground px-6 py-16 text-center text-background shadow-elegant sm:px-12">
        <Sparkles className="mx-auto h-6 w-6 text-primary" />
        <h2 className="mt-4 font-serif text-3xl text-balance sm:text-4xl lg:text-5xl">
          Convertí tu pasión por las uñas en una habilidad rentable
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-base text-background/70">
          Sumate a la academia premium y empezá a aprender hoy mismo, con soporte real y comunidad activa.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button variant="hero" size="xl" asChild>
            <Link to="/registro">Unirme ahora <ArrowRight className="h-4 w-4" /></Link>
          </Button>
          <Button variant="outline" size="xl" asChild className="border-background/20 bg-transparent text-background hover:bg-background/10">
            <Link to="/cursos"><Play className="h-4 w-4" /> Ver cursos</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}