import { readFileSync } from "node:fs";
import { Client } from "pg";
import "dotenv/config";

const HOSTS = [
  { host: "187.77.247.54", port: 5432, ssl: false },
];

const PG_PASSWORD = process.env.PG_PASSWORD;
if (!PG_PASSWORD) {
  console.error("Falta PG_PASSWORD (poné supabase/.env)");
  process.exit(2);
}

const USER_OPTIONS = [
  { user: "postgres.default",   password: PG_PASSWORD },
  { user: "postgres",           password: PG_PASSWORD },
  { user: "supabase_admin.default", password: PG_PASSWORD },
];

const sql = readFileSync(new URL("./apply.sql", import.meta.url), "utf8");

async function tryConnect() {
  for (const target of HOSTS) {
    for (const cred of USER_OPTIONS) {
      const client = new Client({
        ...target,
        ...cred,
        database: "postgres",
        connectionTimeoutMillis: 4000,
      });
      try {
        await client.connect();
        console.log(`✓ Conectado a ${target.host}:${target.port} como ${cred.user}`);
        return client;
      } catch (e) {
        console.log(`✗ ${target.host}:${target.port} ${cred.user} — ${e.code || ""} ${e.message}`);
        try { await client.end(); } catch { /* noop */ }
      }
    }
  }
  throw new Error("No se pudo conectar a Postgres con ninguna combinación");
}

const client = await tryConnect();
try {
  console.log("\nEjecutando migración...");
  await client.query(sql);
  console.log("✓ Migración aplicada");

  const { rows } = await client.query(`
    select
      (select count(*) from lucianails.courses)   as cursos,
      (select count(*) from lucianails.plans)     as planes,
      (select count(*) from lucianails.modules)   as modulos,
      (select count(*) from lucianails.lessons)   as lecciones
  `);
  console.log("Conteos:", rows[0]);
} finally {
  await client.end();
}
