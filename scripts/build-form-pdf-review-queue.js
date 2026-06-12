#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const builtAt = new Date().toISOString();

function readJSON(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function writeJSON(relativePath, value) {
  fs.writeFileSync(path.join(root, relativePath), `${JSON.stringify(value, null, 2)}\n`);
}

const pdfReport = readJSON("data/form-pdf-monitoring-report.json");
const results = pdfReport.results || [];

const packetGroups = new Map();
for (const item of results) {
  if (!packetGroups.has(item.packet_id)) {
    packetGroups.set(item.packet_id, {
      packet_id: item.packet_id,
      packet_label: item.packet_label,
      page_label: item.page_label,
      page_url: item.page_url,
      total_pdf_candidates: 0,
      english: 0,
      spanish: 0,
      unknown_language: 0,
      pdf_source_ok: 0
    });
  }
  const group = packetGroups.get(item.packet_id);
  group.total_pdf_candidates += 1;
  if (item.language === "English") group.english += 1;
  else if (item.language === "Spanish") group.spanish += 1;
  else group.unknown_language += 1;
  if (item.source_status === "pdf_source_ok") group.pdf_source_ok += 1;
}

const reviewItems = results.map((item, index) => ({
  pdf_review_id: `maricopa-pdf-review-${String(index + 1).padStart(3, "0")}`,
  packet_id: item.packet_id,
  packet_label: item.packet_label,
  page_label: item.page_label,
  page_url: item.page_url,
  pdf_label: item.pdf_label,
  file_name: item.file_name,
  pdf_url: item.pdf_url,
  language: item.language,
  source_status: item.source_status,
  human_review_status: "pending",
  public_pdf_action_enabled: false,
  direct_cached_download_enabled: false,
  review_checklist: [
    "Confirm the PDF belongs to the selected packet page and filing posture.",
    "Confirm the PDF title, language, and file purpose are clear enough for public display.",
    "Confirm the SHA-256 hash, content type, file size, and official URL are current.",
    "Confirm whether this PDF should be promoted to an official PDF action or remain packet-page only."
  ],
  monitor: {
    checked_at: item.checked_at,
    http_status: item.http_status,
    final_url: item.final_url,
    content_type: item.content_type,
    content_length: item.content_length,
    last_modified: item.last_modified,
    etag: item.etag,
    sha256: item.sha256
  }
}));

const output = {
  version: "0.7.0-pdf-review-queue",
  built_at: builtAt,
  public_safety: {
    public_pdf_actions_enabled: false,
    direct_cached_downloads_enabled: false,
    public_packet_page_actions_remain_available: true,
    sensitive_public_collection_enabled: false
  },
  summary: {
    total_pdf_review_items: reviewItems.length,
    pdf_source_ok: results.filter((item) => item.source_status === "pdf_source_ok").length,
    human_review_pending: reviewItems.length,
    english: results.filter((item) => item.language === "English").length,
    spanish: results.filter((item) => item.language === "Spanish").length,
    unknown_language: results.filter((item) => item.language !== "English" && item.language !== "Spanish").length,
    packet_groups: packetGroups.size,
    public_pdf_actions_enabled: false,
    direct_cached_downloads_enabled: false
  },
  packet_groups: Array.from(packetGroups.values()),
  review_items: reviewItems
};

writeJSON("data/form-pdf-review-queue.json", output);
console.log(`Built PDF review queue: ${output.summary.total_pdf_review_items} items across ${output.summary.packet_groups} packet groups; ${output.summary.english} English, ${output.summary.spanish} Spanish; public PDF actions disabled.`);
