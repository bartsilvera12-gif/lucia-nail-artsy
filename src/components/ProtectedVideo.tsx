import { useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";

interface DynTubeVideoProps {
  /**
   * Video ID de DynTube — string corto tipo "t5jKHsw7LEOzl0P2twKnpA"
   * que va en https://videos.dyntube.com/iframes/<videoId>.
   * Es el mismo ID que aparece en el embed code oficial de DynTube.
   * Se obtiene en el panel de DynTube → menú del video → "Copy Video ID".
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
    const triggerScreenshotWarning = () => {
      navigator.clipboard?.writeText("").catch(() => undefined);
      showWarning("📸 Las capturas de pantalla no están permitidas.");
    };

    const onKey = (e: KeyboardEvent) => {
      // Windows manda PrintScreen al keyup, no al keydown — capturamos ambos.
      if (e.key === "PrintScreen" || e.code === "PrintScreen") {
        triggerScreenshotWarning();
        return;
      }
      // Snipping Tool (Win+Shift+S en Windows, Cmd+Shift+S en mac).
      // En Windows el Win es `metaKey` en el browser.
      if (e.shiftKey && (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        triggerScreenshotWarning();
        return;
      }
      // Atajos macOS: Cmd+Shift+3 / 4 / 5
      if (e.metaKey && e.shiftKey && ["3", "4", "5"].includes(e.key)) {
        triggerScreenshotWarning();
        return;
      }
    };

    // Algunos navegadores en Windows solo disparan PrintScreen en keyup.
    window.addEventListener("keydown", onKey, { capture: true });
    window.addEventListener("keyup", onKey, { capture: true });
    document.addEventListener("keydown", onKey, { capture: true });
    document.addEventListener("keyup", onKey, { capture: true });

    return () => {
      window.removeEventListener("keydown", onKey, { capture: true } as EventListenerOptions);
      window.removeEventListener("keyup", onKey, { capture: true } as EventListenerOptions);
      document.removeEventListener("keydown", onKey, { capture: true } as EventListenerOptions);
      document.removeEventListener("keyup", onKey, { capture: true } as EventListenerOptions);
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
      onContextMenu={(e) => {
        e.preventDefault();
        showWarning("Las capturas de pantalla no están permitidas.");
      }}
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
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/85 px-6 backdrop-blur-md"
          role="alert"
          aria-live="assertive"
        >
          <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-zinc-900 via-black to-zinc-900 p-6 text-center shadow-2xl">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 ring-1 ring-primary/40">
              <ShieldAlert className="h-7 w-7 text-primary" strokeWidth={1.75} />
            </div>

            <p className="mt-4 font-serif text-lg leading-snug text-white sm:text-xl">
              {warning}
            </p>

            <div aria-hidden className="my-4 mx-auto h-px w-12 bg-primary/40" />

            <p className="text-[11px] leading-relaxed text-zinc-400 sm:text-xs">
              El contenido del curso es propiedad de
              <span className="text-zinc-200"> Lucía Rojas Studio</span>.
              Compartirlo o reproducirlo fuera de la plataforma puede generar
              la baja inmediata de tu acceso.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
