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

const sourceHealth = readJSON("data/source-health-public.json");
const sourceReport = readJSON("data/source-monitoring-report.json");
const actionPlan = readJSON("data/forms-tools-action-plan.json");
const reviewRoadmap = readJSON("data/forms-tools-review-roadmap.json");
const calculatorReadiness = readJSON("data/calculator-readiness.json");

const controls = [
  {
    control_id: "official-source-monitoring",
    label: "Official source monitoring",
    status: sourceHealth.summary?.broken ? "needs review" : "passing",
    detail: `${sourceHealth.summary?.ok || 0}/${sourceHealth.summary?.total || 0} official sources checked OK.`
  },
  {
    control_id: "fallback-rule",
    label: "Broken or changed source fallback",
    status: sourceReport.rules?.broken_or_changed_sources_fallback_to_official_page ? "enabled" : "needs review",
    detail: "If source status is uncertain, public actions should fall back to official court source pages."
  },
  {
    control_id: "download-control",
    label: "Approved PDF delivery control",
    status: reviewRoadmap.summary?.same_origin_pdf_delivery_enabled ? "enabled" : "disabled",
    detail: reviewRoadmap.summary?.same_origin_pdf_delivery_enabled
      ? "Reviewed PDFs can be viewed and downloaded on site through approved court-source delivery. Cached copies remain disabled."
      : "Public actions open official URLs. Website-hosted cached downloads remain disabled."
  },
  {
    control_id: "formula-control",
    label: "On-site calculator control",
    status: calculatorReadiness.summary?.mflg_calculators_enabled_on_site ? "enabled" : "fallback",
    detail: calculatorReadiness.summary?.mflg_calculators_enabled_on_site
      ? "MFLG child-support and maintenance calculators are enabled on site with official-source fallback."
      : "Calculator actions fall back to official sources until MFLG tools are enabled."
  },
  {
    control_id: "sensitive-data-control",
    label: "Sensitive data control",
    status: "enabled",
    detail: "Forms & Tools carries only starting-point selections and routes detailed facts to Guided Intake review."
  }
];

const output = {
  version: "1.0.0-forms-tools-maintenance-status",
  built_at: new Date().toISOString(),
  checked_at: sourceHealth.checked_at || sourceReport.checked_at || null,
  source_manifests: [
    "data/source-health-public.json",
    "data/source-monitoring-report.json",
    "data/forms-tools-action-plan.json",
    "data/forms-tools-review-roadmap.json",
    "data/calculator-readiness.json"
  ],
  public_safety: {
    contains_sensitive_user_data: false,
    safe_route_metadata_only: true,
    raw_hashes_exposed: false,
    raw_etags_exposed: false,
    formula_logic_enabled_on_site: Boolean(calculatorReadiness.summary?.formula_logic_enabled_on_site),
    official_api_runtime_enabled: Boolean(calculatorReadiness.summary?.official_api_runtime_enabled),
    mflg_calculators_enabled_on_site: Boolean(calculatorReadiness.summary?.mflg_calculators_enabled_on_site),
    same_origin_pdf_delivery_enabled: Boolean(reviewRoadmap.summary?.same_origin_pdf_delivery_enabled),
    direct_cached_downloads_enabled: false,
    sensitive_public_collection_enabled: false
  },
  summary: {
    official_sources_checked: sourceHealth.summary?.total || 0,
    official_sources_ok: sourceHealth.summary?.ok || 0,
    official_sources_broken: sourceHealth.summary?.broken || 0,
    reviewed_routes: actionPlan.summary?.reviewed_routes || 0,
    review_only_candidates: reviewRoadmap.summary?.packet_candidates_review_only || 0,
    formula_logic_enabled_on_site: Boolean(calculatorReadiness.summary?.formula_logic_enabled_on_site),
    official_api_runtime_enabled: Boolean(calculatorReadiness.summary?.official_api_runtime_enabled),
    mflg_calculators_enabled_on_site: Boolean(calculatorReadiness.summary?.mflg_calculators_enabled_on_site),
    same_origin_pdf_delivery_enabled: Boolean(reviewRoadmap.summary?.same_origin_pdf_delivery_enabled),
    direct_cached_downloads_enabled: false,
    controls_passing_or_disabled_safe: controls.filter((item) => ["passing", "enabled", "disabled", "fallback"].includes(item.status)).length
  },
  controls,
  public_message: "Forms & Tools is monitored for official-source health. MFLG calculators are available on site; cached downloads and unreviewed items remain controlled."
};

writeJSON("data/forms-tools-maintenance-status.json", output);
console.log(`Built Forms & Tools maintenance status: ${output.summary.official_sources_ok}/${output.summary.official_sources_checked} sources OK, ${output.controls.length} controls.`);
