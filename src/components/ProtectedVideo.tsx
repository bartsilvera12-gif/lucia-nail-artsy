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
 * Capas de protección:
 *   1. Acceso: la ruta padre verifica hasAccessTo / is_free_preview ANTES
 *      de renderizar — la videoKey nunca sale al DOM si no hay acceso.
 *   2. Domain lock: DynTube valida en su servidor que el iframe esté
 *      embebido en un dominio autorizado.
 *   3. AES-128: los chunks del video vienen encriptados.
 *   4. Anti-captura (este componente):
 *      - PrintScreen → clipboard vacío + overlay de advertencia
 *      - window blur (Snipping Tool, grabador de pantalla, alt-tab) →
 *        overlay de advertencia para desalentar capturas
 *      - Click derecho bloqueado sobre el player
 *
 * Nota honesta: ningún sitio web puede prevenir 100% screenshots a nivel
 * de SO. Esto es fricción + identificación visible (idealmente combinado
 * con Screen Shield de DynTube que pone watermark con el email).
 */
export function ProtectedVideo({ videoKey, title }: DynTubeVideoProps) {
  const [warning, setWarning] = useState<string | null>(null);
  const blurTimerRef = useRef<number | null>(null);

  // Mostrar overlay de advertencia por N segundos
  const showWarning = (message: string) => {
    setWarning(message);
    window.setTimeout(() => setWarning(null), 4500);
  };

  // PrintScreen → limpiar clipboard + mostrar advertencia
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen") {
        navigator.clipboard?.writeText("").catch(() => undefined);
        showWarning("📸 Las capturas de pantalla no están permitidas.");
        return;
      }
      // Snipping Tool de Windows: Win+Shift+S
      if (e.shiftKey && (e.metaKey || e.key === "Meta") && e.key.toLowerCase() === "s") {
        showWarning("📸 Las capturas de pantalla no están permitidas.");
      }
      // macOS: Cmd+Shift+3, Cmd+Shift+4, Cmd+Shift+5
      if (e.metaKey && e.shiftKey && ["3", "4", "5"].includes(e.key)) {
        showWarning("📸 Las capturas de pantalla no están permitidas.");
      }
    };
    window.addEventListener("keydown", onKey, { capture: true });
    return () => window.removeEventListener("keydown", onKey, { capture: true } as EventListenerOptions);
  }, []);

  // Window blur → puede ser captura externa, alt-tab, o snipping tool.
  // Aplicamos un pequeño debounce para evitar falsos positivos (clicks
  // legítimos en otras tabs no debería disparar el aviso constantemente).
  useEffect(() => {
    const onBlur = () => {
      // Si el blur dura más de 200ms y la página sigue visible, probable
      // herramienta de captura activa
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
      className="relative mx-auto w-full overflow-hidden rounded-xl border border-border bg-black select-none"
      style={{
        aspectRatio: "16 / 9",
        maxHeight: "min(70vh, 720px)",
        maxWidth: "min(100%, 1280px)",
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <iframe
        src={`https://videos.dyntube.com/iframes/${videoKey}`}
        title={title ?? "Lección"}
        allow="autoplay; fullscreen; encrypted-media"
        allowFullScreen
        className="absolute inset-0 h-full w-full border-0"
      />

      {/* Overlay de advertencia anti-captura. Tapa el player completo y
          se autodismissea después de 4.5s. */}
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
