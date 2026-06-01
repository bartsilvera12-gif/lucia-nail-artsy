// server.mjs — Node.js HTTP server for Hostinger SPA deployment
//
// Hostinger config:
//   Build command   : npm run build
//   Output directory: dist
//   Entry file      : server.mjs
//   Node version    : 20.x
//
// After build, postbuild copies this file to dist/server.mjs.
// Hostinger then runs:  node server.mjs  inside dist/
//
// Path resolution strategy:
//   __dirname  ← resolved from import.meta.url  (reliable regardless of cwd)
//   Candidates tested in order:
//     1. {__dirname}/client          ← running from dist/
//     2. {__dirname}/dist/client     ← running from project root
//     3. {__dirname}/../dist/client  ← running from a sub-folder of project root
//     4. {cwd}/dist/client           ← cwd-based fallback
import { createServer }                                     from "node:http";
import { createReadStream, existsSync, statSync, readFileSync } from "node:fs";
import { join, extname }                                    from "node:path";
import { fileURLToPath }                                    from "node:url";
import { createHash }                                       from "node:crypto";

// ── Path resolution ──────────────────────────────────────────────────────────
const __dirname = fileURLToPath(new URL(".", import.meta.url));
const PORT = Number(process.env.PORT) || 3000;

const candidates = [
  join(__dirname, "client"),
  join(__dirname, "dist", "client"),
  join(__dirname, "..", "dist", "client"),
  join(process.cwd(), "dist", "client"),
];

const CLIENT_DIST = candidates.find(
  (p) => existsSync(p) && existsSync(join(p, "index.html"))
);

// ── Startup diagnostics ──────────────────────────────────────────────────────
console.log("[lrs] ── Startup diagnostics ─────────────────────────────────");
console.log("[lrs] __dirname (import.meta.url) :", __dirname);
console.log("[lrs] process.cwd()               :", process.cwd());
console.log("[lrs] PORT                         :", PORT);
candidates.forEach((p, i) => {
  const found = existsSync(p) && existsSync(join(p, "index.html"));
  console.log(`[lrs] candidate[${i}] ${found ? "✓" : "✗"} : ${p}`);
});

if (!CLIENT_DIST) {
  console.error("[lrs] FATAL: no client/index.html found in any candidate path.");
  console.error("[lrs] Run 'npm run build' first.");
  process.exit(1);
}

const INDEX_PATH = join(CLIENT_DIST, "index.html");
console.log("[lrs] Using static folder :", CLIENT_DIST);
console.log("[lrs] index.html          :", existsSync(INDEX_PATH) ? "✓ found" : "✗ MISSING");

// ── VdoCipher config (server-side only — NEVER expose API SECRET to client) ──
const VDOCIPHER_API_SECRET = process.env.VDOCIPHER_API_SECRET || "";

// ── Pagopar config (server-side only — NEVER expose PRIVATE_TOKEN to client) ─
const PAGOPAR_PUBLIC  = process.env.PAGOPAR_PUBLIC_TOKEN  || "";
const PAGOPAR_PRIVATE = process.env.PAGOPAR_PRIVATE_TOKEN || "";
const PAGOPAR_ENV_VAR = process.env.PAGOPAR_ENV           || "development";

// Pagopar API endpoints. Override with PAGOPAR_API_URL if Pagopar provides a different sandbox.
// As of 2025 Pagopar does NOT have a separate sandbox URL — tokens differ per environment.
const PAGOPAR_API_URLS = {
  production:  "https://api.pagopar.com/api/comercios/2.0/iniciar-transaccion",
  development: "https://api.pagopar.com/api/comercios/2.0/iniciar-transaccion",
};
const PAGOPAR_API_URL =
  process.env.PAGOPAR_API_URL ||
  PAGOPAR_API_URLS[PAGOPAR_ENV_VAR] ||
  PAGOPAR_API_URLS.production;

// Lucía Rojas opera en Guaraníes (PYG). No hay conversión de moneda.

// Supabase (for recording orders — service key required for webhook)
const SUPA_URL     = process.env.VITE_SUPABASE_URL        || "";
const SUPA_ANON    = process.env.VITE_SUPABASE_ANON_KEY   || "";
const SUPA_SERVICE = process.env.SUPABASE_SERVICE_KEY     || ""; // optional, needed for webhook

if (!PAGOPAR_PUBLIC || !PAGOPAR_PRIVATE) {
  console.warn("[pagopar] PAGOPAR_PUBLIC_TOKEN o PAGOPAR_PRIVATE_TOKEN no configurados — endpoints desactivados");
} else {
  console.log(`[pagopar] env=${PAGOPAR_ENV_VAR} — moneda: PYG (Guaraníes)`);
  console.log(`[pagopar] API URL: ${PAGOPAR_API_URL}`);
  console.log(`[pagopar] token_publico length: ${PAGOPAR_PUBLIC.length} chars`);
}
if (!SUPA_SERVICE) {
  console.warn("[pagopar] SUPABASE_SERVICE_KEY no configurado — webhook no actualizará DB");
}
if (!VDOCIPHER_API_SECRET) {
  console.warn("[vdocipher] VDOCIPHER_API_SECRET no configurado — endpoint /api/vdocipher-otp desactivado");
} else {
  console.log(`[vdocipher] API Secret configurado (${VDOCIPHER_API_SECRET.length} chars) — endpoint activo`);
}
console.log("[lrs] ─────────────────────────────────────────────────────────");

// Pre-read index.html once (it's small and served frequently)
const INDEX_HTML = readFileSync(INDEX_PATH);

// ── Utilities ────────────────────────────────────────────────────────────────
const sha1 = (s) => createHash("sha1").update(String(s)).digest("hex");

function jsonOk(res, data) {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

function jsonError(res, status, message) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: message }));
}

// Pagopar-specific error — includes structured response for frontend diagnosis
function jsonErrorPagopar(res, status, message, pagoparRaw) {
  const pagopar_respuesta = pagoparRaw?.resultado ?? false;
  // Extract the human-readable message from Pagopar (various possible fields)
  const pagopar_mensaje =
    (typeof pagoparRaw?.respuesta === "string" ? pagoparRaw.respuesta : null) ||
    pagoparRaw?.mensaje ||
    pagoparRaw?.error ||
    pagoparRaw?.descripcion ||
    null;
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: message, pagopar_respuesta, pagopar_mensaje }));
}

async function readJsonBody(req) {
  return new Promise((resolve) => {
    let raw = "";
    req.on("data", (c) => { raw += c.toString(); });
    req.on("end", () => {
      try { resolve(JSON.parse(raw)); } catch { resolve(null); }
    });
    req.on("error", () => resolve(null));
  });
}

// Supabase REST helper (schema: lucianails)
async function supaRest({ table, method = "GET", body, match = {}, select, jwt }) {
  if (!SUPA_URL || !SUPA_ANON) return { _error: "Supabase no configurado" };
  const url = new URL(`${SUPA_URL}/rest/v1/${table}`);
  if (select) url.searchParams.set("select", select);
  Object.entries(match).forEach(([k, v]) => url.searchParams.set(k, `eq.${v}`));

  // Use service key if available (bypasses RLS — needed for webhook), else fallback to jwt/anon
  const authToken = (method !== "GET" && SUPA_SERVICE) ? SUPA_SERVICE : (jwt || SUPA_ANON);

  const headers = {
    apikey: SUPA_ANON,
    Authorization: `Bearer ${authToken}`,
    "Accept-Profile": "lucianails",
    "Content-Profile": "lucianails",
  };
  if (body) {
    headers["Content-Type"] = "application/json";
    headers["Prefer"] = "return=representation";
  }

  try {
    const r = await fetch(url.toString(), {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!r.ok) {
      const text = await r.text();
      return { _error: text, _status: r.status };
    }
    return r.json();
  } catch (e) {
    return { _error: e.message };
  }
}

// ── Pagopar: POST /api/pagopar/iniciar ───────────────────────────────────────
// Body: { monto_pyg, curso_id?, plan_id?, descripcion, comprador, productos[], user_id }
// monto_pyg: monto en Guaraníes (PYG), entero, sin conversión.
// Headers: Authorization: Bearer <supabase_jwt>
// ── VdoCipher: POST /api/vdocipher-otp ───────────────────────────────────────
// Body: { lessonId }
// Headers: Authorization: Bearer <supabase_jwt>
// Devuelve: { otp, playbackInfo, userEmail }
//
// Replica la Vercel edge function api/vdocipher-otp.ts:
//  1. Verifica JWT contra Supabase /auth/v1/user
//  2. Lee la lección + curso desde lucianails.lessons (con embed de module/course)
//  3. Verifica acceso: free preview, admin, o compra individual (course_purchases)
//  4. Si pasa, pide OTP a VdoCipher con licenseRules (Widevine L1 + PlayReady SL3000)
async function handleVdoCipherOtp(req, res) {
  if (!SUPA_URL || !SUPA_ANON) {
    jsonError(res, 500, "Supabase no configurado en este servidor");
    return;
  }
  if (!VDOCIPHER_API_SECRET) {
    console.error("[vdocipher] VDOCIPHER_API_SECRET no configurado");
    jsonError(res, 500, "VdoCipher no configurado en este servidor");
    return;
  }

  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) {
    jsonError(res, 401, "Sin autenticación");
    return;
  }

  const body = await readJsonBody(req);
  if (!body?.lessonId) {
    jsonError(res, 400, "Falta lessonId");
    return;
  }
  const lessonId = String(body.lessonId);

  // 1. Verificar sesión: pedir el usuario actual
  let user;
  try {
    const userResp = await fetch(`${SUPA_URL}/auth/v1/user`, {
      headers: { apikey: SUPA_ANON, Authorization: auth },
    });
    if (!userResp.ok) {
      jsonError(res, 401, "Token inválido");
      return;
    }
    user = await userResp.json();
  } catch (err) {
    console.error("[vdocipher] error verificando JWT:", err.message);
    jsonError(res, 502, "No se pudo verificar la sesión");
    return;
  }

  // 2. Cargar la lección + curso (vía embed de PostgREST)
  let lesson;
  try {
    const url = new URL(`${SUPA_URL}/rest/v1/lessons`);
    url.searchParams.set("id", `eq.${lessonId}`);
    url.searchParams.set("select", "id,is_free_preview,video_path,module:modules(course:courses(id,included_in_membership))");
    const r = await fetch(url.toString(), {
      headers: {
        apikey: SUPA_ANON,
        Authorization: auth,
        "Accept-Profile": "lucianails",
      },
    });
    if (!r.ok) {
      const text = await r.text();
      console.error(`[vdocipher] error leyendo lección: ${r.status} ${text}`);
      jsonError(res, 502, "No se pudo leer la lección");
      return;
    }
    const rows = await r.json();
    lesson = Array.isArray(rows) ? rows[0] : null;
  } catch (err) {
    console.error("[vdocipher] error leyendo lección:", err.message);
    jsonError(res, 502, "No se pudo leer la lección");
    return;
  }

  if (!lesson) { jsonError(res, 404, "Lección no encontrada"); return; }
  if (!lesson.video_path) { jsonError(res, 404, "La lección no tiene video"); return; }

  const course = lesson.module?.course;
  if (!course) { jsonError(res, 404, "Curso no encontrado"); return; }

  // 3. ¿El usuario tiene acceso?
  let hasAccess = !!lesson.is_free_preview;

  if (!hasAccess) {
    // admin?
    try {
      const r = await fetch(
        `${SUPA_URL}/rest/v1/profiles?id=eq.${user.id}&select=role`,
        { headers: { apikey: SUPA_ANON, Authorization: auth, "Accept-Profile": "lucianails" } },
      );
      if (r.ok) {
        const profiles = await r.json();
        if (profiles[0]?.role === "admin") hasAccess = true;
      }
    } catch { /* silenciar */ }
  }

  if (!hasAccess) {
    // compra individual?
    try {
      const r = await fetch(
        `${SUPA_URL}/rest/v1/course_purchases?user_id=eq.${user.id}&course_id=eq.${course.id}&select=id&limit=1`,
        { headers: { apikey: SUPA_ANON, Authorization: auth, "Accept-Profile": "lucianails" } },
      );
      if (r.ok) {
        const purchases = await r.json();
        if (purchases.length > 0) hasAccess = true;
      }
    } catch { /* silenciar */ }
  }

  if (!hasAccess) {
    console.warn(`[vdocipher] sin acceso — user=${user.id} lesson=${lessonId} course=${course.id}`);
    jsonError(res, 403, "Sin acceso a esta lección");
    return;
  }

  // 4. Pedir OTP a VdoCipher forzando hardware DRM
  const licenseRules = JSON.stringify({
    rules: {
      widevineSecurityLevel: "HW_SECURE_DECODE",
      playreadyMinSecurityLevel: 3000,
    },
  });

  try {
    const vdoResp = await fetch(`https://dev.vdocipher.com/api/videos/${lesson.video_path}/otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Apisecret ${VDOCIPHER_API_SECRET}`,
      },
      body: JSON.stringify({ ttl: 300, licenseRules }),
    });
    if (!vdoResp.ok) {
      const errText = await vdoResp.text();
      console.error(`[vdocipher] OTP error ${vdoResp.status}: ${errText}`);
      jsonError(res, 502, `VdoCipher error: ${vdoResp.status}`);
      return;
    }
    const vdo = await vdoResp.json();
    console.log(`[vdocipher] OTP generado — user=${user.id} lesson=${lessonId} video=${lesson.video_path}`);
    jsonOk(res, {
      otp: vdo.otp,
      playbackInfo: vdo.playbackInfo,
      userEmail: user.email,
    });
  } catch (err) {
    console.error("[vdocipher] fetch error:", err.message);
    jsonError(res, 502, "No se pudo conectar con VdoCipher");
  }
}

async function handlePagoparIniciar(req, res) {
  if (!PAGOPAR_PUBLIC || !PAGOPAR_PRIVATE) {
    jsonError(res, 503, "Pagopar no configurado en este servidor");
    return;
  }

  const body = await readJsonBody(req);
  if (!body) { jsonError(res, 400, "JSON inválido"); return; }

  const { monto_pyg, curso_id, plan_id, descripcion, comprador, productos, user_id } = body;

  // Validate — monto must be a positive integer in PYG (Guaraníes), no conversion
  const montoInt = Math.round(Number(monto_pyg));
  if (!monto_pyg || montoInt <= 0) {
    jsonError(res, 400, "monto_pyg requerido: monto en Guaraníes, entero positivo");
    return;
  }

  // ⚠️ Sanity check: valores menores a 1000 son casi seguramente dólares (precio viejo en USD).
  // El campo `price` en Supabase debe estar en Guaraníes. Actualizarlo desde el panel admin.
  if (montoInt < 1000) {
    console.warn(
      `[pagopar/iniciar] ADVERTENCIA: monto_pyg=${montoInt} parece ser USD, no PYG. ` +
      `Actualizá el precio del curso en el panel admin (Gs. reales, ej: 89000 en lugar de 89).`
    );
    jsonError(res, 400,
      `monto_pyg=${montoInt} parece ser un precio en dólares, no en Guaraníes. ` +
      `El precio del curso debe estar en PYG (ej: 89000). Actualizalo desde el panel admin.`
    );
    return;
  }

  if (!comprador || !productos?.length || !user_id) {
    jsonError(res, 400, "Campos requeridos: monto_pyg, comprador, productos, user_id");
    return;
  }

  // Validate comprador fields
  const camposRequeridos = ["nombre", "apellido", "documento_identidad", "email", "celular", "ciudad", "departamento", "direccion"];
  for (const campo of camposRequeridos) {
    if (!comprador[campo]) {
      jsonError(res, 400, `Comprador incompleto — falta: ${campo}`);
      return;
    }
  }

  const id_pedido_comercio = `lrs-${user_id.slice(0, 8)}-${Date.now()}`;

  // monto_total: entero en guaraníes, sin decimales. PHP: strval(floatval(89000)) → "89000"
  const montoTotalStr = String(montoInt);

  // fecha_maxima_pago: 24h desde ahora en formato "YYYY-MM-DD HH:mm:ss"
  const fechaMaxima = (() => {
    const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  })();

  // Log payload interno recibido (sin tokens)
  console.log(`[pagopar/iniciar] ── nuevo pedido ────────────────────────────`);
  console.log(`[pagopar/iniciar]   payload interno         :`, JSON.stringify({ monto_pyg, curso_id, user_id, productos_count: productos.length }));
  console.log(`[pagopar/iniciar]   monto_pyg recibido      : ${monto_pyg}`);
  console.log(`[pagopar/iniciar]   id_pedido_comercio      : ${id_pedido_comercio}`);
  console.log(`[pagopar/iniciar]   monto_total a Pagopar   : ${montoTotalStr} (entero PYG)`);
  console.log(`[pagopar/iniciar]   fecha_maxima_pago       : ${fechaMaxima}`);
  console.log(`[pagopar/iniciar]   ambiente                : ${PAGOPAR_ENV_VAR}`);
  console.log(`[pagopar/iniciar]   api_url                 : ${PAGOPAR_API_URL}`);
  console.log(`[pagopar/iniciar]   public_key length       : ${PAGOPAR_PUBLIC.length} chars`);

  // Token según docs de Pagopar:
  //   sha1(PRIVATE_TOKEN + id_pedido_comercio + strval(floatval(monto_total)))
  const token = sha1(PAGOPAR_PRIVATE + id_pedido_comercio + montoTotalStr);
  console.log(`[pagopar/iniciar]   token sha1              : ${token.slice(0, 8)}... (generado OK)`);

  // Guardar ciudad real del comprador solo para logs internos — NO se envía a Pagopar
  // (Pagopar espera ciudad="1" para items/comprador sin envío físico)
  const ciudadInterna = comprador.ciudad ? String(comprador.ciudad).trim() : "";
  console.log(`[pagopar/iniciar]   ciudad (interna)        : "${ciudadInterna}" (no se envía a Pagopar, va "1")`);

  // ── Normalización de teléfono al formato internacional paraguayo ─────────────
  // Acepta: 0981123456, 981123456, +595981123456, 595 981 123 456 → +595981123456
  function normalizePhonePy(raw) {
    if (!raw) return null;
    let s = String(raw).replace(/[\s\-().]/g, "");
    if (s.startsWith("+595")) s = s.slice(4);
    else if (s.startsWith("595")) s = s.slice(3);
    else if (s.startsWith("0")) s = s.slice(1);
    if (!/^\d{9}$/.test(s)) return null;
    return "+595" + s;
  }
  const telefonoNormalizado = normalizePhonePy(comprador.celular || comprador.telefono);
  if (!telefonoNormalizado) {
    console.error(`[pagopar/iniciar] ✗ telefono inválido: ${JSON.stringify(comprador.celular)}`);
    jsonError(res, 400, "El teléfono debe ser un número paraguayo válido.");
    return;
  }
  console.log(`[pagopar/iniciar]   telefono normalizado    : ${telefonoNormalizado}`);

  // Nombre completo (Pagopar recibe solo "nombre", no "apellido")
  const nombreCompleto = `${comprador.nombre || ""} ${comprador.apellido || ""}`.trim();
  const documentoCi    = comprador.documento_identidad || comprador.documento || "";

  // ── Comprador para Pagopar — campos EXACTOS, sin spread del formulario ───────
  const compradorPagopar = {
    ruc:                   "",
    email:                 comprador.email,
    ciudad:                "1",                  // literal Pagopar — sin envío físico
    nombre:                nombreCompleto,
    telefono:              telefonoNormalizado,
    direccion:             "",
    documento:             documentoCi,
    coordenadas:           "",
    razon_social:          nombreCompleto,
    tipo_documento:        "CI",
    direccion_referencia:  "",
  };

  // Log seguro: email parcialmente oculto + campos del objeto
  const emailOculto = compradorPagopar.email
    ? compradorPagopar.email.replace(/^(.).+(@.+)$/, "$1***$2")
    : "";
  const compradorKeys = Object.keys(compradorPagopar);
  console.log(`[pagopar/iniciar]   compradorPagopar email  : ${emailOculto}`);
  console.log(`[pagopar/iniciar]   compradorPagopar campos : [${compradorKeys.join(", ")}] (${compradorKeys.length} campos)`);

  // ── compras_items — formato exacto, sin campos internos ──────────────────────
  const compras_items = productos.map((p, i) => {
    const cantidad = Number(p.cantidad) || 1;
    const precioUnitario = Math.round(Number(p.precio_pyg || montoInt));
    const precioTotal = precioUnitario * cantidad;
    return {
      ciudad:                          "1",
      nombre:                          p.nombre,
      cantidad:                        cantidad,
      categoria:                       "909",
      public_key:                      PAGOPAR_PUBLIC,
      url_imagen:                      p.url_imagen || "",
      descripcion:                     p.descripcion || p.nombre || (descripcion || ""),
      id_producto:                     String(p.id_producto || p.id || curso_id || `item-${i + 1}`),
      precio_total:                    precioTotal,
      vendedor_telefono:               "",
      vendedor_direccion:              "",
      vendedor_direccion_referencia:   "",
      vendedor_direccion_coordenadas:  "",
    };
  });

  compras_items.forEach((it, i) => {
    console.log(`[pagopar/iniciar]   item[${i}] nombre="${it.nombre}" cantidad=${it.cantidad} precio_total=${it.precio_total} id_producto=${it.id_producto} categoria=${it.categoria} ciudad=${it.ciudad}`);
  });

  // ── Verificar que monto_total === suma de items ──────────────────────────────
  const sumaItems = compras_items.reduce((acc, it) => acc + Number(it.precio_total), 0);
  console.log(`[pagopar/iniciar]   monto_total             : ${montoInt}`);
  console.log(`[pagopar/iniciar]   suma_items              : ${sumaItems}`);
  if (sumaItems !== montoInt) {
    console.error(`[pagopar/iniciar] ✗ monto_total (${montoInt}) ≠ suma_items (${sumaItems})`);
    jsonError(res, 400, `El monto total (${montoInt}) no coincide con la suma de los items (${sumaItems}).`);
    return;
  }

  // ── Payload final a Pagopar ──────────────────────────────────────────────────
  const pagoparPayload = {
    token,
    comprador:           compradorPagopar,
    public_key:          PAGOPAR_PUBLIC,
    monto_total:         montoInt,                  // entero en guaraníes
    tipo_pedido:         "VENTA-COMERCIO",
    compras_items,
    fecha_maxima_pago:   fechaMaxima,
    id_pedido_comercio,
    descripcion_resumen: (descripcion || "Compra Lucía Rojas Studio").slice(0, 150),
    forma_pago:          9,
  };

  const safePayloadKeys = Object.keys(pagoparPayload).filter((k) => k !== "token");
  console.log(`[pagopar/iniciar]   payload a Pagopar keys  : [${safePayloadKeys.join(", ")}]`);

  let pagoparRes;
  let pagoparHttpStatus;
  try {
    console.log(`[pagopar/iniciar] → enviando request a Pagopar...`);
    const r = await fetch(PAGOPAR_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pagoparPayload),
    });
    pagoparHttpStatus = r.status;
    const rawText = await r.text();
    console.log(`[pagopar/iniciar] ← HTTP ${pagoparHttpStatus} respuesta raw: ${rawText.slice(0, 500)}`);
    try { pagoparRes = JSON.parse(rawText); } catch { pagoparRes = { _raw: rawText }; }
  } catch (err) {
    console.error("[pagopar/iniciar] fetch error:", err.message);
    jsonError(res, 502, "No se pudo conectar con Pagopar: " + err.message);
    return;
  }

  // Log respuesta completa de Pagopar, ocultando tokens si aparecen
  console.log(`[pagopar/iniciar] ← HTTP status Pagopar    : ${pagoparHttpStatus}`);
  console.log(`[pagopar/iniciar] ← respuesta              : ${JSON.stringify(pagoparRes?.respuesta)}`);
  if (pagoparRes && typeof pagoparRes === "object") {
    const safeRes = JSON.parse(JSON.stringify(pagoparRes));
    if (safeRes.token) safeRes.token = "***";
    if (safeRes.token_privado) safeRes.token_privado = "***";
    if (safeRes.public_key) safeRes.public_key = "***";
    console.log(`[pagopar/iniciar] ← respuesta completa     :`, JSON.stringify(safeRes));
  }

  // Pagopar v2.0:
  //   { respuesta: true, resultado: [ { data: "HASH", pedido: "..." } ] }
  //   { respuesta: false, resultado: "mensaje de error" }
  const respuestaOk =
    pagoparRes?.respuesta === true ||
    pagoparRes?.respuesta === "true" ||
    pagoparRes?.respuesta === 1 ||
    pagoparRes?.respuesta === "1";

  // Extraer hash de resultado[0].data (formato Pagopar v2.0)
  let hash_pedido = null;
  if (Array.isArray(pagoparRes?.resultado) && pagoparRes.resultado.length > 0) {
    hash_pedido = pagoparRes.resultado[0]?.data || null;
  }
  // Fallbacks por compatibilidad con otras versiones de la API
  if (!hash_pedido) {
    if (typeof pagoparRes?.resultado === "string" && pagoparRes.resultado.length > 4) {
      // Algunas versiones devuelven el hash directo en `resultado`
      // pero solo si respuestaOk — caso contrario suele ser un mensaje de error
      if (respuestaOk) hash_pedido = pagoparRes.resultado;
    } else if (typeof pagoparRes?.respuesta === "string" && pagoparRes.respuesta.length > 10) {
      hash_pedido = pagoparRes.respuesta;
    }
  }

  console.log(`[pagopar/iniciar]   hash extraído           : ${JSON.stringify(hash_pedido)}`);

  // Mensaje crudo de error de Pagopar (cuando respuesta=false)
  const pagoparRawMessage =
    (typeof pagoparRes?.resultado === "string" ? pagoparRes.resultado : null) ||
    (typeof pagoparRes?.mensaje === "string" ? pagoparRes.mensaje : null) ||
    (Array.isArray(pagoparRes?.resultado) && typeof pagoparRes.resultado[0] === "string" ? pagoparRes.resultado[0] : null) ||
    null;

  const BAD_VALUES = new Set(["false", "null", "undefined", "0", "", "true"]);
  const hashIsValid =
    typeof hash_pedido === "string" &&
    hash_pedido.length > 4 &&
    !BAD_VALUES.has(hash_pedido.toLowerCase());

  if (!respuestaOk || !hashIsValid) {
    console.error(`[pagopar/iniciar] ✗ Pagopar rechazó el pedido. respuesta=${JSON.stringify(pagoparRes?.respuesta)} hash=${JSON.stringify(hash_pedido)} mensaje="${pagoparRawMessage}"`);
    // Devolver detalle seguro al frontend
    res.writeHead(502, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      error:              "Pagopar no devolvió un hash válido",
      pagopar_respuesta:  pagoparRes?.respuesta ?? false,
      pagopar_raw_message: pagoparRawMessage,
      pagopar_mensaje:    pagoparRawMessage,
    }));
    return;
  }

  const url_pago = `https://www.pagopar.com/pagos/${hash_pedido}`;
  console.log(`[pagopar/iniciar] ✓ hash=${hash_pedido} url=${url_pago}`);

  // ── Respondemos al cliente PRIMERO ──────────────────────────────────────────
  // Antes el insert a `payments` se hacía con await ANTES de jsonOk. Si la DB
  // rechazaba el insert (ej: reference_id uuid recibía un hash hex de 64 chars
  // tipo "ad11...e3e"), generaba un unhandled rejection que mataba al worker
  // de Phusion Passenger antes de que el cliente recibiera el JSON. Resultado:
  // el frontend caía al catch "No se pudo conectar con el servidor de pagos"
  // mientras Pagopar ya tenía el pedido creado. El usuario reintentaba y se
  // generaban pedidos huérfanos.
  //
  // Ahora: response al cliente PRIMERO, insert en background con error truly
  // non-fatal (sin await, sin throw, Promise siempre encadena .catch).
  // NOTE: usamos id_pedido_comercio (la única variable definida en este scope).
  // Antes decía id_pedido_local — variable inexistente que tiraba ReferenceError
  // sincrónico cuando se llegaba acá, matando al worker antes del flush de la
  // response. El bug estaba latente porque el await supaRest ANTERIOR fallaba
  // primero (UUID), y nunca se ejecutaba esta línea.
  jsonOk(res, { hash_pedido, url_pago, id_pedido: id_pedido_comercio });

  // Record pending payment in Supabase usando el JWT del usuario (respeta RLS).
  // Fire-and-forget: cualquier error queda solo en logs, NO afecta al cliente
  // ni al proceso. Patrón void + .then + .catch garantiza que ninguna Promise
  // pendiente quede sin handler.
  const jwt = (req.headers.authorization || "").replace("Bearer ", "") || undefined;
  void supaRest({
    table: "payments",
    method: "POST",
    jwt,
    body: {
      user_id,
      amount: montoInt,  // stored in PYG
      type: curso_id ? "course_purchase" : "subscription",
      status: "pending",
      reference_id: hash_pedido,
      method: "pagopar",
    },
  }).then((dbRes) => {
    if (dbRes?._error) {
      console.warn("[pagopar/iniciar] DB insert warning post-response:", dbRes._error);
    } else {
      console.log(`[pagopar/iniciar] DB insert OK post-response — payment recorded`);
    }
  }).catch((err) => {
    console.warn("[pagopar/iniciar] DB insert exception post-response:", err?.message || err);
  });
}

// ── Pagopar: POST /api/pagopar/respuesta ─────────────────────────────────────
// Called by Pagopar webhook — validates token before doing anything
async function handlePagoparRespuesta(req, res) {
  const body = await readJsonBody(req);
  if (!body) { jsonError(res, 400, "JSON inválido"); return; }

  const { hash_pedido, token: tokenRecibido, pagado } = body;
  if (!hash_pedido || !tokenRecibido) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Payload incompleto" }));
    return;
  }

  // MANDATORY token validation — sha1(PRIVATE + hash_pedido)
  const tokenEsperado = sha1(PAGOPAR_PRIVATE + hash_pedido);
  if (tokenRecibido !== tokenEsperado) {
    console.warn(`[pagopar/respuesta] token INVÁLIDO para hash=${hash_pedido}`);
    res.writeHead(401, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Token inválido" }));
    return;
  }

  console.log(`[pagopar/respuesta] hash=${hash_pedido} pagado=${pagado}`);

  if (pagado === true && SUPA_SERVICE) {
    try {
      // Update the pending payment record to succeeded
      const updated = await supaRest({
        table: "payments",
        method: "PATCH",
        match: { reference_id: hash_pedido, method: "pagopar" },
        body: { status: "succeeded" },
        select: "id,user_id,type,amount",
      });

      if (Array.isArray(updated) && updated[0]) {
        const pmt = updated[0];
        console.log(`[pagopar/respuesta] payment updated — id=${pmt.id} user=${pmt.user_id}`);
      }
    } catch (e) {
      console.error("[pagopar/respuesta] DB update error:", e.message);
    }
  } else if (pagado === true && !SUPA_SERVICE) {
    console.warn("[pagopar/respuesta] pagado=true pero SUPABASE_SERVICE_KEY no configurado — acceso será otorgado desde resultado page");
  }

  // Pagopar requiere 200 + el payload recibido
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

// ── Pagopar: POST /api/pagopar/estado ────────────────────────────────────────
// Queries Pagopar directly for order status (private token stays server-side)
async function handlePagoparEstado(req, res) {
  const body = await readJsonBody(req);
  if (!body?.hash_pedido) { jsonError(res, 400, "hash_pedido requerido"); return; }

  if (!PAGOPAR_PUBLIC || !PAGOPAR_PRIVATE) {
    jsonError(res, 503, "Pagopar no configurado en este servidor");
    return;
  }

  const token = sha1(PAGOPAR_PRIVATE + "CONSULTA");

  try {
    const r = await fetch("https://api.pagopar.com/api/pedidos/1.1/traer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        token_publico: PAGOPAR_PUBLIC,
        hash_pedido: body.hash_pedido,
      }),
    });
    const data = await r.json();
    jsonOk(res, data);
  } catch (err) {
    console.error("[pagopar/estado] fetch error:", err.message);
    jsonError(res, 502, "No se pudo consultar estado en Pagopar");
  }
}

// ── MIME types ───────────────────────────────────────────────────────────────
const MIME = {
  ".html":  "text/html; charset=utf-8",
  ".js":    "application/javascript; charset=utf-8",
  ".mjs":   "application/javascript; charset=utf-8",
  ".css":   "text/css; charset=utf-8",
  ".json":  "application/json",
  ".png":   "image/png",
  ".jpg":   "image/jpeg",
  ".jpeg":  "image/jpeg",
  ".webp":  "image/webp",
  ".gif":   "image/gif",
  ".svg":   "image/svg+xml",
  ".ico":   "image/x-icon",
  ".woff":  "font/woff",
  ".woff2": "font/woff2",
  ".ttf":   "font/ttf",
  ".otf":   "font/otf",
  ".txt":   "text/plain",
  ".xml":   "application/xml",
  ".map":   "application/json",
};

// ── HTTP server ───────────────────────────────────────────────────────────────
const server = createServer(async (req, res) => {
  const method   = req.method || "GET";
  const pathname = new URL(req.url || "/", "http://localhost").pathname;

  // ── Health check ─────────────────────────────────────────────────────────
  if (pathname === "/healthz") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("OK");
    return;
  }

  // ── VdoCipher API route ───────────────────────────────────────────────────
  if (method === "POST" && pathname === "/api/vdocipher-otp") {
    await handleVdoCipherOtp(req, res);
    return;
  }

  // ── Pagopar API routes ────────────────────────────────────────────────────
  if (method === "POST" && pathname === "/api/pagopar/iniciar") {
    await handlePagoparIniciar(req, res);
    return;
  }
  if (method === "POST" && pathname === "/api/pagopar/respuesta") {
    await handlePagoparRespuesta(req, res);
    return;
  }
  if (method === "POST" && pathname === "/api/pagopar/estado") {
    await handlePagoparEstado(req, res);
    return;
  }

  // ── Static file serving ───────────────────────────────────────────────────
  const filePath = join(CLIENT_DIST, pathname);

  // Path traversal guard
  if (!filePath.startsWith(CLIENT_DIST)) {
    res.writeHead(403, { "Content-Type": "text/plain" });
    res.end("Forbidden");
    return;
  }

  // Try to serve the file if it exists on disk
  if (existsSync(filePath)) {
    const stat = statSync(filePath);
    if (stat.isFile()) {
      const ext = extname(filePath).toLowerCase();
      const contentType = MIME[ext] || "application/octet-stream";
      const isHashed = pathname.startsWith("/assets/");

      // No Content-Length — let Node use chunked transfer encoding.
      // Explicit Content-Length + Hostinger's reverse proxy can mismatch
      // if the proxy applies compression, truncating JS/CSS in the browser.
      res.writeHead(200, {
        "Content-Type": contentType,
        "Cache-Control": isHashed
          ? "public, max-age=31536000, immutable"
          : "no-store, no-cache, must-revalidate, max-age=0",
      });

      const stream = createReadStream(filePath);
      stream.on("error", (err) => {
        console.error(`[lrs] stream error for ${pathname}:`, err.message);
        if (!res.headersSent) res.writeHead(500, { "Content-Type": "text/plain" });
        res.end();
      });
      stream.pipe(res);
      return;
    }
  }

  // ── Asset 404 (don't fall through to SPA for /assets/* or static exts) ──
  const isStaticPath =
    pathname.startsWith("/assets/") ||
    pathname.startsWith("/favicon") ||
    /\.(js|mjs|css|png|jpg|jpeg|webp|gif|svg|ico|woff|woff2|ttf|otf|map)$/.test(pathname);

  if (isStaticPath) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
    return;
  }

  // ── SPA fallback — all app routes get index.html ──────────────────────────
  // No cache agresivo: el index referencia chunks JS con hashes que cambian
  // en cada deploy. Si el browser usa un index viejo, intenta fetchear chunks
  // que ya no existen y rompe el render.
  res.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    "Pragma": "no-cache",
    "Expires": "0",
  });
  res.end(INDEX_HTML);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`[lrs] Server ready → http://0.0.0.0:${PORT}`);
});
