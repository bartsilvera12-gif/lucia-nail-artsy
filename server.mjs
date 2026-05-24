// server.mjs — Node.js static file server for SPA deployment on Hostinger
//
// Auto-detects the client folder so the same file works in two positions:
//   • dist/server.mjs  → serves ./client   (dist/client)
//   • root/server.mjs  → serves ./dist/client
//
// Hostinger config:
//   Build command   : npm run build
//   Output directory: dist
//   Entry file      : server.mjs
//   Node version    : 20.x
import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const PORT = Number(process.env.PORT) || 3000;

// ── Locate the client dist folder ────────────────────────────────────────────
// Running from dist/ → __dirname ends in dist/ → sibling "client" exists
// Running from root/ → __dirname ends in root/ → "dist/client" exists
const CLIENT_DIST = existsSync(join(__dirname, "client"))
  ? join(__dirname, "client")
  : join(__dirname, "dist", "client");

const INDEX_PATH = join(CLIENT_DIST, "index.html");

// ── Startup diagnostics ──────────────────────────────────────────────────────
console.log(`[lrs] PORT           : ${PORT}`);
console.log(`[lrs] Static folder  : ${CLIENT_DIST}`);
console.log(`[lrs] index.html     : ${existsSync(INDEX_PATH) ? "✓ found" : "✗ NOT FOUND — build may be missing"}`);

if (!existsSync(CLIENT_DIST)) {
  console.error("[lrs] ERROR: client folder not found. Run 'npm run build' first.");
  process.exit(1);
}

const INDEX_HTML = readFileSync(INDEX_PATH);

// ── MIME types ───────────────────────────────────────────────────────────────
const MIME_TYPES = {
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
  ".map":   "application/json",
  ".txt":   "text/plain",
  ".xml":   "application/xml",
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

  const filePath = join(CLIENT_DIST, pathname);

  // Path traversal guard
  if (!filePath.startsWith(CLIENT_DIST)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  // Serve static file if it exists on disk
  if (existsSync(filePath) && statSync(filePath).isFile()) {
    const ext = extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    // Hashed assets (/assets/*) get long-lived immutable cache
    const isHashed = pathname.startsWith("/assets/");
    res.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": isHashed
        ? "public, max-age=31536000, immutable"
        : "no-cache",
    });
    res.end(readFileSync(filePath));
    return;
  }

  // SPA fallback — unknown routes return index.html so the client router takes over
  res.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-cache",
  });
  res.end(INDEX_HTML);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`[lrs] Server ready → http://0.0.0.0:${PORT}`);
});
