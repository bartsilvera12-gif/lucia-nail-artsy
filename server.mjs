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

// ── Pagopar config (server-side only — NEVER expose PRIVATE_TOKEN to client) ─
const PAGOPAR_PUBLIC  = process.env.PAGOPAR_PUBLIC_TOKEN  || "";
const PAGOPAR_PRIVATE = process.env.PAGOPAR_PRIVATE_TOKEN || "";
const PAGOPAR_ENV_VAR = process.env.PAGOPAR_ENV           || "development";
// Lucía Rojas opera en Guaraníes (PYG). No hay conversión de moneda.

// Supabase (for recording orders — service key required for webhook)
const SUPA_URL     = process.env.VITE_SUPABASE_URL        || "";
const SUPA_ANON    = process.env.VITE_SUPABASE_ANON_KEY   || "";
const SUPA_SERVICE = process.env.SUPABASE_SERVICE_KEY     || ""; // optional, needed for webhook

if (!PAGOPAR_PUBLIC || !PAGOPAR_PRIVATE) {
  console.warn("[pagopar] PAGOPAR_PUBLIC_TOKEN o PAGOPAR_PRIVATE_TOKEN no configurados — endpoints desactivados");
} else {
  console.log(`[pagopar] env=${PAGOPAR_ENV_VAR} — moneda: PYG (Guaraníes)`);
}
if (!SUPA_SERVICE) {
  console.warn("[pagopar] SUPABASE_SERVICE_KEY no configurado — webhook no actualizará DB");
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
async function handlePagoparIniciar(req, res) {
  if (!PAGOPAR_PUBLIC || !PAGOPAR_PRIVATE) {
    jsonError(res, 503, "Pagopar no configurado en este servidor");
    return;
  }

  const body = await readJsonBody(req);
  if (!body) { jsonError(res, 400, "JSON inválido"); return; }

  const { monto_pyg, curso_id, plan_id, descripcion, comprador, productos, user_id } = body;

  // Validate — monto must be a positive integer in PYG, no conversion
  const montoInt = Math.round(Number(monto_pyg));
  if (!monto_pyg || montoInt <= 0) {
    jsonError(res, 400, "monto_pyg requerido: monto en Guaraníes, entero positivo");
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

  const id_pedido_local = `lrs-${user_id.slice(0, 8)}-${Date.now()}`;

  // Token: sha1(public + monto_en_guaranies + private) — sent as exact integer string
  const token = sha1(PAGOPAR_PUBLIC + String(montoInt) + PAGOPAR_PRIVATE);

  const pagoparPayload = {
    token,
    token_publico: PAGOPAR_PUBLIC,
    id_pedido: id_pedido_local,
    descripcion_pedido: descripcion || "Compra Lucía Rojas Studio",
    monto_total: String(montoInt),   // exact PYG, no conversion
    tipo_pedido: "1",
    comprador,
    productos: productos.map((p) => ({
      ...p,
      // precio_pyg already in Guaraníes — send as-is
      precio_unitario: String(Math.round(Number(p.precio_pyg || montoInt))),
      cantidad: String(p.cantidad || 1),
    })),
  };

  let pagoparRes;
  try {
    const r = await fetch("https://api.pagopar.com/api/comercios/2.0/iniciar-transaccion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pagoparPayload),
    });
    pagoparRes = await r.json();
  } catch (err) {
    console.error("[pagopar/iniciar] fetch error:", err.message);
    jsonError(res, 502, "No se pudo conectar con Pagopar");
    return;
  }

  if (!pagoparRes?.resultado) {
    console.error("[pagopar/iniciar] error de Pagopar:", JSON.stringify(pagoparRes));
    jsonError(res, 502, pagoparRes?.respuesta || "Error iniciando transacción en Pagopar");
    return;
  }

  const hash_pedido = pagoparRes.respuesta;
  const url_pago = `https://www.pagopar.com/pagos/${hash_pedido}`;
  console.log(`[pagopar/iniciar] hash=${hash_pedido} monto_pyg=${montoInt} user=${user_id}`);

  // Record pending payment in Supabase using the user's JWT (respects RLS)
  const jwt = (req.headers.authorization || "").replace("Bearer ", "") || undefined;
  const dbRes = await supaRest({
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
  });
  if (dbRes?._error) {
    // Non-fatal — transaction still proceeds
    console.warn("[pagopar/iniciar] DB insert warning:", dbRes._error);
  }

  jsonOk(res, { hash_pedido, url_pago, id_pedido: id_pedido_local });
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
          : "no-cache",
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
  res.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-cache",
  });
  res.end(INDEX_HTML);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`[lrs] Server ready → http://0.0.0.0:${PORT}`);
});
