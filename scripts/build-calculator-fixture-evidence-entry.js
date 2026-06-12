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

const fixtureTemplate = readJSON("internal/calculator-fixture-entry-template.json");
const regressionHarness = readJSON("internal/calculator-regression-harness.json");
const engineScaffold = readJSON("internal/calculator-engine-scaffold.json");
const evidenceFile = optionalJSON("internal/calculator-fixture-evidence.json");

const fixtureTemplates = fixtureTemplate.fixture_templates || [];
const requiredInputs = regressionHarness.required_inputs || [];
const requiredOutputs = regressionHarness.required_outputs || [];
const evidenceRecords = Array.isArray(evidenceFile?.fixtures) ? evidenceFile.fixtures : [];
const builtAt = new Date().toISOString();

const evidencePackets = fixtureTemplates.map((fixture) => {
  const evidence = evidenceRecords.find((item) => item.fixture_id === fixture.fixture_id) || null;
  const inputCount = requiredInputs.filter((field) => hasValue(evidence?.inputs?.[field.key]?.value)).length;
  const outputCount = requiredOutputs.filter((field) => hasValue(evidence?.expected_outputs?.[field.name]?.official_value)).length;
  const reviewer = evidence?.reviewer || {};
  const complete = reviewer.approval_status === "approved" &&
    hasValue(reviewer.reviewed_by) &&
    hasValue(reviewer.reviewed_at) &&
    hasValue(reviewer.official_calculator_version) &&
    inputCount === requiredInputs.length &&
    outputCount === requiredOutputs.length;

  return {
    fixture_id: fixture.fixture_id,
    purpose: fixture.purpose,
    evidence_record_present: Boolean(evidence),
    input_values_present: inputCount,
    required_input_values: requiredInputs.length,
    output_values_present: outputCount,
    required_output_values: requiredOutputs.length,
    reviewer_metadata_complete: complete,
    evidence_packet_complete: complete,
    public_values_exposed: false
  };
});

const completeEvidencePackets = evidencePackets.filter((item) => item.evidence_packet_complete).length;

const internalTemplate = {
  version: "1.0.0-calculator-fixture-evidence-entry",
  built_at: builtAt,
  public_exposure: "blocked by Worker /internal/ route",
  intended_output_path: "internal/calculator-fixture-evidence.json",
  source_fixture_template_version: fixtureTemplate.version,
  source_regression_harness_version: regressionHarness.version,
  source_engine_scaffold_version: engineScaffold.version,
  safety: {
    contains_sensitive_user_data: false,
    contains_real_fixture_values: false,
    contains_raw_formula_text: false,
    public_results_enabled: false,
    intended_use: "Internal official-output fixture evidence entry packet for n8n and CRM OS only."
  },
  n8n_workflow_contract: {
    schedule: "Create or update fixture evidence records after official calculator output is reviewed.",
    allowed_public_fetches: [
      "/data/calculator-fixture-evidence-status.json",
      "/data/calculator-approved-fixtures-status.json",
      "/data/calculator-unlock-phase-workflow.json"
    ],
    do_not_fetch: [
      "/internal/calculator-fixture-evidence-entry.json",
      "/internal/calculator-fixture-evidence.json",
      "/internal/calculator-approved-fixtures.json",
      "/internal/calculator-formula-map.json"
    ],
    crm_os_fields: {
      calculator_fixture_evidence_complete: "data.calculator-fixture-evidence-status.summary.complete_evidence_packets",
      calculator_fixture_evidence_pending: "data.calculator-fixture-evidence-status.summary.pending_evidence_packets",
      calculator_public_results_enabled: "data.calculator-fixture-evidence-status.summary.public_results_enabled"
    }
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

const publicStatus = {
  version: "1.0.0-calculator-fixture-evidence-status",
  built_at: builtAt,
  public_safety: {
    sensitive_fixture_values_exposed: false,
    raw_formula_text_exposed: false,
    internal_evidence_template_exposed: false,
    internal_values_publicly_exposed: false,
    public_results_enabled: false,
    reviewer_approval_required: true
  },
  summary: {
    fixture_evidence_entry_ready: true,
    evidence_file_present: Boolean(evidenceFile),
    fixture_evidence_packets: evidencePackets.length,
    complete_evidence_packets: completeEvidencePackets,
    pending_evidence_packets: evidencePackets.length - completeEvidencePackets,
    required_input_fields_per_fixture: requiredInputs.length,
    required_output_fields_per_fixture: requiredOutputs.length,
    public_results_enabled: false
  },
  public_evidence_packets: evidencePackets.map((item) => ({
    fixture_id: item.fixture_id,
    evidence_record_present: item.evidence_record_present,
    evidence_packet_complete: item.evidence_packet_complete,
    public_values_exposed: false
  })),
  public_message: "Fixture evidence entry is ready, but no official-output evidence values are public. MFLG calculator results remain locked until internal evidence is complete and approved."
};

writeJSON("internal/calculator-fixture-evidence-entry.json", internalTemplate);
writeJSON("data/calculator-fixture-evidence-status.json", publicStatus);
console.log(`Built calculator fixture evidence entry: ${completeEvidencePackets}/${evidencePackets.length} evidence packets complete, public results locked.`);
