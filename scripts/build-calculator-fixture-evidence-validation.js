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

const evidenceEntry = readJSON("internal/calculator-fixture-evidence-entry.json");
const evidenceStatus = readJSON("data/calculator-fixture-evidence-status.json");
const approvedFixturesStatus = readJSON("data/calculator-approved-fixtures-status.json");
const evidenceFile = optionalJSON("internal/calculator-fixture-evidence.json");

const fixtureTemplates = evidenceEntry.fixtures || [];
const evidenceRecords = Array.isArray(evidenceFile?.fixtures) ? evidenceFile.fixtures : [];
const requiredInputFields = evidenceStatus.summary?.required_input_fields_per_fixture || 0;
const requiredOutputFields = evidenceStatus.summary?.required_output_fields_per_fixture || 0;
const builtAt = new Date().toISOString();

const validationItems = fixtureTemplates.map((fixture) => {
  const evidence = evidenceRecords.find((item) => item.fixture_id === fixture.fixture_id) || null;
  const reviewer = evidence?.reviewer || {};
  const inputValuesPresent = evidence?.inputs
    ? Object.values(evidence.inputs).filter((item) => hasValue(item?.value)).length
    : 0;
  const outputValuesPresent = evidence?.expected_outputs
    ? Object.values(evidence.expected_outputs).filter((item) => hasValue(item?.official_value)).length
    : 0;
  const reviewerMetadataComplete = reviewer.approval_status === "approved" &&
    hasValue(reviewer.reviewed_by) &&
    hasValue(reviewer.reviewed_at) &&
    hasValue(reviewer.official_calculator_version) &&
    hasValue(reviewer.official_calculator_source) &&
    hasValue(reviewer.official_source_last_checked);
  const evidenceValidated = Boolean(evidence) &&
    reviewerMetadataComplete &&
    inputValuesPresent === requiredInputFields &&
    outputValuesPresent === requiredOutputFields;

  return {
    fixture_id: fixture.fixture_id,
    evidence_record_present: Boolean(evidence),
    reviewer_metadata_complete: reviewerMetadataComplete,
    input_values_present: inputValuesPresent,
    required_input_values: requiredInputFields,
    output_values_present: outputValuesPresent,
    required_output_values: requiredOutputFields,
    evidence_validated: evidenceValidated,
    public_values_exposed: false
  };
});

const validatedEvidencePackets = validationItems.filter((item) => item.evidence_validated).length;

const publicStatus = {
  version: "1.0.0-calculator-fixture-evidence-validation-status",
  built_at: builtAt,
  public_safety: {
    sensitive_fixture_values_exposed: false,
    raw_formula_text_exposed: false,
    internal_validation_detail_exposed: false,
    internal_values_publicly_exposed: false,
    public_results_enabled: false,
    reviewer_approval_required: true
  },
  summary: {
    fixture_evidence_validation_ready: true,
    evidence_file_present: Boolean(evidenceFile),
    validation_items: validationItems.length,
    validated_evidence_packets: validatedEvidencePackets,
    pending_evidence_validation: validationItems.length - validatedEvidencePackets,
    approved_fixture_records_found: approvedFixturesStatus.summary?.approved_fixture_records_found || 0,
    public_results_enabled: false
  },
  public_validation_items: validationItems.map((item) => ({
    fixture_id: item.fixture_id,
    evidence_record_present: item.evidence_record_present,
    evidence_validated: item.evidence_validated,
    public_values_exposed: false
  })),
  public_message: "Fixture evidence validation is ready. No fixture values are public, and MFLG calculator results remain locked until evidence validates and is promoted internally."
};

const internalValidation = {
  version: "1.0.0-calculator-fixture-evidence-validation",
  built_at: builtAt,
  public_exposure: "blocked by Worker /internal/ route",
  source_evidence_entry_version: evidenceEntry.version,
  source_evidence_status_version: evidenceStatus.version,
  intended_input_path: "internal/calculator-fixture-evidence.json",
  intended_output_path: "internal/calculator-approved-fixtures.json",
  safety: {
    contains_sensitive_user_data: false,
    contains_real_fixture_values: false,
    contains_raw_formula_text: false,
    public_results_enabled: false,
    intended_use: "Internal fixture evidence validation and approved-fixture promotion checkpoint for n8n and CRM OS only."
  },
  n8n_workflow_contract: {
    schedule: "Run after fixture evidence is entered and before approved fixtures are generated.",
    allowed_public_fetches: [
      "/data/calculator-fixture-evidence-validation-status.json",
      "/data/calculator-fixture-evidence-status.json",
      "/data/calculator-approved-fixtures-status.json"
    ],
    do_not_fetch: [
      "/internal/calculator-fixture-evidence-validation.json",
      "/internal/calculator-fixture-evidence.json",
      "/internal/calculator-approved-fixtures.json",
      "/internal/calculator-formula-map.json"
    ],
    crm_os_fields: {
      calculator_fixture_evidence_validated: "data.calculator-fixture-evidence-validation-status.summary.validated_evidence_packets",
      calculator_fixture_evidence_pending_validation: "data.calculator-fixture-evidence-validation-status.summary.pending_evidence_validation",
      calculator_public_results_enabled: "data.calculator-fixture-evidence-validation-status.summary.public_results_enabled"
    }
  },
  validation_items: validationItems,
  promotion_policy: {
    can_generate_approved_fixtures: validatedEvidencePackets === validationItems.length && validationItems.length > 0,
    public_results_enabled: false,
    final_reviewer_approval_required: true
  }
};

writeJSON("data/calculator-fixture-evidence-validation-status.json", publicStatus);
writeJSON("internal/calculator-fixture-evidence-validation.json", internalValidation);
console.log(`Built calculator fixture evidence validation: ${validatedEvidencePackets}/${validationItems.length} evidence packets validated, public results locked.`);
