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

const promotion = readJSON("data/calculator-promotion-control.json");
const monitoring = readJSON("data/calculator-launch-monitoring.json");
const guardrails = readJSON("data/calculator-launch-guardrails.json");
const release = readJSON("data/calculator-release-readiness.json");

const auditItems = [
  {
    key: "promotion_control_present",
    public_label: "Promotion control present",
    status: promotion.summary?.promotion_control_ready ? "pass" : "blocked",
    public_note: "Promotion decision status is available."
  },
  {
    key: "promotion_locked",
    public_label: "Promotion decision approved",
    status: promotion.summary?.promotion_allowed ? "pass" : "blocked",
    public_note: "Promotion becomes approved only after every release check passes."
  },
  {
    key: "public_results_locked",
    public_label: "Public results remain off",
    status: promotion.summary?.public_results_enabled ? "blocked" : "pass",
    public_note: "MFLG-branded calculator outputs remain disabled."
  },
  {
    key: "official_fallback_available",
    public_label: "Official fallback available",
    status: promotion.summary?.official_fallback_available ? "pass" : "blocked",
    public_note: "Official calculator sources remain available."
  },
  {
    key: "promotion_checks_clear",
    public_label: "Promotion checks clear",
    status: promotion.summary?.blocked_promotion_checks === 0 ? "pass" : "blocked",
    public_note: "Blocked promotion checks remain."
  },
  {
    key: "monitoring_clear",
    public_label: "Monitoring clear",
    status: monitoring.summary?.attention_signals === 0 ? "pass" : "blocked",
    public_note: "Monitoring attention signals remain."
  },
  {
    key: "launch_guardrails_clear",
    public_label: "Launch guardrails clear",
    status: guardrails.summary?.blocked_guardrails === 0 ? "pass" : "blocked",
    public_note: "Blocked launch guardrails remain."
  },
  {
    key: "release_packet_complete",
    public_label: "Release packet complete",
    status: release.summary?.release_packet_complete ? "pass" : "blocked",
    public_note: "Release packet remains incomplete."
  }
];

const passedAuditItems = auditItems.filter((item) => item.status === "pass").length;
const blockedAuditItems = auditItems.length - passedAuditItems;
const promotionAllowed = blockedAuditItems === 0;
const builtAt = new Date().toISOString();

const publicStatus = {
  version: "1.0.0-calculator-promotion-audit",
  built_at: builtAt,
  public_safety: {
    internal_promotion_audit_exposed: false,
    sensitive_fixture_values_exposed: false,
    raw_formula_text_exposed: false,
    internal_engine_outputs_exposed: false,
    comparison_deltas_exposed: false,
    public_results_enabled: false,
    reviewer_approval_required: true
  },
  summary: {
    promotion_audit_ready: true,
    audit_items: auditItems.length,
    passed_audit_items: passedAuditItems,
    blocked_audit_items: blockedAuditItems,
    promotion_allowed: promotionAllowed,
    official_fallback_available: Boolean(promotion.summary?.official_fallback_available),
    public_results_enabled: false,
    next_public_status: promotion.summary?.next_public_status || "official_tools_remain_available"
  },
  public_audit_items: auditItems,
  public_message: promotionAllowed
    ? "Calculator promotion audit is clear. MFLG calculator results remain off until the public runtime is separately enabled."
    : "Calculator promotion audit is active. Promotion remains locked and official calculator sources remain available."
};

const internalAudit = {
  version: "1.0.0-calculator-promotion-audit-internal",
  built_at: builtAt,
  public_exposure: "blocked by Worker /internal/ route",
  safety: {
    contains_sensitive_user_data: false,
    contains_real_fixture_values: false,
    contains_raw_formula_text: false,
    contains_internal_engine_outputs: false,
    public_results_enabled: false,
    intended_use: "Internal calculator promotion audit for n8n and CRM OS only."
  },
  n8n_workflow_contract: {
    schedule: "Poll after promotion control, launch monitoring, or release readiness changes.",
    allowed_public_fetches: [
      "/data/calculator-promotion-audit.json",
      "/data/calculator-promotion-control.json",
      "/data/calculator-launch-monitoring.json",
      "/data/calculator-release-readiness.json"
    ],
    do_not_fetch: [
      "/internal/calculator-promotion-audit.json",
      "/internal/calculator-promotion-control.json",
      "/internal/calculator-launch-monitoring-runbook.json",
      "/internal/calculator-formula-map.json"
    ],
    crm_os_fields: {
      calculator_promotion_audit_ready: "data.calculator-promotion-audit.summary.promotion_audit_ready",
      calculator_blocked_audit_items: "data.calculator-promotion-audit.summary.blocked_audit_items",
      calculator_promotion_allowed: "data.calculator-promotion-audit.summary.promotion_allowed",
      calculator_public_results_enabled: "data.calculator-promotion-audit.summary.public_results_enabled"
    }
  },
  audit_decision: {
    promotion_allowed: promotionAllowed,
    public_results_enabled: false,
    blocked_audit_items: blockedAuditItems,
    final_reviewer_approval_required: true
  },
  audit_items: auditItems.map((item) => ({
    key: item.key,
    status: item.status,
    public_results_enabled: false,
    route_to_review: item.status === "blocked"
  }))
};

writeJSON("data/calculator-promotion-audit.json", publicStatus);
writeJSON("internal/calculator-promotion-audit.json", internalAudit);
console.log(`Built calculator promotion audit: ${passedAuditItems}/${auditItems.length} audit items passed, public results locked.`);
