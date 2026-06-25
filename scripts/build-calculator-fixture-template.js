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

const regressionHarness = readJSON("internal/calculator-regression-harness.json");
const engineScaffold = readJSON("internal/calculator-engine-scaffold.json");

const inputFields = regressionHarness.required_inputs || [];
const outputFields = regressionHarness.required_outputs || [];
const scenarios = regressionHarness.scenario_templates || [];

function emptyInputs() {
  return Object.fromEntries(inputFields.map((field) => [field.key, {
    value: null,
    source_note: "",
    sensitive: Boolean(field.sensitive),
    workbook_target_candidates: field.workbook_target_candidates || []
  }]));
}

function emptyOutputs() {
  return Object.fromEntries(outputFields.map((field) => [field.name, {
    official_value: null,
    output_type: /percentage/i.test(field.name) ? "percentage" : "currency_or_number",
    workbook_target: field.target || null,
    formula_hash: field.formula_hash || null,
    reviewer_note: ""
  }]));
}

const fixtureTemplates = scenarios.map((scenario) => ({
  fixture_id: scenario.fixture_id,
  status: "needs_official_output",
  purpose: scenario.purpose,
  reviewer: {
    reviewed_by: "",
    reviewed_at: "",
    official_calculator_version: "",
    official_calculator_source: "Arizona official child-support calculator",
    approval_status: "not_approved"
  },
  inputs: emptyInputs(),
  expected_outputs: emptyOutputs(),
  acceptance: {
    required_output_checks: outputFields.length,
    allowed_material_mismatches: 0,
    notes: "Enter only reviewer-approved official calculator values. Do not place real client identifiers in this file."
  }
}));

const internalTemplate = {
  version: "1.0.0-calculator-fixture-entry-template",
  built_at: new Date().toISOString(),
  public_exposure: "blocked by Worker /internal/ route",
  source_regression_harness_version: regressionHarness.version,
  source_engine_scaffold_version: engineScaffold.version,
  safety: {
    contains_sensitive_user_data: false,
    contains_raw_formula_text: false,
    contains_real_fixture_values: false,
    public_results_enabled: false,
    local_formula_engine_enabled: false,
    reviewer_approval_required: true,
    intended_use: "Internal official-output fixture entry template only."
  },
  summary: {
    fixture_templates: fixtureTemplates.length,
    required_input_fields: inputFields.length,
    required_output_fields: outputFields.length,
    approved_fixture_values: 0,
    ready_for_public_results: false
  },
  fixture_templates: fixtureTemplates,
  next_steps: [
    "Run each scenario in the official Arizona child-support calculator.",
    "Enter official outputs into a reviewed internal fixture file.",
    "Record official calculator version/source and reviewer approval.",
    "Run local engine comparisons only after fixture approval."
  ]
};

const publicReadiness = {
  version: "1.0.0-calculator-fixture-template-readiness",
  built_at: internalTemplate.built_at,
  public_safety: {
    sensitive_fixture_values_exposed: false,
    raw_formula_text_exposed: false,
    public_results_enabled: false,
    local_formula_engine_enabled: false,
    reviewer_approval_required: true
  },
  summary: {
    fixture_entry_template_ready: true,
    fixture_templates: fixtureTemplates.length,
    required_input_fields: inputFields.length,
    required_output_fields: outputFields.length,
    approved_fixture_values: 0,
    ready_for_public_results: false
  },
  public_message: "Internal official-output fixture templates are ready. Public MFLG formula results remain locked until reviewed fixture values are approved and pass."
};

writeJSON("internal/calculator-fixture-entry-template.json", internalTemplate);
writeJSON("data/calculator-fixture-template-readiness.json", publicReadiness);
console.log(`Built calculator fixture template: ${fixtureTemplates.length} templates, ${inputFields.length} input fields, ${outputFields.length} output fields.`);
