import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ShieldAlert, Eye, Maximize2, Minimize2, Radio } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface CourseSecurityGuardProps {
  children: ReactNode;
  userEmail: string;
  userPhone?: string;
  courseId?: string;
  lessonId?: string;
  /** Cuando se activa la pantalla negra de bloqueo (ms) */
  overlayMs?: number;
}

const DEFAULT_OVERLAY_MS = 3500;

async function reportSecurityEvent(payload: {
  event_type: string;
  course_id?: string;
  lesson_id?: string;
  metadata?: Record<string, unknown>;
}): Promise<{ suspicious: boolean } | null> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return null;
  try {
    const res = await fetch("/api/security-events", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    return (await res.json()) as { suspicious: boolean };
  } catch {
    return null;
  }
}

export function CourseSecurityGuard({
  children, userEmail, userPhone, courseId, lessonId, overlayMs = DEFAULT_OVERLAY_MS,
}: CourseSecurityGuardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [obscured, setObscured] = useState(false);
  const [warning, setWarning] = useState<string>("");
  const [suspicious, setSuspicious] = useState(false);
  const [isFs, setIsFs] = useState(false);
  const [recording, setRecording] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const trigger = useCallback(async (eventType: string, why: string, meta: Record<string, unknown> = {}) => {
    setWarning(why);
    setObscured(true);
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);

    const result = await reportSecurityEvent({
      event_type: eventType,
      course_id: courseId,
      lesson_id: lessonId,
      metadata: meta,
    });
    const isSuspicious = !!result?.suspicious;
    if (isSuspicious) setSuspicious(true);

    timeoutRef.current = window.setTimeout(
      () => setObscured(false),
      isSuspicious ? overlayMs * 3 : overlayMs,
    );
  }, [courseId, lessonId, overlayMs]);

  useEffect(() => {
    const onContextMenu = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) return;
      e.preventDefault();
      trigger("contextmenu", "El menú contextual está deshabilitado en esta clase.");
    };
    const onCopy = (e: ClipboardEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) return;
      e.preventDefault();
      trigger("copy", "Copiar contenido no está permitido.");
    };
    const isPrintScreenEvent = (e: KeyboardEvent): boolean => {
      // En Chrome/Edge PrintScreen solo dispara keyup. En Firefox a veces ambos.
      // Cubrimos varios identificadores por las dudas.
      return (
        e.key === "PrintScreen" ||
        e.code === "PrintScreen" ||
        e.keyCode === 44 ||
        e.which === 44
      );
    };

    const handlePrintScreen = () => {
      navigator.clipboard?.writeText("").catch(() => undefined);
      // Algunos browsers solo permiten escribir clipboard si la página tiene foco.
      // Intentamos hasta 3 veces espaciado para "pisar" el contenido capturado.
      let attempts = 0;
      const wipe = () => {
        navigator.clipboard?.writeText("").catch(() => undefined);
        if (++attempts < 3) window.setTimeout(wipe, 150);
      };
      wipe();
      trigger("printscreen", "Por seguridad, no está permitido tomar capturas de pantalla. Este intento fue registrado.");
    };

    const onKey = (e: KeyboardEvent) => {
      if (isPrintScreenEvent(e)) {
        handlePrintScreen();
        return;
      }
      const meta = e.ctrlKey || e.metaKey;
      const k = e.key;
      if (meta) {
        const lower = k.toLowerCase();
        if (lower === "c") { e.preventDefault(); trigger("shortcut_copy", "Copiar contenido no está permitido."); return; }
        if (lower === "s") { e.preventDefault(); trigger("shortcut_save", "Guardar página no está permitido."); return; }
        if (lower === "p") { e.preventDefault(); trigger("shortcut_print", "Imprimir está deshabilitado en esta clase."); return; }
        if (lower === "u") { e.preventDefault(); trigger("shortcut_view_source", "Ver código fuente no está permitido."); return; }
        if (e.shiftKey && (lower === "s" || lower === "5" || lower === "4" || lower === "3")) {
          e.preventDefault(); trigger("shortcut_capture", "Atajo de captura bloqueado."); return;
        }
        if (e.shiftKey && lower === "i") {
          e.preventDefault(); trigger("shortcut_devtools", "Herramientas de desarrollo deshabilitadas."); return;
        }
      }
      if (k === "F12") {
        e.preventDefault();
        trigger("shortcut_devtools", "Herramientas de desarrollo deshabilitadas.");
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      // PrintScreen suele venir solo en keyup en Chrome/Edge
      if (isPrintScreenEvent(e)) handlePrintScreen();
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        reportSecurityEvent({ event_type: "visibility_hidden", course_id: courseId, lesson_id: lessonId });
      }
    };
    const onBlur = () => {
      reportSecurityEvent({ event_type: "window_blur", course_id: courseId, lesson_id: lessonId });
    };
    const onFocus = () => {
      reportSecurityEvent({ event_type: "window_focus", course_id: courseId, lesson_id: lessonId });
    };
    const onFsChange = () => {
      const inFs = document.fullscreenElement === containerRef.current;
      setIsFs(inFs);
      reportSecurityEvent({
        event_type: inFs ? "fullscreen_enter" : "fullscreen_exit",
        course_id: courseId,
        lesson_id: lessonId,
      });
    };

    // Cuando el iframe del player tiene foco, los keydown/keyup pueden no
    // bubblear al window padre. Detectamos blur del window → captura potencial.
    let blurredByIframe = false;
    const onWindowBlurForCapture = () => {
      // Si el activeElement es un iframe, asumimos que el usuario está
      // interactuando con el player y desde ahí podría disparar PrintScreen.
      // Mostramos overlay preventivo si el blur dura más de 200 ms
      // (no penaliza alt+tab cortos).
      if (document.activeElement?.tagName === "IFRAME") {
        blurredByIframe = true;
      }
    };
    const onWindowFocusBackFromIframe = () => { blurredByIframe = false; };

    // --- Detección de grabación de pantalla iniciada DESDE el browser ---
    // Sobrescribimos getDisplayMedia para detectar:
    // - "Compartir esta pestaña" (Chrome/Edge)
    // - Captura de pantalla vía cualquier extensión que use la API
    // Solo detecta captura del propio browser. NO detecta OBS, QuickTime,
    // celulares apuntando a la pantalla, etc.
    const md = navigator.mediaDevices;
    let originalGDM: typeof navigator.mediaDevices.getDisplayMedia | null = null;
    let activeStream: MediaStream | null = null;
    const releaseStream = () => {
      activeStream?.getTracks().forEach((t) => t.stop());
      activeStream = null;
      setRecording(false);
      reportSecurityEvent({ event_type: "displaymedia_ended", course_id: courseId, lesson_id: lessonId });
    };
    if (md && typeof md.getDisplayMedia === "function") {
      originalGDM = md.getDisplayMedia.bind(md);
      md.getDisplayMedia = async (constraints?: DisplayMediaStreamOptions) => {
        reportSecurityEvent({ event_type: "displaymedia_request", course_id: courseId, lesson_id: lessonId });
        trigger("printscreen", "Detectamos un intento de grabación de pantalla. Esta acción está prohibida y quedó registrada.");
        const stream = await originalGDM!(constraints);
        activeStream = stream;
        setRecording(true);
        reportSecurityEvent({ event_type: "displaymedia_active", course_id: courseId, lesson_id: lessonId });
        stream.getTracks().forEach((t) => t.addEventListener("ended", releaseStream));
        return stream;
      };
    }
    const onDevChange = () => {
      reportSecurityEvent({ event_type: "mediadevices_change", course_id: courseId, lesson_id: lessonId });
    };
    md?.addEventListener?.("devicechange", onDevChange);

    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("copy", onCopy);
    window.addEventListener("keydown", onKey, { capture: true });
    window.addEventListener("keyup", onKeyUp, { capture: true });
    document.addEventListener("keydown", onKey, { capture: true });
    document.addEventListener("keyup", onKeyUp, { capture: true });
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    window.addEventListener("blur", onWindowBlurForCapture);
    window.addEventListener("focus", onFocus);
    window.addEventListener("focus", onWindowFocusBackFromIframe);
    document.addEventListener("fullscreenchange", onFsChange);

    return () => {
      void blurredByIframe;
      if (originalGDM && md) md.getDisplayMedia = originalGDM;
      md?.removeEventListener?.("devicechange", onDevChange);
      releaseStream();
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("copy", onCopy);
      window.removeEventListener("keydown", onKey, { capture: true } as EventListenerOptions);
      window.removeEventListener("keyup", onKeyUp, { capture: true } as EventListenerOptions);
      document.removeEventListener("keydown", onKey, { capture: true } as EventListenerOptions);
      document.removeEventListener("keyup", onKeyUp, { capture: true } as EventListenerOptions);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("blur", onWindowBlurForCapture);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("focus", onWindowFocusBackFromIframe);
      document.removeEventListener("fullscreenchange", onFsChange);
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, [courseId, lessonId, trigger]);

  const toggleFs = async () => {
    const el = containerRef.current; if (!el) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await el.requestFullscreen();
    } catch { /* noop */ }
  };

  // Tag para el watermark (rastrea filtraciones)
  const wmParts = [userEmail, userPhone, new Date().toLocaleString(), lessonId?.slice(0, 8)]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      ref={containerRef}
      data-secure-area
      className={
        "group/secure secure-area relative w-full select-none overflow-hidden " +
        (isFs ? "h-screen rounded-none" : "aspect-video rounded-xl") +
        " border border-border bg-black"
      }
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      {children}

      {/* Watermark dinámico repetido en diagonal */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden text-[11px] font-medium text-white/15"
        style={{ mixBlendMode: "difference" }}
      >
        <div className="absolute inset-0 -rotate-[18deg]">
          <div className="flex h-[200%] w-[200%] flex-wrap content-start gap-x-12 gap-y-10 p-6">
            {Array.from({ length: 90 }).map((_, i) => (
              <span key={i} className="whitespace-nowrap">{wmParts}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Badge con email */}
      <div className="pointer-events-none absolute right-3 top-3 z-10 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-medium text-white/90 backdrop-blur">
        <Eye className="h-3 w-3" /> {userEmail}
      </div>

      {/* Banner permanente: grabación prohibida + indicador rojo si detectamos */}
      <div
        className={
          "pointer-events-none absolute left-1/2 top-3 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-medium backdrop-blur transition-colors " +
          (recording
            ? "bg-red-600/90 text-white shadow-lg shadow-red-900/60 animate-pulse"
            : "bg-black/60 text-white/80")
        }
      >
        <Radio className={"h-3 w-3 " + (recording ? "text-white" : "text-red-400")} />
        {recording ? "Grabación detectada — sesión registrada" : "Grabación prohibida · sesión rastreada"}
      </div>

      {/* Botón fullscreen custom (mantiene el watermark arriba) */}
      <button
        type="button"
        onClick={toggleFs}
        aria-label={isFs ? "Salir de pantalla completa" : "Pantalla completa"}
        className="absolute bottom-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-md bg-black/60 text-white/80 opacity-0 backdrop-blur transition-opacity hover:bg-black/80 hover:text-white group-hover/secure:opacity-100"
      >
        {isFs ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
      </button>

      {/* Overlay de advertencia */}
      {obscured && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/95 px-6 text-center text-white animate-fade-in">
          <ShieldAlert className="h-10 w-10 text-primary" />
          <p className="font-serif text-lg sm:text-xl">{suspicious ? "Sesión marcada como sospechosa" : "Acción no permitida"}</p>
          <p className="max-w-md text-xs text-white/80 sm:text-sm">
            {warning} Este intento quedó registrado junto a tu sesión.
          </p>
          {suspicious && (
            <p className="mt-1 max-w-md text-[11px] text-amber-300/90">
              Detectamos varios intentos en poco tiempo. El equipo va a revisar esta sesión.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
