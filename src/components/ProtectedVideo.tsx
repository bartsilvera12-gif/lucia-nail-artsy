import { useEffect, useState } from "react";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

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

// ── Video Security Layer ─────────────────────────────────────────────────────
// Aceptacion del aviso anti-grabacion. Se guarda en sessionStorage (no
// localStorage) — si la alumna cierra el navegador y vuelve, debe ver el
// aviso otra vez. Es una decision de seguridad: no queremos persistir el
// "ya lo viste" para siempre.
const WARNING_SESSION_KEY = "lrs_recording_warning_accepted";

function isTouchDevice(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(pointer: coarse)").matches;
}

function hasAcceptedWarning(): boolean {
  if (typeof sessionStorage === "undefined") return false;
  try {
    return sessionStorage.getItem(WARNING_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

function markWarningAccepted() {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(WARNING_SESSION_KEY, "1");
  } catch { /* ignore quota / private-mode errors */ }
}

/**
 * Iframe nativo de DynTube con capa propia de seguridad.
 *
 * Capas de proteccion:
 *   1. Acceso: la ruta padre verifica acceso antes de renderizar.
 *   2. Domain lock: DynTube valida en su servidor.
 *   3. AES-128: chunks encriptados.
 *   4. Anti-captura desktop (este componente): PrintScreen / Snipping Tool /
 *      atajos Cmd+Shift+3-5 -> overlay disuasorio.
 *   5. Anti-grabacion mobile (este componente, step 1 VSL): modal previo
 *      que la alumna debe aceptar antes de que se renderice el iframe.
 *      Solo se muestra en dispositivos touch y se persiste por sesion.
 *
 * Nota importante: en mobile NO hay forma confiable de detectar screen
 * recording. visibilitychange/blur son señales indirectas (se disparan al
 * abrir Control Center / panel notif / cambiar de app, pero tambien por
 * llamadas y notificaciones legitimas). Lo usamos como disuasivo, no como
 * deteccion 100% real. La proteccion real solo seria posible en una app
 * nativa (FLAG_SECURE en Android, screenCaptureProtected en iOS).
 */
export function ProtectedVideo({ videoKey, title }: DynTubeVideoProps) {
  const [warning, setWarning] = useState<string | null>(null);

  // Modal anti-grabacion (solo mobile). En desktop arrancamos en true para
  // no mostrar nada — la proteccion desktop sigue siendo el handler de
  // PrintScreen / atajos. SSR-safe: en el server arrancamos en true asi no
  // bloqueamos el render inicial. El primer useEffect ajusta si es mobile.
  const [warningAccepted, setWarningAccepted] = useState(true);

  // Overlay persistente de pausa por perdida de foco (VSL paso 2). A
  // diferencia de `warning` (auto-dismiss 4.5s para eventos de teclado en
  // desktop), este overlay NO se cierra solo. La alumna tiene que tocar
  // "Continuar reproduccion" para sacarlo. Solo se dispara en mobile y
  // solo despues de que acepto el modal del paso 1.
  const [securityPause, setSecurityPause] = useState<{ reason: string } | null>(null);

  const showWarning = (message: string) => {
    setWarning(message);
    window.setTimeout(() => setWarning(null), 4500);
  };

  // En mount (cliente), decidimos si hay que mostrar el modal.
  useEffect(() => {
    if (isTouchDevice() && !hasAcceptedWarning()) {
      setWarningAccepted(false);
    }
  }, []);

  const handleAcceptWarning = () => {
    markWarningAccepted();
    setWarningAccepted(true);
    // TODO (VSL step 6): emitir RPC record_video_event con
    // event_type="recording_warning_accepted" una vez creada la tabla
    // video_play_events. Por ahora la aceptacion vive solo client-side.
  };

  const handleResumePlayback = () => {
    setSecurityPause(null);
    // No podemos controlar el iframe de DynTube (cross-origin), asi que
    // solo escondemos el overlay. Si el OS pauso el video al cambiar de
    // app, la alumna lo va a tener que reanudar tocando play en el player.
  };

  // ── Handlers de teclado desktop (PrintScreen / atajos) ─────────────────────
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

  // ── Overlay de pausa preventiva en mobile (VSL paso 2) ─────────────────────
  // Importante: NO es deteccion real de screen recording. Son señales
  // INDIRECTAS — visibilitychange/blur/pagehide/freeze se disparan al abrir
  // Control Center o panel notif (que es donde esta el boton de grabar) pero
  // tambien por llamadas, notificaciones, cambio de app y bloqueo de pantalla.
  // Tratamos todos esos casos por igual y mostramos el overlay disuasorio.
  //
  // Solo se activa cuando:
  //   - es un dispositivo touch
  //   - la alumna ya acepto el modal del paso 1 (sino no esta reproduciendo)
  //   - el overlay no esta ya visible (evitamos re-trigger durante la pausa)
  useEffect(() => {
    if (!warningAccepted) return;
    const touch = isTouchDevice();
    if (!touch) return;

    const triggerSecurityPause = (reason: string) => {
      // Si ya hay overlay activo, no lo re-trigereamos. Usamos updater para
      // leer el valor mas reciente sin meter securityPause en deps.
      setSecurityPause((curr) => curr ?? { reason });
      // TODO (VSL paso 6): emitir RPC record_video_event con
      // event_type="possible_screen_recording_attempt" + metadata={reason}.
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        triggerSecurityPause("visibilitychange");
      }
    };

    // Android Chrome no siempre marca la pagina como hidden cuando se baja
    // el panel de notificaciones — pero si se pierde el focus de la ventana.
    // Filtramos el caso normal: tocar el iframe transfiere foco al IFRAME,
    // eso NO debe disparar el overlay.
    const onBlur = () => {
      window.setTimeout(() => {
        const active = document.activeElement;
        if (active && active.tagName === "IFRAME") return;
        if (document.visibilityState === "hidden") return; // ya lo cubrio onVisibility
        triggerSecurityPause("blur");
      }, 0);
    };

    // pagehide: se dispara cuando la pagina entra al bfcache o se descarga.
    // Util para iOS Safari cuando la alumna sale a otra app y vuelve.
    const onPageHide = () => triggerSecurityPause("pagehide");

    // freeze (Page Lifecycle API): la tab pasa a estado frozen. Solo lo
    // soportan algunos browsers — si no existe, no hacemos nada.
    const onFreeze = () => triggerSecurityPause("freeze");

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    window.addEventListener("pagehide", onPageHide);
    // `freeze` no esta tipado en lib.dom — addEventListener acepta el string
    // igual y los browsers que no lo soportan simplemente no lo disparan.
    document.addEventListener("freeze", onFreeze as EventListener);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("pagehide", onPageHide);
      document.removeEventListener("freeze", onFreeze as EventListener);
    };
  }, [warningAccepted]);

  return (
    <div
      className="relative mx-auto w-full overflow-hidden rounded-xl border border-border bg-black select-none"
      style={{ aspectRatio: "9 / 16", maxWidth: "min(100%, calc((100vh - 200px) * 9 / 16))" }}
      onContextMenu={(e) => {
        e.preventDefault();
        showWarning("Las capturas de pantalla no están permitidas.");
      }}
    >
      {/* Iframe de DynTube — solo se renderiza despues de aceptar el aviso.
          En desktop warningAccepted arranca en true, asi que se renderiza
          inmediatamente. */}
      {warningAccepted && (
        <iframe
          src={`https://videos.dyntube.com/iframes/${videoKey}`}
          title={title ?? "Lección"}
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          allowFullScreen
          scrolling="no"
          className="absolute inset-0 h-full w-full border-0"
          style={{ border: "none" }}
        />
      )}

      {/* Modal anti-grabacion mobile (VSL step 1). Bloquea el iframe hasta
          que la alumna acepte. La aceptacion vive en sessionStorage. */}
      {!warningAccepted && (
        <div
          className="absolute inset-0 z-40 flex items-center justify-center bg-black/95 px-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby="vsl-warning-title"
        >
          <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-zinc-900 via-black to-zinc-900 p-6 text-center shadow-2xl">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 ring-1 ring-primary/40">
              <ShieldCheck className="h-7 w-7 text-primary" strokeWidth={1.75} />
            </div>

            <h2
              id="vsl-warning-title"
              className="mt-4 font-serif text-lg leading-snug text-white sm:text-xl"
            >
              Antes de empezar
            </h2>

            <p className="mt-3 text-sm leading-relaxed text-zinc-300">
              Por seguridad del contenido, no está permitido grabar la pantalla,
              compartir el acceso ni distribuir este material.
            </p>

            <div aria-hidden className="my-5 mx-auto h-px w-12 bg-primary/40" />

            <Button
              type="button"
              variant="gold"
              className="w-full"
              onClick={handleAcceptWarning}
            >
              Entiendo y continuar
            </Button>

            <p className="mt-3 text-[11px] leading-relaxed text-zinc-500">
              El contenido es propiedad de
              <span className="text-zinc-300"> Lucía Rojas Studio</span>.
              Reproducirlo fuera de la plataforma puede generar la baja
              inmediata de tu acceso.
            </p>
          </div>
        </div>
      )}

      {/* Overlay persistente de pausa preventiva (VSL paso 2). Solo en mobile,
          se dispara al perder foco/visibilidad y se queda hasta que la alumna
          toque "Continuar reproduccion". */}
      {securityPause && warningAccepted && (
        <div
          className="absolute inset-0 z-40 flex items-center justify-center bg-black/95 px-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby="vsl-pause-title"
        >
          <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-zinc-900 via-black to-zinc-900 p-6 text-center shadow-2xl">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 ring-1 ring-primary/40">
              <ShieldAlert className="h-7 w-7 text-primary" strokeWidth={1.75} />
            </div>

            <h2
              id="vsl-pause-title"
              className="mt-4 font-serif text-lg leading-snug text-white sm:text-xl"
            >
              El video fue pausado por seguridad
            </h2>

            <p className="mt-3 text-sm leading-relaxed text-zinc-300">
              No está permitido grabar pantalla.
            </p>

            <div aria-hidden className="my-5 mx-auto h-px w-12 bg-primary/40" />

            <Button
              type="button"
              variant="gold"
              className="w-full"
              onClick={handleResumePlayback}
            >
              Continuar reproducción
            </Button>

            <p className="mt-3 text-[11px] leading-relaxed text-zinc-500">
              Si esta pausa fue por una notificación o llamada, podés continuar
              sin problema. Reproducir este contenido fuera de la plataforma
              puede generar la baja inmediata de tu acceso.
            </p>
          </div>
        </div>
      )}

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
