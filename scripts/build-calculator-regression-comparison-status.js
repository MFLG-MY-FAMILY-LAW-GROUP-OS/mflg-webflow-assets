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

const approvedFixturesStatus = readJSON("data/calculator-approved-fixtures-status.json");
const fixtureQaStatus = readJSON("data/calculator-fixture-qa-status.json");
const engineScaffold = readJSON("internal/calculator-engine-scaffold.json");
const approvedFixturesFile = optionalJSON("internal/calculator-approved-fixtures.json");
const comparisonResultsFile = optionalJSON("internal/calculator-regression-comparison-results.json");

const requiredOutputs = engineScaffold.required_outputs || [];
const publicReviewItems = approvedFixturesStatus.public_review_items || [];
const approvedFixtureCount = approvedFixturesStatus.summary?.complete_approved_fixtures || 0;
const comparisonResults = Array.isArray(comparisonResultsFile?.comparisons) ? comparisonResultsFile.comparisons : [];

const comparisonItems = publicReviewItems.map((item, index) => {
  const result = comparisonResults.find((comparison) => comparison.fixture_id === item.fixture_id) || null;
  const outputChecks = Array.isArray(result?.output_checks) ? result.output_checks : [];
  const passedOutputChecks = outputChecks.filter((check) => check?.status === "pass").length;
  const materialMismatches = outputChecks.filter((check) => check?.material_mismatch === true).length;
  const comparisonComplete = Boolean(result) &&
    item.approved_fixture_complete === true &&
    outputChecks.length === requiredOutputs.length &&
    passedOutputChecks === requiredOutputs.length &&
    materialMismatches === 0 &&
    result?.reviewer?.approval_status === "approved";
  return {
    fixture_id: item.fixture_id,
    review_order: index + 1,
    approved_fixture_complete: Boolean(item.approved_fixture_complete),
    comparison_result_present: Boolean(result),
    output_checks_present: outputChecks.length,
    required_output_checks: requiredOutputs.length,
    passed_output_checks: passedOutputChecks,
    material_mismatches: materialMismatches,
    comparison_complete: comparisonComplete,
    public_values_exposed: false
  };
});

const completeComparisons = comparisonItems.filter((item) => item.comparison_complete).length;
const materialMismatches = comparisonItems.reduce((total, item) => total + item.material_mismatches, 0);
const executableRegressionTests = approvedFixtureCount;
const comparisonResultsFilePresent = Boolean(comparisonResultsFile);
const publicUnlockReady = approvedFixtureCount > 0 &&
  approvedFixtureCount === publicReviewItems.length &&
  completeComparisons === publicReviewItems.length &&
  materialMismatches === 0 &&
  engineScaffold.summary?.unsupported_excel_functions === 0;

const internalPlan = {
  version: "1.0.0-calculator-regression-comparison-plan",
  built_at: new Date().toISOString(),
  public_exposure: "blocked by Worker /internal/ route",
  source_engine_scaffold_version: engineScaffold.version,
  source_fixture_qa_status_version: fixtureQaStatus.version,
  source_approved_fixtures_status_version: approvedFixturesStatus.version,
  intended_results_path: "internal/calculator-regression-comparison-results.json",
  safety: {
    contains_sensitive_user_data: false,
    contains_real_fixture_values: false,
    contains_raw_formula_text: false,
    public_results_enabled: false,
    reviewer_approval_required: true,
    intended_use: "Internal regression comparison plan for approved official-output fixtures only."
  },
  summary: {
    comparison_plan_ready: true,
    approved_fixture_file_present: Boolean(approvedFixturesFile),
    comparison_results_file_present: comparisonResultsFilePresent,
    fixture_comparison_items: comparisonItems.length,
    approved_fixture_count: approvedFixtureCount,
    executable_regression_tests: executableRegressionTests,
    complete_comparisons: completeComparisons,
    required_output_checks_per_fixture: requiredOutputs.length,
    material_mismatches: materialMismatches,
    public_unlock_ready: publicUnlockReady
  },
  comparison_contract: {
    output_policy: "Compare only reviewer-approved fixture values against internal engine outputs.",
    pass_condition: "Every required output check passes with zero material mismatches.",
    public_policy: "Do not expose fixture values, engine results, deltas, formulas, or client-identifying data publicly."
  },
  comparison_items: comparisonItems,
  required_staff_actions: [
    "Complete approved official-output fixture records before running comparisons.",
    "Run comparison results only against reviewer-approved fixture records.",
    "Record pass/fail status for every required output field.",
    "Require zero material mismatches and reviewer approval before public unlock can be considered."
  ]
};

const publicStatus = {
  version: "1.0.0-calculator-regression-comparison-status",
  built_at: internalPlan.built_at,
  public_safety: {
    sensitive_fixture_values_exposed: false,
    raw_formula_text_exposed: false,
    internal_engine_outputs_exposed: false,
    comparison_deltas_exposed: false,
    public_results_enabled: false,
    local_formula_engine_enabled: false,
    reviewer_approval_required: true
  },
  summary: {
    comparison_plan_ready: true,
    comparison_results_file_present: comparisonResultsFilePresent,
    fixture_comparison_items: comparisonItems.length,
    approved_fixture_count: approvedFixtureCount,
    executable_regression_tests: executableRegressionTests,
    complete_comparisons: completeComparisons,
    pending_comparisons: comparisonItems.length - completeComparisons,
    material_mismatches: materialMismatches,
    required_output_checks_per_fixture: requiredOutputs.length,
    public_unlock_ready: false
  },
  public_review_items: comparisonItems.map((item) => ({
    fixture_id: item.fixture_id,
    comparison_result_present: item.comparison_result_present,
    comparison_complete: item.comparison_complete,
    material_mismatches: item.material_mismatches,
    public_values_exposed: false
  })),
  public_message: "Regression comparison is planned but public calculator results remain locked until approved fixtures exist and every comparison passes."
};

writeJSON("internal/calculator-regression-comparison-plan.json", internalPlan);
writeJSON("data/calculator-regression-comparison-status.json", publicStatus);
console.log(`Built regression comparison status: ${completeComparisons}/${comparisonItems.length} comparisons complete, ${materialMismatches} material mismatches, public results locked.`);
