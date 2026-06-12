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
const publicUnlock = readJSON("data/calculator-public-unlock-status.json");
const operations = readJSON("data/calculator-operations-status.json");

const completeFixtures = approvedFixtures.summary?.complete_approved_fixtures || 0;
const pendingFixtures = approvedFixtures.summary?.pending_approved_fixtures || 0;
const completeComparisons = comparison.summary?.complete_comparisons || 0;
const pendingComparisons = comparison.summary?.pending_comparisons || 0;
const blockedGates = publicUnlock.summary?.blocked_gates || 0;

const alerts = [
  {
    key: "approved_fixtures_needed",
    public_label: "Official test records needed",
    public_status: completeFixtures > 0 ? "in_review" : "waiting",
    severity: pendingFixtures > 0 ? "blocking" : "watch",
    public_next_step: "MFLG-branded calculator results stay locked until approved official test records are complete."
  },
  {
    key: "regression_comparisons_waiting",
    public_label: "Calculator comparison checks waiting",
    public_status: completeComparisons > 0 ? "in_review" : "waiting",
    severity: pendingComparisons > 0 ? "blocking" : "watch",
    public_next_step: "Each approved test record must be compared before MFLG-branded results can be shown."
  },
  {
    key: "public_unlock_blocked",
    public_label: "Final result release locked",
    public_status: publicUnlock.summary?.public_unlock_ready ? "ready" : "locked",
    severity: blockedGates > 0 ? "blocking" : "watch",
    public_next_step: "Official calculators remain the available option until final review clears every release gate."
  }
];

const blockingAlerts = alerts.filter((alert) => alert.severity === "blocking").length;
const builtAt = new Date().toISOString();

const publicStatus = {
  version: "1.0.0-calculator-operations-alerts",
  built_at: builtAt,
  public_safety: {
    internal_alert_rules_exposed: false,
    sensitive_fixture_values_exposed: false,
    raw_formula_text_exposed: false,
    internal_engine_outputs_exposed: false,
    public_results_enabled: false,
    reviewer_approval_required: true
  },
  summary: {
    operations_alerts_ready: Boolean(operations.summary?.operations_status_ready),
    alert_count: alerts.length,
    blocking_alerts: blockingAlerts,
    public_results_enabled: false,
    next_public_status: "official_tools_remain_available"
  },
  public_alerts: alerts,
  public_message: "Calculator safety checks are tracked, but MFLG-branded calculator results remain locked until official test records, comparison checks, and final review are complete."
};

const internalRules = {
  version: "1.0.0-calculator-operations-alert-rules",
  built_at: builtAt,
  public_exposure: "blocked by Worker /internal/ route",
  safety: {
    contains_sensitive_user_data: false,
    contains_real_fixture_values: false,
    contains_raw_formula_text: false,
    public_results_enabled: false,
    intended_use: "Internal calculator alert routing for n8n and CRM OS only."
  },
  n8n_workflow_contract: {
    schedule: "Poll after calculator source-monitoring, fixture review, or comparison jobs finish.",
    allowed_public_fetches: [
      "/data/calculator-operations-status.json",
      "/data/calculator-operations-alerts.json",
      "/data/calculator-public-unlock-status.json"
    ],
    do_not_fetch: [
      "/internal/calculator-operations-alert-rules.json",
      "/internal/calculator-operations-runbook.json",
      "/internal/calculator-formula-map.json",
      "/internal/calculator-regression-comparison-plan.json"
    ],
    crm_os_fields: {
      calculator_alert_count: "data.calculator-operations-alerts.summary.alert_count",
      calculator_blocking_alerts: "data.calculator-operations-alerts.summary.blocking_alerts",
      calculator_next_public_status: "data.calculator-operations-alerts.summary.next_public_status",
      calculator_public_results_enabled: "data.calculator-operations-alerts.summary.public_results_enabled"
    }
  },
  alert_rules: alerts.map((alert) => ({
    key: alert.key,
    severity: alert.severity,
    public_status: alert.public_status,
    route_to_staff_review: alert.severity === "blocking",
    public_results_enabled: false
  }))
};

writeJSON("data/calculator-operations-alerts.json", publicStatus);
writeJSON("internal/calculator-operations-alert-rules.json", internalRules);
console.log(`Built calculator operations alerts: ${alerts.length} alerts, ${blockingAlerts} blocking, public results locked.`);
