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
 * loader). Aspect ratio 16:9 fijado por estilo inline (compat con
 * cualquier versión de Tailwind), con max-height para que no se haga
 * gigante en pantallas grandes.
 *
 * Control de acceso en 2 capas:
 *   1. La ruta padre verifica acceso (hasAccessTo / is_free_preview)
 *      ANTES de renderizar — si no hay acceso, este componente nunca
 *      se monta y la videoKey nunca sale al DOM.
 *   2. DynTube valida "domain lock" en su servidor — el iframe solo
 *      reproduce si el host es uno de los dominios autorizados.
 *
 * Encriptación AES-128 sobre los chunks. Manejo de PrintScreen: limpia
 * clipboard como fricción anti-captura (no es DRM real — el DRM lo
 * hace DynTube con Screen Shield + watermarks).
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
      // mx-auto + max-w → centra y limita el ancho en pantallas amplias
      // aspectRatio + maxHeight → respeta proporción 16:9 sin volverse gigante
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
    </div>
  );
}
