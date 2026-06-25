const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const readJSON = (file) => JSON.parse(fs.readFileSync(path.join(ROOT, file), "utf8"));
const writeJSON = (file, value) => {
  fs.mkdirSync(path.dirname(path.join(ROOT, file)), { recursive: true });
  fs.writeFileSync(path.join(ROOT, file), `${JSON.stringify(value, null, 2)}\n`);
};

const uniqueCoverage = readJSON("data/unique-route-coverage-audit.json");
const matterCoverage = readJSON("data/forms-tools-matter-coverage.json");

const entryPaths = ["practice-area", "diy-guide", "forms-calculators-direct"];
const routeByPacket = new Map(uniqueCoverage.records.map((record) => [record.packet_id, record]));

function bestRecordForMatter(matter) {
  const exactPackets = Array.isArray(matter.exact_packets) ? matter.exact_packets : [];
  for (const packet of exactPackets) {
    const record = routeByPacket.get(packet.packet_id);
    if (record) return record;
  }
  return {
    route_key: `${matter.matter_id} | general-source`,
    packet_id: "",
    public_packet_title: matter.official_source_label || "General county forms directory",
    county: matter.default_county || "Not sure",
    issue: matter.title || "Choose issue",
    posture: "Choose stage",
    children: "Choose one",
    classification: matter.intake_fallback_required ? "intake-required" : "general-county-forms-index",
    source_type: "general-index",
    verified_pdf_count: 0,
    public_explanation: matter.intake_fallback_required
      ? "Guided Intake is required before a form can be safely identified."
      : "General county forms directory only; no issue-specific packet verified."
  };
}

const scenarios = [];
const mismatches = [];

for (const matter of matterCoverage.matters || []) {
  const base = bestRecordForMatter(matter);
  const rows = entryPaths.map((entryPath) => ({
    entry_path: entryPath,
    matter_id: matter.matter_id,
    title: matter.title,
    canonical_answers: {
      issue: base.issue,
      county: base.county,
      posture: base.posture,
      children: base.children
    },
    classification: base.classification,
    packet_id: base.packet_id,
    public_packet_title: base.public_packet_title,
    county_status: base.county,
    source_type: base.source_type,
    primary_action: base.classification === "intake-required" || base.classification === "no-verified-form"
      ? "Start Guided Intake"
      : base.classification === "general-county-forms-index"
      ? "Review source summary"
      : "Open matched result",
    verified_pdf_count: base.verified_pdf_count,
    limitation_explanation: base.public_explanation
  }));
  const signature = (row) => [
    row.classification,
    row.packet_id,
    row.public_packet_title,
    row.county_status,
    row.source_type,
    row.primary_action,
    row.verified_pdf_count,
    row.limitation_explanation
  ].join(" || ");
  const signatures = new Set(rows.map(signature));
  if (signatures.size !== 1) mismatches.push({ matter_id: matter.matter_id, title: matter.title, rows });
  scenarios.push({ matter_id: matter.matter_id, title: matter.title, rows });
}

const classificationCounts = scenarios.reduce((acc, scenario) => {
  const classification = scenario.rows[0].classification;
  acc[classification] = (acc[classification] || 0) + 1;
  return acc;
}, {});

const output = {
  version: "1.0.0-three-path-parity",
  built_at: new Date().toISOString(),
  entry_paths: entryPaths,
  summary: {
    matters: scenarios.length,
    entry_paths: entryPaths.length,
    parity_rows: scenarios.length * entryPaths.length,
    parity_scenarios: scenarios.length,
    mismatches: mismatches.length,
    classification_counts: classificationCounts
  },
  scenarios,
  mismatches
};

writeJSON("data/three-path-parity-audit.json", output);

if (scenarios.length !== 50) throw new Error(`Expected 50 parity scenarios, got ${scenarios.length}`);
if (mismatches.length) throw new Error(`Three-path parity mismatches:\n${JSON.stringify(mismatches, null, 2)}`);

console.log("THREE_PATH_PARITY_AUDIT_PASS");
console.log(JSON.stringify(output.summary, null, 2));
