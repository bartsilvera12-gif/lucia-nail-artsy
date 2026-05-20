import { useEffect } from "react";

interface ProtectedVideoProps {
  /** OTP de VdoCipher */
  otp: string;
  /** playbackInfo de VdoCipher (base64) */
  playbackInfo: string;
  userEmail: string;
  title?: string;
}

/**
 * Reproductor VdoCipher. DRM real (Widevine/FairPlay) gestionado por el
 * propio player. Bloqueo de menú contextual + limpieza de clipboard al
 * detectar PrintScreen.
 */
export function ProtectedVideo({ otp, playbackInfo, userEmail, title }: ProtectedVideoProps) {
  void userEmail;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen") {
        navigator.clipboard?.writeText("").catch(() => undefined);
      }
    };
    window.addEventListener("keydown", onKey, { capture: true });
    return () => window.removeEventListener("keydown", onKey, { capture: true } as EventListenerOptions);
  }, []);

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
    </div>
  );
}
