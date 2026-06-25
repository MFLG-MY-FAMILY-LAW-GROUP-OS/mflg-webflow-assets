#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

function readJSON(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function writeJSON(relativePath, value) {
  fs.writeFileSync(path.join(root, relativePath), `${JSON.stringify(value, null, 2)}\n`);
}

const coverage = readJSON("data/forms-tools-coverage.json");
const routeActions = readJSON("data/form-route-actions.json");
const jurisdiction = readJSON("data/jurisdiction-readiness.json");
const calculators = readJSON("data/calculator-readiness.json");
const downloadReadiness = fs.existsSync(path.join(root, "data/form-download-readiness.json"))
  ? readJSON("data/form-download-readiness.json")
  : null;
const calculatorsEnabled = Boolean(calculators.summary?.mflg_calculators_enabled_on_site);
const sameOriginPdfDeliveryEnabled = Boolean(downloadReadiness?.summary?.same_origin_pdf_delivery_enabled);

const steps = [
  {
    step_id: "choose-on-page-start",
    label: "Choose the on-page starting point",
    status: "ready",
    metric: `${jurisdiction.summary?.monitored_sources_ok || 0}/${jurisdiction.summary?.monitored_sources_total || 0} sources OK`,
    guidance: "Start with county and posture. If the county is uncertain, use the on-page statewide guidance first."
  },
  {
    step_id: "use-reviewed-route",
    label: "Use a reviewed route when available",
    status: "ready for reviewed Maricopa routes",
    metric: `${routeActions.summary?.route_actions || 0} reviewed routes`,
    guidance: "Reviewed routes open approved PDFs in the on-page viewer without collecting sensitive facts."
  },
  {
    step_id: "keep-other-counties-source-only",
    label: "Keep non-reviewed counties source-only",
    status: "source-only",
    metric: `${jurisdiction.summary?.county_source_only || 0} county sources only`,
    guidance: "For monitored counties without packet review, use Guided Intake instead of guessing."
  },
  {
    step_id: "use-official-calculators",
    label: "Use MFLG calculators on this page",
    status: calculatorsEnabled ? "on-site calculators available" : "official fallback available",
    metric: `${calculators.summary?.official_formula_sources_ok || 0}/${calculators.summary?.official_formula_sources || 0} formula sources OK`,
    guidance: calculatorsEnabled
      ? "Use the MFLG child-support and spousal-maintenance calculators on this page for planning. Official Arizona sources remain available as fallback."
      : "Use the official fallback workspace until each MFLG calculator is reviewed and enabled."
  },
  {
    step_id: "start-guarded-intake",
    label: "Start Guided Intake when facts matter",
    status: "recommended for fit review",
    metric: "starting choices only",
    guidance: "Carry only the source, county, issue, posture, packet, or calculator choice into Intake. Do not collect allegations, uploads, or detailed financial facts here."
  }
];

const output = {
  version: "1.0.0-forms-tools-action-plan",
  built_at: new Date().toISOString(),
  source_manifests: [
    "data/forms-tools-coverage.json",
    "data/form-route-actions.json",
    "data/jurisdiction-readiness.json",
    "data/calculator-readiness.json"
  ],
  public_safety: {
    contains_sensitive_user_data: false,
    safe_route_metadata_only: true,
    formula_logic_enabled_on_site: Boolean(calculators.summary?.formula_logic_enabled_on_site),
    official_api_runtime_enabled: Boolean(calculators.summary?.official_api_runtime_enabled),
    mflg_calculators_enabled_on_site: calculatorsEnabled,
    direct_cached_downloads_enabled: false,
    sensitive_public_collection_enabled: false
  },
  summary: {
    official_sources_ok: coverage.summary?.official_sources_ok || 0,
    official_sources_checked: coverage.summary?.official_sources_checked || 0,
    reviewed_routes: routeActions.summary?.route_actions || 0,
    approved_pdf_actions: routeActions.summary?.official_pdf_actions || 0,
    same_origin_pdf_delivery_enabled: sameOriginPdfDeliveryEnabled,
    official_formula_sources_ok: calculators.summary?.official_formula_sources_ok || 0,
    safe_planning_tools: calculators.summary?.safe_planning_tools || 0,
    official_embeds_enabled: calculators.summary?.official_embeds_enabled === true,
    formula_logic_enabled_on_site: Boolean(calculators.summary?.formula_logic_enabled_on_site),
    official_api_runtime_enabled: Boolean(calculators.summary?.official_api_runtime_enabled),
    mflg_calculators_enabled_on_site: calculatorsEnabled,
    direct_cached_downloads_enabled: false
  },
  steps,
  public_message: sameOriginPdfDeliveryEnabled
    ? "Use on-page reviewed forms and site PDF downloads first, reviewed Maricopa routes when available, MFLG calculators for planning, and Guided Intake when facts require review."
    : "Use on-page reviewed forms first, reviewed Maricopa routes when available, MFLG calculators for planning, and Guided Intake when facts require review."
};

writeJSON("data/forms-tools-action-plan.json", output);
console.log(`Built Forms & Tools action plan: ${output.steps.length} steps, ${output.summary.reviewed_routes} reviewed routes.`);
