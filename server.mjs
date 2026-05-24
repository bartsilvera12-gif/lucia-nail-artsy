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
import { createServer } from "node:http";
import { createReadStream, existsSync, statSync, readFileSync } from "node:fs";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";

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
console.log("[lrs] ─────────────────────────────────────────────────────────");

// Pre-read index.html once (it's small and served frequently)
const INDEX_HTML = readFileSync(INDEX_PATH);

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
const server = createServer((req, res) => {
  const pathname = new URL(req.url || "/", "http://localhost").pathname;

  // Health check
  if (pathname === "/healthz") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("OK");
    return;
  }

  // Resolve to absolute path inside CLIENT_DIST
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

      // If the stream errors (e.g. file deleted mid-transfer), end cleanly
      stream.on("error", (err) => {
        console.error(`[lrs] stream error for ${pathname}:`, err.message);
        if (!res.headersSent) {
          res.writeHead(500, { "Content-Type": "text/plain" });
        }
        res.end();
      });

      stream.pipe(res);
      return;
    }
  }

  // ── Asset 404 (don't fall through to SPA for /assets/* or known static exts) ──
  const isStaticPath =
    pathname.startsWith("/assets/") ||
    pathname.startsWith("/favicon") ||
    /\.(js|mjs|css|png|jpg|jpeg|webp|gif|svg|ico|woff|woff2|ttf|otf|map)$/.test(pathname);

  if (isStaticPath) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
    return;
  }

  // SPA fallback — all app routes (/, /cursos, /planes, …) get index.html
  res.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-cache",
  });
  res.end(INDEX_HTML);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`[lrs] Server ready → http://0.0.0.0:${PORT}`);
});
