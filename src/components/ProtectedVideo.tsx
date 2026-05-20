import { useEffect } from "react";
import { Eye } from "lucide-react";

interface ProtectedVideoProps {
  /** OTP de VdoCipher */
  otp: string;
  /** playbackInfo de VdoCipher (base64) */
  playbackInfo: string;
  userEmail: string;
  title?: string;
}

/**
 * Reproductor VdoCipher con DRM real (Widevine/FairPlay) y watermark
 * server-side. Capas extra: marca de agua visible con email del usuario
 * y bloqueo de menú contextual + clipboard al detectar PrintScreen.
 *
 * Ya no obscurecemos por blur/visibility porque rompía la experiencia
 * en fullscreen y clicks legítimos. La protección real es la de VdoCipher.
 */
export function ProtectedVideo({ otp, playbackInfo, userEmail, title }: ProtectedVideoProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen") {
        navigator.clipboard?.writeText("").catch(() => undefined);
      }
    };
    window.addEventListener("keydown", onKey, { capture: true });
    return () => window.removeEventListener("keydown", onKey, { capture: true } as EventListenerOptions);
  }, []);

  const watermark = `${userEmail} · ${new Date().toLocaleDateString()}`;

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
      />

      {/* Marca de agua visual extra (capa cliente) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden text-[11px] font-medium text-white/10"
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
    </div>
  );
}
