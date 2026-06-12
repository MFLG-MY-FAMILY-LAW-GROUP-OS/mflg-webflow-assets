#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

function readJSON(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function writeJSON(relativePath, value) {
  fs.writeFileSync(path.join(root, relativePath), `${JSON.stringify(value, null, 2)}\n`);
}

const coverage = readJSON("data/forms-tools-coverage.json");
const packetPages = readJSON("data/form-packet-page-actions.json");
const pdfActions = readJSON("data/form-pdf-public-actions.json");

const packetPageActions = Array.isArray(packetPages.actions) ? packetPages.actions : [];
const officialPdfActions = Array.isArray(pdfActions.actions) ? pdfActions.actions : [];
const coverageRoutes = Array.isArray(coverage.routes) ? coverage.routes : [];
const sameOriginPdfDeliveryEnabled = pdfActions.summary?.same_origin_pdf_delivery_enabled === true ||
  pdfActions.public_safety?.same_origin_pdf_delivery_enabled === true;

const pageByPacket = new Map();
for (const action of packetPageActions) {
  const packetId = action.packet_id || "unknown-packet";
  if (!pageByPacket.has(packetId)) pageByPacket.set(packetId, []);
  pageByPacket.get(packetId).push({
    action_id: action.action_id,
    label: action.label || action.packet_label || "Official packet page",
    official_packet_page_url: action.official_packet_page_url || "",
    review_id: action.review_id || ""
  });
}

const pdfByPacket = new Map();
for (const action of officialPdfActions) {
  const packetId = action.packet_id || "unknown-packet";
  if (!pdfByPacket.has(packetId)) pdfByPacket.set(packetId, []);
  pdfByPacket.get(packetId).push({
    action_id: action.action_id,
    display_label: action.display_label || action.label || action.file_name || "Official court PDF",
    source_label: action.source_label || "Open official PDF",
    language: action.language || "Official source",
    file_name: action.file_name || "",
    official_pdf_url: action.official_pdf_url || "",
    site_pdf_view_url: action.site_pdf_view_url || `/api/official-pdf/${encodeURIComponent(action.action_id)}`,
    site_pdf_download_url: action.site_pdf_download_url || `/api/official-pdf/${encodeURIComponent(action.action_id)}?download=1`
  });
}

const packetIds = new Set([
  ...coverageRoutes.map((route) => route.packet_id).filter(Boolean),
  ...packetPageActions.map((action) => action.packet_id).filter(Boolean),
  ...officialPdfActions.map((action) => action.packet_id).filter(Boolean)
]);

const routes = Array.from(packetIds).sort().map((packetId) => {
  const coverageRoute = coverageRoutes.find((route) => route.packet_id === packetId) || {};
  const packetPageList = pageByPacket.get(packetId) || [];
  const pdfList = pdfByPacket.get(packetId) || [];
  const languages = Array.from(new Set(pdfList.map((item) => item.language).filter(Boolean))).sort();
  return {
    packet_id: packetId,
    packet_label: coverageRoute.packet_label || packetPageActions.find((item) => item.packet_id === packetId)?.packet_label || officialPdfActions.find((item) => item.packet_id === packetId)?.packet_label || packetId,
    route: coverageRoute.route || packetPageActions.find((item) => item.packet_id === packetId)?.route || null,
    official_packet_pages: packetPageList,
    official_pdfs: pdfList,
    counts: {
      official_packet_pages: packetPageList.length,
      official_pdfs: pdfList.length,
      languages: languages.length
    },
    languages,
    public_status: pdfList.length
      ? "Packet page and reviewed official PDFs available"
      : packetPageList.length ? "Packet page available; PDF review pending" : "Route review pending"
  };
});

const output = {
  version: "1.0.0-route-actions",
  built_at: new Date().toISOString(),
  source_manifests: [
    "data/forms-tools-coverage.json",
    "data/form-packet-page-actions.json",
    "data/form-pdf-public-actions.json"
  ],
  public_safety: {
    contains_sensitive_user_data: false,
    safe_route_metadata_only: true,
    official_source_urls_only: false,
    approved_same_origin_pdf_delivery_enabled: sameOriginPdfDeliveryEnabled,
    public_pdf_view_download_enabled: sameOriginPdfDeliveryEnabled,
    direct_cached_downloads_enabled: false,
    sensitive_public_collection_enabled: false
  },
  summary: {
    route_actions: routes.length,
    routes_with_packet_pages: routes.filter((route) => route.counts.official_packet_pages > 0).length,
    routes_with_approved_pdfs: routes.filter((route) => route.counts.official_pdfs > 0).length,
    official_packet_page_actions: packetPageActions.length,
    official_pdf_actions: officialPdfActions.length,
    approved_same_origin_pdf_delivery_enabled: sameOriginPdfDeliveryEnabled,
    public_pdf_view_download_enabled: sameOriginPdfDeliveryEnabled,
    direct_cached_downloads_enabled: false
  },
  routes,
  public_message: "Choose the starting point that sounds closest, then view or download the reviewed forms on this site. No sensitive facts are collected here."
};

writeJSON("data/form-route-actions.json", output);
console.log(`Built route actions: ${output.summary.route_actions} routes, ${output.summary.official_packet_page_actions} packet pages, ${output.summary.official_pdf_actions} PDFs.`);
