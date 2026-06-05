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
 * Reproductor DynTube con disuasión anti-captura.
 *
 * Estructura del embed: idéntica a la que recomienda DynTube — wrapper
 * con padding-top: 56.25% (forzar 16:9) + iframe absoluto. Es lo más
 * compatible cross-browser y evita scrollbars internos.
 *
 * El tamaño máximo del player lo decide el contenedor PADRE (limitar
 * con max-w-3xl, max-w-4xl, etc.). Acá solo nos aseguramos la proporción.
 *
 * Capas de protección:
 *   1. Acceso: la ruta padre verifica hasAccessTo / is_free_preview
 *      ANTES de renderizar.
 *   2. Domain lock: DynTube valida que el host esté autorizado.
 *   3. AES-128: chunks del video encriptados.
 *   4. Anti-captura (este componente):
 *      - PrintScreen / Win+Shift+S / Cmd+Shift+3-4-5 → overlay
 *      - Window blur (Snipping Tool, OBS, etc.) → overlay
 *      - Click derecho bloqueado
 */
export function ProtectedVideo({ videoKey, title }: DynTubeVideoProps) {
  const [warning, setWarning] = useState<string | null>(null);
  const blurTimerRef = useRef<number | null>(null);

  const showWarning = (message: string) => {
    setWarning(message);
    window.setTimeout(() => setWarning(null), 4500);
  };

  // Atajos de captura
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
    return () => window.removeEventListener("keydown", onKey, { capture: true } as EventListenerOptions);
  }, []);

  // Window blur (Snipping Tool, herramientas externas, screen recorders)
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
    // Wrapper exactamente como recomienda DynTube: padding-top 56.25%
    // fuerza el aspect ratio 16:9. El iframe va absoluto adentro.
    <div
      className="relative w-full overflow-hidden rounded-xl border border-border bg-black select-none"
      style={{ paddingTop: "56.25%" }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <iframe
        src={`https://videos.dyntube.com/iframes/${videoKey}`}
        title={title ?? "Lección"}
        allow="autoplay; fullscreen; encrypted-media"
        allowFullScreen
        scrolling="no"
        className="absolute inset-0 h-full w-full border-0"
        style={{ border: "none" }}
      />

      {/* Overlay anti-captura */}
      {warning && (
        <div
          className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-black/90 px-6 text-center text-white backdrop-blur-sm"
          role="alert"
          aria-live="assertive"
        >
          <div className="text-5xl">🚫</div>
          <p className="font-serif text-xl sm:text-2xl">{warning}</p>
          <p className="max-w-md text-xs text-zinc-300 sm:text-sm">
            El contenido del curso es propiedad de Lucía Rojas Studio.
            Compartirlo o reproducirlo fuera de la plataforma puede generar
            la baja inmediata de tu acceso.
          </p>
        </div>
      )}
    </div>
  );
}
