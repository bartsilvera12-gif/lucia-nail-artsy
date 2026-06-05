import { useEffect, useRef, useState } from "react";

interface DynTubeVideoProps {
  /**
   * Video ID de DynTube. Es lo que devuelve el botón "Copy Video ID" en
   * el panel — un string corto tipo "t5jKHsw7LEOzl0P2twKnpA" que se usa
   * en la URL del iframe https://videos.dyntube.com/iframes/<videoId>.
   */
  videoKey: string;
  title?: string;
}

/**
 * Reproductor DynTube nativo con disuasión anti-captura.
 *
 * Se usa dentro de la sección dedicada (`/ver/$slug`), por eso no
 * tiene cover ni CTA — el contexto ya está controlado por la ruta.
 *
 * Capas de protección:
 *   1. Acceso: la ruta padre verifica acceso ANTES de renderizar.
 *   2. Domain lock: DynTube valida en su servidor.
 *   3. AES-128: chunks encriptados.
 *   4. Anti-captura (este componente):
 *      - PrintScreen / Snipping Tool / Cmd+Shift+3-5 → overlay
 *      - Window blur (capturas externas) → overlay
 */
export function ProtectedVideo({ videoKey, title }: DynTubeVideoProps) {
  const [warning, setWarning] = useState<string | null>(null);
  const blurTimerRef = useRef<number | null>(null);

  const showWarning = (message: string) => {
    setWarning(message);
    window.setTimeout(() => setWarning(null), 4500);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen") {
        navigator.clipboard?.writeText("").catch(() => undefined);
        showWarning("📸 Las capturas de pantalla no están permitidas.");
        return;
      }
      if (e.shiftKey && (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        showWarning("📸 Las capturas de pantalla no están permitidas.");
      }
      if (e.metaKey && e.shiftKey && ["3", "4", "5"].includes(e.key)) {
        showWarning("📸 Las capturas de pantalla no están permitidas.");
      }
    };
    window.addEventListener("keydown", onKey, { capture: true });
    document.addEventListener("keydown", onKey, { capture: true });
    return () => {
      window.removeEventListener("keydown", onKey, { capture: true } as EventListenerOptions);
      document.removeEventListener("keydown", onKey, { capture: true } as EventListenerOptions);
    };
  }, []);

  useEffect(() => {
    const onBlur = () => {
      if (blurTimerRef.current) window.clearTimeout(blurTimerRef.current);
      blurTimerRef.current = window.setTimeout(() => {
        if (document.visibilityState === "visible") {
          showWarning("⚠️ Detectamos pérdida de foco. Las capturas no están permitidas.");
        }
      }, 200);
    };
    const onFocus = () => {
      if (blurTimerRef.current) {
        window.clearTimeout(blurTimerRef.current);
        blurTimerRef.current = null;
      }
    };
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      if (blurTimerRef.current) window.clearTimeout(blurTimerRef.current);
    };
  }, []);

  return (
    <div
      className="relative w-full overflow-hidden rounded-xl border border-border bg-black select-none"
      style={{ paddingTop: "56.25%" }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <iframe
        src={`https://videos.dyntube.com/iframes/${videoKey}`}
        title={title ?? "Lección"}
        allow="autoplay; encrypted-media; fullscreen"
        allowFullScreen
        scrolling="no"
        className="absolute inset-0 h-full w-full border-0"
        style={{ border: "none" }}
      />

      {warning && (
        <div
          className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-black/90 px-6 text-center text-white backdrop-blur-sm"
          role="alert"
          aria-live="assertive"
        >
          <div className="text-5xl sm:text-6xl">🚫</div>
          <p className="font-serif text-xl sm:text-3xl">{warning}</p>
          <p className="max-w-md text-xs text-zinc-300 sm:text-base">
            El contenido del curso es propiedad de Lucía Rojas Studio.
            Compartirlo o reproducirlo fuera de la plataforma puede generar
            la baja inmediata de tu acceso.
          </p>
        </div>
      )}
    </div>
  );
}
