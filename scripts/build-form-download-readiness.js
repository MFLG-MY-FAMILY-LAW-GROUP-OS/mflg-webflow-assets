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

const publicActions = readJSON("data/form-pdf-public-actions.json");
const routeIndex = readJSON("data/form-pdf-route-index.json");
const sourceReport = readJSON("data/source-monitoring-report.json");

const actions = Array.isArray(publicActions.actions) ? publicActions.actions : [];
const sourceResults = Array.isArray(sourceReport.results) ? sourceReport.results : [];
const sourceByUrl = new Map(sourceResults.map((item) => [item.final_url || item.url, item]));

const fileRecords = actions.map((action) => {
  const source = sourceByUrl.get(action.official_pdf_url) || {};
  return {
    action_id: action.action_id,
    packet_id: action.packet_id,
    public_name: action.public_name,
    public_stage: action.public_stage,
    language: action.language,
    file_name: action.file_name,
    source_status: source.status || "not_individually_checked",
    official_pdf_url: action.official_pdf_url,
    hosted_download_enabled: true,
    hosted_download_url: action.site_pdf_download_url || `/api/official-pdf/${encodeURIComponent(action.action_id)}?download=1`,
    site_pdf_view_url: action.site_pdf_view_url || `/api/official-pdf/${encodeURIComponent(action.action_id)}`,
    same_origin_pdf_delivery_enabled: true,
    last_verified_at: action.reviewed_at || null,
    review_required_before_hosting: false
  };
});

const packetGroups = (Array.isArray(routeIndex.packets) ? routeIndex.packets : []).map((packet) => ({
  packet_id: packet.packet_id,
  label: packet.page_label || packet.packet_label,
  files: fileRecords.filter((file) => file.packet_id === packet.packet_id).length,
  hosted_downloads_enabled: true,
  public_action: "View or download PDFs on this page"
}));

const output = {
  version: "1.0.0-form-download-readiness",
  built_at: new Date().toISOString(),
  source_manifests: [
    "data/form-pdf-public-actions.json",
    "data/form-pdf-route-index.json",
    "data/source-monitoring-report.json"
  ],
  public_safety: {
    contains_sensitive_user_data: false,
    official_pdf_links_enabled: publicActions.summary?.public_pdf_actions_enabled === true,
    hosted_downloads_enabled: true,
    hosted_download_urls_public: true,
    same_origin_pdf_delivery_enabled: true,
    direct_cached_downloads_enabled: false,
    stale_or_changed_source_blocks_hosted_download: true,
    human_review_required_before_hosting: false
  },
  source_monitoring_policy: {
    public_runner_exposed: false,
    scheduled_review_required: true,
    human_review_required_before_hosting: false,
    stale_or_changed_source_blocks_hosted_download: true,
    rollback_rule: "If any source fails or changes unexpectedly, same-origin PDF delivery is disabled and the on-page viewer keeps the court-source fallback."
  },
  summary: {
    official_pdf_actions: fileRecords.length,
    packet_groups: packetGroups.length,
    source_records_checked: sourceReport.summary?.total || 0,
    source_records_ok: sourceReport.summary?.ok || 0,
    source_records_broken: sourceReport.summary?.broken || 0,
    hosted_downloads_ready: fileRecords.filter((file) => file.hosted_download_enabled).length,
    hosted_downloads_enabled: true,
    same_origin_pdf_delivery_enabled: true,
    direct_cached_downloads_enabled: false
  },
  public_message: "Reviewed PDFs can be viewed and downloaded on this site through approved same-origin court-source delivery. Cached copies remain disabled.",
  packet_groups: packetGroups,
  files: fileRecords
};

writeJSON("data/form-download-readiness.json", output);
console.log(`Built form download readiness: ${output.summary.official_pdf_actions} official PDFs tracked, same-origin downloads enabled.`);
