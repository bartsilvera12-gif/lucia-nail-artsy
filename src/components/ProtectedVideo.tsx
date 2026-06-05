import { useEffect, useRef, useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";

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
 * Fullscreen custom: en vez de dejar que el iframe maneje su propio
 * fullscreen (que tapa nuestro overlay), envolvemos TODO el bloque
 * (iframe + overlay) en un único elemento fullscreen-able. Así nuestro
 * overlay sigue siendo visible incluso en pantalla completa.
 *
 * Capas de protección:
 *   1. Acceso: la ruta padre verifica acceso ANTES de renderizar.
 *   2. Domain lock: DynTube valida en su servidor.
 *   3. AES-128: chunks encriptados.
 *   4. Anti-captura (este componente):
 *      - PrintScreen / Snipping Tool / Cmd+Shift+3-5 → overlay
 *      - Window blur (capturas externas) → overlay
 *      - Fullscreen custom para que el overlay se vea siempre
 */
export function ProtectedVideo({ videoKey, title }: DynTubeVideoProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
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
    document.addEventListener("keydown", onKey, { capture: true });
    return () => {
      window.removeEventListener("keydown", onKey, { capture: true } as EventListenerOptions);
      document.removeEventListener("keydown", onKey, { capture: true } as EventListenerOptions);
    };
  }, []);

  // Window blur (herramientas externas de captura)
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

  // Sync de estado fullscreen con el browser. Importante: el wrapper es
  // el elemento que entra en fullscreen, así que nuestro overlay
  // (que vive dentro del wrapper) sigue visible.
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(document.fullscreenElement === wrapperRef.current);
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (wrapperRef.current) {
        await wrapperRef.current.requestFullscreen();
      }
    } catch (err) {
      console.warn("[video] fullscreen toggle failed:", err);
    }
  };

  return (
    // Wrapper hace de "elemento fullscreen". Adentro están iframe + overlay
    // + botón de fullscreen, así todo queda visible en pantalla completa.
    <div
      ref={wrapperRef}
      className={
        isFullscreen
          ? "group relative h-screen w-screen bg-black select-none flex items-center justify-center"
          : "group relative w-full overflow-hidden rounded-xl border border-border bg-black select-none"
      }
      style={isFullscreen ? undefined : { paddingTop: "56.25%" }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <iframe
        src={`https://videos.dyntube.com/iframes/${videoKey}`}
        title={title ?? "Lección"}
        // Importante: SIN `allow=fullscreen` y SIN `allowFullScreen` —
        // así el botón nativo del player de DynTube no maneja fullscreen
        // y nos aseguramos que el fullscreen lo controle nuestro wrapper.
        allow="autoplay; encrypted-media"
        scrolling="no"
        className="absolute inset-0 h-full w-full border-0"
        style={{ border: "none" }}
      />

      {/* Botón fullscreen propio. Aparece arriba a la derecha del video. */}
      <button
        type="button"
        onClick={toggleFullscreen}
        title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
        aria-label={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
        className="absolute right-3 top-3 z-40 rounded-md bg-black/50 p-2 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-black/70 group-hover:opacity-100 focus:opacity-100"
      >
        {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
      </button>

      {/* Toast anti-captura — sutil, arriba del video, no tapa el contenido */}
      {warning && (
        <div
          className="pointer-events-none absolute left-1/2 top-4 z-50 -translate-x-1/2 rounded-lg bg-black/80 px-4 py-2 text-center text-sm text-white shadow-lg backdrop-blur-sm sm:text-base"
          role="alert"
          aria-live="polite"
        >
          {warning}
        </div>
      )}
    </div>
  );
}
