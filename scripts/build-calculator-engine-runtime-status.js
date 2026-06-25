#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

function readJSON(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeJSON(relativePath, value) {
  const outputPath = path.join(root, relativePath);
  ensureDir(path.dirname(outputPath));
  fs.writeFileSync(outputPath, `${JSON.stringify(value, null, 2)}\n`);
}

const sourceSnapshot = readJSON("data/calculator-source-snapshot-status.json");
const formulaMap = readJSON("data/calculator-formula-engine-readiness.json");
const engine = readJSON("data/calculator-engine-readiness.json");
const approvedFixtures = readJSON("data/calculator-approved-fixtures-status.json");
const regressionComparison = readJSON("data/calculator-regression-comparison-status.json");
const regressionEvidence = readJSON("data/calculator-regression-evidence-status.json");
const runtimePublic = exists("data/calculator-runtime-public-status.json") ? readJSON("data/calculator-runtime-public-status.json") : null;
const builtAt = new Date().toISOString();
const publicResultsEnabled = Boolean(runtimePublic?.summary?.child_support_runtime_enabled);
const localFormulaEngineEnabled = publicResultsEnabled;
const maintenanceRuntimeEnabled = Boolean(runtimePublic?.summary?.spousal_maintenance_runtime_enabled);

const runtimeChecks = [
  {
    key: "source_snapshot_ready",
    public_label: "Official source snapshot ready",
    status: sourceSnapshot.summary?.source_snapshot_ready ? "pass" : "blocked",
    public_note: "Official source snapshot must be current before local calculations can be considered."
  },
  {
    key: "formula_map_ready",
    public_label: "Formula map ready",
    status: formulaMap.summary?.child_support_formula_map_ready ? "pass" : "blocked",
    public_note: "Formula map must exist before a runtime can be validated."
  },
  {
    key: "unsupported_functions_resolved",
    public_label: "Workbook functions mapped",
    status: engine.summary?.unsupported_excel_functions === 0 ? "pass" : "blocked",
    public_note: "Every formula function needed by the mapped outputs must be supported or reviewed."
  },
  {
    key: "runtime_bundle_present",
    public_label: "Runtime bundle present",
    status: exists("js/mflg-calculator-engine.js") ? "pass" : "blocked",
    public_note: "No public MFLG formula runtime bundle is enabled yet."
  },
  {
    key: "approved_fixtures_complete",
    public_label: "Approved fixtures complete",
    status: approvedFixtures.summary?.complete_approved_fixtures === approvedFixtures.summary?.fixture_templates &&
      approvedFixtures.summary?.fixture_templates > 0 ? "pass" : "blocked",
    public_note: "Approved official-output fixtures are required before a local runtime can produce results."
  },
  {
    key: "regression_evidence_complete",
    public_label: "Regression evidence complete",
    status: regressionEvidence.summary?.complete_regression_evidence === regressionEvidence.summary?.regression_evidence_items &&
      regressionEvidence.summary?.regression_evidence_items > 0 ? "pass" : "blocked",
    public_note: "Every approved fixture must have completed comparison evidence."
  },
  {
    key: "comparisons_passed",
    public_label: "Regression comparisons passed",
    status: regressionComparison.summary?.complete_comparisons === regressionComparison.summary?.fixture_comparison_items &&
      regressionComparison.summary?.fixture_comparison_items > 0 &&
      regressionComparison.summary?.material_mismatches === 0 ? "pass" : "blocked",
    public_note: "Every comparison must pass with zero material mismatch."
  }
];

const passedRuntimeChecks = runtimeChecks.filter((item) => item.status === "pass").length;
const blockedRuntimeChecks = runtimeChecks.length - passedRuntimeChecks;
const runtimeReady = blockedRuntimeChecks === 0;

const publicStatus = {
  version: "1.0.0-calculator-engine-runtime-status",
  built_at: builtAt,
  public_safety: {
    internal_runtime_plan_exposed: false,
    raw_formula_text_exposed: false,
    internal_engine_outputs_exposed: false,
    sensitive_fixture_values_exposed: false,
    local_formula_engine_enabled: localFormulaEngineEnabled,
    official_api_runtime_enabled: maintenanceRuntimeEnabled,
    public_results_enabled: publicResultsEnabled,
    reviewer_approval_required: true
  },
  summary: {
    engine_runtime_status_ready: true,
    runtime_checks: runtimeChecks.length,
    passed_runtime_checks: passedRuntimeChecks,
    blocked_runtime_checks: blockedRuntimeChecks,
    runtime_ready: runtimeReady,
    public_results_enabled: publicResultsEnabled,
    local_formula_engine_enabled: localFormulaEngineEnabled,
    official_api_runtime_enabled: maintenanceRuntimeEnabled,
    child_support_runtime_enabled: publicResultsEnabled,
    spousal_maintenance_runtime_enabled: maintenanceRuntimeEnabled
  },
  public_runtime_checks: runtimeChecks,
  public_message: publicResultsEnabled
    ? `The MFLG child-support calculator runtime is enabled for on-site planning.${maintenanceRuntimeEnabled ? " The MFLG spousal-maintenance calculator is enabled on site and powered by the official Arizona API." : " Spousal maintenance remains in official-source fallback."}`
    : "The MFLG calculator runtime is being tracked, but local formula results remain locked until a reviewed runtime bundle, approved fixtures, and passing comparisons are complete."
};

const internalPlan = {
  version: "1.0.0-calculator-engine-runtime-plan",
  built_at: builtAt,
  public_exposure: "blocked by Worker /internal/ route",
  safety: {
    contains_sensitive_user_data: false,
    contains_real_fixture_values: false,
    contains_raw_formula_text: false,
    contains_internal_engine_outputs: false,
    public_results_enabled: false,
    intended_use: "Internal runtime readiness and implementation plan for calculator release control."
  },
  runtime_contract: {
    public_runtime_path: "js/mflg-calculator-engine.js",
    required_before_enablement: [
      "Reviewed runtime bundle present.",
      "Approved official-output fixtures complete.",
      "Regression comparison results complete.",
      "Zero material mismatches.",
      "Final reviewer unlock approval recorded."
    ],
    prohibited_before_enablement: [
      "Do not expose workbook formulas.",
      "Do not expose fixture values.",
      "Do not calculate public support or maintenance outputs from unapproved formulas.",
      "Do not mark public results enabled from status files alone."
    ]
  },
  n8n_workflow_contract: {
    schedule: "Run after formula-map, fixture, and regression-comparison builds.",
    allowed_public_fetches: [
      "/data/calculator-engine-runtime-status.json",
      "/data/calculator-source-snapshot-status.json",
      "/data/calculator-regression-evidence-status.json"
    ],
    do_not_fetch: [
      "/internal/calculator-engine-runtime-plan.json",
      "/internal/calculator-formula-map.json",
      "/internal/calculator-approved-fixtures.json",
      "/internal/calculator-regression-comparison-results.json"
    ],
    crm_os_fields: {
      calculator_runtime_ready: "data.calculator-engine-runtime-status.summary.runtime_ready",
      calculator_blocked_runtime_checks: "data.calculator-engine-runtime-status.summary.blocked_runtime_checks",
      calculator_local_formula_engine_enabled: "data.calculator-engine-runtime-status.summary.local_formula_engine_enabled",
      calculator_public_results_enabled: "data.calculator-engine-runtime-status.summary.public_results_enabled"
    }
  },
  runtime_checks: runtimeChecks.map((item) => ({
    key: item.key,
    status: item.status,
    required_before_public_release: true
  }))
};

writeJSON("data/calculator-engine-runtime-status.json", publicStatus);
writeJSON("internal/calculator-engine-runtime-plan.json", internalPlan);
console.log(`Built calculator engine runtime status: ${passedRuntimeChecks}/${runtimeChecks.length} checks passed, child-support runtime ${publicResultsEnabled ? "enabled" : "locked"}.`);
