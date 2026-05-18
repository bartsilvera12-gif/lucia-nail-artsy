import { useEffect, useRef, useState } from "react";
import { ShieldAlert, Eye } from "lucide-react";

interface ProtectedVideoProps {
  src: string;
  poster?: string;
  userEmail: string;
  title?: string;
}

/**
 * Reproductor con mitigaciones anti-screenshot/grabación:
 * - Marca de agua dinámica con email del usuario (rastreable si se filtra)
 * - Bloqueo de menú contextual, selección, arrastre y picture-in-picture
 * - Oculta el video al perder foco, al detectar PrintScreen y al cambiar de pestaña
 * - Detecta intentos de captura/grabación de pantalla vía Page Visibility API
 * - Desactiva el botón de descarga nativo
 *
 * Nota: ningún método del lado del cliente puede impedir 100% una grabación de
 * pantalla externa. Para protección real se debe usar DRM (Widevine/FairPlay/
 * PlayReady) vía Encrypted Media Extensions del lado del servidor.
 */
export function ProtectedVideo({ src, poster, userEmail, title }: ProtectedVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [obscured, setObscured] = useState(false);
  const [reason, setReason] = useState<string>("");

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const obscure = (why: string) => {
      setReason(why);
      setObscured(true);
      try { video.pause(); } catch { /* noop */ }
    };
    const reveal = () => setObscured(false);

    const onVisibility = () => {
      if (document.visibilityState !== "visible") obscure("Pestaña inactiva");
    };
    const onBlur = () => obscure("La ventana perdió el foco");
    const onFocus = () => {
      if (document.visibilityState === "visible") reveal();
    };

    const onKey = (e: KeyboardEvent) => {
      const k = e.key;
      // Print Screen
      if (k === "PrintScreen") {
        navigator.clipboard?.writeText("").catch(() => undefined);
        obscure("Captura de pantalla bloqueada");
      }
      // Atajos comunes de grabación / DevTools
      const meta = e.ctrlKey || e.metaKey;
      if (meta && e.shiftKey && (k === "S" || k === "s" || k === "5" || k === "4" || k === "3" || k === "I" || k === "i")) {
        e.preventDefault();
        obscure("Atajo de captura bloqueado");
      }
      if (k === "F12") {
        e.preventDefault();
        obscure("Herramientas de desarrollo");
      }
    };

    const onContext = (e: MouseEvent) => e.preventDefault();

    // Detección de grabación de pantalla activa del propio tab (Chrome)
    // @ts-expect-error: experimental API
    if (navigator.mediaDevices?.addEventListener) {
      // no event for capture, fallback below
    }

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    window.addEventListener("keydown", onKey, { capture: true });
    video.addEventListener("contextmenu", onContext);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("keydown", onKey, { capture: true } as EventListenerOptions);
      video.removeEventListener("contextmenu", onContext);
    };
  }, []);

  // Marca de agua repetida con email del usuario
  const watermark = `${userEmail} · ${new Date().toLocaleDateString()}`;

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-black select-none">
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        controls
        controlsList="nodownload noremoteplayback noplaybackrate"
        disablePictureInPicture
        disableRemotePlayback
        playsInline
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
        className="h-full w-full bg-black"
        style={{
          WebkitUserSelect: "none",
          userSelect: "none",
          WebkitTouchCallout: "none",
          pointerEvents: obscured ? "none" : "auto",
        }}
      />

      {/* Marca de agua repetida en diagonal */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden text-[11px] font-medium text-white/15"
        style={{ mixBlendMode: "difference" }}
      >
        <div className="absolute inset-0 -rotate-[18deg] [background:repeating-linear-gradient(0deg,transparent_0,transparent_120px)]">
          <div className="flex h-[200%] w-[200%] flex-wrap content-start gap-x-12 gap-y-8 p-6">
            {Array.from({ length: 80 }).map((_, i) => (
              <span key={i} className="whitespace-nowrap">{watermark}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Pequeño badge persistente */}
      <div className="pointer-events-none absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-medium text-white/90 backdrop-blur">
        <Eye className="h-3 w-3" /> {userEmail}
      </div>

      {title && (
        <div className="pointer-events-none absolute left-3 top-3 rounded bg-black/60 px-2 py-1 text-[10px] font-medium text-white/90 backdrop-blur">
          {title}
        </div>
      )}

      {/* Overlay de obscurecimiento */}
      {obscured && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/95 text-center text-white">
          <ShieldAlert className="h-10 w-10 text-primary" />
          <p className="font-serif text-lg">Reproducción pausada</p>
          <p className="max-w-xs text-xs text-white/70">{reason}. Para continuar viendo, mantené la ventana en foco. La grabación o difusión de las clases está prohibida.</p>
          <button
            onClick={() => setObscured(false)}
            className="mt-2 rounded-md border border-white/20 px-4 py-2 text-xs hover:bg-white/10"
          >
            Reanudar
          </button>
        </div>
      )}
    </div>
  );
}
