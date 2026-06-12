#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const root = path.resolve(__dirname, "..");
const checkedAt = new Date().toISOString();

function readJSON(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function uniqueRecords() {
  const forms = readJSON("data/forms-catalog.json");
  const packets = readJSON("data/form-packet-catalog.json");
  const calculators = readJSON("data/calculators-catalog.json");
  const records = [];

  for (const item of forms.official_source_router || []) {
    if (item.monitoring_status === "access_restricted") continue;
    records.push({
      id: item.form_set_id,
      type: item.source_type || "form_source",
      label: item.label,
      url: item.source_page_url || item.official_url,
      fallback_url: item.official_url
    });
  }

  for (const item of packets.packet_records || []) {
    records.push({
      id: item.packet_id,
      type: "form_packet",
      label: item.label,
      url: item.official_packet_url || item.source_page_url,
      fallback_url: item.source_page_url
    });
  }

  for (const item of calculators.calculators || []) {
    records.push({
      id: item.calculator_id,
      type: "calculator",
      label: item.label,
      url: item.official_url || item.source_page_url || item.fallback_url,
      fallback_url: item.fallback_url
    });
  }

  const seen = new Map();
  for (const record of records) {
    if (!record.url) continue;
    const key = `${record.type}:${record.id}:${record.url}`;
    if (!seen.has(key)) seen.set(key, record);
  }
  return Array.from(seen.values());
}

async function checkRecord(record) {
  const startedAt = Date.now();
  try {
    const response = await fetch(record.url, {
      redirect: "follow",
      headers: {
        "user-agent": "MY FAMILY LAW GROUP PLLC source monitor; public planning tools"
      }
    });
    const buffer = Buffer.from(await response.arrayBuffer());
    const hash = crypto.createHash("sha256").update(buffer).digest("hex");
    return {
      ...record,
      checked_at: checkedAt,
      status: response.ok ? "ok" : "broken",
      http_status: response.status,
      final_url: response.url,
      content_type: response.headers.get("content-type"),
      content_length: buffer.length,
      last_modified: response.headers.get("last-modified"),
      etag: response.headers.get("etag"),
      sha256: hash,
      elapsed_ms: Date.now() - startedAt
    };
  } catch (error) {
    return {
      ...record,
      checked_at: checkedAt,
      status: "broken",
      http_status: null,
      error: error.message,
      elapsed_ms: Date.now() - startedAt
    };
  }
}

async function main() {
  const records = uniqueRecords();
  const results = [];
  for (const record of records) {
    results.push(await checkRecord(record));
  }

  const report = {
    version: "0.6.0-source-monitoring",
    checked_at: checkedAt,
    summary: {
      total: results.length,
      ok: results.filter((item) => item.status === "ok").length,
      broken: results.filter((item) => item.status === "broken").length
    },
    rules: {
      public_downloads_enabled: false,
      formula_updates_require_human_review: true,
      broken_or_changed_sources_fallback_to_official_page: true
    },
    results
  };

  fs.writeFileSync(
    path.join(root, "data/source-monitoring-report.json"),
    `${JSON.stringify(report, null, 2)}\n`
  );
  console.log(`Checked ${report.summary.total} official sources: ${report.summary.ok} ok, ${report.summary.broken} broken.`);
  if (report.summary.broken) {
    process.exitCode = 2;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
