#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

function readJSON(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function optionalJSON(relativePath) {
  const target = path.join(root, relativePath);
  if (!fs.existsSync(target)) return null;
  return readJSON(relativePath);
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeJSON(relativePath, value) {
  const outputPath = path.join(root, relativePath);
  ensureDir(path.dirname(outputPath));
  fs.writeFileSync(outputPath, `${JSON.stringify(value, null, 2)}\n`);
}

const promotionStatus = readJSON("data/calculator-approved-fixture-promotion-status.json");
const comparisonStatus = readJSON("data/calculator-regression-comparison-status.json");
const comparisonPlan = readJSON("internal/calculator-regression-comparison-plan.json");
const approvedFixturesFile = optionalJSON("internal/calculator-approved-fixtures.json");
const comparisonResultsFile = optionalJSON("internal/calculator-regression-comparison-results.json");

const promotionItems = promotionStatus.public_promotion_items || [];
const comparisonItems = comparisonPlan.comparison_items || comparisonStatus.public_review_items || [];
const comparisonResults = Array.isArray(comparisonResultsFile?.comparisons) ? comparisonResultsFile.comparisons : [];
const requiredOutputChecks = comparisonStatus.summary?.required_output_checks_per_fixture || comparisonPlan.summary?.required_output_checks_per_fixture || 0;
const builtAt = new Date().toISOString();

const evidenceItems = comparisonItems.map((item, index) => {
  const promotion = promotionItems.find((entry) => entry.fixture_id === item.fixture_id) || null;
  const result = comparisonResults.find((entry) => entry.fixture_id === item.fixture_id) || null;
  const outputChecks = Array.isArray(result?.output_checks) ? result.output_checks : [];
  const passedOutputChecks = outputChecks.filter((check) => check?.status === "pass").length;
  const materialMismatches = outputChecks.filter((check) => check?.material_mismatch === true).length;
  const promotedApprovedFixture = Boolean(promotion?.promoted_to_approved_fixture);
  const comparisonEvidenceComplete = promotedApprovedFixture &&
    Boolean(result) &&
    outputChecks.length === requiredOutputChecks &&
    passedOutputChecks === requiredOutputChecks &&
    materialMismatches === 0 &&
    result?.reviewer?.approval_status === "approved";

  return {
    fixture_id: item.fixture_id,
    review_order: index + 1,
    promoted_approved_fixture: promotedApprovedFixture,
    comparison_result_present: Boolean(result),
    output_checks_present: outputChecks.length,
    required_output_checks: requiredOutputChecks,
    passed_output_checks: passedOutputChecks,
    material_mismatches: materialMismatches,
    comparison_evidence_complete: comparisonEvidenceComplete,
    public_values_exposed: false
  };
});

const completeEvidence = evidenceItems.filter((item) => item.comparison_evidence_complete).length;
const pendingEvidence = evidenceItems.length - completeEvidence;
const materialMismatches = evidenceItems.reduce((total, item) => total + item.material_mismatches, 0);

const publicStatus = {
  version: "1.0.0-calculator-regression-evidence-status",
  built_at: builtAt,
  public_safety: {
    sensitive_fixture_values_exposed: false,
    internal_comparison_evidence_exposed: false,
    internal_engine_outputs_exposed: false,
    comparison_deltas_exposed: false,
    raw_formula_text_exposed: false,
    public_results_enabled: false,
    reviewer_approval_required: true
  },
  summary: {
    regression_evidence_entry_ready: true,
    approved_fixtures_file_present: Boolean(approvedFixturesFile),
    comparison_results_file_present: Boolean(comparisonResultsFile),
    regression_evidence_items: evidenceItems.length,
    complete_regression_evidence: completeEvidence,
    pending_regression_evidence: pendingEvidence,
    material_mismatches: materialMismatches,
    required_output_checks_per_fixture: requiredOutputChecks,
    can_unlock_public_results: false,
    public_results_enabled: false
  },
  public_review_items: evidenceItems.map((item) => ({
    fixture_id: item.fixture_id,
    promoted_approved_fixture: item.promoted_approved_fixture,
    comparison_result_present: item.comparison_result_present,
    comparison_evidence_complete: item.comparison_evidence_complete,
    material_mismatches: item.material_mismatches,
    public_values_exposed: false
  })),
  public_message: "Calculator comparison evidence is ready to track. Public MFLG calculator results stay locked until approved fixtures are compared, reviewed, and cleared."
};

const internalEvidence = {
  version: "1.0.0-calculator-regression-evidence-entry",
  built_at: builtAt,
  public_exposure: "blocked by Worker /internal/ route",
  source_promotion_status_version: promotionStatus.version,
  source_comparison_status_version: comparisonStatus.version,
  source_comparison_plan_version: comparisonPlan.version,
  intended_input_paths: [
    "internal/calculator-approved-fixtures.json",
    "internal/calculator-regression-comparison-results.json"
  ],
  intended_output_path: "internal/calculator-regression-comparison-results.json",
  safety: {
    contains_sensitive_user_data: false,
    contains_real_fixture_values: false,
    contains_raw_formula_text: false,
    public_results_enabled: false,
    reviewer_approval_required: true,
    intended_use: "Internal comparison-evidence entry and completion bridge for n8n and CRM OS only."
  },
  n8n_workflow_contract: {
    schedule: "Run after approved fixture promotion and before regression comparison status rebuilds.",
    allowed_public_fetches: [
      "/data/calculator-regression-evidence-status.json",
      "/data/calculator-approved-fixture-promotion-status.json",
      "/data/calculator-regression-comparison-status.json"
    ],
    do_not_fetch: [
      "/internal/calculator-regression-evidence-entry.json",
      "/internal/calculator-approved-fixtures.json",
      "/internal/calculator-regression-comparison-results.json",
      "/internal/calculator-formula-map.json"
    ],
    crm_os_fields: {
      calculator_regression_evidence_ready: "data.calculator-regression-evidence-status.summary.regression_evidence_entry_ready",
      calculator_complete_regression_evidence: "data.calculator-regression-evidence-status.summary.complete_regression_evidence",
      calculator_pending_regression_evidence: "data.calculator-regression-evidence-status.summary.pending_regression_evidence",
      calculator_public_results_enabled: "data.calculator-regression-evidence-status.summary.public_results_enabled"
    }
  },
  comparison_evidence_policy: {
    require_promoted_approved_fixture: true,
    require_all_output_checks_passed: true,
    require_zero_material_mismatches: true,
    require_reviewer_approval: true,
    public_results_enabled: false
  },
  evidence_items: evidenceItems
};

writeJSON("data/calculator-regression-evidence-status.json", publicStatus);
writeJSON("internal/calculator-regression-evidence-entry.json", internalEvidence);
console.log(`Built calculator regression evidence entry: ${completeEvidence}/${evidenceItems.length} evidence items complete, public results locked.`);
