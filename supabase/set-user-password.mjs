/**
 * Cambia la contraseña de un usuario en Supabase Auth.
 *
 * Variables requeridas:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   TARGET_EMAIL
 *   NEW_PASSWORD
 *
 * Uso:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *   TARGET_EMAIL=alguien@correo.com NEW_PASSWORD=nueva \
 *   node supabase/set-user-password.mjs
 *
 * NOTA: lista todos los usuarios y filtra por email del lado del cliente
 * porque la query string ?email= del servidor self-hosted no filtra.
 */
import "dotenv/config";

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TARGET_EMAIL = process.env.TARGET_EMAIL?.trim().toLowerCase();
const NEW_PASSWORD = process.env.NEW_PASSWORD;

if (!SUPABASE_URL || !SERVICE_ROLE || !TARGET_EMAIL || !NEW_PASSWORD) {
  console.error("Faltan variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, TARGET_EMAIL, NEW_PASSWORD");
  process.exit(2);
}
if (NEW_PASSWORD.length < 6) {
  console.error("La contraseña debe tener al menos 6 caracteres.");
  process.exit(2);
}

const headers = {
  "Content-Type": "application/json",
  apikey: SERVICE_ROLE,
  Authorization: `Bearer ${SERVICE_ROLE}`,
};

// 1. Listar todos los usuarios y filtrar client-side
let page = 1;
let target = null;
while (true) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?page=${page}&per_page=200`, { headers });
  if (!res.ok) { console.error("List error:", res.status, await res.text()); process.exit(1); }
  const data = await res.json();
  const users = data?.users ?? [];
  target = users.find((u) => (u.email ?? "").toLowerCase() === TARGET_EMAIL);
  if (target) break;
  if (users.length < 200) break; // no hay más páginas
  page += 1;
}

if (!target) {
  console.error(`No se encontró un usuario con email "${TARGET_EMAIL}".`);
  process.exit(1);
}

console.log(`Encontrado: ${target.email} (id ${target.id})`);

// 2. Cambiar la contraseña (Admin API)
const updateRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${target.id}`, {
  method: "PUT",
  headers,
  body: JSON.stringify({ password: NEW_PASSWORD, email_confirm: true }),
});
if (!updateRes.ok) {
  console.error("Error actualizando:", updateRes.status, await updateRes.text());
  process.exit(1);
}

// 3. Verificar haciendo login
const verifyRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
  method: "POST",
  headers: { "Content-Type": "application/json", apikey: SERVICE_ROLE },
  body: JSON.stringify({ email: target.email, password: NEW_PASSWORD }),
});
const ok = verifyRes.ok;

console.log("\n" + (ok ? "✓" : "✗") + " Resultado");
console.log("  Email:    ", target.email);
console.log("  User ID:  ", target.id);
console.log("  Password: ", NEW_PASSWORD);
console.log("  Login OK: ", ok);
if (!ok) console.log("  Respuesta:", await verifyRes.text());
