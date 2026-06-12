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

const readiness = readJSON("data/calculator-formula-readiness.json");
const release = readJSON("data/calculator-release-readiness.json");
const evidence = readJSON("data/calculator-release-evidence-status.json");
const operations = readJSON("data/calculator-operations-status.json");
const unlock = readJSON("data/calculator-public-unlock-status.json");

const publicResultsEnabled = Boolean(readiness.summary?.public_results_enabled);
const officialFallbackAvailable = operations.summary?.next_public_status === "official_tools_remain_available";
const releasePacketComplete = Boolean(release.summary?.release_packet_complete);
const evidenceComplete = evidence.summary?.pending_evidence_items === 0 && evidence.summary?.evidence_items > 0;
const unlockReady = Boolean(unlock.summary?.public_unlock_ready);
const publicResultsAuthorized = !publicResultsEnabled || (releasePacketComplete && evidenceComplete && unlockReady);

const guardrails = [
  {
    key: "official_calculator_fallback",
    public_label: "Official calculators remain available",
    status: officialFallbackAvailable ? "pass" : "blocked",
    public_note: "Visitors keep access to official calculator sources while MFLG-branded results are locked."
  },
  {
    key: "public_results_authorized",
    public_label: "MFLG results authorized",
    status: publicResultsAuthorized ? "pass" : "blocked",
    public_note: "Local result output must stay off unless release evidence and final unlock are complete."
  },
  {
    key: "release_evidence_complete",
    public_label: "Release evidence complete",
    status: evidenceComplete ? "pass" : "blocked",
    public_note: "All required test and review evidence must be complete before launch."
  },
  {
    key: "release_packet_complete",
    public_label: "Release packet complete",
    status: releasePacketComplete ? "pass" : "blocked",
    public_note: "The release packet must be complete before MFLG-branded results can go live."
  },
  {
    key: "final_unlock_ready",
    public_label: "Final unlock approved",
    status: unlockReady ? "pass" : "blocked",
    public_note: "Final review must approve the public unlock before local results appear."
  }
];

const passingGuardrails = guardrails.filter((item) => item.status === "pass").length;
const blockedGuardrails = guardrails.length - passingGuardrails;
const launchReady = blockedGuardrails === 0;
const builtAt = new Date().toISOString();

const publicStatus = {
  version: "1.0.0-calculator-launch-guardrails",
  built_at: builtAt,
  public_safety: {
    internal_launch_runbook_exposed: false,
    sensitive_fixture_values_exposed: false,
    raw_formula_text_exposed: false,
    internal_engine_outputs_exposed: false,
    comparison_deltas_exposed: false,
    public_results_enabled: false,
    reviewer_approval_required: true
  },
  summary: {
    launch_guardrails_ready: true,
    guardrail_count: guardrails.length,
    passing_guardrails: passingGuardrails,
    blocked_guardrails: blockedGuardrails,
    official_fallback_available: officialFallbackAvailable,
    public_results_enabled: false,
    launch_ready: launchReady,
    next_public_status: operations.summary?.next_public_status || "official_tools_remain_available"
  },
  public_guardrails: guardrails,
  public_message: launchReady
    ? "Calculator launch guardrails are clear. MFLG calculator results remain off until the public runtime is separately enabled."
    : "MFLG-branded calculator results remain locked. Official calculator sources stay available until release evidence, packet review, and final unlock are complete."
};

const internalRunbook = {
  version: "1.0.0-calculator-launch-guardrails-runbook",
  built_at: builtAt,
  public_exposure: "blocked by Worker /internal/ route",
  safety: {
    contains_sensitive_user_data: false,
    contains_real_fixture_values: false,
    contains_raw_formula_text: false,
    contains_internal_engine_outputs: false,
    public_results_enabled: false,
    intended_use: "Internal calculator launch and rollback guardrails for n8n and CRM OS only."
  },
  n8n_workflow_contract: {
    schedule: "Poll before any calculator release toggle is changed.",
    allowed_public_fetches: [
      "/data/calculator-launch-guardrails.json",
      "/data/calculator-release-readiness.json",
      "/data/calculator-release-evidence-status.json",
      "/data/calculator-public-unlock-status.json"
    ],
    do_not_fetch: [
      "/internal/calculator-launch-guardrails-runbook.json",
      "/internal/calculator-release-evidence-index.json",
      "/internal/calculator-release-approval-packet.json",
      "/internal/calculator-formula-map.json"
    ],
    crm_os_fields: {
      calculator_launch_ready: "data.calculator-launch-guardrails.summary.launch_ready",
      calculator_blocked_guardrails: "data.calculator-launch-guardrails.summary.blocked_guardrails",
      calculator_official_fallback_available: "data.calculator-launch-guardrails.summary.official_fallback_available",
      calculator_public_results_enabled: "data.calculator-launch-guardrails.summary.public_results_enabled"
    }
  },
  rollback_policy: {
    public_results_enabled: false,
    fallback_path: "official_tools_remain_available",
    rollback_trigger: "Any failed release evidence item, failed final unlock, or source-monitoring concern keeps local results off."
  },
  guardrails: guardrails.map((item) => ({
    key: item.key,
    status: item.status,
    required_before_public_release: true,
    public_results_enabled: false
  }))
};

writeJSON("data/calculator-launch-guardrails.json", publicStatus);
writeJSON("internal/calculator-launch-guardrails-runbook.json", internalRunbook);
console.log(`Built calculator launch guardrails: ${passingGuardrails}/${guardrails.length} passing, public results locked.`);
