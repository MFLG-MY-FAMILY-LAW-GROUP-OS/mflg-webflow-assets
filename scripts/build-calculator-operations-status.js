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
const comparison = readJSON("data/calculator-regression-comparison-status.json");
const unlock = readJSON("data/calculator-public-unlock-status.json");
const internalStatus = readJSON("data/calculator-internal-status.json");

const operationStages = [
  {
    key: "fixture_entry",
    internal_owner: "Reviewer",
    automation_trigger: "manual_review_required",
    public_status: approvedFixtures.summary?.complete_approved_fixtures > 0 ? "in_review" : "waiting",
    blocking_reason: approvedFixtures.summary?.complete_approved_fixtures > 0 ? "" : "No approved official-output fixture records are complete."
  },
  {
    key: "comparison_run",
    internal_owner: "Calculator QA",
    automation_trigger: "approved_fixtures_complete",
    public_status: comparison.summary?.complete_comparisons > 0 ? "in_review" : "waiting",
    blocking_reason: comparison.summary?.complete_comparisons > 0 ? "" : "Regression comparison results are not complete."
  },
  {
    key: "final_unlock_review",
    internal_owner: "Final reviewer",
    automation_trigger: "all_comparisons_passed",
    public_status: unlock.summary?.public_unlock_ready ? "ready" : "locked",
    blocking_reason: unlock.summary?.public_unlock_ready ? "" : "Final public-unlock gate remains locked."
  }
];

const publicStatus = {
  version: "1.0.0-calculator-operations-status",
  built_at: new Date().toISOString(),
  public_safety: {
    sensitive_fixture_values_exposed: false,
    raw_formula_text_exposed: false,
    internal_engine_outputs_exposed: false,
    internal_runbook_exposed: false,
    public_results_enabled: false,
    reviewer_approval_required: true
  },
  summary: {
    operations_status_ready: true,
    monitored_status_files: 4,
    internal_artifacts_ready: Boolean(internalStatus.summary?.internal_artifacts_ready),
    approved_fixture_records_found: approvedFixtures.summary?.approved_fixture_records_found || 0,
    complete_approved_fixtures: approvedFixtures.summary?.complete_approved_fixtures || 0,
    complete_regression_comparisons: comparison.summary?.complete_comparisons || 0,
    public_unlock_ready: false,
    public_results_enabled: false,
    next_public_status: "official_tools_remain_available"
  },
  public_stages: operationStages.map((stage) => ({
    key: stage.key,
    public_status: stage.public_status,
    blocking_reason: stage.blocking_reason
  })),
  public_message: "Calculator operations are monitored, but MFLG-branded results remain locked until approved fixtures, comparison checks, and final review are complete."
};

const internalRunbook = {
  version: "1.0.0-calculator-operations-runbook",
  built_at: publicStatus.built_at,
  public_exposure: "blocked by Worker /internal/ route",
  safety: {
    contains_sensitive_user_data: false,
    contains_real_fixture_values: false,
    contains_raw_formula_text: false,
    public_results_enabled: false,
    intended_use: "Internal calculator approval workflow and n8n/CRM monitoring runbook only."
  },
  monitored_public_status_files: [
    "data/calculator-approved-fixtures-status.json",
    "data/calculator-regression-comparison-status.json",
    "data/calculator-public-unlock-status.json",
    "data/calculator-operations-status.json"
  ],
  n8n_workflow_contract: {
    schedule: "Poll public status files after each source-monitoring or calculator-build run.",
    do_not_fetch: [
      "/internal/calculator-formula-map.json",
      "/internal/calculator-approved-fixtures-template.json",
      "/internal/calculator-regression-comparison-plan.json",
      "/internal/calculator-public-unlock-decision.json"
    ],
    allowed_public_fetches: [
      "/data/calculator-approved-fixtures-status.json",
      "/data/calculator-regression-comparison-status.json",
      "/data/calculator-public-unlock-status.json",
      "/data/calculator-operations-status.json"
    ],
    crm_os_fields: {
      calculator_pipeline_status: "data.calculator-operations-status.summary.next_public_status",
      approved_fixture_count: "data.calculator-approved-fixtures-status.summary.complete_approved_fixtures",
      comparison_count: "data.calculator-regression-comparison-status.summary.complete_comparisons",
      public_unlock_ready: "data.calculator-public-unlock-status.summary.public_unlock_ready"
    }
  },
  operation_stages: operationStages,
  required_staff_actions: [
    "Enter approved official-output fixture records only in the internal approved-fixtures file.",
    "Run regression comparison results only after approved fixture records are complete.",
    "Do not enable public calculator outputs unless the public unlock status reports ready and final reviewer approval is separately recorded.",
    "Use official Arizona calculators as the public fallback until every gate passes."
  ]
};

writeJSON("internal/calculator-operations-runbook.json", internalRunbook);
writeJSON("data/calculator-operations-status.json", publicStatus);
console.log("Built calculator operations status: monitored workflow ready, public results locked.");
