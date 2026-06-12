#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

function readJSON(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function writeJSON(relativePath, value) {
  fs.writeFileSync(path.join(root, relativePath), `${JSON.stringify(value, null, 2)}\n`);
}

const calculatorCatalog = readJSON("data/calculators-catalog.json");
const sourceHealth = readJSON("data/source-health-public.json");
const sourceReport = readJSON("data/source-monitoring-report.json");
const runtimePublic = exists("data/calculator-runtime-public-status.json") ? readJSON("data/calculator-runtime-public-status.json") : null;
const childRuntimeEnabled = Boolean(runtimePublic?.summary?.child_support_runtime_enabled);
const maintenanceRuntimeEnabled = Boolean(runtimePublic?.summary?.spousal_maintenance_runtime_enabled);

const monitoredById = new Map(
  (sourceReport.results || [])
    .filter((item) => item.type === "calculator")
    .map((item) => [item.id, item])
);

const calculators = (calculatorCatalog.calculators || []).map((item) => {
  const monitored = monitoredById.get(item.calculator_id);
  const isOfficial = item.status === "official_link";
  const isSafePlanning = item.status === "internal_safe_tool";
  const isChildSupport = item.calculator_id === "az-child-support-official";
  const isMaintenance = item.calculator_id === "az-spousal-maintenance-official";
  const mflgEnabled = (isChildSupport && childRuntimeEnabled) || (isMaintenance && maintenanceRuntimeEnabled);
  return {
    calculator_id: item.calculator_id,
    label: item.label,
    jurisdiction: item.jurisdiction,
    source_authority: item.source_authority,
    official_url: item.official_url,
    embed_url: item.embed_url || null,
    fallback_url: item.fallback_url,
    status: item.status,
    public_status: mflgEnabled || isSafePlanning
      ? "Planning tool"
      : isOfficial ? "Official backup" : "Review required",
    source_monitor_status: monitored?.status || (isSafePlanning ? "not an official formula source" : "needs review"),
    checked_at: monitored?.checked_at || null,
    formula_logic_enabled_on_site: Boolean(isChildSupport && childRuntimeEnabled),
    official_api_runtime_enabled: Boolean(isMaintenance && maintenanceRuntimeEnabled),
    mflg_calculator_enabled_on_site: Boolean(mflgEnabled),
    official_embed_enabled: Boolean(item.embed_url),
    safe_public_inputs: mflgEnabled
      ? ["planning numbers only", "no names", "no case numbers", "no documents", "no allegations"]
      : isSafePlanning
      ? ["overnight count", "schedule assumptions", "notes kept out of public submission"]
      : ["none on this website before official calculator or Guided Intake"],
    public_guidance: mflgEnabled
      ? "Use the on-site calculator for planning, then confirm the result before filing, signing, or relying on it. Use Guided Intake when inputs or next steps are unclear."
      : isOfficial ? "Use the official fallback workspace, then Guided Intake when formula inputs or next steps are unclear."
      : "Use this only as a planning organizer. Do not enter child names, allegations, account numbers, or detailed financial records here.",
    intake_guidance: isOfficial
      ? "Carry only calculator type and source selection into Guided Intake. Detailed numbers should be reviewed only after conflict and scope review."
      : "Carry only that a planning tool was selected; sensitive schedule facts should be reviewed inside Guided Intake or office review."
  };
});

const officialCalculators = calculators.filter((item) => item.status === "official_link");
const safePlanningTools = calculators.filter((item) => item.status === "internal_safe_tool");
const monitoredOk = officialCalculators.filter((item) => item.source_monitor_status === "ok").length;

const output = {
  version: "1.0.0-calculator-readiness",
  built_at: new Date().toISOString(),
  checked_at: sourceHealth.checked_at || sourceReport.checked_at || null,
  source_manifests: [
    "data/calculators-catalog.json",
    "data/source-health-public.json",
    "data/source-monitoring-report.json"
  ],
  public_safety: {
    contains_sensitive_user_data: false,
    safe_route_metadata_only: true,
    formula_logic_enabled_on_site: childRuntimeEnabled,
    official_api_runtime_enabled: maintenanceRuntimeEnabled,
    mflg_calculators_enabled_on_site: childRuntimeEnabled && maintenanceRuntimeEnabled,
    official_embeds_enabled: true,
    direct_cached_downloads_enabled: false,
    sensitive_public_collection_enabled: false
  },
  summary: {
    calculators: calculators.length,
    official_formula_sources: officialCalculators.length,
    official_formula_sources_ok: monitoredOk,
    safe_planning_tools: safePlanningTools.length,
    formula_logic_enabled_on_site: childRuntimeEnabled,
    official_api_runtime_enabled: maintenanceRuntimeEnabled,
    mflg_calculators_enabled_on_site: childRuntimeEnabled && maintenanceRuntimeEnabled,
    child_support_runtime_enabled: childRuntimeEnabled,
    spousal_maintenance_runtime_enabled: maintenanceRuntimeEnabled,
    official_embeds_enabled: officialCalculators.every((item) => Boolean(item.embed_url)),
    direct_cached_downloads_enabled: false
  },
  calculators,
  public_message: childRuntimeEnabled && maintenanceRuntimeEnabled
    ? "Child-support and spousal-maintenance calculators are available on this page for planning. Official Arizona sources remain available as fallback."
    : "Official formula calculators load in the on-page fallback workspace until each MFLG calculator is reviewed and enabled."
};

writeJSON("data/calculator-readiness.json", output);
console.log(`Built calculator readiness: ${output.summary.calculators} calculators, ${output.summary.official_formula_sources_ok}/${output.summary.official_formula_sources} official sources OK.`);
