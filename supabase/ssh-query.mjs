import { Client } from "ssh2";
import "dotenv/config";

const SSH_HOST = process.env.SSH_HOST;
const SSH_USER = process.env.SSH_USER ?? "root";
const SSH_PASSWORD = process.env.SSH_PASSWORD;
if (!SSH_HOST || !SSH_PASSWORD) {
  console.error("Faltan SSH_HOST / SSH_PASSWORD (poné supabase/.env)");
  process.exit(2);
}

const ssh = new Client();
const query = process.argv[2] ?? "select (select count(*) from lucianails.courses) c, (select count(*) from lucianails.plans) p, (select count(*) from lucianails.modules) m, (select count(*) from lucianails.lessons) l;";

ssh.on("ready", () => {
  const cmd = `docker exec -i $(docker ps --format '{{.Names}}' | grep -E 'supabase[-_]db|supabase[-_]postgres' | head -n1) psql -U postgres -d postgres -c "${query.replace(/"/g, '\\"')}"`;
  ssh.exec(cmd, (err, stream) => {
    if (err) { console.error(err); ssh.end(); return; }
    stream.on("close", (code) => { ssh.end(); process.exit(code); })
          .on("data", (d) => process.stdout.write(d))
          .stderr.on("data", (d) => process.stderr.write(d));
  });
}).connect({
  host: SSH_HOST, port: 22, username: SSH_USER,
  password: SSH_PASSWORD, tryKeyboard: true,
});
ssh.on("keyboard-interactive", (_n, _i, _l, _p, done) => done([SSH_PASSWORD]));
