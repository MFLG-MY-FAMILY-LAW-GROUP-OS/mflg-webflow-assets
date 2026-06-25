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

function hasValue(value) {
  return value !== null && value !== undefined && value !== "";
}

const fixtureEntryTemplate = readJSON("internal/calculator-fixture-entry-template.json");
const regressionHarness = readJSON("internal/calculator-regression-harness.json");
const engineScaffold = readJSON("internal/calculator-engine-scaffold.json");
const approvedFixturesFile = optionalJSON("internal/calculator-approved-fixtures.json");

const fixtureTemplates = fixtureEntryTemplate.fixture_templates || [];
const requiredInputs = regressionHarness.required_inputs || [];
const requiredOutputs = regressionHarness.required_outputs || [];
const approvedFixtures = Array.isArray(approvedFixturesFile?.fixtures) ? approvedFixturesFile.fixtures : [];

const approvedFixtureTemplate = {
  version: "1.0.0-calculator-approved-fixtures-template",
  built_at: new Date().toISOString(),
  public_exposure: "blocked by Worker /internal/ route",
  intended_output_path: "internal/calculator-approved-fixtures.json",
  source_fixture_entry_template_version: fixtureEntryTemplate.version,
  source_regression_harness_version: regressionHarness.version,
  source_engine_scaffold_version: engineScaffold.version,
  safety: {
    contains_sensitive_user_data: false,
    contains_real_client_identifiers: false,
    contains_raw_formula_text: false,
    public_results_enabled: false,
    reviewer_approval_required: true,
    intended_use: "Template for reviewer-approved official calculator comparison fixtures only."
  },
  schema_contract: {
    required_fixture_count: fixtureTemplates.length,
    required_input_fields_per_fixture: requiredInputs.length,
    required_output_fields_per_fixture: requiredOutputs.length,
    approval_status_required: "approved",
    prohibited_values: [
      "real client names",
      "case numbers",
      "street addresses",
      "dates of birth",
      "Social Security numbers",
      "unreviewed calculator outputs"
    ]
  },
  fixtures: fixtureTemplates.map((fixture) => ({
    fixture_id: fixture.fixture_id,
    status: "draft_until_reviewed",
    purpose: fixture.purpose,
    reviewer: {
      reviewed_by: "",
      reviewed_at: "",
      official_calculator_version: "",
      official_calculator_source: "Arizona official child-support calculator",
      official_source_last_checked: "",
      approval_status: "not_approved",
      approval_note: ""
    },
    inputs: Object.fromEntries(requiredInputs.map((field) => [field.key, {
      value: null,
      source_note: "Synthetic review fixture only; no real client identifiers.",
      sensitive: Boolean(field.sensitive)
    }])),
    expected_outputs: Object.fromEntries(requiredOutputs.map((field) => [field.name, {
      official_value: null,
      output_type: /percentage/i.test(field.name) ? "percentage" : "currency_or_number",
      workbook_target: field.target || null,
      formula_hash: field.formula_hash || null,
      reviewer_note: ""
    }]))
  }))
};

const validationItems = fixtureTemplates.map((template) => {
  const fixture = approvedFixtures.find((item) => item.fixture_id === template.fixture_id) || null;
  const inputValuesPresent = requiredInputs.filter((field) => hasValue(fixture?.inputs?.[field.key]?.value)).length;
  const outputValuesPresent = requiredOutputs.filter((field) => hasValue(fixture?.expected_outputs?.[field.name]?.official_value)).length;
  const approvalStatus = fixture?.reviewer?.approval_status || "missing";
  const reviewerPresent = hasValue(fixture?.reviewer?.reviewed_by);
  const reviewedAtPresent = hasValue(fixture?.reviewer?.reviewed_at);
  const sourcePresent = hasValue(fixture?.reviewer?.official_calculator_source);
  const sourceVersionPresent = hasValue(fixture?.reviewer?.official_calculator_version);
  const complete = approvalStatus === "approved" &&
    reviewerPresent &&
    reviewedAtPresent &&
    sourcePresent &&
    sourceVersionPresent &&
    inputValuesPresent === requiredInputs.length &&
    outputValuesPresent === requiredOutputs.length;
  return {
    fixture_id: template.fixture_id,
    fixture_present: Boolean(fixture),
    approval_status: approvalStatus,
    reviewer_present: reviewerPresent,
    reviewed_at_present: reviewedAtPresent,
    official_source_present: sourcePresent,
    official_version_present: sourceVersionPresent,
    input_values_present: inputValuesPresent,
    required_input_values: requiredInputs.length,
    output_values_present: outputValuesPresent,
    required_output_values: requiredOutputs.length,
    approved_fixture_complete: complete,
    public_values_exposed: false
  };
});

const completeApprovedFixtures = validationItems.filter((item) => item.approved_fixture_complete).length;
const approvedFixturesFilePresent = Boolean(approvedFixturesFile);

const publicStatus = {
  version: "1.0.0-calculator-approved-fixtures-status",
  built_at: approvedFixtureTemplate.built_at,
  public_safety: {
    sensitive_fixture_values_exposed: false,
    raw_formula_text_exposed: false,
    approved_fixture_values_exposed: false,
    internal_values_publicly_exposed: false,
    public_results_enabled: false,
    local_formula_engine_enabled: false,
    reviewer_approval_required: true
  },
  summary: {
    approved_fixture_template_ready: true,
    approved_fixtures_file_present: approvedFixturesFilePresent,
    fixture_templates: fixtureTemplates.length,
    approved_fixture_records_found: approvedFixtures.length,
    complete_approved_fixtures: completeApprovedFixtures,
    pending_approved_fixtures: fixtureTemplates.length - completeApprovedFixtures,
    required_input_fields_per_fixture: requiredInputs.length,
    required_output_fields_per_fixture: requiredOutputs.length,
    executable_regression_tests: completeApprovedFixtures,
    public_unlock_ready: false
  },
  public_review_items: validationItems.map((item) => ({
    fixture_id: item.fixture_id,
    fixture_present: item.fixture_present,
    approval_status: item.approval_status,
    approved_fixture_complete: item.approved_fixture_complete,
    public_values_exposed: false
  })),
  public_message: "Approved official-output fixture records are not public. MFLG calculator results remain locked until reviewed fixture records are complete and pass comparison testing."
};

writeJSON("internal/calculator-approved-fixtures-template.json", approvedFixtureTemplate);
writeJSON("data/calculator-approved-fixtures-status.json", publicStatus);
console.log(`Built approved fixtures workflow: ${completeApprovedFixtures}/${fixtureTemplates.length} approved fixtures complete, public results locked.`);
