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

const formsCatalog = readJSON("data/forms-catalog.json");
const sourceHealth = readJSON("data/source-health-public.json");
const routeActions = readJSON("data/form-route-actions.json");

const officialSources = (formsCatalog.official_source_router || []).filter((source) => (
  source.jurisdiction !== "reference" &&
  source.source_type !== "reference_index" &&
  source.monitoring_status !== "access_restricted"
));
const routeList = Array.isArray(routeActions.routes) ? routeActions.routes : [];
const checkedAt = sourceHealth.checked_at || null;

function statusFor(source) {
  const county = source.county || "Statewide";
  const packetRoutes = routeList.filter((route) => (route.route?.county || "") === county);
  const packetPages = packetRoutes.reduce((sum, route) => sum + (route.counts?.official_packet_pages || 0), 0);
  const approvedPdfs = packetRoutes.reduce((sum, route) => sum + (route.counts?.official_pdfs || 0), 0);
  const packetReviewed = packetPages > 0 || approvedPdfs > 0;

  return {
    jurisdiction_id: source.form_set_id,
    label: source.label,
    county,
    court: source.court,
    jurisdiction_type: source.jurisdiction,
    official_url: source.official_url,
    source_status: "official source monitored",
    packet_review_status: packetReviewed
      ? "packet actions reviewed"
      : county === "Statewide" ? "statewide source only" : "county source only",
    reviewed_packet_routes: packetRoutes.length,
    official_packet_page_actions: packetPages,
    approved_pdf_actions: approvedPdfs,
    public_guidance: packetReviewed
      ? "Reviewed packet actions and approved PDFs are available in the on-page viewer for matching routes."
      : "Use Guided Intake if this jurisdiction is not clearly matched yet.",
    intake_guidance: county === "Statewide"
      ? "Use statewide resources when the county is not known yet, then confirm the filing court before choosing packet details."
      : "If this is the county for an existing case or likely new filing, carry the county into Guided Intake for review."
  };
}

const jurisdictions = officialSources.map(statusFor);

const output = {
  version: "1.0.0-jurisdiction-readiness",
  built_at: new Date().toISOString(),
  checked_at: checkedAt,
  source_manifests: [
    "data/forms-catalog.json",
    "data/source-health-public.json",
    "data/form-route-actions.json"
  ],
  public_safety: {
    contains_sensitive_user_data: false,
    safe_route_metadata_only: true,
    direct_cached_downloads_enabled: false,
    sensitive_public_collection_enabled: false
  },
  summary: {
    official_jurisdictions: jurisdictions.length,
    monitored_sources_ok: sourceHealth.summary?.ok || 0,
    monitored_sources_total: sourceHealth.summary?.total || 0,
    jurisdictions_with_reviewed_packet_actions: jurisdictions.filter((item) => item.reviewed_packet_routes > 0).length,
    county_source_only: jurisdictions.filter((item) => item.reviewed_packet_routes === 0 && item.jurisdiction_type === "county").length,
    statewide_source_only: jurisdictions.filter((item) => item.reviewed_packet_routes === 0 && item.jurisdiction_type === "statewide").length,
    direct_cached_downloads_enabled: false
  },
  jurisdictions,
  public_message: "County choice controls the safest starting point. Maricopa has reviewed packet-level actions now; other monitored county sources should route through Guided Intake until packet review is completed."
};

writeJSON("data/jurisdiction-readiness.json", output);
console.log(`Built jurisdiction readiness: ${output.summary.official_jurisdictions} jurisdictions, ${output.summary.jurisdictions_with_reviewed_packet_actions} with reviewed packet actions.`);
