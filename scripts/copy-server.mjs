// scripts/copy-server.mjs
// Copies server.mjs into dist/ after the build so Hostinger can run:
//   Output directory: dist
//   Entry file:       server.mjs
import { copyFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const src  = join(root, "server.mjs");
const dest = join(root, "dist", "server.mjs");

if (!existsSync(join(root, "dist", "client"))) {
  console.error("[copy-server] dist/client not found — did the build run?");
  process.exit(1);
}

copyFileSync(src, dest);
console.log("[copy-server] server.mjs → dist/server.mjs ✓");
