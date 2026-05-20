/**
 * Crea (o promueve) un usuario admin en Supabase Auth + lucianails.profiles.
 * Variables requeridas (supabase/.env):
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   ADMIN_EMAIL
 *   ADMIN_PASSWORD
 *   ADMIN_NAME (opcional)
 *
 * Uso:  node supabase/create-admin.mjs
 */
import "dotenv/config";

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_NAME = process.env.ADMIN_NAME ?? "Admin";

if (!SUPABASE_URL || !SERVICE_ROLE || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error("Faltan variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL, ADMIN_PASSWORD");
  process.exit(2);
}

const headers = {
  "Content-Type": "application/json",
  apikey: SERVICE_ROLE,
  Authorization: `Bearer ${SERVICE_ROLE}`,
};

// 1) Buscar si ya existe (Admin API: GET /admin/users?email=...)
const listRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(ADMIN_EMAIL)}`, { headers });
const listData = await listRes.json();
let userId = listData?.users?.[0]?.id ?? null;

if (!userId) {
  console.log(`Creando usuario ${ADMIN_EMAIL}…`);
  const createRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: { name: ADMIN_NAME },
    }),
  });
  const created = await createRes.json();
  if (!createRes.ok) {
    console.error("Error creando usuario:", created);
    process.exit(1);
  }
  userId = created.id;
  console.log("✓ Usuario creado:", userId);
} else {
  console.log(`Usuario ya existe (${userId}). Actualizando password…`);
  const patchRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ password: ADMIN_PASSWORD, email_confirm: true }),
  });
  if (!patchRes.ok) console.error("Error actualizando:", await patchRes.text());
}

// 2) Asegurar profile con role=admin via PostgREST + service_role
const profileHeaders = {
  ...headers,
  Prefer: "resolution=merge-duplicates,return=representation",
  "Content-Profile": "lucianails",
};

const profileRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
  method: "POST",
  headers: profileHeaders,
  body: JSON.stringify([{
    id: userId,
    email: ADMIN_EMAIL,
    name: ADMIN_NAME,
    role: "admin",
  }]),
});
if (!profileRes.ok) {
  // Si falla el upsert, intentamos un UPDATE explícito
  const updateRes = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`,
    {
      method: "PATCH",
      headers: { ...headers, "Content-Profile": "lucianails", Prefer: "return=representation" },
      body: JSON.stringify({ role: "admin", name: ADMIN_NAME }),
    },
  );
  if (!updateRes.ok) {
    console.error("Error actualizando profile:", await updateRes.text());
    process.exit(1);
  }
}

console.log("\n✓ Admin listo");
console.log("  Email:    ", ADMIN_EMAIL);
console.log("  Password: ", ADMIN_PASSWORD);
console.log("  User ID:  ", userId);
console.log("  Role:     admin");
