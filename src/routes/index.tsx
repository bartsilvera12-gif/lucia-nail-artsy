import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
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
  ArrowLeft,
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
import { useCourses } from "@/hooks/useCourses";
import { plans, testimonials, faqs } from "@/data/site";
import { AnimateIn } from "@/components/AnimateIn";
import aboutImg from "@/assets/about-studio.jpg";
import heroLogo from "@/assets/logo/lucia_rojas_studio_logo.webp";
import esmalteImg from "@/assets/esmalte.png";


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
      <FeaturedCourses />
      <ValueProps />
      <PlansSection />
      <Benefits />
      <SkoolStyle />
      <Testimonials />
      <FinalCTA />
    </PublicLayout>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-cream">
      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-8 sm:px-6 sm:py-10 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-12">
        <AnimateIn direction="up" duration={700} className="flex flex-col justify-center">
          <h1 className="font-serif text-3xl leading-[1.05] text-balance sm:text-4xl lg:text-5xl">
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
        </AnimateIn>

        <div className="relative flex items-center justify-center -translate-y-8">
          {/* halo dorado de fondo */}
          <div
            aria-hidden
            className="absolute inset-0 -z-0 mx-auto my-auto h-[78%] w-[78%] rounded-full bg-gradient-gold opacity-30 blur-3xl animate-glow"
          />
          {/* anillo decorativo girando */}
          <div
            aria-hidden
            className="absolute inset-6 -z-0 hidden rounded-full border border-primary/30 animate-spin-slow sm:block"
          />
          <img
            src={heroLogo}
            alt="Lucía Rojas Studio"
            className="relative z-10 mx-auto w-full max-w-xs animate-float drop-shadow-2xl lg:max-w-sm"
          />

          <div className="absolute -bottom-4 left-4 hidden w-44 rounded-xl border border-border bg-card/95 p-3 shadow-elegant backdrop-blur animate-fade-up sm:block lg:-bottom-6 lg:-left-6" style={{ animationDelay: "400ms" }}>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: Crown, label: "Cursos premium" },
                { icon: Users, label: "Comunidad privada" },
                { icon: Award, label: "Certificado digital" },
                { icon: Smartphone, label: "Desde celular" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="text-[10px]">
                  <Icon className="h-3 w-3 text-primary" />
                  <p className="mt-0.5 leading-tight">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Imagen decorativa esmalte — bottom right */}
      <img
        src={esmalteImg}
        alt=""
        aria-hidden
        className="pointer-events-none absolute -bottom-28 -right-20 hidden h-[30rem] w-auto object-contain object-bottom lg:block"
      />
    </section>
  );
}

function ValueProps() {
  const items = [
    { icon: GraduationCap, title: "Cursos paso a paso", desc: "Estructurados por módulos para que avances con seguridad desde tu primera clase.", accent: "01" },
    { icon: Users,         title: "Comunidad privada", desc: "Compartí trabajos, resolvé dudas y crecé junto a otras alumnas.",                      accent: "02" },
    { icon: Award,         title: "Certificado al completar", desc: "Recibí un certificado digital con código único de validación.",                accent: "03" },
    { icon: Smartphone,    title: "Acceso flexible", desc: "Mirá las clases desde celular, tablet o computadora cuando quieras.",                    accent: "04" },
  ];
  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
      {/* Halos decorativos */}
      <div aria-hidden className="pointer-events-none absolute -top-32 -left-20 h-72 w-72 rounded-full bg-gradient-gold opacity-20 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-32 -right-20 h-72 w-72 rounded-full bg-gradient-gold opacity-15 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-px max-w-4xl gold-divider" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AnimateIn direction="up">
          <SectionHeader eyebrow="Propuesta de valor" title="Todo lo que necesitás para aprender, practicar y crecer" />
        </AnimateIn>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map(({ icon: Icon, title, desc, accent }, i) => (
            <AnimateIn key={title} direction="up" delay={i * 100} className="h-full">
            <article
              key={title}
              style={{ animationDelay: `${i * 120}ms` }}
              className="group relative flex h-full flex-col animate-fade-up overflow-hidden rounded-2xl border border-border bg-card p-7 shadow-soft transition-all duration-500 hover:-translate-y-2 hover:border-primary/40 hover:shadow-elegant"
            >
              {/* Brillo dorado al hover */}
              <div aria-hidden className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-gold opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-40" />

              {/* Número decorativo grande al fondo */}
              <span aria-hidden className="absolute -right-1 -top-3 select-none font-serif text-7xl leading-none text-primary/10 transition-colors group-hover:text-primary/20">
                {accent}
              </span>

              {/* Icono con doble capa */}
              <div className="relative inline-flex">
                <span aria-hidden className="absolute inset-0 rounded-2xl bg-gradient-gold opacity-30 blur-md transition-all duration-500 group-hover:opacity-60 group-hover:blur-xl" />
                <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-gold shadow-gold transition-transform duration-500 group-hover:rotate-[-6deg] group-hover:scale-110">
                  <Icon className="h-6 w-6 text-foreground" strokeWidth={1.75} />
                </span>
              </div>

              <h3 className="mt-6 font-serif text-xl">{title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{desc}</p>

              {/* línea dorada inferior animada */}
              <span aria-hidden className="absolute inset-x-7 bottom-0 h-px origin-left scale-x-0 bg-gradient-to-r from-transparent via-primary to-transparent transition-transform duration-500 group-hover:scale-x-100" />
            </article>
            </AnimateIn>
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
        <AnimateIn direction="right">
        <div>
          <GoldBadge><Sparkles className="h-3 w-3" /> Espacio de Alumnas</GoldBadge>
          <h2 className="mt-6 font-serif text-3xl text-balance sm:text-4xl lg:text-5xl">
            Preguntá, aprendé y crecé con respuestas reales de la docente
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground">
            El Espacio de Alumnas es un canal directo entre vos y Lucía. Enviá tus consultas técnicas, seguí las preguntas de otras alumnas y accedé a respuestas oficiales en un solo lugar.
          </p>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {["Consultas técnicas","Respuestas de la docente","Preguntas destacadas","Filtros por curso","Historial completo","Solo para miembras"].map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-primary" /> {f}
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <Button variant="gold" asChild>
              <Link to="/planes">Acceder con membresía</Link>
            </Button>
          </div>
        </div>
        </AnimateIn>

        <AnimateIn direction="left" delay={100}>
        <div className="relative">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-elegant">
            {/* Header del panel */}
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-primary" />
                <span className="font-serif text-sm">Espacio de Alumnas</span>
              </div>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium">Solo miembras</span>
            </div>

            {/* Pregunta destacada respondida */}
            <div className="mt-4 space-y-3">
              <QuestionMock
                featured
                status="answered"
                title="¿Cuánto tiempo debo curar el gel para que no se levante?"
                author="Camila F."
                course="Kapping profesional"
                answer="Curá entre 60 y 90 segundos en lámpara LED de 48 W. El levantamiento suele ocurrir por capa muy gruesa o por no sellar los bordes libres antes del curado."
              />
              <QuestionMock
                status="answered"
                title="¿Qué lima uso para dar forma sin dañar el acrílico?"
                author="Macarena R."
                course="Acrílico avanzado"
                answer="Lima de 180/240 para la forma gruesa y 240/320 para refinado final. Siempre en una sola dirección."
              />
              <QuestionMock
                status="pending"
                title="¿Puedo mezclar distintas marcas de base y top coat?"
                author="Valentina S."
              />
            </div>
          </div>
        </div>
        </AnimateIn>
      </div>
    </section>
  );
}

function QuestionMock({
  featured,
  status,
  title,
  author,
  course,
  answer,
}: {
  featured?: boolean;
  status: "pending" | "answered";
  title: string;
  author: string;
  course?: string;
  answer?: string;
}) {
  return (
    <div className={`rounded-lg border bg-background/60 p-4 ${featured ? "border-primary/30" : "border-border"}`}>
      {/* fila superior */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
          {featured && <Pin className="h-3 w-3 text-primary" />}
          <span className="font-medium text-foreground/80">{author}</span>
          {course && <><span>·</span><span className="text-primary">{course}</span></>}
        </div>
        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${
          status === "answered"
            ? "border-green-200 bg-green-50 text-green-700"
            : "border-amber-200 bg-amber-50 text-amber-700"
        }`}>
          {status === "answered" ? "Respondida" : "Pendiente"}
        </span>
      </div>

      {/* título */}
      <p className="mt-2 font-serif text-sm leading-snug">{title}</p>

      {/* respuesta oficial */}
      {answer && (
        <div className="mt-3 rounded-md border border-primary/20 bg-primary/5 px-3 py-2">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-primary">Respuesta de la docente</p>
          <p className="text-[11px] leading-relaxed text-muted-foreground line-clamp-2">{answer}</p>
        </div>
      )}
    </div>
  );
}

function FeaturedCourses() {
  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AnimateIn direction="up">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
            <SectionHeader eyebrow="Cursos destacados" title="Empezá por donde más te interesa" description="Una selección de los cursos favoritos de la academia para que arranques hoy." align="left" />
            <Button variant="outlineGold" asChild>
              <Link to="/cursos">Ver todos los cursos <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
        </AnimateIn>
        <FeaturedCoursesCarousel />
      </div>
    </section>
  );
}

function FeaturedCoursesCarousel() {
  const { data: courses = [] } = useCourses();
  const featured = courses.slice(0, 6);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);

  const scrollByCard = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-card]");
    const step = card ? card.offsetWidth + 24 : 320;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  // Auto-scroll continuo a ~50px/s; al alcanzar la mitad (segunda copia), resetea sin saltos.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      if (!pausedRef.current && el) {
        el.scrollLeft += (dt / 1000) * 50;
        const half = el.scrollWidth / 2;
        if (el.scrollLeft >= half) el.scrollLeft -= half;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      className="group relative mt-12"
      onMouseEnter={() => { pausedRef.current = true; }}
      onMouseLeave={() => { pausedRef.current = false; }}
    >
      <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-background to-transparent" />
      <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-background to-transparent" />

      <button
        type="button"
        aria-label="Anterior"
        onClick={() => scrollByCard(-1)}
        className="absolute left-2 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card/95 shadow-elegant backdrop-blur transition-all hover:bg-gradient-gold hover:text-foreground sm:-left-4"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        aria-label="Siguiente"
        onClick={() => scrollByCard(1)}
        className="absolute right-2 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card/95 shadow-elegant backdrop-blur transition-all hover:bg-gradient-gold hover:text-foreground sm:-right-4"
      >
        <ArrowRight className="h-5 w-5" />
      </button>

      <div
        ref={scrollerRef}
        className="flex gap-6 overflow-x-auto px-2 pb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {[...featured, ...featured].map((course, i) => (
          <div
            key={`${course.slug}-${i}`}
            data-card
            className="h-auto w-[280px] shrink-0 transition-transform duration-300 hover:-translate-y-2 sm:w-[320px] lg:w-[360px]"
          >
            <CourseCard course={course} />
          </div>
        ))}
      </div>
    </div>
  );
}

function Benefits() {
  const items: { icon: typeof Crown; title: string; desc: string }[] = [
    { icon: Sparkles,       title: "Acceso inmediato",     desc: "Apenas confirmás tu pago empezás a ver tus clases." },
    { icon: GraduationCap,  title: "Por módulos",          desc: "Clases organizadas con un orden claro y progresivo." },
    { icon: CheckCircle2,   title: "Progreso guardado",    desc: "Tu avance queda registrado en cada clase automáticamente." },
    { icon: Play,           title: "Retomá donde dejaste", desc: "Volvé a la última clase vista en un solo clic." },
    { icon: Users,          title: "Comunidad privada",    desc: "Crecé acompañada por otras alumnas y por Lucía." },
    { icon: Award,          title: "Certificado único",    desc: "Recibí tu certificado digital con código de validación." },
    { icon: Heart,          title: "Bonos descargables",   desc: "Plantillas, checklists y guías para tu mesa de trabajo." },
    { icon: MessageCircle,  title: "Soporte real",         desc: "Novedades, anuncios y soporte directo todo el mes." },
  ];
  return (
    <section className="relative overflow-hidden bg-gradient-cream py-24 sm:py-28">
      <div aria-hidden className="pointer-events-none absolute -top-32 right-0 h-72 w-72 rounded-full bg-gradient-gold opacity-25 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-32 left-0 h-72 w-72 rounded-full bg-gradient-gold opacity-20 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AnimateIn direction="up">
          <SectionHeader eyebrow="Beneficios" title="Una experiencia premium pensada para alumnas que quieren avanzar" />
        </AnimateIn>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map(({ icon: Icon, title, desc }, i) => (
            <AnimateIn key={title} direction="up" delay={i * 80}>
            <div
              className="group relative flex flex-col rounded-2xl border border-border bg-card/80 p-6 shadow-soft backdrop-blur-sm transition-all duration-500 hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-elegant"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-gold shadow-gold transition-transform duration-500 group-hover:scale-110">
                <Icon className="h-5 w-5 text-foreground" strokeWidth={1.75} />
              </span>
              <h3 className="mt-5 font-serif text-base">{title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{desc}</p>
            </div>
            </AnimateIn>
          ))}
        </div>
      </div>
    </section>
  );
}

function PlansSection() {
  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
      {/* decoración */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-px max-w-4xl gold-divider" />
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-20 -z-10 h-96 w-[90%] -translate-x-1/2 rounded-full bg-gradient-gold opacity-10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AnimateIn direction="up">
          <SectionHeader
            eyebrow="Planes"
            title="Elegí cómo aprender"
            description="Membresía con todo incluido o compra individual del curso que necesites. Cancelás cuando quieras."
          />
        </AnimateIn>
        <div className="mt-16 grid items-stretch gap-8 lg:grid-cols-3 lg:gap-6">
          {plans.map((plan, i) => (
            <AnimateIn key={plan.id} direction="up" delay={i * 120}>
              <PlanCard {...plan} to={plan.id === "individual" ? "/cursos" : `/registro?plan=${plan.id}`} />
            </AnimateIn>
          ))}
        </div>

        <p className="mt-10 text-center text-xs text-muted-foreground">
          <CheckCircle2 className="mr-1 inline h-3 w-3 text-primary" /> Acceso inmediato después del pago
          <span className="mx-3">·</span>
          <CheckCircle2 className="mr-1 inline h-3 w-3 text-primary" /> Pago seguro
        </p>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="bg-secondary/40 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AnimateIn direction="up">
          <SectionHeader eyebrow="Alumnas" title="Resultados reales de la academia" />
        </AnimateIn>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <AnimateIn key={t.name} direction="up" delay={i * 100}>
              <TestimonialCard {...t} />
            </AnimateIn>
          ))}
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
      <AnimateIn direction="up" className="mx-auto max-w-5xl rounded-3xl border border-border bg-foreground px-6 py-16 text-center text-background shadow-elegant sm:px-12">
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
          <Button
            variant="outline"
            size="xl"
            asChild
            className="border border-background/30 bg-transparent text-background hover:border-primary hover:bg-primary hover:text-primary-foreground focus-visible:ring-primary/60"
          >
            <Link to="/cursos"><Play className="h-4 w-4" /> Ver cursos</Link>
          </Button>
        </div>
      </AnimateIn>
    </section>
  );
}