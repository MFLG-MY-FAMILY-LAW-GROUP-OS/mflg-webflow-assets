#!/usr/bin/env node
const fs = require("fs");
const http = require("http");
const path = require("path");

const root = path.resolve(__dirname, "..");
const port = Number(process.env.PORT || 4173);
const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".mp4": "video/mp4",
  ".png": "image/png",
  ".webp": "image/webp"
};
const blockedPrefixes = [
  "/docs/",
  "/scripts/",
  "/js/releases/",
  "/css/releases/"
];
const blockedPaths = new Set([
  "/js/mflg-intake-v3.4-microcopy.js",
  "/js/mflg-site-enhancements.js",
  "/js/mflg-site-reveal-pathways-v2.2.js"
]);

function resolveRequest(urlPath) {
  const pathname = decodeURIComponent(urlPath.split("?")[0]);
  if (blockedPaths.has(pathname) || blockedPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return { blocked: true };
  }
  const normalized = path.normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  let filePath = path.join(root, normalized);

  if (!filePath.startsWith(root)) return null;
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, "index.html");
  }
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) return filePath;
  return null;
}

function sendFile(res, filePath, statusCode) {
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(statusCode, {
    "Content-Type": contentTypes[ext] || "application/octet-stream"
  });
  fs.createReadStream(filePath).pipe(res);
}

http.createServer((req, res) => {
  const filePath = resolveRequest(req.url || "/");
  if (filePath && filePath.blocked) {
    const fallback = path.join(root, "404.html");
    sendFile(res, fallback, 404);
    return;
  }
  if (filePath) {
    sendFile(res, filePath, 200);
    return;
  }

  const fallback = path.join(root, "404.html");
  sendFile(res, fallback, 404);
}).listen(port, () => {
  console.log(`MFLG static preview listening on http://127.0.0.1:${port}`);
});
