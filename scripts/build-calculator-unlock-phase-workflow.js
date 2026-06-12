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
const regressionComparison = readJSON("data/calculator-regression-comparison-status.json");
const publicUnlock = readJSON("data/calculator-public-unlock-status.json");
const promotionAudit = readJSON("data/calculator-promotion-audit.json");

const phases = [
  {
    key: "approved_official_fixtures",
    order: 1,
    public_label: "Approved official test records",
    status: approvedFixtures.summary?.complete_approved_fixtures === approvedFixtures.summary?.fixture_templates &&
      approvedFixtures.summary?.fixture_templates > 0 ? "complete" : "blocked",
    public_next_step: "Enter reviewer-approved official-output fixture records before MFLG results can be tested."
  },
  {
    key: "fixture_quality_review",
    order: 2,
    public_label: "Test record review",
    status: fixtureQa.summary?.approved_fixture_count === fixtureQa.summary?.fixture_review_items &&
      fixtureQa.summary?.fixture_review_items > 0 ? "complete" : "blocked",
    public_next_step: "Confirm every approved fixture has required inputs, official outputs, source version, and reviewer approval."
  },
  {
    key: "regression_comparison",
    order: 3,
    public_label: "Regression comparison",
    status: regressionComparison.summary?.complete_comparisons === regressionComparison.summary?.fixture_comparison_items &&
      regressionComparison.summary?.fixture_comparison_items > 0 &&
      regressionComparison.summary?.material_mismatches === 0 ? "complete" : "blocked",
    public_next_step: "Compare MFLG engine outputs against approved official outputs with zero material mismatches."
  },
  {
    key: "final_reviewer_approval",
    order: 4,
    public_label: "Final release approval",
    status: publicUnlock.summary?.public_unlock_ready ? "complete" : "blocked",
    public_next_step: "Record final reviewer approval only after fixture, QA, and comparison phases are complete."
  }
];

const completePhases = phases.filter((phase) => phase.status === "complete").length;
const blockedPhases = phases.length - completePhases;
const publicUnlockReady = blockedPhases === 0;
const builtAt = new Date().toISOString();

const publicStatus = {
  version: "1.0.0-calculator-unlock-phase-workflow",
  built_at: builtAt,
  public_safety: {
    internal_unlock_workflow_exposed: false,
    sensitive_fixture_values_exposed: false,
    raw_formula_text_exposed: false,
    internal_engine_outputs_exposed: false,
    comparison_deltas_exposed: false,
    public_results_enabled: false,
    reviewer_approval_required: true
  },
  summary: {
    unlock_phase_workflow_ready: true,
    unlock_phases: phases.length,
    complete_unlock_phases: completePhases,
    blocked_unlock_phases: blockedPhases,
    promotion_audit_ready: Boolean(promotionAudit.summary?.promotion_audit_ready),
    promotion_allowed: Boolean(promotionAudit.summary?.promotion_allowed),
    public_unlock_ready: publicUnlockReady,
    public_results_enabled: false,
    next_public_status: promotionAudit.summary?.next_public_status || "official_tools_remain_available"
  },
  public_unlock_phases: phases,
  public_message: publicUnlockReady
    ? "All calculator unlock phases are complete. MFLG calculator results remain off until the public runtime is separately enabled."
    : "The four remaining MFLG calculator unlock phases are built and tracked. Public MFLG results remain locked until all four phases are complete."
};

const internalRunbook = {
  version: "1.0.0-calculator-unlock-phase-workflow-runbook",
  built_at: builtAt,
  public_exposure: "blocked by Worker /internal/ route",
  safety: {
    contains_sensitive_user_data: false,
    contains_real_fixture_values: false,
    contains_raw_formula_text: false,
    contains_internal_engine_outputs: false,
    public_results_enabled: false,
    intended_use: "Internal calculator unlock phase workflow for n8n and CRM OS only."
  },
  n8n_workflow_contract: {
    schedule: "Poll after approved fixture, fixture QA, regression comparison, and final reviewer approval updates.",
    allowed_public_fetches: [
      "/data/calculator-unlock-phase-workflow.json",
      "/data/calculator-approved-fixtures-status.json",
      "/data/calculator-fixture-qa-status.json",
      "/data/calculator-regression-comparison-status.json",
      "/data/calculator-public-unlock-status.json"
    ],
    do_not_fetch: [
      "/internal/calculator-unlock-phase-workflow-runbook.json",
      "/internal/calculator-approved-fixtures.json",
      "/internal/calculator-regression-comparison-results.json",
      "/internal/calculator-formula-map.json"
    ],
    crm_os_fields: {
      calculator_unlock_phase_workflow_ready: "data.calculator-unlock-phase-workflow.summary.unlock_phase_workflow_ready",
      calculator_complete_unlock_phases: "data.calculator-unlock-phase-workflow.summary.complete_unlock_phases",
      calculator_blocked_unlock_phases: "data.calculator-unlock-phase-workflow.summary.blocked_unlock_phases",
      calculator_public_results_enabled: "data.calculator-unlock-phase-workflow.summary.public_results_enabled"
    }
  },
  phase_order: phases.map((phase) => ({
    key: phase.key,
    order: phase.order,
    status: phase.status,
    blocks_public_results: phase.status !== "complete"
  })),
  unlock_decision: {
    public_unlock_ready: publicUnlockReady,
    promotion_allowed: Boolean(promotionAudit.summary?.promotion_allowed),
    public_results_enabled: false,
    final_reviewer_approval_required: true
  }
};

writeJSON("data/calculator-unlock-phase-workflow.json", publicStatus);
writeJSON("internal/calculator-unlock-phase-workflow-runbook.json", internalRunbook);
console.log(`Built calculator unlock phase workflow: ${completePhases}/${phases.length} phases complete, public results locked.`);
