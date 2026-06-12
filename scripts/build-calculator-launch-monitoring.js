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

const guardrails = readJSON("data/calculator-launch-guardrails.json");
const release = readJSON("data/calculator-release-readiness.json");
const evidence = readJSON("data/calculator-release-evidence-status.json");
const operations = readJSON("data/calculator-operations-status.json");

const monitoredSignals = [
  {
    key: "official_fallback",
    public_label: "Official calculator fallback",
    status: guardrails.summary?.official_fallback_available ? "healthy" : "attention",
    public_note: "Official calculator sources stay available while MFLG-branded results are locked."
  },
  {
    key: "public_results_lock",
    public_label: "Public result lock",
    status: guardrails.summary?.public_results_enabled ? "attention" : "healthy",
    public_note: "MFLG-branded result output remains off."
  },
  {
    key: "release_packet",
    public_label: "Release packet",
    status: release.summary?.release_packet_complete ? "healthy" : "attention",
    public_note: "Release packet review must be complete before launch."
  },
  {
    key: "release_evidence",
    public_label: "Release evidence",
    status: evidence.summary?.pending_evidence_items === 0 && evidence.summary?.evidence_items > 0 ? "healthy" : "attention",
    public_note: "Evidence items are monitored before any launch decision."
  },
  {
    key: "fallback_status",
    public_label: "Fallback status",
    status: operations.summary?.next_public_status === "official_tools_remain_available" ? "healthy" : "attention",
    public_note: "The page should continue routing visitors to official calculator sources."
  }
];

const healthySignals = monitoredSignals.filter((item) => item.status === "healthy").length;
const attentionSignals = monitoredSignals.length - healthySignals;
const launchReady = attentionSignals === 0 && Boolean(guardrails.summary?.launch_ready);
const builtAt = new Date().toISOString();

const publicStatus = {
  version: "1.0.0-calculator-launch-monitoring",
  built_at: builtAt,
  public_safety: {
    internal_monitoring_runbook_exposed: false,
    sensitive_fixture_values_exposed: false,
    raw_formula_text_exposed: false,
    internal_engine_outputs_exposed: false,
    comparison_deltas_exposed: false,
    public_results_enabled: false,
    reviewer_approval_required: true
  },
  summary: {
    launch_monitoring_ready: true,
    monitored_signals: monitoredSignals.length,
    healthy_signals: healthySignals,
    attention_signals: attentionSignals,
    official_fallback_available: Boolean(guardrails.summary?.official_fallback_available),
    launch_ready: launchReady,
    public_results_enabled: false,
    next_public_status: operations.summary?.next_public_status || "official_tools_remain_available"
  },
  public_signals: monitoredSignals,
  public_message: launchReady
    ? "Calculator launch monitoring is clear. MFLG calculator results remain off until the public runtime is separately enabled."
    : "Calculator launch monitoring is active. MFLG-branded results remain locked while official calculator sources stay available."
};

const internalRunbook = {
  version: "1.0.0-calculator-launch-monitoring-runbook",
  built_at: builtAt,
  public_exposure: "blocked by Worker /internal/ route",
  safety: {
    contains_sensitive_user_data: false,
    contains_real_fixture_values: false,
    contains_raw_formula_text: false,
    contains_internal_engine_outputs: false,
    public_results_enabled: false,
    intended_use: "Internal calculator launch monitoring runbook for n8n and CRM OS only."
  },
  n8n_workflow_contract: {
    schedule: "Poll after each calculator release build and after each official-source monitoring run.",
    allowed_public_fetches: [
      "/data/calculator-launch-monitoring.json",
      "/data/calculator-launch-guardrails.json",
      "/data/calculator-release-evidence-status.json",
      "/data/calculator-operations-status.json"
    ],
    do_not_fetch: [
      "/internal/calculator-launch-monitoring-runbook.json",
      "/internal/calculator-launch-guardrails-runbook.json",
      "/internal/calculator-release-evidence-index.json",
      "/internal/calculator-formula-map.json"
    ],
    crm_os_fields: {
      calculator_launch_monitoring_ready: "data.calculator-launch-monitoring.summary.launch_monitoring_ready",
      calculator_attention_signals: "data.calculator-launch-monitoring.summary.attention_signals",
      calculator_official_fallback_available: "data.calculator-launch-monitoring.summary.official_fallback_available",
      calculator_public_results_enabled: "data.calculator-launch-monitoring.summary.public_results_enabled"
    }
  },
  rollback_triggers: [
    "Public results enabled before final unlock.",
    "Official fallback unavailable.",
    "Release evidence or release packet becomes incomplete.",
    "Any monitored signal changes to attention after launch."
  ],
  monitored_signals: monitoredSignals.map((item) => ({
    key: item.key,
    status: item.status,
    public_results_enabled: false,
    route_to_review: item.status === "attention"
  }))
};

writeJSON("data/calculator-launch-monitoring.json", publicStatus);
writeJSON("internal/calculator-launch-monitoring-runbook.json", internalRunbook);
console.log(`Built calculator launch monitoring: ${healthySignals}/${monitoredSignals.length} healthy, public results locked.`);
