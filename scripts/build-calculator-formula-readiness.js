#!/usr/bin/env node
const fs = require("fs");
const https = require("https");
const path = require("path");

const root = path.resolve(__dirname, "..");

function readJSON(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function writeJSON(relativePath, value) {
  fs.writeFileSync(path.join(root, relativePath), `${JSON.stringify(value, null, 2)}\n`);
}

function request(url, method = "GET") {
  return new Promise((resolve) => {
    const req = https.request(url, {
      method,
      rejectUnauthorized: false,
      timeout: 15000,
      headers: {
        "user-agent": "MFLG source monitor"
      }
    }, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => resolve({
        ok: res.statusCode >= 200 && res.statusCode < 400,
        status: res.statusCode,
        headers: res.headers,
        body: Buffer.concat(chunks).toString("utf8")
      }));
    });
    req.on("error", (error) => resolve({ ok: false, status: 0, headers: {}, body: "", error: error.message }));
    req.on("timeout", () => {
      req.destroy();
      resolve({ ok: false, status: 0, headers: {}, body: "", error: "timeout" });
    });
    req.end();
  });
}

function extractSpousalVersions(html) {
  const versions = new Set();
  const effective = new Set();
  for (const match of html.matchAll(/version=([0-9.]+)/gi)) versions.add(match[1]);
  for (const match of html.matchAll(/Effective as of\s+([0-9/]+)/gi)) effective.add(match[1]);
  if (html.includes("CalculateSelfSufficiency")) versions.add("current");
  return {
    api_versions_detected: Array.from(versions),
    effective_dates_detected: Array.from(effective)
  };
}

async function main() {
const catalog = readJSON("data/calculators-catalog.json");
let sourceSummary = null;
try {
  sourceSummary = readJSON("data/calculator-formula-source-summary.json");
} catch (_) {
  sourceSummary = null;
}
let sourceSnapshot = null;
try {
  sourceSnapshot = readJSON("data/calculator-source-snapshot-status.json");
} catch (_) {
  sourceSnapshot = null;
}
let engineReadiness = null;
try {
  engineReadiness = readJSON("data/calculator-formula-engine-readiness.json");
} catch (_) {
  engineReadiness = null;
}
let regressionReadiness = null;
try {
  regressionReadiness = readJSON("data/calculator-regression-readiness.json");
} catch (_) {
  regressionReadiness = null;
}
let calculatorEngineReadiness = null;
try {
  calculatorEngineReadiness = readJSON("data/calculator-engine-readiness.json");
} catch (_) {
  calculatorEngineReadiness = null;
}
let fixtureTemplateReadiness = null;
try {
  fixtureTemplateReadiness = readJSON("data/calculator-fixture-template-readiness.json");
} catch (_) {
  fixtureTemplateReadiness = null;
}
let fixtureQaStatus = null;
try {
  fixtureQaStatus = readJSON("data/calculator-fixture-qa-status.json");
} catch (_) {
  fixtureQaStatus = null;
}
let approvedFixturesStatus = null;
try {
  approvedFixturesStatus = readJSON("data/calculator-approved-fixtures-status.json");
} catch (_) {
  approvedFixturesStatus = null;
}
let regressionComparisonStatus = null;
try {
  regressionComparisonStatus = readJSON("data/calculator-regression-comparison-status.json");
} catch (_) {
  regressionComparisonStatus = null;
}
let publicUnlockStatus = null;
try {
  publicUnlockStatus = readJSON("data/calculator-public-unlock-status.json");
} catch (_) {
  publicUnlockStatus = null;
}
let operationsStatus = null;
try {
  operationsStatus = readJSON("data/calculator-operations-status.json");
} catch (_) {
  operationsStatus = null;
}
let operationsAlerts = null;
try {
  operationsAlerts = readJSON("data/calculator-operations-alerts.json");
} catch (_) {
  operationsAlerts = null;
}
let releaseReadiness = null;
try {
  releaseReadiness = readJSON("data/calculator-release-readiness.json");
} catch (_) {
  releaseReadiness = null;
}
let releaseEvidence = null;
try {
  releaseEvidence = readJSON("data/calculator-release-evidence-status.json");
} catch (_) {
  releaseEvidence = null;
}
let launchGuardrails = null;
try {
  launchGuardrails = readJSON("data/calculator-launch-guardrails.json");
} catch (_) {
  launchGuardrails = null;
}
let launchMonitoring = null;
try {
  launchMonitoring = readJSON("data/calculator-launch-monitoring.json");
} catch (_) {
  launchMonitoring = null;
}
let promotionControl = null;
try {
  promotionControl = readJSON("data/calculator-promotion-control.json");
} catch (_) {
  promotionControl = null;
}
let promotionAudit = null;
try {
  promotionAudit = readJSON("data/calculator-promotion-audit.json");
} catch (_) {
  promotionAudit = null;
}
let unlockPhaseWorkflow = null;
try {
  unlockPhaseWorkflow = readJSON("data/calculator-unlock-phase-workflow.json");
} catch (_) {
  unlockPhaseWorkflow = null;
}
let fixtureEvidence = null;
try {
  fixtureEvidence = readJSON("data/calculator-fixture-evidence-status.json");
} catch (_) {
  fixtureEvidence = null;
}
let fixtureEvidenceValidation = null;
try {
  fixtureEvidenceValidation = readJSON("data/calculator-fixture-evidence-validation-status.json");
} catch (_) {
  fixtureEvidenceValidation = null;
}
let approvedFixturePromotion = null;
try {
  approvedFixturePromotion = readJSON("data/calculator-approved-fixture-promotion-status.json");
} catch (_) {
  approvedFixturePromotion = null;
}
let regressionEvidence = null;
try {
  regressionEvidence = readJSON("data/calculator-regression-evidence-status.json");
} catch (_) {
  regressionEvidence = null;
}
let engineRuntime = null;
try {
  engineRuntime = readJSON("data/calculator-engine-runtime-status.json");
} catch (_) {
  engineRuntime = null;
}
let runtimePublic = null;
try {
  runtimePublic = readJSON("data/calculator-runtime-public-status.json");
} catch (_) {
  runtimePublic = null;
}
let maintenanceRuntime = null;
try {
  maintenanceRuntime = readJSON("data/calculator-maintenance-runtime-status.json");
} catch (_) {
  maintenanceRuntime = null;
}
const calculators = catalog.calculators || [];
  const childSupport = calculators.find((item) => item.calculator_id === "az-child-support-official") || {};
  const maintenance = calculators.find((item) => item.calculator_id === "az-spousal-maintenance-official") || {};

  const childWorksheetUrl = "https://superiorcourt.maricopa.gov/media/pktkahu4/cs_calculator.xlsx";
  const childWorksheet = await request(childWorksheetUrl, "HEAD");
  const maintenancePage = await request(maintenance.embed_url || "https://www.superiorcourt.maricopa.gov/app/selfsuffcalc/");
  const maintenanceVersions = extractSpousalVersions(maintenancePage.body || "");

  const formulaSources = [
    {
      calculator_id: "az-child-support-official",
      public_name: "Arizona Child Support Calculator",
      branded_calculator_name: "MFLG Child Support Calculator",
      current_public_path: runtimePublic?.summary?.child_support_runtime_enabled
        ? "MFLG on-site child-support calculator"
        : "official fallback worksheet interview",
      local_formula_status: "official calculator available now",
      official_embed_enabled: Boolean(childSupport.embed_url),
      source_files: [
        {
          label: "Official calculator information page",
          source_url: childSupport.official_url,
          public_status: childSupport.official_url ? "monitored source" : "missing source"
        },
        {
          label: "Official Excel worksheet",
          source_url: childWorksheetUrl,
          public_status: childWorksheet.ok ? "source reachable" : "needs source review",
          content_type: childWorksheet.headers["content-type"] || "",
          last_modified: childWorksheet.headers["last-modified"] || null,
          content_length: childWorksheet.headers["content-length"] || null
        }
      ],
      implementation_requirements: [
        runtimePublic?.summary?.child_support_runtime_enabled
          ? "Use the on-site MFLG child-support calculator for planning after confirming the inputs are complete."
          : "Use the embedded official calculator for child-support numbers today.",
        runtimePublic?.summary?.child_support_runtime_enabled
          ? "Confirm any result before filing, signing, or relying on it."
          : "MFLG-branded child-support results will appear only after testing and approval.",
        "Use Intake when you are unsure which income, parenting-time, insurance, or childcare inputs apply."
      ],
      local_inputs_allowed_before_review: Boolean(runtimePublic?.summary?.child_support_runtime_enabled),
      public_result_enabled: Boolean(runtimePublic?.summary?.child_support_runtime_enabled)
    },
    {
      calculator_id: "az-spousal-maintenance-official",
      public_name: "Arizona Spousal Maintenance Calculator",
      branded_calculator_name: "MFLG Spousal Maintenance Calculator",
      current_public_path: runtimePublic?.summary?.spousal_maintenance_runtime_enabled
        ? "MFLG on-site maintenance calculator powered by official Arizona API"
        : "official fallback maintenance calculator",
      local_formula_status: "official calculator available now",
      official_embed_enabled: Boolean(maintenance.embed_url),
      source_files: [
        {
          label: "Official maintenance calculator page",
          source_url: maintenance.embed_url,
          public_status: maintenancePage.ok ? "source reachable" : "needs source review",
          current_api_detected: maintenanceVersions.api_versions_detected.includes("current"),
          api_versions_detected: maintenanceVersions.api_versions_detected,
          effective_dates_detected: maintenanceVersions.effective_dates_detected
        }
      ],
      implementation_requirements: [
        runtimePublic?.summary?.spousal_maintenance_runtime_enabled
          ? "Use the on-site MFLG spousal-maintenance calculator powered by the official Arizona maintenance API."
          : "Use the embedded official calculator for maintenance planning today.",
        runtimePublic?.summary?.spousal_maintenance_runtime_enabled
          ? "Confirm eligibility, dates, income, and court-source guidance before filing, signing, or relying on a result."
          : "MFLG-branded maintenance results will appear only after testing and approval.",
        "Use Intake when income, marriage dates, effective dates, or eligibility questions are unclear."
      ],
      local_inputs_allowed_before_review: Boolean(runtimePublic?.summary?.spousal_maintenance_runtime_enabled),
      public_result_enabled: Boolean(runtimePublic?.summary?.spousal_maintenance_runtime_enabled),
      official_api_runtime_enabled: Boolean(maintenanceRuntime?.summary?.maintenance_runtime_enabled)
    }
  ];

  const output = {
    version: "1.0.0-calculator-formula-readiness",
    built_at: new Date().toISOString(),
    source_manifests: [
      "data/calculators-catalog.json",
      "data/calculator-source-snapshot-status.json",
      "data/calculator-formula-source-summary.json",
      "data/calculator-formula-engine-readiness.json",
      "data/calculator-regression-readiness.json",
      "data/calculator-engine-readiness.json",
      "data/calculator-fixture-template-readiness.json",
      "data/calculator-approved-fixtures-status.json",
      "data/calculator-fixture-qa-status.json",
      "data/calculator-regression-comparison-status.json",
      "data/calculator-public-unlock-status.json",
      "data/calculator-operations-status.json",
      "data/calculator-operations-alerts.json",
      "data/calculator-release-readiness.json",
      "data/calculator-release-evidence-status.json",
      "data/calculator-launch-guardrails.json",
      "data/calculator-launch-monitoring.json",
      "data/calculator-promotion-control.json",
      "data/calculator-promotion-audit.json",
      "data/calculator-unlock-phase-workflow.json",
      "data/calculator-fixture-evidence-status.json",
      "data/calculator-fixture-evidence-validation-status.json",
      "data/calculator-approved-fixture-promotion-status.json",
      "data/calculator-regression-evidence-status.json",
      "data/calculator-engine-runtime-status.json",
      "data/calculator-runtime-public-status.json"
    ],
    public_safety: {
      contains_sensitive_user_data: false,
      raw_hashes_exposed: false,
      raw_etags_exposed: false,
      local_formula_logic_enabled: Boolean(runtimePublic?.summary?.child_support_runtime_enabled),
      local_formula_results_enabled: Boolean(runtimePublic?.summary?.child_support_runtime_enabled),
      official_api_runtime_enabled: Boolean(runtimePublic?.summary?.spousal_maintenance_runtime_enabled),
      official_embeds_remain_fallback: true,
      reviewer_approval_required: !runtimePublic?.summary?.child_support_runtime_enabled
    },
    summary: {
    formula_sources: formulaSources.length,
    official_embeds_enabled: formulaSources.every((item) => item.official_embed_enabled),
    source_snapshot_ready: Boolean(sourceSnapshot?.summary?.source_snapshot_ready),
    source_inventory_ready: sourceSummary?.summary ? true : false,
    child_support_formula_count: sourceSummary?.summary?.child_support_formula_count || 0,
    maintenance_candidate_input_count: sourceSummary?.summary?.maintenance_candidate_input_count || 0,
    child_support_formula_map_ready: Boolean(engineReadiness?.summary?.child_support_formula_map_ready),
    child_support_formula_cells_mapped: engineReadiness?.summary?.child_support_formula_cells_mapped || 0,
    local_formula_maps_ready: engineReadiness?.summary?.child_support_formula_map_ready ? 1 : 0,
    engine_scaffold_ready: Boolean(calculatorEngineReadiness?.summary?.engine_scaffold_ready),
    engine_required_output_checks: calculatorEngineReadiness?.summary?.required_output_checks || 0,
    engine_unsupported_excel_functions: calculatorEngineReadiness?.summary?.unsupported_excel_functions || 0,
    fixture_entry_template_ready: Boolean(fixtureTemplateReadiness?.summary?.fixture_entry_template_ready),
    fixture_templates_ready: fixtureTemplateReadiness?.summary?.fixture_templates || 0,
    fixture_output_fields_ready: fixtureTemplateReadiness?.summary?.required_output_fields || 0,
    approved_fixture_template_ready: Boolean(approvedFixturesStatus?.summary?.approved_fixture_template_ready),
    complete_approved_fixtures: approvedFixturesStatus?.summary?.complete_approved_fixtures || 0,
    fixture_qa_plan_ready: Boolean(fixtureQaStatus?.summary?.fixture_qa_plan_ready),
    pending_official_comparisons: fixtureQaStatus?.summary?.pending_official_comparisons || 0,
    regression_comparison_plan_ready: Boolean(regressionComparisonStatus?.summary?.comparison_plan_ready),
    complete_regression_comparisons: regressionComparisonStatus?.summary?.complete_comparisons || 0,
    regression_material_mismatches: regressionComparisonStatus?.summary?.material_mismatches || 0,
    public_unlock_gate_ready: Boolean(publicUnlockStatus?.summary?.public_unlock_gate_ready),
    public_unlock_passed_gates: publicUnlockStatus?.summary?.passed_gates || 0,
    public_unlock_blocked_gates: publicUnlockStatus?.summary?.blocked_gates || 0,
    operations_status_ready: Boolean(operationsStatus?.summary?.operations_status_ready),
    operations_alerts_ready: Boolean(operationsAlerts?.summary?.operations_alerts_ready),
    operations_blocking_alerts: operationsAlerts?.summary?.blocking_alerts || 0,
    release_readiness_ready: Boolean(releaseReadiness?.summary?.release_readiness_ready),
    release_packet_complete: Boolean(releaseReadiness?.summary?.release_packet_complete),
    release_blocked_gates: releaseReadiness?.summary?.blocked_gates || 0,
    release_evidence_status_ready: Boolean(releaseEvidence?.summary?.release_evidence_status_ready),
    release_evidence_items: releaseEvidence?.summary?.evidence_items || 0,
    release_evidence_pending_items: releaseEvidence?.summary?.pending_evidence_items || 0,
    launch_guardrails_ready: Boolean(launchGuardrails?.summary?.launch_guardrails_ready),
    launch_blocked_guardrails: launchGuardrails?.summary?.blocked_guardrails || 0,
    official_fallback_available: Boolean(launchGuardrails?.summary?.official_fallback_available),
    launch_monitoring_ready: Boolean(launchMonitoring?.summary?.launch_monitoring_ready),
    launch_attention_signals: launchMonitoring?.summary?.attention_signals || 0,
    promotion_control_ready: Boolean(promotionControl?.summary?.promotion_control_ready),
    blocked_promotion_checks: promotionControl?.summary?.blocked_promotion_checks || 0,
    promotion_allowed: Boolean(promotionControl?.summary?.promotion_allowed),
    promotion_audit_ready: Boolean(promotionAudit?.summary?.promotion_audit_ready),
    blocked_promotion_audit_items: promotionAudit?.summary?.blocked_audit_items || 0,
    unlock_phase_workflow_ready: Boolean(unlockPhaseWorkflow?.summary?.unlock_phase_workflow_ready),
    blocked_unlock_phases: unlockPhaseWorkflow?.summary?.blocked_unlock_phases || 0,
    fixture_evidence_entry_ready: Boolean(fixtureEvidence?.summary?.fixture_evidence_entry_ready),
    complete_fixture_evidence_packets: fixtureEvidence?.summary?.complete_evidence_packets || 0,
    pending_fixture_evidence_packets: fixtureEvidence?.summary?.pending_evidence_packets || 0,
    fixture_evidence_validation_ready: Boolean(fixtureEvidenceValidation?.summary?.fixture_evidence_validation_ready),
    validated_fixture_evidence_packets: fixtureEvidenceValidation?.summary?.validated_evidence_packets || 0,
    pending_fixture_evidence_validation: fixtureEvidenceValidation?.summary?.pending_evidence_validation || 0,
    approved_fixture_promotion_ready: Boolean(approvedFixturePromotion?.summary?.approved_fixture_promotion_ready),
    promoted_approved_fixtures: approvedFixturePromotion?.summary?.promoted_approved_fixtures || 0,
    pending_approved_fixture_promotions: approvedFixturePromotion?.summary?.pending_promotions || 0,
    regression_evidence_entry_ready: Boolean(regressionEvidence?.summary?.regression_evidence_entry_ready),
    complete_regression_evidence_items: regressionEvidence?.summary?.complete_regression_evidence || 0,
    pending_regression_evidence_items: regressionEvidence?.summary?.pending_regression_evidence || 0,
    engine_runtime_status_ready: Boolean(engineRuntime?.summary?.engine_runtime_status_ready),
    blocked_engine_runtime_checks: engineRuntime?.summary?.blocked_runtime_checks || 0,
    engine_runtime_ready: Boolean(engineRuntime?.summary?.runtime_ready),
    local_formula_engines_ready: runtimePublic?.summary?.child_support_runtime_enabled ? 1 : 0,
    child_support_runtime_enabled: Boolean(runtimePublic?.summary?.child_support_runtime_enabled),
    spousal_maintenance_runtime_enabled: Boolean(runtimePublic?.summary?.spousal_maintenance_runtime_enabled),
    spousal_maintenance_runtime_type: runtimePublic?.summary?.spousal_maintenance_runtime_type || "",
    runtime_fixture_comparisons: runtimePublic?.summary?.runtime_fixture_comparisons || 0,
    runtime_material_mismatches: runtimePublic?.summary?.runtime_material_mismatches || 0,
    maintenance_fixture_comparisons: runtimePublic?.summary?.maintenance_fixture_comparisons || 0,
    maintenance_material_mismatches: runtimePublic?.summary?.maintenance_material_mismatches || 0,
      regression_harness_ready: Boolean(regressionReadiness?.summary?.regression_harness_ready),
      regression_scenario_templates_ready: regressionReadiness?.summary?.scenario_templates_ready || 0,
      approved_regression_fixtures: regressionReadiness?.summary?.approved_regression_fixtures || 0,
      pending_official_output_fixtures: regressionReadiness?.summary?.pending_official_output_fixtures || 0,
      regression_tests_ready: regressionReadiness?.summary?.approved_regression_fixtures || 0,
      reviewer_approved_calculators: (runtimePublic?.summary?.child_support_runtime_enabled ? 1 : 0) + (runtimePublic?.summary?.spousal_maintenance_runtime_enabled ? 1 : 0),
      public_results_enabled: Boolean(runtimePublic?.summary?.child_support_runtime_enabled)
    },
    formula_sources: formulaSources,
    public_message: runtimePublic?.summary?.child_support_runtime_enabled
      ? `The MFLG child-support calculator is available on this page for planning.${runtimePublic?.summary?.spousal_maintenance_runtime_enabled ? " The MFLG spousal-maintenance calculator is also available here and powered by the official Arizona maintenance API." : ""} Official Arizona sources remain available for confirmation.`
      : "Official Arizona calculators remain available on this page. MFLG-branded results will appear only after testing and approval."
  };

  writeJSON("data/calculator-formula-readiness.json", output);
  console.log(`Built calculator formula readiness: ${formulaSources.length} formula sources, child-support runtime ${runtimePublic?.summary?.child_support_runtime_enabled ? "enabled" : "disabled"}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
