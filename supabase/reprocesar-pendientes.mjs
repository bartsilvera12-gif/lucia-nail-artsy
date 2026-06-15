// reprocesar-pendientes.mjs
//
// Recorre los payments con status='pending' y method='pagopar', consulta el
// estado real en Pagopar y, si Pagopar confirma `pagado=true`, habilita el
// curso (insert en course_purchases + payments→succeeded). Si Pagopar reporta
// `cancelado=true`, marca el payment como failed.
//
// Uso:
//   cd supabase
//   node reprocesar-pendientes.mjs            # dry-run (no escribe nada)
//   node reprocesar-pendientes.mjs --apply    # aplica los cambios
//   node reprocesar-pendientes.mjs --apply --since=7d   # filtra antigüedad
//
// Requiere en supabase/.env:
//   PAGOPAR_PUBLIC_TOKEN
//   PAGOPAR_PRIVATE_TOKEN
//   VITE_SUPABASE_URL
//   SUPABASE_SERVICE_KEY

import "dotenv/config";
import { createHash } from "node:crypto";

const APPLY = process.argv.includes("--apply");
const sinceArg = process.argv.find((a) => a.startsWith("--since="));
const SINCE = sinceArg ? sinceArg.split("=")[1] : "7d";

const {
  PAGOPAR_PUBLIC_TOKEN,
  PAGOPAR_PRIVATE_TOKEN,
  VITE_SUPABASE_URL,
  SUPABASE_SERVICE_KEY,
} = process.env;

if (!PAGOPAR_PUBLIC_TOKEN || !PAGOPAR_PRIVATE_TOKEN || !VITE_SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Faltan variables. Revisá supabase/.env:");
  console.error("  PAGOPAR_PUBLIC_TOKEN, PAGOPAR_PRIVATE_TOKEN, VITE_SUPABASE_URL, SUPABASE_SERVICE_KEY");
  process.exit(2);
}

const sha1 = (s) => createHash("sha1").update(String(s)).digest("hex");
const PAGOPAR_URL = "https://api.pagopar.com/api/pedidos/1.1/traer";
const SUPA = VITE_SUPABASE_URL.replace(/\/$/, "");

// ── Supabase REST helper (schema lucianails con service key) ─────────────────
async function supa(path, { method = "GET", body, headers = {} } = {}) {
  const r = await fetch(`${SUPA}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Accept-Profile": "lucianails",
      "Content-Profile": "lucianails",
      ...(body ? { "Content-Type": "application/json", Prefer: "return=representation" } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`${method} ${path} → ${r.status}: ${text}`);
  return text ? JSON.parse(text) : null;
}

// ── Pagopar /traer ───────────────────────────────────────────────────────────
async function consultarPagopar(hash_pedido) {
  const token = sha1(PAGOPAR_PRIVATE_TOKEN + "CONSULTA");
  const r = await fetch(PAGOPAR_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token,
      token_publico: PAGOPAR_PUBLIC_TOKEN,
      hash_pedido,
    }),
  });
  const data = await r.json();
  const detalle = Array.isArray(data?.resultado) ? data.resultado[0] : null;
  return {
    pagado: detalle?.pagado === true,
    cancelado: detalle?.cancelado === true,
    raw: detalle,
  };
}

// ── Convierte "7d" / "48h" / "30m" a ISO string ──────────────────────────────
function sinceToIso(s) {
  const m = /^(\d+)\s*([dhm])$/.exec(s);
  if (!m) throw new Error(`--since inválido: ${s} (usá 7d, 48h, 30m)`);
  const n = Number(m[1]);
  const ms = m[2] === "d" ? n * 86400_000 : m[2] === "h" ? n * 3600_000 : n * 60_000;
  return new Date(Date.now() - ms).toISOString();
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const sinceIso = sinceToIso(SINCE);
  console.log(`▶ Modo: ${APPLY ? "APPLY (escribe en DB)" : "DRY-RUN (solo lee)"}`);
  console.log(`▶ Filtrando pending creados después de ${sinceIso} (--since=${SINCE})`);
  console.log("");

  // Pendientes con hash, sin course_purchase asociado
  const pendientes = await supa(
    `payments?select=id,user_id,course_id,amount,reference_id,created_at` +
    `&status=eq.pending&method=eq.pagopar&reference_id=not.is.null` +
    `&course_id=not.is.null&created_at=gte.${encodeURIComponent(sinceIso)}` +
    `&order=created_at.asc`,
  );

  console.log(`▶ ${pendientes.length} payments pending a revisar`);
  console.log("");

  const resumen = { habilitados: 0, cancelados: 0, sin_pagar: 0, ya_tenia_acceso: 0, errores: 0 };

  for (const [i, p] of pendientes.entries()) {
    const tag = `[${i + 1}/${pendientes.length}] ${p.reference_id.slice(0, 12)}…`;
    try {
      const { pagado, cancelado } = await consultarPagopar(p.reference_id);

      if (pagado) {
        // ¿Ya tiene course_purchase?
        const existing = await supa(
          `course_purchases?select=id&user_id=eq.${p.user_id}&course_id=eq.${p.course_id}`,
        );
        if (existing.length > 0) {
          console.log(`${tag} ✓ ya tenía acceso (course_purchase id=${existing[0].id})`);
          if (APPLY) {
            await supa(`payments?id=eq.${p.id}`, {
              method: "PATCH",
              body: { status: "succeeded", notes: "Reconciliado: ya tenía course_purchase" },
            });
          }
          resumen.ya_tenia_acceso++;
          continue;
        }

        console.log(`${tag} ✅ PAGADO → habilitar curso user=${p.user_id} course=${p.course_id}`);
        if (APPLY) {
          await supa("course_purchases", {
            method: "POST",
            body: {
              user_id: p.user_id,
              course_id: p.course_id,
              price_paid: p.amount,
              payment_method: "pagopar",
              notes: "Reconciliado por reprocesar-pendientes.mjs",
            },
          });
          await supa(`payments?id=eq.${p.id}`, {
            method: "PATCH",
            body: { status: "succeeded", notes: "Reconciliado por reprocesar-pendientes.mjs" },
          });
        }
        resumen.habilitados++;
      } else if (cancelado) {
        console.log(`${tag} ✗ cancelado en Pagopar → marcar failed`);
        if (APPLY) {
          await supa(`payments?id=eq.${p.id}`, {
            method: "PATCH",
            body: { status: "failed", notes: "Cancelado según Pagopar" },
          });
        }
        resumen.cancelados++;
      } else {
        console.log(`${tag} … sin pagar (abandono o aún esperando)`);
        resumen.sin_pagar++;
      }
    } catch (err) {
      console.error(`${tag} ERROR:`, err.message);
      resumen.errores++;
    }

    // Throttle para no saturar Pagopar
    await new Promise((r) => setTimeout(r, 250));
  }

  console.log("");
  console.log("───────────── Resumen ─────────────");
  console.log(`  Habilitados ahora      : ${resumen.habilitados}`);
  console.log(`  Ya tenían acceso       : ${resumen.ya_tenia_acceso}`);
  console.log(`  Cancelados (→ failed)  : ${resumen.cancelados}`);
  console.log(`  Sin pagar (abandono)   : ${resumen.sin_pagar}`);
  console.log(`  Errores                : ${resumen.errores}`);
  console.log("");
  if (!APPLY) console.log("⚠ Dry-run. Para aplicar cambios: node reprocesar-pendientes.mjs --apply");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
