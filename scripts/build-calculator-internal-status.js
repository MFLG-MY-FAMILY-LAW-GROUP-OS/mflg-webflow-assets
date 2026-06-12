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

function fileStatus(relativePath, expectedVersion) {
  if (!exists(relativePath)) {
    return {
      path: relativePath,
      present_locally: false,
      expected_version: expectedVersion,
      version_ok: false
    };
  }
  const value = readJSON(relativePath);
  return {
    path: relativePath,
    present_locally: true,
    expected_version: expectedVersion,
    version_ok: value.version === expectedVersion
  };
}

function writeJSON(relativePath, value) {
  fs.writeFileSync(path.join(root, relativePath), `${JSON.stringify(value, null, 2)}\n`);
}

const sourceSummary = readJSON("data/calculator-formula-source-summary.json");
const formulaEngine = readJSON("data/calculator-formula-engine-readiness.json");
const regression = readJSON("data/calculator-regression-readiness.json");
const engine = readJSON("data/calculator-engine-readiness.json");
const fixture = readJSON("data/calculator-fixture-template-readiness.json");
const sourceSnapshot = readJSON("data/calculator-source-snapshot-status.json");

const internalArtifacts = [
  fileStatus("internal/calculator-source-snapshot.json", "1.0.0-calculator-source-snapshot"),
  fileStatus("internal/calculator-formula-workbench.json", "1.0.0-calculator-formula-workbench"),
  fileStatus("internal/calculator-formula-map.json", "1.0.0-calculator-formula-map"),
  fileStatus("internal/calculator-regression-harness.json", "1.0.0-calculator-regression-harness"),
  fileStatus("internal/calculator-engine-scaffold.json", "1.0.0-calculator-engine-scaffold"),
  fileStatus("internal/calculator-fixture-entry-template.json", "1.0.0-calculator-fixture-entry-template"),
  fileStatus("internal/calculator-approved-fixtures-template.json", "1.0.0-calculator-approved-fixtures-template"),
  fileStatus("internal/calculator-fixture-qa-plan.json", "1.0.0-calculator-fixture-qa-plan"),
  fileStatus("internal/calculator-regression-comparison-plan.json", "1.0.0-calculator-regression-comparison-plan"),
  fileStatus("internal/calculator-final-approval.json", "1.0.0-calculator-final-approval-internal"),
  fileStatus("internal/calculator-public-unlock-decision.json", "1.0.0-calculator-public-unlock-decision"),
  fileStatus("internal/calculator-operations-runbook.json", "1.0.0-calculator-operations-runbook"),
  fileStatus("internal/calculator-operations-alert-rules.json", "1.0.0-calculator-operations-alert-rules"),
  fileStatus("internal/calculator-release-approval-packet.json", "1.0.0-calculator-release-approval-packet"),
  fileStatus("internal/calculator-release-evidence-index.json", "1.0.0-calculator-release-evidence-index"),
  fileStatus("internal/calculator-launch-guardrails-runbook.json", "1.0.0-calculator-launch-guardrails-runbook"),
  fileStatus("internal/calculator-launch-monitoring-runbook.json", "1.0.0-calculator-launch-monitoring-runbook"),
  fileStatus("internal/calculator-promotion-control.json", "1.0.0-calculator-promotion-control-internal"),
  fileStatus("internal/calculator-promotion-audit.json", "1.0.0-calculator-promotion-audit-internal"),
  fileStatus("internal/calculator-unlock-phase-workflow-runbook.json", "1.0.0-calculator-unlock-phase-workflow-runbook"),
  fileStatus("internal/calculator-fixture-evidence-entry.json", "1.0.0-calculator-fixture-evidence-entry"),
  fileStatus("internal/calculator-fixture-evidence-validation.json", "1.0.0-calculator-fixture-evidence-validation"),
  fileStatus("internal/calculator-approved-fixture-promotion.json", "1.0.0-calculator-approved-fixture-promotion"),
  fileStatus("internal/calculator-regression-evidence-entry.json", "1.0.0-calculator-regression-evidence-entry"),
  fileStatus("internal/calculator-engine-runtime-plan.json", "1.0.0-calculator-engine-runtime-plan"),
  fileStatus("internal/calculator-runtime-self-test.json", "1.0.0-calculator-runtime-self-test")
];

const allArtifactsReady = internalArtifacts.every((item) => item.present_locally && item.version_ok);

const output = {
  version: "1.0.0-calculator-internal-status",
  built_at: new Date().toISOString(),
  public_safety: {
    public_status_manifest_enabled: true,
    internal_artifacts_publicly_exposed: false,
    raw_formula_text_exposed: false,
    sensitive_fixture_values_exposed: false,
    direct_internal_file_links_enabled: false,
    local_formula_results_enabled: false,
    reviewer_approval_required: true
  },
  summary: {
    internal_artifacts_ready: allArtifactsReady,
    internal_artifact_count: internalArtifacts.length,
    internal_artifacts_version_ok: internalArtifacts.filter((item) => item.version_ok).length,
    source_snapshot_ready: Boolean(sourceSnapshot.summary?.source_snapshot_ready),
    source_inventory_ready: Boolean(sourceSummary.summary),
    child_support_formula_count: sourceSummary.summary?.child_support_formula_count || 0,
    child_support_formula_map_ready: Boolean(formulaEngine.summary?.child_support_formula_map_ready),
    child_support_formula_cells_mapped: formulaEngine.summary?.child_support_formula_cells_mapped || 0,
    regression_harness_ready: Boolean(regression.summary?.regression_harness_ready),
    regression_scenario_templates_ready: regression.summary?.scenario_templates_ready || 0,
    approved_regression_fixtures: regression.summary?.approved_regression_fixtures || 0,
    engine_scaffold_ready: Boolean(engine.summary?.engine_scaffold_ready),
    engine_required_input_fields: engine.summary?.required_input_fields || 0,
    engine_required_output_checks: engine.summary?.required_output_checks || 0,
    engine_unsupported_excel_functions: engine.summary?.unsupported_excel_functions || 0,
    fixture_entry_template_ready: Boolean(fixture.summary?.fixture_entry_template_ready),
    fixture_templates_ready: fixture.summary?.fixture_templates || 0,
    public_unlock_ready: false,
    public_results_enabled: false
  },
  internal_artifacts: internalArtifacts.map((item) => ({
    name: item.path.replace("internal/", "").replace(".json", ""),
    present_locally: item.present_locally,
    version_ok: item.version_ok,
    public_url_status: "blocked_404",
    public_url_exposed: false
  })),
  public_message: "Internal calculator build files are present for staff review, but raw internal artifacts remain blocked from public access. This public status file confirms readiness without exposing formulas, fixture values, or internal scaffolds."
};

writeJSON("data/calculator-internal-status.json", output);
console.log(`Built calculator internal status: ${internalArtifacts.filter((item) => item.version_ok).length}/${internalArtifacts.length} internal artifacts ready, public exposure blocked.`);
