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

function isBlocked(pathname) {
  return blockedPaths.has(pathname) || blockedPrefixes.some((prefix) => pathname.startsWith(prefix));
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
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
