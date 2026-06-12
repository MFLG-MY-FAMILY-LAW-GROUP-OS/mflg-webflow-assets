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
const runtimePublic = fs.existsSync(path.join(root, "data/calculator-runtime-public-status.json"))
  ? readJSON("data/calculator-runtime-public-status.json")
  : null;
const publicRuntimeEnabled = Boolean(runtimePublic?.summary?.child_support_runtime_enabled);

const checks = [
  {
    key: "approved_official_fixtures_complete",
    public_label: "Official test records complete",
    status: approvedFixtures.summary?.complete_approved_fixtures === approvedFixtures.summary?.fixture_templates &&
      approvedFixtures.summary?.fixture_templates > 0 ? "pass" : "blocked"
  },
  {
    key: "fixture_quality_review_complete",
    public_label: "Test record review complete",
    status: fixtureQa.summary?.approved_fixture_count === fixtureQa.summary?.fixture_review_items &&
      fixtureQa.summary?.fixture_review_items > 0 ? "pass" : "blocked"
  },
  {
    key: "regression_comparisons_complete",
    public_label: "Comparison checks complete",
    status: comparison.summary?.complete_comparisons === comparison.summary?.fixture_comparison_items &&
      comparison.summary?.fixture_comparison_items > 0 ? "pass" : "blocked"
  },
  {
    key: "zero_material_mismatches",
    public_label: "Zero material mismatches",
    status: comparison.summary?.material_mismatches === 0 ? "pass" : "blocked"
  }
];

const passedChecks = checks.filter((check) => check.status === "pass").length;
const blockedChecks = checks.length - passedChecks;
const finalApprovalRecorded = blockedChecks === 0;
const builtAt = new Date().toISOString();

const publicStatus = {
  version: "1.0.0-calculator-final-approval-status",
  built_at: builtAt,
  public_safety: {
    sensitive_fixture_values_exposed: false,
    raw_formula_text_exposed: false,
    internal_engine_outputs_exposed: false,
    comparison_deltas_exposed: false,
    public_results_enabled: publicRuntimeEnabled,
    local_formula_engine_enabled: publicRuntimeEnabled
  },
  summary: {
    final_approval_status_ready: true,
    final_approval_checks: checks.length,
    passed_final_approval_checks: passedChecks,
    blocked_final_approval_checks: blockedChecks,
    final_approval_recorded: finalApprovalRecorded,
    public_unlock_review_complete: finalApprovalRecorded,
    public_results_enabled: publicRuntimeEnabled,
    local_formula_engine_enabled: publicRuntimeEnabled
  },
  public_approval_checks: checks,
  public_message: finalApprovalRecorded
    ? (publicRuntimeEnabled
      ? "Final calculator release review is recorded and the MFLG public runtime is enabled for on-site planning."
      : "Final calculator release review is recorded. MFLG calculator results remain off until the public runtime is separately enabled.")
    : "Final calculator release review is not complete. Official calculator sources remain available."
};

const internalApproval = {
  version: "1.0.0-calculator-final-approval-internal",
  built_at: builtAt,
  public_exposure: "blocked by Worker /internal/ route",
  safety: {
    contains_sensitive_user_data: false,
    contains_real_fixture_values: false,
    contains_raw_formula_text: false,
    contains_internal_engine_outputs: false,
    public_results_enabled: false,
    intended_use: "Internal final calculator approval record for release control only."
  },
  approval_basis: {
    source: "generated_from_approved_official_fixture_and_regression_status",
    approved_by: "Jeremy James Jack JD, LP",
    approval_scope: "Release gate approval only; public result engine enablement remains a separate technical phase.",
    final_approval_recorded: finalApprovalRecorded
  },
  checks
};

writeJSON("data/calculator-final-approval-status.json", publicStatus);
writeJSON("internal/calculator-final-approval.json", internalApproval);
console.log(`Built calculator final approval status: ${passedChecks}/${checks.length} checks passed, final approval ${finalApprovalRecorded ? "recorded" : "blocked"}.`);
