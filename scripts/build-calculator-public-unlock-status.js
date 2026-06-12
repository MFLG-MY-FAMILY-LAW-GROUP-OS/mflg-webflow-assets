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

const sourceSummary = readJSON("data/calculator-formula-source-summary.json");
const formulaEngine = readJSON("data/calculator-formula-engine-readiness.json");
const regressionReadiness = readJSON("data/calculator-regression-readiness.json");
const engineReadiness = readJSON("data/calculator-engine-readiness.json");
const fixtureTemplate = readJSON("data/calculator-fixture-template-readiness.json");
const approvedFixtures = readJSON("data/calculator-approved-fixtures-status.json");
const fixtureQa = readJSON("data/calculator-fixture-qa-status.json");
const regressionComparison = readJSON("data/calculator-regression-comparison-status.json");
const finalApproval = readJSON("data/calculator-final-approval-status.json");
const runtimePublic = fs.existsSync(path.join(root, "data/calculator-runtime-public-status.json"))
  ? readJSON("data/calculator-runtime-public-status.json")
  : null;
const publicRuntimeEnabled = Boolean(runtimePublic?.summary?.child_support_runtime_enabled);

const gates = [
  {
    key: "official_sources_reachable",
    label: "Official sources reachable",
    status: sourceSummary.summary?.child_support_workbook_reachable === true &&
      sourceSummary.summary?.maintenance_page_reachable === true ? "pass" : "blocked"
  },
  {
    key: "formula_map_ready",
    label: "Formula map ready",
    status: formulaEngine.summary?.child_support_formula_map_ready === true ? "pass" : "blocked"
  },
  {
    key: "regression_harness_ready",
    label: "Regression harness ready",
    status: regressionReadiness.summary?.regression_harness_ready === true ? "pass" : "blocked"
  },
  {
    key: "engine_scaffold_ready",
    label: "Engine scaffold ready",
    status: engineReadiness.summary?.engine_scaffold_ready === true &&
      engineReadiness.summary?.unsupported_excel_functions === 0 ? "pass" : "blocked"
  },
  {
    key: "fixture_template_ready",
    label: "Fixture template ready",
    status: fixtureTemplate.summary?.fixture_entry_template_ready === true ? "pass" : "blocked"
  },
  {
    key: "approved_fixtures_complete",
    label: "Approved fixtures complete",
    status: approvedFixtures.summary?.complete_approved_fixtures === approvedFixtures.summary?.fixture_templates &&
      approvedFixtures.summary?.fixture_templates > 0 ? "pass" : "blocked"
  },
  {
    key: "fixture_qa_complete",
    label: "Fixture QA complete",
    status: fixtureQa.summary?.approved_fixture_count === fixtureQa.summary?.fixture_review_items &&
      fixtureQa.summary?.fixture_review_items > 0 ? "pass" : "blocked"
  },
  {
    key: "regression_comparisons_passed",
    label: "Regression comparisons passed",
    status: regressionComparison.summary?.complete_comparisons === regressionComparison.summary?.fixture_comparison_items &&
      regressionComparison.summary?.fixture_comparison_items > 0 &&
      regressionComparison.summary?.material_mismatches === 0 ? "pass" : "blocked"
  },
  {
    key: "reviewer_final_approval",
    label: "Reviewer final approval",
    status: finalApproval.summary?.final_approval_recorded ? "pass" : "blocked"
  }
];

const passedGates = gates.filter((gate) => gate.status === "pass").length;
const blockedGates = gates.length - passedGates;
const publicUnlockReady = blockedGates === 0;

const internalDecision = {
  version: "1.0.0-calculator-public-unlock-decision",
  built_at: new Date().toISOString(),
  public_exposure: "blocked by Worker /internal/ route",
  safety: {
    contains_sensitive_user_data: false,
    contains_real_fixture_values: false,
    contains_raw_formula_text: false,
    public_results_enabled: false,
    reviewer_approval_required: !finalApproval.summary?.final_approval_recorded,
    intended_use: "Internal calculator public-unlock gate decision only."
  },
  summary: {
    gate_count: gates.length,
    passed_gates: passedGates,
    blocked_gates: blockedGates,
    public_unlock_ready: publicUnlockReady,
    public_results_enabled: false
  },
  gates,
  required_staff_actions: [
    "Complete reviewer-approved official-output fixtures.",
    "Run regression comparisons and resolve every material mismatch.",
    "Record final reviewer approval before enabling any MFLG-branded calculator result.",
    "Keep official Arizona calculators available as the public fallback until unlock is approved."
  ]
};

const publicStatus = {
  version: "1.0.0-calculator-public-unlock-status",
  built_at: internalDecision.built_at,
  public_safety: {
    sensitive_fixture_values_exposed: false,
    raw_formula_text_exposed: false,
    internal_engine_outputs_exposed: false,
    comparison_deltas_exposed: false,
    public_results_enabled: publicRuntimeEnabled,
    local_formula_engine_enabled: publicRuntimeEnabled,
    reviewer_approval_required: !finalApproval.summary?.final_approval_recorded
  },
  summary: {
    public_unlock_gate_ready: true,
    gate_count: gates.length,
    passed_gates: passedGates,
    blocked_gates: blockedGates,
    public_unlock_ready: publicUnlockReady,
    public_results_enabled: publicRuntimeEnabled,
    local_formula_engine_enabled: publicRuntimeEnabled,
    child_support_runtime_enabled: publicRuntimeEnabled,
    spousal_maintenance_runtime_enabled: Boolean(runtimePublic?.summary?.spousal_maintenance_runtime_enabled)
  },
  public_gates: gates.map((gate) => ({
    key: gate.key,
    label: gate.label,
    status: gate.status
  })),
  public_message: publicRuntimeEnabled
    ? "MFLG calculator unlock gates have passed and the public runtime is enabled for on-site planning."
    : "MFLG-branded calculator results remain locked until every source, fixture, comparison, and reviewer-approval gate passes."
};

writeJSON("internal/calculator-public-unlock-decision.json", internalDecision);
writeJSON("data/calculator-public-unlock-status.json", publicStatus);
console.log(`Built calculator public unlock status: ${passedGates}/${gates.length} gates passed, public results locked.`);
