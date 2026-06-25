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

function routeLabel(route) {
  return [route?.county, route?.issue, route?.posture, route?.children]
    .filter(Boolean)
    .join(" / ");
}

const routeActions = readJSON("data/form-route-actions.json");
const coverage = readJSON("data/forms-tools-coverage.json");
const sourceHealth = readJSON("data/source-health-public.json");
const intakeReadiness = readJSON("data/forms-tools-intake-readiness.json");

const routes = (routeActions.routes || []).map((item) => {
  const pdfs = Array.isArray(item.official_pdfs) ? item.official_pdfs : [];
  const packetPages = Array.isArray(item.official_packet_pages) ? item.official_packet_pages : [];
  const primaryPdf = pdfs.find((pdf) => pdf.official_pdf_url);
  const primaryOfficialUrl = packetPages[0]?.official_packet_page_url || primaryPdf?.official_pdf_url || "";
  const primaryOfficialLabel = packetPages[0]?.label || primaryPdf?.display_label || primaryPdf?.label || primaryPdf?.file_name || "";
  return {
    route_start_id: `route-start-${item.packet_id}`,
    packet_id: item.packet_id,
    packet_label: item.packet_label,
    route: item.route || {},
    route_label: routeLabel(item.route),
    public_status: item.public_status,
    official_packet_pages: packetPages.length,
    approved_pdfs: pdfs.length,
    languages: Array.isArray(item.languages) ? item.languages : [],
    primary_official_packet_page_url: primaryOfficialUrl,
    primary_official_packet_page_label: primaryOfficialLabel,
    sample_approved_pdfs: pdfs.slice(0, 3).map((pdf) => ({
      display_label: pdf.display_label,
      language: pdf.language,
      official_pdf_url: pdf.official_pdf_url
    })),
    safe_intake_payload: {
      formCounty: item.route?.county || "Statewide",
      formIssue: item.route?.issue || "all",
      formPosture: item.route?.posture || "Any posture",
      formChildren: item.route?.children || "any",
      approvedPdfPacket: item.packet_label || "",
      sourceType: "Official court source / reviewed route start"
    }
  };
});

const output = {
  version: "1.0.0-forms-tools-route-intake-map",
  built_at: new Date().toISOString(),
  source_manifests: [
    "data/form-route-actions.json",
    "data/forms-tools-coverage.json",
    "data/source-health-public.json",
    "data/forms-tools-intake-readiness.json"
  ],
  public_safety: {
    contains_sensitive_user_data: false,
    safe_route_metadata_only: true,
    exact_route_intake_enabled: true,
    sensitive_public_collection_enabled: false,
    formula_logic_enabled_on_site: false,
    direct_cached_downloads_enabled: false,
    official_source_urls_only: true,
    raw_hashes_exposed: false,
    raw_etags_exposed: false
  },
  summary: {
    reviewed_route_starts: routes.length,
    routes_with_packet_pages: routes.filter((route) => route.official_packet_pages > 0).length,
    routes_with_approved_pdfs: routes.filter((route) => route.approved_pdfs > 0).length,
    official_packet_page_actions: routeActions.summary?.official_packet_page_actions || 0,
    approved_pdf_actions: routeActions.summary?.official_pdf_actions || 0,
    official_sources_ok: sourceHealth.summary?.ok || 0,
    official_sources_checked: sourceHealth.summary?.total || 0,
    safe_start_options: intakeReadiness.summary?.safe_start_options || 0,
    direct_cached_downloads_enabled: false,
    sensitive_public_collection_enabled: false
  },
  routes,
  public_message: "Each reviewed route can start Guided Intake with only county, issue, posture, children category, packet, and official-source metadata."
};

writeJSON("data/forms-tools-route-intake-map.json", output);
console.log(`Built Forms & Tools route Intake map: ${output.summary.reviewed_route_starts} reviewed route starts.`);
