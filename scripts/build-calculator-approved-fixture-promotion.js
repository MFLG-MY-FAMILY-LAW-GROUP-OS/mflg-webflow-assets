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

const validation = readJSON("data/calculator-fixture-evidence-validation-status.json");
const evidenceValidation = readJSON("internal/calculator-fixture-evidence-validation.json");
const evidenceFile = optionalJSON("internal/calculator-fixture-evidence.json");
const approvedFixturesFile = optionalJSON("internal/calculator-approved-fixtures.json");

const validationItems = evidenceValidation.validation_items || [];
const validItems = validationItems.filter((item) => item.evidence_validated);
const canPromoteAll = validationItems.length > 0 && validItems.length === validationItems.length;
const builtAt = new Date().toISOString();

const promotionItems = validationItems.map((item) => ({
  fixture_id: item.fixture_id,
  evidence_validated: item.evidence_validated,
  promotion_ready: item.evidence_validated,
  promoted_to_approved_fixture: Boolean(
    approvedFixturesFile?.fixtures?.some((fixture) => fixture.fixture_id === item.fixture_id && fixture?.reviewer?.approval_status === "approved")
  ),
  public_values_exposed: false
}));

const promotedFixtures = promotionItems.filter((item) => item.promoted_to_approved_fixture).length;

const publicStatus = {
  version: "1.0.0-calculator-approved-fixture-promotion-status",
  built_at: builtAt,
  public_safety: {
    sensitive_fixture_values_exposed: false,
    raw_formula_text_exposed: false,
    internal_promotion_manifest_exposed: false,
    internal_values_publicly_exposed: false,
    public_results_enabled: false,
    reviewer_approval_required: true
  },
  summary: {
    approved_fixture_promotion_ready: true,
    evidence_file_present: Boolean(evidenceFile),
    approved_fixtures_file_present: Boolean(approvedFixturesFile),
    promotion_items: promotionItems.length,
    promotion_ready_items: validItems.length,
    promoted_approved_fixtures: promotedFixtures,
    pending_promotions: promotionItems.length - promotedFixtures,
    can_promote_all_validated_evidence: canPromoteAll,
    public_results_enabled: false
  },
  public_promotion_items: promotionItems.map((item) => ({
    fixture_id: item.fixture_id,
    evidence_validated: item.evidence_validated,
    promotion_ready: item.promotion_ready,
    promoted_to_approved_fixture: item.promoted_to_approved_fixture,
    public_values_exposed: false
  })),
  public_message: "Approved-fixture promotion is wired, but no fixture values are public. MFLG calculator results remain locked until validated evidence is promoted and comparison testing passes."
};

const internalPromotion = {
  version: "1.0.0-calculator-approved-fixture-promotion",
  built_at: builtAt,
  public_exposure: "blocked by Worker /internal/ route",
  source_validation_status_version: validation.version,
  source_validation_internal_version: evidenceValidation.version,
  intended_input_path: "internal/calculator-fixture-evidence.json",
  intended_output_path: "internal/calculator-approved-fixtures.json",
  safety: {
    contains_sensitive_user_data: false,
    contains_real_fixture_values: false,
    contains_raw_formula_text: false,
    public_results_enabled: false,
    intended_use: "Internal validated-evidence to approved-fixture promotion bridge for n8n and CRM OS only."
  },
  n8n_workflow_contract: {
    schedule: "Run after fixture evidence validation passes and before fixture QA status rebuilds.",
    allowed_public_fetches: [
      "/data/calculator-approved-fixture-promotion-status.json",
      "/data/calculator-fixture-evidence-validation-status.json",
      "/data/calculator-approved-fixtures-status.json"
    ],
    do_not_fetch: [
      "/internal/calculator-approved-fixture-promotion.json",
      "/internal/calculator-fixture-evidence.json",
      "/internal/calculator-approved-fixtures.json",
      "/internal/calculator-formula-map.json"
    ],
    crm_os_fields: {
      calculator_approved_fixture_promotion_ready: "data.calculator-approved-fixture-promotion-status.summary.approved_fixture_promotion_ready",
      calculator_promotion_ready_items: "data.calculator-approved-fixture-promotion-status.summary.promotion_ready_items",
      calculator_promoted_approved_fixtures: "data.calculator-approved-fixture-promotion-status.summary.promoted_approved_fixtures",
      calculator_public_results_enabled: "data.calculator-approved-fixture-promotion-status.summary.public_results_enabled"
    }
  },
  promotion_policy: {
    can_promote_all_validated_evidence: canPromoteAll,
    require_reviewed_internal_evidence: true,
    public_results_enabled: false,
    final_reviewer_approval_required: true
  },
  promotion_items: promotionItems
};

writeJSON("data/calculator-approved-fixture-promotion-status.json", publicStatus);
writeJSON("internal/calculator-approved-fixture-promotion.json", internalPromotion);
console.log(`Built calculator approved-fixture promotion: ${promotedFixtures}/${promotionItems.length} fixtures promoted, public results locked.`);
