// server.mjs — Node.js static file server for SPA deployment on Hostinger
// Serves dist/client/ with SPA fallback to index.html
import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const CLIENT_DIST = join(__dirname, "dist", "client");
const PORT = Number(process.env.PORT) || 3000;

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
};

const INDEX_HTML = readFileSync(join(CLIENT_DIST, "index.html"));

const server = createServer((req, res) => {
  const pathname = new URL(req.url || "/", "http://localhost").pathname;
  const filePath = join(CLIENT_DIST, pathname);

  // Path traversal guard
  if (!filePath.startsWith(CLIENT_DIST)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  // Serve static file if it exists
  if (existsSync(filePath) && statSync(filePath).isFile()) {
    const ext = extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
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

  // SPA fallback — all unknown paths get index.html
  res.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-cache",
  });
  res.end(INDEX_HTML);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`[lrs] Server listening on http://0.0.0.0:${PORT}`);
});
