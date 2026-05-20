import { readFileSync } from "node:fs";
import { Client } from "ssh2";
import "dotenv/config";

const SSH_HOST = process.env.SSH_HOST;
const SSH_USER = process.env.SSH_USER ?? "root";
const SSH_PASSWORD = process.env.SSH_PASSWORD;
if (!SSH_HOST || !SSH_PASSWORD) {
  console.error("Faltan SSH_HOST / SSH_PASSWORD (poné supabase/.env)");
  process.exit(2);
}

const sql = readFileSync(new URL("./apply.sql", import.meta.url), "utf8");
const ssh = new Client();

ssh.on("ready", () => {
  console.log("✓ SSH conectado, ejecutando psql...");
  const cmd = `docker exec -i $(docker ps --format '{{.Names}}' | grep -E 'supabase[-_]db|supabase[-_]postgres' | head -n1) psql -U postgres -d postgres -v ON_ERROR_STOP=1 -f -`;
  ssh.exec(cmd, (err, stream) => {
    if (err) { console.error(err); ssh.end(); return; }
    let out = "", errOut = "";
    stream
      .on("close", (code) => {
        console.log("--- stdout ---\n" + out);
        console.log("--- stderr ---\n" + errOut);
        console.log("\nExit code:", code);
        ssh.end();
        process.exit(code === 0 ? 0 : 1);
      })
      .on("data", (d) => { out += d.toString(); })
      .stderr.on("data", (d) => { errOut += d.toString(); });
    stream.end(sql);
  });
}).on("error", (e) => {
  console.error("SSH error:", e.message);
  process.exit(1);
}).connect({
  host: SSH_HOST,
  port: 22,
  username: SSH_USER,
  password: SSH_PASSWORD,
  readyTimeout: 15000,
  tryKeyboard: true,
});

ssh.on("keyboard-interactive", (_n, _i, _l, _p, done) => done([SSH_PASSWORD]));
