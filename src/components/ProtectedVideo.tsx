import { useEffect, useState } from "react";

interface DynTubeVideoProps {
  /**
   * Video ID de DynTube — string corto tipo "t5jKHsw7LEOzl0P2twKnpA"
   * que va en https://videos.dyntube.com/iframes/<videoId>.
   */
  videoKey: string;
  title?: string;
}

/**
 * Iframe nativo de DynTube con overlay anti-captura.
 *
 * Capas de protección:
 *   1. Acceso: la ruta padre verifica acceso antes de renderizar.
 *   2. Domain lock: DynTube valida en su servidor.
 *   3. AES-128: chunks encriptados.
 *   4. Anti-captura (este componente): PrintScreen / Snipping Tool /
 *      atajos Cmd+Shift+3-5 / blur de ventana → overlay disuasorio.
 */
export function ProtectedVideo({ videoKey, title }: DynTubeVideoProps) {
  const [warning, setWarning] = useState<string | null>(null);

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

  // OJO: NO escuchamos `window.blur`. Cada vez que la alumna clickea
  // el iframe de DynTube para reproducir, el window pierde foco a favor
  // del iframe — eso generaba el aviso anti-captura todo el tiempo.
  // La captura por PrintScreen y atajos sí sigue cubierta arriba.

  return (
    <div
      className="relative mx-auto w-full overflow-hidden rounded-xl border border-border bg-black select-none"
      style={{ aspectRatio: "9 / 16", maxWidth: "min(100%, calc((100vh - 200px) * 9 / 16))" }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <iframe
        src={`https://videos.dyntube.com/iframes/${videoKey}`}
        title={title ?? "Lección"}
        allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
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
          <p className="font-serif text-xl sm:text-2xl">{warning}</p>
          <p className="max-w-xs text-xs text-zinc-300">
            El contenido del curso es propiedad de Lucía Rojas Studio.
            Compartirlo o reproducirlo fuera de la plataforma puede generar
            la baja inmediata de tu acceso.
          </p>
        </div>
      )}
    </div>
  );
}
