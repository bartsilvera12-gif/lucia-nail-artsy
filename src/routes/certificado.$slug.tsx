import { createFileRoute, Link, Navigate, notFound } from "@tanstack/react-router";
import { useMemo } from "react";
import { ArrowLeft, Award, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCourseBySlug, useMyProgress } from "@/hooks/useCourses";
import { useAuth } from "@/lib/auth";
import logoLR from "@/assets/logo/logosinletras.png";

export const Route = createFileRoute("/certificado/$slug")({
  head: ({ params }) => ({ meta: [{ title: `Certificado — ${params.slug}` }] }),
  component: CertificadoPage,
});

function CertificadoPage() {
  const { slug } = Route.useParams();
  const { data, isLoading } = useCourseBySlug(slug);
  // isFetching + isLoading nos sirve para no mostrar "no disponible" mientras
  // los datos de progreso todavía están en vuelo (caso típico: la alumna
  // marca la última clase y entra al cert antes de que la query refresque).
  const { data: progress = [], isLoading: progressLoading, isFetching: progressFetching } = useMyProgress();
  const { user, isAuthenticated, loading } = useAuth();

  const allLessons = useMemo(() => {
    if (!data) return [];
    return data.modules.flatMap((m) => data.lessons.filter((l) => l.module_id === m.id));
  }, [data]);

  const completedSet = useMemo(
    () => new Set(progress.filter((p) => p.completed_at).map((p) => p.lesson_id)),
    [progress],
  );

  // Fecha de emisión: el `completed_at` más reciente entre las clases del curso,
  // así el certificado tiene una fecha estable (no el "hoy").
  const issueDateISO = useMemo(() => {
    if (!data) return null;
    const ids = new Set(allLessons.map((l) => l.id));
    const dates = progress
      .filter((p) => ids.has(p.lesson_id) && p.completed_at)
      .map((p) => new Date(p.completed_at as string).getTime());
    if (!dates.length) return null;
    return new Date(Math.max(...dates)).toISOString();
  }, [progress, allLessons, data]);

  if (loading || isLoading || progressLoading || progressFetching) {
    return <div className="flex min-h-screen items-center justify-center">Cargando…</div>;
  }
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (!data) throw notFound();

  const allCompleted =
    allLessons.length > 0 && allLessons.every((l) => completedSet.has(l.id));

  // Si todavía no completó todo, lo mandamos de vuelta a la pantalla de ver
  // con un mensaje claro. Evita acceso directo por URL.
  if (!allCompleted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-cream px-6 py-10 text-center">
        <Award className="h-10 w-10 text-primary" />
        <h1 className="font-serif text-2xl">Tu certificado todavía no está disponible</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Para emitir el certificado, primero tenés que completar todas las
          clases del curso <b>{data.course.title}</b>. Volvé al curso y seguí
          desde donde dejaste.
        </p>
        <Button variant="hero" asChild>
          <Link to="/ver/$slug" params={{ slug }}>Volver al curso</Link>
        </Button>
      </div>
    );
  }

  const fullName = user?.name?.trim() || user?.email || "Alumna";
  const issueDate = issueDateISO ? new Date(issueDateISO) : new Date();
  const issueDateLabel = issueDate.toLocaleDateString("es-PY", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  // ID corto y estable para mostrar abajo del cert. Concat user+course+date.
  const certId = `LR-${(user?.id ?? "").slice(0, 6).toUpperCase()}-${data.course.id.slice(0, 6).toUpperCase()}-${issueDate.toISOString().slice(0, 10).replace(/-/g, "")}`;

  return (
    <div className="min-h-screen bg-gradient-cream py-10">
      {/* Toolbar (no se imprime) */}
      <div className="no-print mx-auto mb-6 flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4">
        <Button variant="ghost" asChild>
          <Link to="/ver/$slug" params={{ slug }}>
            <ArrowLeft className="h-4 w-4" /> Volver al curso
          </Link>
        </Button>
        <Button variant="hero" onClick={() => window.print()}>
          <Printer className="h-4 w-4" /> Descargar / Imprimir
        </Button>
      </div>

      {/* Certificado */}
      <div className="cert mx-auto max-w-5xl bg-white p-10 shadow-elegant sm:p-14">
        <div className="relative overflow-hidden rounded-2xl border-[6px] border-double border-primary/40 p-8 sm:p-12">
          {/* halos decorativos */}
          <div
            aria-hidden
            className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl"
          />

          <div className="relative flex flex-col items-center text-center">
            <img src={logoLR} alt="Lucía Rojas Studio" className="h-20 w-20 object-contain" />

            <p className="mt-4 text-xs uppercase tracking-[6px] text-primary">
              Lucía Rojas Studio
            </p>
            <h1 className="mt-1 font-serif text-4xl text-foreground sm:text-5xl">
              Certificado de finalización
            </h1>

            <div aria-hidden className="my-6 h-px w-24 bg-primary/50" />

            <p className="text-sm text-muted-foreground">Se otorga el presente a</p>
            <p className="mt-2 font-serif text-3xl text-foreground sm:text-4xl">
              {fullName}
            </p>

            <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Por haber completado satisfactoriamente todas las clases del curso
            </p>
            <p className="mt-2 font-serif text-2xl text-primary sm:text-3xl">
              {data.course.title}
            </p>
            {data.course.category && (
              <p className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">
                {data.course.category}
              </p>
            )}

            <div aria-hidden className="my-8 h-px w-16 bg-primary/40" />

            <div className="flex w-full flex-wrap items-end justify-between gap-8 pt-4 text-left sm:px-6">
              <div>
                <p className="font-serif text-lg text-foreground">Lucía Rojas</p>
                <div className="mt-1 h-px w-40 bg-foreground/40" />
                <p className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">
                  Directora · Lucía Rojas Studio
                </p>
              </div>
              <div className="text-right">
                <p className="font-serif text-lg text-foreground">{issueDateLabel}</p>
                <div className="mt-1 ml-auto h-px w-40 bg-foreground/40" />
                <p className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">
                  Fecha de emisión
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] text-muted-foreground">
          ID del certificado: <span className="font-mono">{certId}</span>
        </p>
      </div>

      {/* Estilos solo para impresión: oculta toolbar y deja cert a sangrado. */}
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 10mm; }
          html, body { background: #fff !important; }
          .no-print { display: none !important; }
          .cert { box-shadow: none !important; max-width: 100% !important; padding: 0 !important; }
        }
      `}</style>
    </div>
  );
}
