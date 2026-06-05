interface DynTubeVideoProps {
  /**
   * Video ID de DynTube — string corto tipo "t5jKHsw7LEOzl0P2twKnpA"
   * que va en https://videos.dyntube.com/iframes/<videoId>.
   */
  videoKey: string;
  title?: string;
}

/**
 * Iframe nativo de DynTube, sin overlays ni envoltorios.
 *
 * La protección la dan las capas externas:
 *   1. Acceso: la ruta padre verifica acceso antes de renderizar.
 *   2. Domain lock: DynTube valida en su servidor.
 *   3. AES-128: chunks encriptados.
 */
export function ProtectedVideo({ videoKey, title }: DynTubeVideoProps) {
  return (
    <div
      className="relative w-full overflow-hidden rounded-xl border border-border bg-black"
      style={{ paddingTop: "56.25%" }}
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
    </div>
  );
}
