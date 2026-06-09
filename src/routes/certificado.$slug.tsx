import { createFileRoute, Link, Navigate, notFound } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { ArrowLeft, Award, Download, Loader2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCourseBySlug, useMyProgress } from "@/hooks/useCourses";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import logoLR from "@/assets/logo/logosinletras.png";
import heroBg from "@/assets/lucia-hero.png";

export const Route = createFileRoute("/certificado/$slug")({
  head: ({ params }) => ({ meta: [{ title: `Certificado — ${params.slug}` }] }),
  component: CertificadoPage,
});

function CertificadoPage() {
  const { slug } = Route.useParams();
  const certRef = useRef<HTMLDivElement | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
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
  // Descarga directa como PDF: capturamos el nodo .cert con html2canvas-pro
  // (la version "pro" entiende oklch de Tailwind v4; la original explota) y
  // lo embedeamos en un jsPDF A4 horizontal. Asi la alumna obtiene el PDF de
  // un click, sin pasar por el dialogo de impresion del navegador.
  // Imports dinamicos: ambas libs son grandes (~300kb gz combinados) y solo
  // hacen falta al apretar el boton — no las metemos al bundle inicial.
  const handleDownload = async () => {
    if (!certRef.current || isDownloading) return;
    setIsDownloading(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas-pro"),
        import("jspdf"),
      ]);
      const node = certRef.current;
      const canvas = await html2canvas(node, {
        scale: 2,                  // 2x para que el PDF salga nitido
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });
      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      // Encajamos la imagen manteniendo aspect ratio dentro de la pagina A4.
      const imgRatio = canvas.width / canvas.height;
      const pageRatio = pageW / pageH;
      let drawW = pageW;
      let drawH = pageH;
      if (imgRatio > pageRatio) {
        drawH = pageW / imgRatio;
      } else {
        drawW = pageH * imgRatio;
      }
      const offsetX = (pageW - drawW) / 2;
      const offsetY = (pageH - drawH) / 2;
      pdf.addImage(imgData, "JPEG", offsetX, offsetY, drawW, drawH);
      const safeName = `${fullName}`.replace(/[^a-zA-Z0-9-_ ]+/g, "").trim().replace(/\s+/g, "-");
      const safeCourse = data.course.title.replace(/[^a-zA-Z0-9-_ ]+/g, "").trim().replace(/\s+/g, "-");
      pdf.save(`Certificado-${safeName}-${safeCourse}.pdf`);
    } catch (err) {
      console.error("[cert] download error", err);
      toast.error("No pudimos generar el PDF. Probá imprimir como PDF desde tu navegador.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-cream py-4 sm:py-10">
      {/* Toolbar (no se imprime) */}
      <div className="no-print mx-auto mb-4 flex max-w-5xl flex-wrap items-center justify-between gap-2 px-3 sm:mb-6 sm:gap-3 sm:px-4">
        <Button variant="ghost" size="sm" asChild className="sm:size-default">
          <Link to="/ver/$slug" params={{ slug }}>
            <ArrowLeft className="h-4 w-4" /> Volver al curso
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Descargar: genera el PDF directo desde el DOM con html2canvas-pro +
              jsPDF y lo baja al equipo. Imprimir: dialogo nativo del navegador
              (la alumna que quiera puede tambien guardar como PDF desde ahi,
              pero el camino corto es el primer boton). */}
          <Button
            variant="hero"
            size="sm"
            onClick={handleDownload}
            disabled={isDownloading}
            className="sm:size-default"
          >
            {isDownloading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Generando…
              </>
            ) : (
              <>
                <Download className="h-4 w-4" /> Descargar PDF
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="sm:size-default"
          >
            <Printer className="h-4 w-4" /> Imprimir
          </Button>
        </div>
      </div>

      {/* Certificado */}
      <div ref={certRef} className="cert mx-auto max-w-5xl bg-white p-4 shadow-elegant sm:p-10 lg:p-14">
        <div className="cert-frame relative overflow-hidden rounded-xl border-4 border-double border-primary/40 p-4 sm:rounded-2xl sm:border-[6px] sm:p-8 lg:p-12">
          {/* Foto de Lucía como marca de agua de fondo. La ponemos a la
              derecha con opacidad baja para que decore sin tapar el texto. */}
          <img
            src={heroBg}
            alt=""
            aria-hidden
            className="pointer-events-none absolute right-0 top-1/2 -z-0 h-[110%] -translate-y-1/2 opacity-40 sm:opacity-60"
            style={{ printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}
          />
          {/* Velo crema solo sobre el lado izquierdo, para que el texto
              tenga fondo limpio y la foto se vea con su color natural a
              la derecha. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-0 bg-gradient-to-r from-white via-white/75 to-transparent"
          />

          {/* halos decorativos */}
          <div
            aria-hidden
            className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl"
          />

          <div
            className="relative flex flex-col items-center text-center"
            style={{
              // Halo dorado cálido alrededor del texto: combina con la
              // paleta de la marca y separa los glifos de la foto de fondo
              // sin meter blanco frío que rompa el look premium.
              textShadow: [
                "0 0 8px rgba(255, 248, 230, 0.95)",   // halo cercano cremoso
                "0 0 14px rgba(217, 164, 98, 0.55)",    // resplandor dorado amplio
                "0 1px 0 rgba(255, 255, 255, 0.85)",    // base blanca de apoyo
                "0 2px 6px rgba(120, 80, 50, 0.18)",    // sombra cálida tenue
              ].join(", "),
            }}
          >
            <img src={logoLR} alt="Lucía Rojas Studio" className="h-14 w-14 object-contain sm:h-20 sm:w-20" />

            <p className="mt-3 text-[10px] uppercase tracking-[4px] text-primary sm:mt-4 sm:text-xs sm:tracking-[6px]">
              Lucía Rojas Studio
            </p>
            <h1
              className="mt-1 font-serif text-2xl text-foreground sm:text-4xl lg:text-5xl"
              style={{ textShadow: "none" }}
            >
              Certificado de finalización
            </h1>

            <div aria-hidden className="my-4 h-px w-16 bg-primary/50 sm:my-6 sm:w-24" />

            <p className="text-xs text-muted-foreground sm:text-sm">Se otorga el presente a</p>
            <p
              className="mt-2 font-serif text-xl text-foreground sm:text-3xl lg:text-4xl"
              style={{ textShadow: "none" }}
            >
              {fullName}
            </p>

            <p className="mt-4 max-w-2xl text-xs leading-relaxed text-muted-foreground sm:mt-6 sm:text-sm lg:text-base">
              Por haber completado satisfactoriamente todas las clases del curso
            </p>
            <p className="mt-2 font-serif text-lg text-primary sm:text-2xl lg:text-3xl">
              {data.course.title}
            </p>
            {data.course.category && (
              <p className="mt-1 text-[10px] uppercase tracking-[2px] text-muted-foreground sm:tracking-widest sm:text-[11px]">
                {data.course.category}
              </p>
            )}

            <div aria-hidden className="my-5 h-px w-12 bg-primary/40 sm:my-8 sm:w-16" />

            {/* Firmas: en mobile se apilan centradas; en sm+ se separan
                a izquierda/derecha. */}
            <div className="flex w-full flex-col items-center gap-6 pt-2 text-center sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-8 sm:pt-4 sm:px-6 sm:text-left">
              <div className="flex flex-col items-center sm:items-start">
                <p className="font-serif text-base text-foreground sm:text-lg" style={{ textShadow: "none" }}>Lucía Rojas</p>
                <div className="mt-1 h-px w-32 bg-foreground/40 sm:w-40" />
                <p className="mt-1 text-[10px] uppercase tracking-[2px] text-muted-foreground sm:tracking-widest sm:text-[11px]">
                  Directora · Lucía Rojas Studio
                </p>
              </div>
              <div className="flex flex-col items-center sm:items-end">
                <p className="font-serif text-base text-foreground sm:text-lg" style={{ textShadow: "none" }}>{issueDateLabel}</p>
                <div className="mt-1 h-px w-32 bg-foreground/40 sm:w-40" />
                <p className="mt-1 text-[10px] uppercase tracking-[2px] text-muted-foreground sm:tracking-widest sm:text-[11px]">
                  Fecha de emisión
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Estilos solo para impresión: oculta toolbar, fuerza una sola página
          A4 horizontal y reduce paddings/tamaños para que todo el certificado
          (incluido el ID) entre en la primera hoja. */}
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 0; }
          html, body { background: #fff !important; height: auto !important; }
          .no-print { display: none !important; }

          /* Caja contenedora: sin sombras, sin padding de toolbar. */
          .cert {
            box-shadow: none !important;
            max-width: 100% !important;
            width: 100% !important;
            padding: 8mm 12mm !important;
            margin: 0 !important;
            page-break-after: avoid;
            break-after: avoid;
            page-break-inside: avoid;
            break-inside: avoid;
          }

          /* Marco interior: paddings más cortos para evitar overflow. */
          .cert-frame { padding: 16px 24px !important; }

          /* Asegurar que las imágenes/backgrounds decorativos se impriman. */
          .cert, .cert-frame, .cert-frame img, .cert-frame > div {
            print-color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
          }

          /* Reducimos tamaños tipográficos para que entre cómodo. */
          .cert h1 { font-size: 32px !important; line-height: 1.1 !important; }
          .cert .font-serif { line-height: 1.15 !important; }

          /* El ID del cert va dentro del flujo, no en hoja aparte. */
          .cert-id { margin-top: 10px !important; }

          /* Margen vertical entre bloques: más compacto. */
          .cert .my-6 { margin-top: 12px !important; margin-bottom: 12px !important; }
          .cert .my-8 { margin-top: 14px !important; margin-bottom: 14px !important; }
          .cert .mt-6 { margin-top: 10px !important; }
          .cert .mt-4 { margin-top: 6px !important; }
        }
      `}</style>
    </div>
  );
}
