/**
 * Vercel Serverless Function — genera OTP de VdoCipher para una lección.
 *
 * Flujo:
 *  1. Recibe { lessonId } + JWT del usuario en Authorization.
 *  2. Verifica el JWT contra Supabase.
 *  3. Lee la lección y su curso. Determina si el usuario tiene acceso
 *     (admin, free preview, compra individual o membresía activa).
 *  4. Si pasa, llama a VdoCipher con el API Secret server-side
 *     y devuelve { otp, playbackInfo } al cliente.
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
const VDOCIPHER_API_SECRET = process.env.VDOCIPHER_API_SECRET;

interface LessonRow {
  id: string;
  is_free_preview: boolean;
  video_path: string | null;
  module: {
    course: {
      id: string;
      included_in_membership: boolean;
    };
  };
}

interface ProfileRow { id: string; role: "student" | "admin"; }
interface SubRow { expires_at: string; status: string; }

async function supabaseFetch<T>(path: string, auth: string): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY!,
      Authorization: auth,
      "Accept-Profile": "lucianails",
    },
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !VDOCIPHER_API_SECRET) {
    return new Response("Servidor mal configurado (faltan env vars)", { status: 500 });
  }

  const auth = req.headers.get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) {
    return new Response("Sin autenticación", { status: 401 });
  }

  let body: { lessonId?: string };
  try { body = await req.json(); } catch { return new Response("JSON inválido", { status: 400 }); }
  const lessonId = body.lessonId;
  if (!lessonId) return new Response("Falta lessonId", { status: 400 });

  // 1. Verificar sesión: pedir el usuario actual
  const userResp = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: auth },
  });
  if (!userResp.ok) return new Response("Token inválido", { status: 401 });
  const user = (await userResp.json()) as { id: string; email?: string };

  // 2. Cargar la lección + curso
  const lessons = await supabaseFetch<LessonRow[]>(
    `/rest/v1/lessons?id=eq.${lessonId}&select=id,is_free_preview,video_path,module:modules(course:courses(id,included_in_membership))`,
    auth,
  );
  const lesson = lessons[0];
  if (!lesson) return new Response("Lección no encontrada", { status: 404 });
  if (!lesson.video_path) return new Response("Sin video", { status: 404 });
  const course = lesson.module?.course;
  if (!course) return new Response("Curso no encontrado", { status: 404 });

  // 3. ¿El usuario tiene acceso?
  let hasAccess = lesson.is_free_preview;

  if (!hasAccess) {
    // admin?
    const profiles = await supabaseFetch<ProfileRow[]>(
      `/rest/v1/profiles?id=eq.${user.id}&select=role`,
      auth,
    );
    if (profiles[0]?.role === "admin") hasAccess = true;
  }

  if (!hasAccess) {
    // compra individual?
    const purchases = await supabaseFetch<{ id: string }[]>(
      `/rest/v1/course_purchases?user_id=eq.${user.id}&course_id=eq.${course.id}&select=id&limit=1`,
      auth,
    );
    if (purchases.length > 0) hasAccess = true;
  }

  if (!hasAccess && course.included_in_membership) {
    const nowIso = new Date().toISOString();
    const subs = await supabaseFetch<SubRow[]>(
      `/rest/v1/subscriptions?user_id=eq.${user.id}&status=eq.active&expires_at=gt.${nowIso}&select=expires_at,status&limit=1`,
      auth,
    );
    if (subs.length > 0) hasAccess = true;
  }

  if (!hasAccess) return new Response("Sin acceso a esta lección", { status: 403 });

  // 4. Pedir OTP a VdoCipher
  const vdoResp = await fetch(`https://dev.vdocipher.com/api/videos/${lesson.video_path}/otp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Apisecret ${VDOCIPHER_API_SECRET}`,
    },
    body: JSON.stringify({ ttl: 300 }),
  });
  if (!vdoResp.ok) {
    const errText = await vdoResp.text();
    return new Response(`VdoCipher error: ${errText}`, { status: 502 });
  }
  const vdo = (await vdoResp.json()) as { otp: string; playbackInfo: string };

  return new Response(
    JSON.stringify({
      otp: vdo.otp,
      playbackInfo: vdo.playbackInfo,
      // Datos extra útiles para watermark / log:
      userEmail: user.email,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

export const config = { runtime: "edge" };
