import { useEffect, useRef } from "react";

interface DynTubeVideoProps {
  /** Video Key de DynTube (lo que va en data-dyntube-key) */
  videoKey: string;
  title?: string;
}

/**
 * Reproductor DynTube. El control de acceso lo maneja:
 *   1. Este componente NO se renderiza si la alumna no tiene acceso al curso
 *      (lo decide la ruta padre con hasAccessTo / is_free_preview).
 *   2. DynTube valida el "domain lock" en su servidor — solo se reproduce si
 *      el embed está hosteado en uno de los dominios autorizados del comercio.
 *
 * El video viene encriptado con AES-128 desde DynTube. No hay archivo
 * descargable: el browser baja chunks encriptados y los desencripta en
 * memoria con una key que solo se entrega al dominio autorizado.
 *
 * Manejo de PrintScreen: limpiamos clipboard para desalentar captura. No es
 * DRM real (eso lo hace DynTube con Screen Shield + watermark), solo
 * fricción adicional.
 */
export function ProtectedVideo({ videoKey, title }: DynTubeVideoProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Cargar el script de DynTube una sola vez globalmente (idempotente).
  // El loader oficial ya hace este check con _dyntube_v1_init, pero por
  // las dudas lo envolvemos en una guardia adicional.
  useEffect(() => {
    type DynWin = Window & { _dyntube_v1_init?: boolean };
    const w = window as DynWin;
    if (w._dyntube_v1_init) return;
    w._dyntube_v1_init = true;

    const script = document.createElement("script");
    script.src = "https://embed.dyntube.com/v1.0/dyntube.js";
    script.async = true;
    document.head.appendChild(script);
  }, []);

  // PrintScreen → clipboard vacío (fricción anti-captura, no es DRM real)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen") {
        navigator.clipboard?.writeText("").catch(() => undefined);
      }
    };
    window.addEventListener("keydown", onKey, { capture: true });
    return () => window.removeEventListener("keydown", onKey, { capture: true } as EventListenerOptions);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-black select-none"
      onContextMenu={(e) => e.preventDefault()}
      aria-label={title ?? "Lección"}
    >
      {/* El loader de DynTube descubre este div por el atributo data-dyntube-key
          y monta el player adentro. */}
      <div
        data-dyntube-key={videoKey}
        className="absolute inset-0 h-full w-full"
      />
    </div>
  );
}
