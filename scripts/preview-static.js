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

function safeFileName(value) {
  return String(value || "official-court-form.pdf")
    .replace(/[^a-z0-9._-]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120) || "official-court-form.pdf";
}

function sendJSON(res, statusCode, value) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(value));
}

async function sendOfficialPdf(req, res, actionId) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    sendJSON(res, 405, { error: "method_not_allowed" });
    return;
  }

  const manifestPath = path.join(root, "data/form-pdf-public-actions.json");
  if (!fs.existsSync(manifestPath)) {
    sendJSON(res, 503, { error: "pdf_manifest_unavailable" });
    return;
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const action = (manifest.actions || []).find((item) => item.action_id === actionId);
  if (!action || !action.official_pdf_url) {
    sendJSON(res, 404, { error: "pdf_not_approved" });
    return;
  }

  const requestUrl = new URL(req.url || "/", `http://127.0.0.1:${port}`);
  const fileName = safeFileName(action.file_name || action.public_file_code || `${action.action_id}.pdf`);
  const disposition = requestUrl.searchParams.get("download") === "1" ? "attachment" : "inline";
  const headers = {
    "Content-Type": "application/pdf",
    "Content-Disposition": `${disposition}; filename="${fileName}"`,
    "Cache-Control": "no-store"
  };

  if (req.method === "HEAD") {
    res.writeHead(200, headers);
    res.end();
    return;
  }

  const sourceResponse = await fetch(action.official_pdf_url, {
    headers: { "user-agent": "MFLG local approved court PDF viewer" }
  });
  if (!sourceResponse.ok || !sourceResponse.body) {
    sendJSON(res, 502, { error: "pdf_source_unavailable" });
    return;
  }

  res.writeHead(sourceResponse.status, headers);
  for await (const chunk of sourceResponse.body) {
    res.write(chunk);
  }
  res.end();
}

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
  const pathname = decodeURIComponent((req.url || "/").split("?")[0]);
  if (pathname.startsWith("/api/official-pdf/")) {
    const actionId = decodeURIComponent(pathname.replace("/api/official-pdf/", ""));
    sendOfficialPdf(req, res, actionId).catch(() => {
      if (!res.headersSent) sendJSON(res, 502, { error: "pdf_source_unavailable" });
      else res.end();
    });
    return;
  }

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
