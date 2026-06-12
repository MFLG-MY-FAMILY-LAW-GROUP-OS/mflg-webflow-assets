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

function optionalJSON(relativePath) {
  const target = path.join(root, relativePath);
  if (!fs.existsSync(target)) return null;
  return readJSON(relativePath);
}

const fixtureTemplate = readJSON("internal/calculator-fixture-entry-template.json");
const regressionHarness = readJSON("internal/calculator-regression-harness.json");
const engineScaffold = readJSON("internal/calculator-engine-scaffold.json");
const approvedFixturesStatus = optionalJSON("data/calculator-approved-fixtures-status.json");
const approvedFixtureFile = optionalJSON("internal/calculator-approved-fixtures.json");

const fixtureTemplates = fixtureTemplate.fixture_templates || [];
const approvedFixtures = Array.isArray(approvedFixtureFile?.fixtures)
  ? approvedFixtureFile.fixtures.filter((fixture) => fixture?.reviewer?.approval_status === "approved")
  : [];
const requiredOutputFields = fixtureTemplate.summary?.required_output_fields || 0;
const requiredInputFields = fixtureTemplate.summary?.required_input_fields || 0;

const reviewItems = fixtureTemplates.map((fixture, index) => {
  const approvedFixture = approvedFixtures.find((item) => item.fixture_id === fixture.fixture_id) || null;
  const approvedOutputCount = approvedFixture?.expected_outputs
    ? Object.values(approvedFixture.expected_outputs).filter((item) => item?.official_value !== null && item?.official_value !== "").length
    : 0;
  const approvedInputCount = approvedFixture?.inputs
    ? Object.values(approvedFixture.inputs).filter((item) => item?.value !== null && item?.value !== "").length
    : 0;
  const hasAllOutputs = approvedOutputCount === requiredOutputFields;
  const hasAllInputs = approvedInputCount === requiredInputFields;
  return {
    fixture_id: fixture.fixture_id,
    review_order: index + 1,
    purpose: fixture.purpose,
    public_review_status: approvedFixture && hasAllInputs && hasAllOutputs ? "approved_internal_fixture_ready" : "needs_official_comparison",
    approved_input_fields: approvedInputCount,
    approved_output_fields: approvedOutputCount,
    required_input_fields: requiredInputFields,
    required_output_fields: requiredOutputFields,
    material_mismatches: 0,
    public_values_exposed: false
  };
});

const approvedFixtureCount = reviewItems.filter((item) => item.public_review_status === "approved_internal_fixture_ready").length;
const executableRegressionTests = approvedFixtureCount;
const publicUnlockReady = approvedFixtureCount === fixtureTemplates.length &&
  fixtureTemplates.length > 0 &&
  engineScaffold.summary?.unsupported_excel_functions === 0 &&
  executableRegressionTests === fixtureTemplates.length;

const internalPlan = {
  version: "1.0.0-calculator-fixture-qa-plan",
  built_at: new Date().toISOString(),
  public_exposure: "blocked by Worker /internal/ route",
  source_fixture_template_version: fixtureTemplate.version,
  source_regression_harness_version: regressionHarness.version,
  source_engine_scaffold_version: engineScaffold.version,
  safety: {
    contains_sensitive_user_data: false,
    contains_real_fixture_values: false,
    contains_raw_formula_text: false,
    public_results_enabled: false,
    reviewer_approval_required: true,
    intended_use: "Internal official-output fixture QA plan only."
  },
  summary: {
    fixture_review_items: reviewItems.length,
    approved_fixture_count: approvedFixtureCount,
    pending_official_comparisons: reviewItems.length - approvedFixtureCount,
    required_input_fields: requiredInputFields,
    required_output_fields: requiredOutputFields,
    executable_regression_tests: executableRegressionTests,
    approved_fixture_template_ready: Boolean(approvedFixturesStatus?.summary?.approved_fixture_template_ready),
    complete_approved_fixtures: approvedFixturesStatus?.summary?.complete_approved_fixtures || 0,
    material_mismatches: 0,
    public_unlock_ready: publicUnlockReady
  },
  review_items: reviewItems,
  required_staff_actions: [
    "Run each fixture scenario through the official Arizona child-support calculator.",
    "Record official output values only in an internal approved-fixtures file.",
    "Confirm no real client identifiers are used in fixture data.",
    "Run regression comparisons and require zero material mismatches before public results can be considered.",
    "Record reviewer approval before any public calculator result is enabled."
  ]
};

const publicStatus = {
  version: "1.0.0-calculator-fixture-qa-status",
  built_at: internalPlan.built_at,
  public_safety: {
    sensitive_fixture_values_exposed: false,
    raw_formula_text_exposed: false,
    public_results_enabled: false,
    local_formula_engine_enabled: false,
    reviewer_approval_required: true,
    internal_values_publicly_exposed: false
  },
  summary: {
    fixture_qa_plan_ready: true,
    fixture_review_items: reviewItems.length,
    approved_fixture_count: approvedFixtureCount,
    pending_official_comparisons: reviewItems.length - approvedFixtureCount,
    required_output_fields_per_fixture: requiredOutputFields,
    executable_regression_tests: executableRegressionTests,
    approved_fixture_template_ready: Boolean(approvedFixturesStatus?.summary?.approved_fixture_template_ready),
    complete_approved_fixtures: approvedFixturesStatus?.summary?.complete_approved_fixtures || 0,
    material_mismatches: 0,
    public_unlock_ready: false
  },
  public_review_items: reviewItems.map((item) => ({
    fixture_id: item.fixture_id,
    review_order: item.review_order,
    public_review_status: item.public_review_status,
    public_values_exposed: false
  })),
  public_message: "MFLG-branded child-support results remain locked until official calculator comparison fixtures are approved and pass internal QA."
};

writeJSON("internal/calculator-fixture-qa-plan.json", internalPlan);
writeJSON("data/calculator-fixture-qa-status.json", publicStatus);
console.log(`Built calculator fixture QA status: ${reviewItems.length} review items, ${approvedFixtureCount} approved fixtures, public results locked.`);
