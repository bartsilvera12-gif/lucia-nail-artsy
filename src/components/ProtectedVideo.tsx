import { useEffect, useState } from "react";
import { ShieldAlert, Eye } from "lucide-react";

interface ProtectedVideoProps {
  /** OTP de VdoCipher */
  otp: string;
  /** playbackInfo de VdoCipher (base64) */
  playbackInfo: string;
  userEmail: string;
  title?: string;
}

/**
 * Reproductor VdoCipher con DRM real + capas extra anti-screenshot/grabación:
 * - Marca de agua persistente con email (sumada al watermark dinámico del propio VdoCipher)
 * - Bloqueo de menú contextual y selección
 * - Pausa visual al perder foco / detectar PrintScreen / atajos de captura
 *
 * Nota: VdoCipher ya cifra el video con Widevine/FairPlay y embebe watermark
 * dinámico en el lado del servidor. Esto es una segunda capa visual.
 */
export function ProtectedVideo({ otp, playbackInfo, userEmail, title }: ProtectedVideoProps) {
  const [obscured, setObscured] = useState(false);
  const [reason, setReason] = useState<string>("");

  useEffect(() => {
    const obscure = (why: string) => { setReason(why); setObscured(true); };

    const onVisibility = () => {
      if (document.visibilityState !== "visible") obscure("Pestaña inactiva");
    };
    const onBlur = () => obscure("La ventana perdió el foco");
    const onFocus = () => { if (document.visibilityState === "visible") setObscured(false); };

    const onKey = (e: KeyboardEvent) => {
      const k = e.key;
      if (k === "PrintScreen") {
        navigator.clipboard?.writeText("").catch(() => undefined);
        obscure("Captura de pantalla bloqueada");
      }
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

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    window.addEventListener("keydown", onKey, { capture: true });

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("keydown", onKey, { capture: true } as EventListenerOptions);
    };
  }, []);

  const watermark = `${userEmail} · ${new Date().toLocaleDateString()}`;

  // VdoCipher player URL: https://player.vdocipher.com/v2/?otp=...&playbackInfo=...
  const playerUrl = `https://player.vdocipher.com/v2/?otp=${encodeURIComponent(otp)}&playbackInfo=${encodeURIComponent(playbackInfo)}`;

  return (
    <div
      className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-black select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      <iframe
        src={playerUrl}
        title={title ?? "Lección"}
        allow="encrypted-media; fullscreen"
        allowFullScreen
        className="absolute inset-0 h-full w-full"
        style={{ pointerEvents: obscured ? "none" : "auto" }}
      />

      {/* Marca de agua visual extra (capa cliente) */}
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

      <div className="pointer-events-none absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-medium text-white/90 backdrop-blur">
        <Eye className="h-3 w-3" /> {userEmail}
      </div>

      {title && (
        <div className="pointer-events-none absolute left-3 top-3 rounded bg-black/60 px-2 py-1 text-[10px] font-medium text-white/90 backdrop-blur">
          {title}
        </div>
      )}

      {obscured && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/95 text-center text-white">
          <ShieldAlert className="h-10 w-10 text-primary" />
          <p className="font-serif text-lg">Reproducción pausada</p>
          <p className="max-w-xs text-xs text-white/70">{reason}. Mantené la ventana en foco para continuar. La grabación o difusión de las clases está prohibida y rastreable.</p>
          <button onClick={() => setObscured(false)} className="mt-2 rounded-md border border-white/20 px-4 py-2 text-xs hover:bg-white/10">
            Reanudar
          </button>
        </div>
      )}
    </div>
  );
}
