const blockedPrefixes = [
  "/docs/",
  "/internal/",
  "/scripts/",
  "/js/releases/",
  "/css/releases/"
];

const blockedPaths = new Set([
  "/js/mflg-intake-v3.4-microcopy.js",
  "/js/mflg-site-enhancements.js",
  "/js/mflg-site-reveal-pathways-v2.2.js"
]);

function isBlocked(pathname) {
  return blockedPaths.has(pathname) || blockedPrefixes.some((prefix) => pathname.startsWith(prefix));
}

async function maintenanceCalculator(request) {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { "content-type": "application/json; charset=utf-8" }
    });
  }

  let payload;
  try {
    payload = await request.json();
  } catch (_) {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400,
      headers: { "content-type": "application/json; charset=utf-8" }
    });
  }

  const response = await fetch("https://jbazmc.azure-api.net/SelfSufficiencyCalculator/CalculateSelfSufficiency", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "user-agent": "MFLG public maintenance calculator"
    },
    body: JSON.stringify(payload)
  });
  const body = await response.text();
  return new Response(body, {
    status: response.status,
    headers: {
      "content-type": response.headers.get("content-type") || "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

function safeFileName(value) {
  return String(value || "official-court-form.pdf")
    .replace(/[^a-z0-9._-]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120) || "official-court-form.pdf";
}

async function officialPdf(request, env, actionId) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { "content-type": "application/json; charset=utf-8" }
    });
  }

  const manifestResponse = await env.ASSETS.fetch(new Request(new URL("/data/form-pdf-public-actions.json", request.url), {
    method: "GET",
    headers: { "accept": "application/json" }
  }));
  if (!manifestResponse.ok) {
    return new Response(JSON.stringify({ error: "pdf_manifest_unavailable" }), {
      status: 503,
      headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
    });
  }

  const manifest = await manifestResponse.json();
  const action = (manifest.actions || []).find((item) => item.action_id === actionId);
  if (!action || !action.official_pdf_url) {
    return new Response(JSON.stringify({ error: "pdf_not_approved" }), {
      status: 404,
      headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
    });
  }

  const url = new URL(request.url);
  const fileName = safeFileName(action.file_name || action.public_file_code || `${action.action_id}.pdf`);
  const disposition = url.searchParams.get("download") === "1" ? "attachment" : "inline";
  if (request.method === "HEAD") {
    return new Response(null, {
      status: 200,
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `${disposition}; filename="${fileName}"`,
        "cache-control": "no-store"
      }
    });
  }

  const sourceResponse = await fetch(action.official_pdf_url, {
    headers: { "user-agent": "MFLG approved court PDF viewer" }
  });
  if (!sourceResponse.ok) {
    return new Response(JSON.stringify({ error: "pdf_source_unavailable" }), {
      status: 502,
      headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
    });
  }

  const headers = new Headers(sourceResponse.headers);
  headers.set("content-type", "application/pdf");
  headers.set("content-disposition", `${disposition}; filename="${fileName}"`);
  headers.set("cache-control", "no-store");
  headers.delete("set-cookie");
  return new Response(sourceResponse.body, {
    status: sourceResponse.status,
    headers
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/maintenance-calculator") {
      return maintenanceCalculator(request);
    }
    if (url.pathname.startsWith("/api/official-pdf/")) {
      const actionId = decodeURIComponent(url.pathname.replace("/api/official-pdf/", ""));
      return officialPdf(request, env, actionId);
    }
    if (isBlocked(url.pathname)) {
      const response = await env.ASSETS.fetch(new Request(new URL("/404.html", request.url), request));
      return new Response(response.body, {
        status: 404,
        headers: response.headers
      });
    }
    return env.ASSETS.fetch(request);
  }
};
