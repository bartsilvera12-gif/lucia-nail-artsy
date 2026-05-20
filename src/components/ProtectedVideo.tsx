import { useEffect, useRef, useState } from "react";
import { Eye, Maximize2, Minimize2 } from "lucide-react";

interface ProtectedVideoProps {
  /** OTP de VdoCipher */
  otp: string;
  /** playbackInfo de VdoCipher (base64) */
  playbackInfo: string;
  userEmail: string;
  title?: string;
}

/**
 * Reproductor VdoCipher.
 * - Protección real: DRM de VdoCipher (Widevine/FairPlay) + watermark
 *   dinámico quemado en el stream (configurado en /api/vdocipher-otp.ts).
 * - Extras de UI: marca de agua adicional con email del usuario y
 *   bloqueo de menú contextual.
 * - Fullscreen custom: se hace en el contenedor (no en el iframe) para
 *   que el overlay del watermark del browser quede arriba del video.
 */
export function ProtectedVideo({ otp, playbackInfo, userEmail, title }: ProtectedVideoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFs, setIsFs] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen") {
        navigator.clipboard?.writeText("").catch(() => undefined);
      }
    };
    const onFsChange = () => setIsFs(document.fullscreenElement === containerRef.current);
    window.addEventListener("keydown", onKey, { capture: true });
    document.addEventListener("fullscreenchange", onFsChange);
    return () => {
      window.removeEventListener("keydown", onKey, { capture: true } as EventListenerOptions);
      document.removeEventListener("fullscreenchange", onFsChange);
    };
  }, []);

  const toggleFs = async () => {
    const el = containerRef.current; if (!el) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await el.requestFullscreen();
    } catch { /* noop */ }
  };

  const watermark = `${userEmail} · ${new Date().toLocaleDateString()}`;

  const playerUrl = `https://player.vdocipher.com/v2/?otp=${encodeURIComponent(otp)}&playbackInfo=${encodeURIComponent(playbackInfo)}`;

  return (
    <div
      ref={containerRef}
      className={
        "group relative w-full overflow-hidden border border-border bg-black select-none " +
        (isFs ? "h-screen" : "aspect-video rounded-xl")
      }
      onContextMenu={(e) => e.preventDefault()}
    >
      <iframe
        src={playerUrl}
        title={title ?? "Lección"}
        allow="encrypted-media"
        className="absolute inset-0 h-full w-full"
      />

      {/* Marca de agua visual repetida (capa cliente, además del watermark
          quemado en el stream por VdoCipher). */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden text-[11px] font-medium text-white/15"
        style={{ mixBlendMode: "difference" }}
      >
        <div className="absolute inset-0 -rotate-[18deg]">
          <div className="flex h-[200%] w-[200%] flex-wrap content-start gap-x-12 gap-y-8 p-6">
            {Array.from({ length: 80 }).map((_, i) => (
              <span key={i} className="whitespace-nowrap">{watermark}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Badge con email del usuario, siempre visible */}
      <div className="pointer-events-none absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-medium text-white/90 backdrop-blur">
        <Eye className="h-3 w-3" /> {userEmail}
      </div>

      {title && (
        <div className="pointer-events-none absolute left-3 top-3 rounded bg-black/60 px-2 py-1 text-[10px] font-medium text-white/90 backdrop-blur">
          {title}
        </div>
      )}

      {/* Botón fullscreen propio (el container va fullscreen, no el iframe) */}
      <button
        type="button"
        onClick={toggleFs}
        aria-label={isFs ? "Salir de pantalla completa" : "Pantalla completa"}
        className="absolute bottom-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-md bg-black/60 text-white/80 opacity-0 backdrop-blur transition-opacity hover:bg-black/80 hover:text-white group-hover:opacity-100"
      >
        {isFs ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
      </button>
    </div>
  );
}
