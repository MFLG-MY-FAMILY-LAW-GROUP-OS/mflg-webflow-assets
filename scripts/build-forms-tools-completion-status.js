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
const actionPlan = readJSON("data/forms-tools-action-plan.json");
const reviewRoadmap = readJSON("data/forms-tools-review-roadmap.json");
const maintenanceStatus = readJSON("data/forms-tools-maintenance-status.json");
const intakeReadiness = readJSON("data/forms-tools-intake-readiness.json");
const routeIntakeMap = readJSON("data/forms-tools-route-intake-map.json");
const matterCoverage = readJSON("data/forms-tools-matter-coverage.json");
const jurisdiction = readJSON("data/jurisdiction-readiness.json");
const calculators = readJSON("data/calculator-readiness.json");
const sourceHealth = readJSON("data/source-health-public.json");
const downloadReadiness = readJSON("data/form-download-readiness.json");
const calculatorsEnabled = Boolean(calculators.summary?.mflg_calculators_enabled_on_site);
const sameOriginPdfDeliveryEnabled = Boolean(downloadReadiness.summary?.same_origin_pdf_delivery_enabled);

const checks = [
  {
    check_id: "official-sources",
    label: "Official source monitoring",
    status: sourceHealth.summary?.broken ? "needs review" : "complete",
    detail: `${sourceHealth.summary?.ok || 0}/${sourceHealth.summary?.total || 0} official sources checked OK.`
  },
  {
    check_id: "public-matters",
    label: "50 matter coverage",
    status: matterCoverage.summary?.public_matters === 50 ? "complete" : "needs review",
    detail: `${matterCoverage.summary?.public_matters || 0} public matter issues mapped to official-source or Guided Intake starts.`
  },
  {
    check_id: "reviewed-routes",
    label: "Reviewed route starts",
    status: routeIntakeMap.summary?.reviewed_route_starts >= 7 ? "complete" : "needs review",
    detail: `${routeIntakeMap.summary?.reviewed_route_starts || 0} exact reviewed route starts available.`
  },
  {
    check_id: "official-actions",
    label: "Packet pages and approved PDFs",
    status: coverage.summary?.official_packet_page_actions >= 7 && coverage.summary?.approved_pdf_actions >= 40 ? "complete" : "needs review",
    detail: `${coverage.summary?.official_packet_page_actions || 0} packet pages and ${coverage.summary?.approved_pdf_actions || 0} approved official PDF links.`
  },
  {
    check_id: "calculator-controls",
    label: "Calculator safety",
    status: calculatorsEnabled ? "complete" : "needs review",
    detail: calculatorsEnabled
      ? "MFLG child-support and spousal-maintenance calculators are available on site with official-source fallback."
      : `${calculators.summary?.official_formula_sources_ok || 0}/${calculators.summary?.official_formula_sources || 0} official formula sources OK; MFLG calculators need review.`
  },
  {
    check_id: "public-safety",
    label: "Public safety controls",
    status: maintenanceStatus.summary?.controls_passing_or_disabled_safe >= 5 ? "complete" : "needs review",
    detail: sameOriginPdfDeliveryEnabled
      ? "Sensitive collection, raw hashes, and cached copies remain disabled publicly. Approved PDF delivery is enabled through reviewed action IDs."
      : "Sensitive collection, cached downloads, raw hashes, and unreviewed formula logic remain disabled publicly."
  }
];

const complete = checks.every((check) => check.status === "complete");

const output = {
  version: "1.0.0-forms-tools-completion-status",
  built_at: new Date().toISOString(),
  source_manifests: [
    "data/forms-tools-coverage.json",
    "data/forms-tools-action-plan.json",
    "data/forms-tools-review-roadmap.json",
    "data/forms-tools-maintenance-status.json",
    "data/forms-tools-intake-readiness.json",
    "data/forms-tools-route-intake-map.json",
    "data/forms-tools-matter-coverage.json",
    "data/jurisdiction-readiness.json",
    "data/calculator-readiness.json",
    "data/source-health-public.json"
  ],
  public_safety: {
    contains_sensitive_user_data: false,
    safe_route_metadata_only: true,
    forms_tools_public_surface_complete: complete,
    sensitive_public_collection_enabled: false,
    formula_logic_enabled_on_site: Boolean(calculators.summary?.formula_logic_enabled_on_site),
    official_api_runtime_enabled: Boolean(calculators.summary?.official_api_runtime_enabled),
    mflg_calculators_enabled_on_site: calculatorsEnabled,
    same_origin_pdf_delivery_enabled: sameOriginPdfDeliveryEnabled,
    direct_cached_downloads_enabled: false,
    raw_hashes_exposed: false,
    raw_etags_exposed: false
  },
  summary: {
    completion_checks: checks.length,
    completion_checks_passing: checks.filter((check) => check.status === "complete").length,
    forms_tools_public_surface_complete: complete,
    public_matters: matterCoverage.summary?.public_matters || 0,
    public_matter_categories: matterCoverage.summary?.categories || 0,
    reviewed_route_starts: routeIntakeMap.summary?.reviewed_route_starts || 0,
    safe_start_options: intakeReadiness.summary?.safe_start_options || 0,
    official_sources_ok: sourceHealth.summary?.ok || 0,
    official_sources_checked: sourceHealth.summary?.total || 0,
    official_packet_page_actions: coverage.summary?.official_packet_page_actions || 0,
    approved_pdf_actions: coverage.summary?.approved_pdf_actions || 0,
    same_origin_pdf_delivery_enabled: sameOriginPdfDeliveryEnabled,
    calculator_choices: calculators.summary?.calculators || 0,
    mflg_calculators_enabled_on_site: calculatorsEnabled,
    review_only_candidates_controlled: reviewRoadmap.summary?.packet_candidates_review_only || 0,
    action_plan_steps: Array.isArray(actionPlan.steps) ? actionPlan.steps.length : 0,
    direct_cached_downloads_enabled: false,
    sensitive_public_collection_enabled: false
  },
  checks,
  public_message: complete
    ? "Forms & Tools is complete as a safe public planning, on-site PDF delivery, on-site calculator, official-source routing, reviewed-route, and Guided Intake start system. Cached copies and sensitive fact collection remain controlled."
    : "Forms & Tools still has review items before the public surface should be treated as complete."
};

writeJSON("data/forms-tools-completion-status.json", output);
console.log(`Built Forms & Tools completion status: ${output.summary.completion_checks_passing}/${output.summary.completion_checks} checks passing.`);
