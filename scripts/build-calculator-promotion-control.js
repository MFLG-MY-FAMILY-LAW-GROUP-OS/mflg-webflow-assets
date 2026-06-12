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

const unlock = readJSON("data/calculator-public-unlock-status.json");
const release = readJSON("data/calculator-release-readiness.json");
const evidence = readJSON("data/calculator-release-evidence-status.json");
const guardrails = readJSON("data/calculator-launch-guardrails.json");
const monitoring = readJSON("data/calculator-launch-monitoring.json");

const promotionChecks = [
  {
    key: "public_unlock_ready",
    public_label: "Final unlock ready",
    status: unlock.summary?.public_unlock_ready ? "pass" : "blocked",
    public_note: "Final unlock must pass before MFLG-branded results can be promoted."
  },
  {
    key: "release_packet_complete",
    public_label: "Release packet complete",
    status: release.summary?.release_packet_complete ? "pass" : "blocked",
    public_note: "Release packet remains incomplete."
  },
  {
    key: "release_evidence_complete",
    public_label: "Release evidence complete",
    status: evidence.summary?.pending_evidence_items === 0 && evidence.summary?.evidence_items > 0 ? "pass" : "blocked",
    public_note: "Required evidence items remain pending."
  },
  {
    key: "launch_guardrails_clear",
    public_label: "Launch guardrails clear",
    status: guardrails.summary?.blocked_guardrails === 0 ? "pass" : "blocked",
    public_note: "Blocked launch guardrails keep MFLG-branded results off."
  },
  {
    key: "monitoring_attention_clear",
    public_label: "Monitoring attention clear",
    status: monitoring.summary?.attention_signals === 0 ? "pass" : "blocked",
    public_note: "Monitoring attention signals must clear before promotion."
  },
  {
    key: "official_fallback_available",
    public_label: "Official fallback available",
    status: monitoring.summary?.official_fallback_available ? "pass" : "blocked",
    public_note: "Official calculator sources remain the fallback."
  }
];

const passedChecks = promotionChecks.filter((item) => item.status === "pass").length;
const blockedChecks = promotionChecks.length - passedChecks;
const promotionAllowed = blockedChecks === 0;
const builtAt = new Date().toISOString();

const publicStatus = {
  version: "1.0.0-calculator-promotion-control",
  built_at: builtAt,
  public_safety: {
    internal_promotion_control_exposed: false,
    sensitive_fixture_values_exposed: false,
    raw_formula_text_exposed: false,
    internal_engine_outputs_exposed: false,
    comparison_deltas_exposed: false,
    public_results_enabled: false,
    reviewer_approval_required: true
  },
  summary: {
    promotion_control_ready: true,
    promotion_checks: promotionChecks.length,
    passed_promotion_checks: passedChecks,
    blocked_promotion_checks: blockedChecks,
    promotion_allowed: promotionAllowed,
    official_fallback_available: Boolean(monitoring.summary?.official_fallback_available),
    public_results_enabled: false,
    next_public_status: monitoring.summary?.next_public_status || "official_tools_remain_available"
  },
  public_promotion_checks: promotionChecks,
  public_message: promotionAllowed
    ? "Calculator promotion is approved. MFLG calculator results remain off until the public runtime is separately enabled."
    : "MFLG-branded calculator results are not promoted. Official calculator sources remain available while release checks are incomplete."
};

const internalControl = {
  version: "1.0.0-calculator-promotion-control-internal",
  built_at: builtAt,
  public_exposure: "blocked by Worker /internal/ route",
  safety: {
    contains_sensitive_user_data: false,
    contains_real_fixture_values: false,
    contains_raw_formula_text: false,
    contains_internal_engine_outputs: false,
    public_results_enabled: false,
    intended_use: "Internal calculator promotion control for n8n and CRM OS only."
  },
  n8n_workflow_contract: {
    schedule: "Poll before any calculator promotion toggle is created or changed.",
    allowed_public_fetches: [
      "/data/calculator-promotion-control.json",
      "/data/calculator-launch-monitoring.json",
      "/data/calculator-launch-guardrails.json",
      "/data/calculator-public-unlock-status.json"
    ],
    do_not_fetch: [
      "/internal/calculator-promotion-control.json",
      "/internal/calculator-launch-monitoring-runbook.json",
      "/internal/calculator-launch-guardrails-runbook.json",
      "/internal/calculator-formula-map.json"
    ],
    crm_os_fields: {
      calculator_promotion_allowed: "data.calculator-promotion-control.summary.promotion_allowed",
      calculator_blocked_promotion_checks: "data.calculator-promotion-control.summary.blocked_promotion_checks",
      calculator_official_fallback_available: "data.calculator-promotion-control.summary.official_fallback_available",
      calculator_public_results_enabled: "data.calculator-promotion-control.summary.public_results_enabled"
    }
  },
  promotion_decision: {
    promotion_allowed: promotionAllowed,
    public_results_enabled: false,
    blocked_promotion_checks: blockedChecks,
    final_reviewer_approval_required: true
  },
  promotion_checks: promotionChecks.map((item) => ({
    key: item.key,
    status: item.status,
    required_before_public_release: true,
    public_results_enabled: false
  }))
};

writeJSON("data/calculator-promotion-control.json", publicStatus);
writeJSON("internal/calculator-promotion-control.json", internalControl);
console.log(`Built calculator promotion control: ${passedChecks}/${promotionChecks.length} checks passed, public results locked.`);
