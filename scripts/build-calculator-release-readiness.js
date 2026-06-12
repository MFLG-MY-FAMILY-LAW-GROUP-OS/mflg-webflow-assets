#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

function readJSON(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeJSON(relativePath, value) {
  const outputPath = path.join(root, relativePath);
  ensureDir(path.dirname(outputPath));
  fs.writeFileSync(outputPath, `${JSON.stringify(value, null, 2)}\n`);
}

const unlock = readJSON("data/calculator-public-unlock-status.json");
const alerts = readJSON("data/calculator-operations-alerts.json");
const operations = readJSON("data/calculator-operations-status.json");
const fixtureQa = readJSON("data/calculator-fixture-qa-status.json");
const comparison = readJSON("data/calculator-regression-comparison-status.json");

const publicGates = unlock.public_gates || [];
const blockedReleaseItems = publicGates
  .filter((gate) => gate.status !== "pass")
  .map((gate) => ({
    key: gate.key,
    label: gate.label,
    status: gate.status
  }));

const builtAt = new Date().toISOString();

const publicReadiness = {
  version: "1.0.0-calculator-release-readiness",
  built_at: builtAt,
  public_safety: {
    internal_approval_packet_exposed: false,
    sensitive_fixture_values_exposed: false,
    raw_formula_text_exposed: false,
    internal_engine_outputs_exposed: false,
    comparison_deltas_exposed: false,
    public_results_enabled: false,
    reviewer_approval_required: !unlock.summary?.public_unlock_ready
  },
  summary: {
    release_readiness_ready: true,
    release_packet_complete: Boolean(unlock.summary?.public_unlock_ready),
    public_unlock_gate_ready: Boolean(unlock.summary?.public_unlock_gate_ready),
    gate_count: unlock.summary?.gate_count || publicGates.length,
    passed_gates: unlock.summary?.passed_gates || 0,
    blocked_gates: unlock.summary?.blocked_gates || blockedReleaseItems.length,
    blocking_alerts: alerts.summary?.blocking_alerts || 0,
    fixture_review_items: fixtureQa.summary?.fixture_review_items || 0,
    complete_regression_comparisons: comparison.summary?.complete_comparisons || 0,
    public_results_enabled: false,
    next_public_status: operations.summary?.next_public_status || "official_tools_remain_available"
  },
  blocked_release_items: blockedReleaseItems,
  public_message: unlock.summary?.public_unlock_ready
    ? "Calculator release evidence is complete. MFLG calculator results remain off until the public runtime is separately enabled."
    : "MFLG-branded calculator results are not released yet. Official calculators remain available until the required test records, comparison checks, and final review are complete."
};

const internalApprovalPacket = {
  version: "1.0.0-calculator-release-approval-packet",
  built_at: builtAt,
  public_exposure: "blocked by Worker /internal/ route",
  safety: {
    contains_sensitive_user_data: false,
    contains_real_fixture_values: false,
    contains_raw_formula_text: false,
    contains_internal_engine_outputs: false,
    public_results_enabled: false,
    intended_use: "Internal calculator release approval packet for n8n and CRM OS only."
  },
  release_decision: {
    public_results_enabled: false,
    release_packet_complete: Boolean(unlock.summary?.public_unlock_ready),
    blocked_release_items: blockedReleaseItems.length,
    reviewer_final_approval_required: !unlock.summary?.public_unlock_ready
  },
  n8n_workflow_contract: {
    schedule: "Poll after fixture approval, regression comparison, and final-review updates.",
    allowed_public_fetches: [
      "/data/calculator-release-readiness.json",
      "/data/calculator-public-unlock-status.json",
      "/data/calculator-operations-alerts.json"
    ],
    do_not_fetch: [
      "/internal/calculator-release-approval-packet.json",
      "/internal/calculator-public-unlock-decision.json",
      "/internal/calculator-regression-comparison-plan.json",
      "/internal/calculator-formula-map.json"
    ],
    crm_os_fields: {
      calculator_release_packet_complete: "data.calculator-release-readiness.summary.release_packet_complete",
      calculator_blocked_gates: "data.calculator-release-readiness.summary.blocked_gates",
      calculator_blocking_alerts: "data.calculator-release-readiness.summary.blocking_alerts",
      calculator_public_results_enabled: "data.calculator-release-readiness.summary.public_results_enabled"
    }
  },
  required_release_evidence: [
    "Approved official-output fixture records are complete.",
    "Regression comparisons are complete with zero material mismatches.",
    "Final reviewer approval is recorded before any public MFLG-branded result appears.",
    "Official Arizona calculators remain available as fallback until release approval is complete."
  ],
  blocked_release_items: blockedReleaseItems
};

writeJSON("data/calculator-release-readiness.json", publicReadiness);
writeJSON("internal/calculator-release-approval-packet.json", internalApprovalPacket);
console.log(`Built calculator release readiness: ${publicReadiness.summary.passed_gates}/${publicReadiness.summary.gate_count} gates passed, public results locked.`);
