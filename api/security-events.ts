/**
 * Vercel Edge Function — registra eventos de seguridad de la plataforma.
 *
 * POST /api/security-events
 * Body: {
 *   event_type: string,
 *   course_id?: string,
 *   lesson_id?: string,
 *   metadata?: Record<string, unknown>,
 * }
 *
 * Devuelve { ok: true, suspicious: boolean }.
 * suspicious=true cuando el usuario disparó 3+ eventos en los últimos 10 minutos.
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const ABUSE_THRESHOLD = 3;
const ABUSE_WINDOW_MINUTES = 10;

const ALLOWED_TYPES = new Set([
  "contextmenu", "copy", "printscreen",
  "shortcut_copy", "shortcut_save", "shortcut_print", "shortcut_view_source",
  "shortcut_devtools", "shortcut_capture",
  "visibility_hidden", "window_blur", "window_focus",
  "fullscreen_enter", "fullscreen_exit",
  "displaymedia_request", "displaymedia_active", "displaymedia_ended",
  "mediadevices_change",
]);

function getClientIp(req: Request): string | null {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() ?? null;
  return (
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-real-ip") ??
    null
  );
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response("Servidor mal configurado", { status: 500 });
  }

  const auth = req.headers.get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) return new Response("Sin sesión", { status: 401 });

  let body: { event_type?: string; course_id?: string; lesson_id?: string; metadata?: Record<string, unknown> };
  try { body = await req.json(); } catch { return new Response("JSON inválido", { status: 400 }); }
  const event_type = body.event_type?.toString();
  if (!event_type || !ALLOWED_TYPES.has(event_type)) {
    return new Response("event_type inválido", { status: 400 });
  }

  // Validar sesión
  const userResp = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: auth },
  });
  if (!userResp.ok) return new Response("Token inválido", { status: 401 });
  const user = (await userResp.json()) as { id: string; email?: string };

  const ip = getClientIp(req);
  const userAgent = req.headers.get("user-agent");

  // Insertar evento usando service_role (bypassea RLS)
  const insertResp = await fetch(`${SUPABASE_URL}/rest/v1/security_events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Profile": "lucianails",
      Prefer: "return=minimal",
    },
    body: JSON.stringify([
      {
        user_id: user.id,
        email: user.email ?? null,
        event_type,
        course_id: body.course_id ?? null,
        lesson_id: body.lesson_id ?? null,
        ip_address: ip,
        user_agent: userAgent,
        metadata: body.metadata ?? {},
      },
    ]),
  });
  if (!insertResp.ok) {
    return new Response(`Insert error: ${await insertResp.text()}`, { status: 500 });
  }

  // Detectar abuso: 3+ eventos en 10 minutos
  const rpcResp = await fetch(`${SUPABASE_URL}/rest/v1/rpc/recent_security_event_count`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Profile": "lucianails",
    },
    body: JSON.stringify({ p_user_id: user.id, p_minutes: ABUSE_WINDOW_MINUTES }),
  });
  let recent = 0;
  if (rpcResp.ok) {
    const raw = await rpcResp.json();
    recent = typeof raw === "number" ? raw : Number(raw) || 0;
  }
  const suspicious = recent >= ABUSE_THRESHOLD;

  return new Response(
    JSON.stringify({ ok: true, suspicious, recent }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

export const config = { runtime: "edge" };
