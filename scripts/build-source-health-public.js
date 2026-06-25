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

function typeLabel(type) {
  if (type === "form_source") return "Official form libraries";
  if (type === "form_packet") return "Packet source pages";
  if (type === "calculator") return "Calculator sources";
  if (type === "reference_index") return "Reference indexes";
  return "Official sources";
}

const report = readJSON("data/source-monitoring-report.json");
const results = Array.isArray(report.results) ? report.results : [];
const groups = new Map();

for (const item of results) {
  const type = item.type || "source";
  if (!groups.has(type)) {
    groups.set(type, {
      type,
      label: typeLabel(type),
      total: 0,
      ok: 0,
      broken: 0
    });
  }
  const group = groups.get(type);
  group.total += 1;
  if (item.status === "ok") group.ok += 1;
  if (item.status === "broken") group.broken += 1;
}

const output = {
  version: "1.0.0-public-source-health",
  built_at: new Date().toISOString(),
  source_report_version: report.version || "",
  checked_at: report.checked_at || "",
  public_safety: {
    contains_sensitive_user_data: false,
    raw_hashes_exposed: false,
    raw_etags_exposed: false,
    cached_downloads_enabled: false
  },
  summary: {
    total: report.summary?.total || results.length,
    ok: report.summary?.ok || results.filter((item) => item.status === "ok").length,
    broken: report.summary?.broken || results.filter((item) => item.status === "broken").length,
    public_downloads_enabled: false
  },
  groups: Array.from(groups.values()).sort((a, b) => a.label.localeCompare(b.label)),
  public_message: report.summary?.broken
    ? "One or more official sources need review. Public links should fall back to official source pages."
    : "Official-source checks passed. Public actions continue to open official court sources only."
};

writeJSON("data/source-health-public.json", output);
console.log(`Built public source-health summary: ${output.summary.ok} ok, ${output.summary.broken} broken.`);
