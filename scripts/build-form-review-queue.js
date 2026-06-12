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

const packets = readJSON("data/form-packet-catalog.json");
const candidates = readJSON("data/maricopa-form-link-candidates.json");
const monitor = readJSON("data/source-monitoring-report.json");

const monitorByUrl = new Map((monitor.results || []).map((item) => [item.url, item]));
const packetById = new Map((packets.packet_records || []).map((item) => [item.packet_id, item]));

const queue = (candidates.candidates || []).map((candidate, index) => {
  const packet = packetById.get(candidate.packet_id) || {};
  const monitorRecord = monitorByUrl.get(candidate.candidate_url);
  const sourceOk = monitorRecord?.status === "ok";
  const isRepresentative = packet.official_packet_url === candidate.candidate_url;
  const pageActionStatus = sourceOk && isRepresentative ? "open_official_page_allowed" : "review_before_public_action";

  return {
    review_id: `maricopa-review-${String(index + 1).padStart(3, "0")}`,
    packet_id: candidate.packet_id,
    packet_label: packet.label || candidate.candidate_label,
    candidate_label: candidate.candidate_label,
    candidate_url: candidate.candidate_url,
    source_page_url: candidate.source_page_url,
    source_status: sourceOk ? "source_ok" : "source_needs_check",
    public_action_status: pageActionStatus,
    public_download_enabled: false,
    direct_cached_download_enabled: false,
    human_review_status: "pending",
    review_checklist: [
      "Confirm this page matches the packet group and filing posture.",
      "Confirm children/no-children, response, agreement, or post-decree routing fit.",
      "Confirm no stale, duplicate, or misleading packet page is being promoted.",
      "Confirm whether packet page can be public action while PDF downloads remain disabled."
    ],
    monitor: monitorRecord
      ? {
          checked_at: monitorRecord.checked_at,
          http_status: monitorRecord.http_status,
          final_url: monitorRecord.final_url,
          content_type: monitorRecord.content_type,
          sha256: monitorRecord.sha256
        }
      : null
  };
});

const output = {
  version: "0.5.0-review-queue",
  built_at: builtAt,
  public_safety: {
    public_downloads_enabled: false,
    direct_cached_downloads_enabled: false,
    public_packet_pages_may_open_when_source_ok_and_representative: true,
    sensitive_public_collection_enabled: false
  },
  summary: {
    total_review_items: queue.length,
    source_ok: queue.filter((item) => item.source_status === "source_ok").length,
    open_official_page_allowed: queue.filter((item) => item.public_action_status === "open_official_page_allowed").length,
    review_before_public_action: queue.filter((item) => item.public_action_status === "review_before_public_action").length,
    public_downloads_enabled: false
  },
  queue
};

writeJSON("data/form-review-queue.json", output);
console.log(`Built form review queue: ${output.summary.total_review_items} items, ${output.summary.open_official_page_allowed} official-page actions allowed, downloads disabled.`);
