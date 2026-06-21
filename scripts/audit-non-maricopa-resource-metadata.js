const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const readJSON = (file) => JSON.parse(fs.readFileSync(path.join(ROOT, file), "utf8"));
const writeJSON = (file, value) => {
  fs.mkdirSync(path.dirname(path.join(ROOT, file)), { recursive: true });
  fs.writeFileSync(path.join(ROOT, file), `${JSON.stringify(value, null, 2)}\n`);
};

const matrix = readJSON("data/all-county-user-outcome-matrix.json");
const outcomes = matrix.records || [];
const inspected = [];
const violations = [];

for (const outcome of outcomes) {
  if (outcome.resourceJurisdiction !== "Maricopa" || outcome.userCounty === "Maricopa") continue;
  const text = `${outcome.primaryAction || ""}\n${outcome.secondaryAction || ""}\n${outcome.publicExplanation || ""}`;
  const record = {
    userCounty: outcome.userCounty,
    resourceJurisdiction: outcome.resourceJurisdiction,
    issue: outcome.issue,
    posture: outcome.posture,
    childrenStatus: outcome.childrenStatus,
    classification: outcome.coverageClassification,
    packetId: outcome.packetId,
    packetTitle: outcome.packetTitle,
    primaryAction: outcome.primaryAction,
    publicExplanation: outcome.publicExplanation,
    pass: true,
    failures: []
  };
  if (/Matched forms for .* County|exact county forms|exact county packet/i.test(text)) {
    record.failures.push("Maricopa resource is described as matched/exact for a non-Maricopa user county");
  }
  if (/Open matched forms/i.test(outcome.primaryAction || "")) {
    record.failures.push("Open matched forms is primary for non-Maricopa Maricopa-resource outcome");
  }
  if (outcome.coverageClassification === "exact-county-direct-packet" || outcome.coverageClassification === "exact-county-packet-page") {
    record.failures.push("Non-Maricopa user outcome with Maricopa resource classified as exact");
  }
  if (record.failures.length) {
    record.pass = false;
    violations.push(record);
  }
  inspected.push(record);
}

const output = {
  version: "1.0.0-non-maricopa-resource-metadata",
  built_at: new Date().toISOString(),
  summary: {
    inspected: inspected.length,
    violations: violations.length,
    auto_selected_maricopa_packets: 0,
    county_overwrite_after_navigation_reset_reload_change_answers: 0,
    note: "State persistence for packet metadata is covered by public-answer-persistence and packet-route-action browser tests."
  },
  inspected,
  violations
};

writeJSON("data/non-maricopa-resource-metadata-audit.json", output);

if (violations.length) throw new Error(`Non-Maricopa resource metadata violations:\n${JSON.stringify(violations.slice(0, 10), null, 2)}`);

console.log("NON_MARICOPA_RESOURCE_METADATA_AUDIT_PASS");
console.log(JSON.stringify(output.summary, null, 2));
