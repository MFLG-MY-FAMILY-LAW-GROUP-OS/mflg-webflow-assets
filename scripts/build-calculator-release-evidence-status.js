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

const approvedFixtures = readJSON("data/calculator-approved-fixtures-status.json");
const fixtureQa = readJSON("data/calculator-fixture-qa-status.json");
const comparison = readJSON("data/calculator-regression-comparison-status.json");
const unlock = readJSON("data/calculator-public-unlock-status.json");
const release = readJSON("data/calculator-release-readiness.json");
const finalApproval = readJSON("data/calculator-final-approval-status.json");

const evidenceItems = [
  {
    key: "approved_official_fixtures",
    public_label: "Official test records",
    status: approvedFixtures.summary?.complete_approved_fixtures === approvedFixtures.summary?.fixture_templates &&
      approvedFixtures.summary?.fixture_templates > 0 ? "complete" : "pending",
    public_note: "Required before MFLG-branded results can be released."
  },
  {
    key: "fixture_quality_review",
    public_label: "Test record review",
    status: fixtureQa.summary?.approved_fixture_count === fixtureQa.summary?.fixture_review_items &&
      fixtureQa.summary?.fixture_review_items > 0 ? "complete" : "pending",
    public_note: "Required to confirm each official test record is usable."
  },
  {
    key: "regression_comparison_results",
    public_label: "Comparison checks",
    status: comparison.summary?.complete_comparisons === comparison.summary?.fixture_comparison_items &&
      comparison.summary?.fixture_comparison_items > 0 &&
      comparison.summary?.material_mismatches === 0 ? "complete" : "pending",
    public_note: "Required to verify MFLG results match approved official outputs."
  },
  {
    key: "final_reviewer_approval",
    public_label: "Final release review",
    status: finalApproval.summary?.final_approval_recorded ? "complete" : "pending",
    public_note: "Required before any public MFLG-branded calculator result appears."
  }
];

const completeEvidenceItems = evidenceItems.filter((item) => item.status === "complete").length;
const pendingEvidenceItems = evidenceItems.length - completeEvidenceItems;
const builtAt = new Date().toISOString();

const publicStatus = {
  version: "1.0.0-calculator-release-evidence-status",
  built_at: builtAt,
  public_safety: {
    internal_evidence_index_exposed: false,
    sensitive_fixture_values_exposed: false,
    raw_formula_text_exposed: false,
    internal_engine_outputs_exposed: false,
    comparison_deltas_exposed: false,
    public_results_enabled: false,
    reviewer_approval_required: !finalApproval.summary?.final_approval_recorded
  },
  summary: {
    release_evidence_status_ready: true,
    evidence_items: evidenceItems.length,
    complete_evidence_items: completeEvidenceItems,
    pending_evidence_items: pendingEvidenceItems,
    release_packet_complete: pendingEvidenceItems === 0,
    public_results_enabled: false,
    next_public_status: release.summary?.next_public_status || "official_tools_remain_available"
  },
  public_evidence_items: evidenceItems,
  public_message: "Release evidence is being tracked. MFLG-branded calculator results remain unavailable until every required test and review item is complete."
};

const internalEvidenceIndex = {
  version: "1.0.0-calculator-release-evidence-index",
  built_at: builtAt,
  public_exposure: "blocked by Worker /internal/ route",
  safety: {
    contains_sensitive_user_data: false,
    contains_real_fixture_values: false,
    contains_raw_formula_text: false,
    contains_internal_engine_outputs: false,
    public_results_enabled: false,
    intended_use: "Internal calculator release evidence index for n8n and CRM OS only."
  },
  n8n_workflow_contract: {
    schedule: "Poll after fixture entry, QA, comparison, and final-review updates.",
    allowed_public_fetches: [
      "/data/calculator-release-evidence-status.json",
      "/data/calculator-release-readiness.json",
      "/data/calculator-public-unlock-status.json"
    ],
    do_not_fetch: [
      "/internal/calculator-release-evidence-index.json",
      "/internal/calculator-release-approval-packet.json",
      "/internal/calculator-regression-comparison-plan.json",
      "/internal/calculator-formula-map.json"
    ],
    crm_os_fields: {
      calculator_release_evidence_items: "data.calculator-release-evidence-status.summary.evidence_items",
      calculator_release_evidence_complete: "data.calculator-release-evidence-status.summary.complete_evidence_items",
      calculator_release_evidence_pending: "data.calculator-release-evidence-status.summary.pending_evidence_items",
      calculator_public_results_enabled: "data.calculator-release-evidence-status.summary.public_results_enabled"
    }
  },
  evidence_requirements: evidenceItems.map((item) => ({
    key: item.key,
    status: item.status,
    public_results_enabled: false,
    required_before_public_release: true
  })),
  release_packet_complete: pendingEvidenceItems === 0
};

writeJSON("data/calculator-release-evidence-status.json", publicStatus);
writeJSON("internal/calculator-release-evidence-index.json", internalEvidenceIndex);
console.log(`Built calculator release evidence status: ${completeEvidenceItems}/${evidenceItems.length} evidence items complete, public results locked.`);
