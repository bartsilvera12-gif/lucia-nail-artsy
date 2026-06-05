import { useEffect } from "react";

interface DynTubeVideoProps {
  /**
   * Video ID de DynTube. Es lo que devuelve el botón "Copy Video ID" en
   * el panel — un string corto tipo "t5jKHsw7LEOzl0P2twKnpA" que se usa
   * en la URL del iframe https://videos.dyntube.com/iframes/<videoId>.
   *
   * Ojo: DynTube también muestra un "Video Key" más largo (el de
   * data-dyntube-key) en el código de embed con script. NO es ese — es
   * el corto, el que sale del botón "Copy Video ID".
   */
  videoKey: string;
  title?: string;
}

/**
 * Reproductor DynTube embebido vía iframe directo (no requiere script
 * loader). El control de acceso se hace en dos capas:
 *
 *   1. La ruta padre verifica acceso al curso (hasAccessTo /
 *      is_free_preview) ANTES de renderizar este componente. Si la
 *      alumna no tiene acceso, este componente nunca se monta y el
 *      videoKey nunca sale al DOM.
 *
 *   2. DynTube valida "domain lock" en su servidor — el iframe solo
 *      reproduce el video si el padre que lo embebe es uno de los
 *      dominios autorizados en el panel de DynTube (en nuestro caso,
 *      luciarojasstudio.com.py).
 *
 * El video viene encriptado con AES-128 desde DynTube. Manejo de
 * PrintScreen: limpia clipboard para desalentar captura (no es DRM
 * real, solo fricción adicional — el DRM real lo hace DynTube con
 * Screen Shield y watermarks visibles).
 */
export function ProtectedVideo({ videoKey, title }: DynTubeVideoProps) {
  // PrintScreen → clipboard vacío (fricción anti-captura)
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
      className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-black select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      <iframe
        src={`https://videos.dyntube.com/iframes/${videoKey}`}
        title={title ?? "Lección"}
        allow="autoplay; fullscreen; encrypted-media"
        allowFullScreen
        className="absolute inset-0 h-full w-full border-0"
      />
    </div>
  );
}
