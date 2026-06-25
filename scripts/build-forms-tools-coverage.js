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

const sourceHealth = readJSON("data/source-health-public.json");
const packetActions = readJSON("data/form-packet-page-actions.json");
const pdfActions = readJSON("data/form-pdf-public-actions.json");
const pdfRouteIndex = readJSON("data/form-pdf-route-index.json");
const reviewQueue = readJSON("data/form-review-queue.json");
const sameOriginPdfDeliveryEnabled = pdfActions.summary?.same_origin_pdf_delivery_enabled === true ||
  pdfActions.public_safety?.same_origin_pdf_delivery_enabled === true;

const packetActionList = packetActions.actions || [];
const pdfRoutePackets = pdfRouteIndex.packets || [];
const packetIds = new Set([
  ...packetActionList.map((item) => item.packet_id).filter(Boolean),
  ...pdfRoutePackets.map((item) => item.packet_id).filter(Boolean)
]);

const routes = Array.from(packetIds).sort().map((packetId) => {
  const packetPageActions = packetActionList.filter((item) => item.packet_id === packetId);
  const pdfPacket = pdfRoutePackets.find((item) => item.packet_id === packetId);
  const representative = packetPageActions[0] || pdfPacket || {};
  return {
    packet_id: packetId,
    packet_label: representative.packet_label || pdfPacket?.packet_label || "",
    has_official_packet_page: packetPageActions.length > 0,
    official_packet_page_actions: packetPageActions.length,
    has_approved_pdf_actions: !!pdfPacket,
    approved_pdf_actions: pdfPacket?.official_pdf_action_ids?.length || 0,
    route: representative.route || pdfPacket?.route || null
  };
});

const output = {
  version: "1.0.0-forms-tools-coverage",
  built_at: new Date().toISOString(),
  source_manifests: [
    "data/source-health-public.json",
    "data/form-packet-page-actions.json",
    "data/form-pdf-public-actions.json",
    "data/form-pdf-route-index.json",
    "data/form-review-queue.json"
  ],
  public_safety: {
    contains_sensitive_user_data: false,
    safe_route_metadata_only: true,
    approved_same_origin_pdf_delivery_enabled: sameOriginPdfDeliveryEnabled,
    public_downloads_enabled: sameOriginPdfDeliveryEnabled,
    direct_cached_downloads_enabled: false,
    raw_source_hashes_exposed: false
  },
  summary: {
    official_sources_checked: sourceHealth.summary?.total || 0,
    official_sources_ok: sourceHealth.summary?.ok || 0,
    official_sources_broken: sourceHealth.summary?.broken || 0,
    official_packet_page_actions: packetActions.summary?.official_packet_page_actions || 0,
    packet_candidates_review_only: packetActions.summary?.review_before_public_action || reviewQueue.summary?.review_before_public_action || 0,
    approved_pdf_actions: pdfActions.summary?.approved_official_pdf_actions || 0,
    pdf_route_packets: pdfRouteIndex.summary?.route_packets || 0,
    covered_packet_routes: routes.length,
    approved_same_origin_pdf_delivery_enabled: sameOriginPdfDeliveryEnabled,
    public_downloads_enabled: sameOriginPdfDeliveryEnabled,
    direct_cached_downloads_enabled: false
  },
  routes,
  public_message: sameOriginPdfDeliveryEnabled
    ? "Forms & Tools now lets visitors view and download reviewed official PDFs on site through approved same-origin delivery. Unreviewed packet candidates and raw cached copies remain controlled."
    : "Forms & Tools uses official court source links and keeps downloads disabled until each form source is reviewed for public use."
};

writeJSON("data/forms-tools-coverage.json", output);
console.log(`Built Forms & Tools coverage: ${output.summary.covered_packet_routes} packet routes, ${output.summary.official_packet_page_actions} packet pages, ${output.summary.approved_pdf_actions} PDFs.`);
