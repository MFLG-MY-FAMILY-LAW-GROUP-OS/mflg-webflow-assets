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

function compactRoute(route) {
  return {
    packet_id: route.packet_id,
    packet_label: route.packet_label,
    public_status: route.public_status,
    packet_pages: route.counts?.official_packet_pages || 0,
    approved_pdfs: route.counts?.official_pdfs || 0
  };
}

const actionPlan = readJSON("data/forms-tools-action-plan.json");
const reviewRoadmap = readJSON("data/forms-tools-review-roadmap.json");
const maintenanceStatus = readJSON("data/forms-tools-maintenance-status.json");
const jurisdictionReadiness = readJSON("data/jurisdiction-readiness.json");
const calculatorReadiness = readJSON("data/calculator-readiness.json");
const routeActions = readJSON("data/form-route-actions.json");
const packetPageActions = readJSON("data/form-packet-page-actions.json");
const pdfPublicActions = readJSON("data/form-pdf-public-actions.json");

const reviewedRoutes = (routeActions.routes || []).map(compactRoute);
const primaryRoutes = reviewedRoutes.slice(0, 6);
const officialJurisdictions = (jurisdictionReadiness.jurisdictions || []).slice(0, 4).map((item) => ({
  jurisdiction_id: item.jurisdiction_id,
  label: item.label,
  county: item.county,
  jurisdiction_type: item.jurisdiction_type,
  packet_review_status: item.packet_review_status,
  official_packet_page_actions: item.official_packet_page_actions || 0,
  approved_pdf_actions: item.approved_pdf_actions || 0
}));
const calculators = (calculatorReadiness.calculators || []).map((item) => ({
  calculator_id: item.calculator_id,
  label: item.label,
  status: item.status,
  public_status: item.public_status,
  formula_logic_enabled_on_site: Boolean(item.formula_logic_enabled_on_site),
  official_api_runtime_enabled: Boolean(item.official_api_runtime_enabled),
  mflg_calculator_enabled_on_site: Boolean(item.mflg_calculator_enabled_on_site)
}));

const options = [
  {
    option_id: "reviewed-route-start",
    label: "Reviewed form route",
    option_type: "route",
    count: routeActions.summary?.route_actions || reviewedRoutes.length,
    public_status: "Use a reviewed Forms & Tools route as the starting point.",
    intake_value: "Reviewed route selected"
  },
  {
    option_id: "county-source-start",
    label: "County source check",
    option_type: "jurisdiction",
    count: jurisdictionReadiness.summary?.official_jurisdictions || officialJurisdictions.length,
    public_status: "Carry only county/source status into Guided Intake.",
    intake_value: "County source selected"
  },
  {
    option_id: "calculator-start",
    label: "Calculator planning status",
    option_type: "calculator",
    count: calculatorReadiness.summary?.calculators || calculators.length,
    public_status: "Use the on-site calculator for planning, or carry only calculator interest into Guided Intake when inputs are unclear.",
    intake_value: "Calculator interest selected"
  },
  {
    option_id: "official-packet-start",
    label: "Official packet page",
    option_type: "packet_page",
    count: packetPageActions.summary?.official_packet_page_actions || 0,
    public_status: "Use an official packet-page source after public review.",
    intake_value: "Official packet page selected"
  },
  {
    option_id: "approved-pdf-start",
    label: "Approved official PDF",
    option_type: "official_pdf",
    count: pdfPublicActions.summary?.approved_official_pdf_actions || 0,
    public_status: "Use an approved official PDF link as a non-sensitive planning selection.",
    intake_value: "Approved official PDF selected"
  },
  {
    option_id: "source-health-start",
    label: "Source health reviewed",
    option_type: "maintenance",
    count: maintenanceStatus.summary?.official_sources_ok || 0,
    public_status: "Carry official-source monitoring status only.",
    intake_value: "Source health reviewed"
  }
];

const output = {
  version: "1.0.0-forms-tools-intake-readiness",
  built_at: new Date().toISOString(),
  source_manifests: [
    "data/forms-tools-action-plan.json",
    "data/forms-tools-review-roadmap.json",
    "data/forms-tools-maintenance-status.json",
    "data/jurisdiction-readiness.json",
    "data/calculator-readiness.json",
    "data/form-route-actions.json",
    "data/form-packet-page-actions.json",
    "data/form-pdf-public-actions.json"
  ],
  public_safety: {
    contains_sensitive_user_data: false,
    safe_route_metadata_only: true,
    sensitive_public_collection_enabled: false,
    formula_logic_enabled_on_site: Boolean(calculatorReadiness.summary?.formula_logic_enabled_on_site),
    official_api_runtime_enabled: Boolean(calculatorReadiness.summary?.official_api_runtime_enabled),
    mflg_calculators_enabled_on_site: Boolean(calculatorReadiness.summary?.mflg_calculators_enabled_on_site),
    direct_cached_downloads_enabled: false,
    raw_hashes_exposed: false,
    raw_etags_exposed: false
  },
  summary: {
    safe_start_options: options.length,
    reviewed_routes: actionPlan.summary?.reviewed_routes || routeActions.summary?.route_actions || 0,
    jurisdiction_source_options: jurisdictionReadiness.summary?.official_jurisdictions || 0,
    calculator_choices: calculatorReadiness.summary?.calculators || 0,
    official_packet_page_actions: packetPageActions.summary?.official_packet_page_actions || 0,
    approved_pdf_actions: pdfPublicActions.summary?.approved_official_pdf_actions || 0,
    official_sources_ok: maintenanceStatus.summary?.official_sources_ok || 0,
    official_sources_checked: maintenanceStatus.summary?.official_sources_checked || 0,
    action_plan_available: Boolean(actionPlan.version),
    review_roadmap_available: Boolean(reviewRoadmap.version),
    maintenance_status_available: Boolean(maintenanceStatus.version),
    formula_logic_enabled_on_site: Boolean(calculatorReadiness.summary?.formula_logic_enabled_on_site),
    official_api_runtime_enabled: Boolean(calculatorReadiness.summary?.official_api_runtime_enabled),
    mflg_calculators_enabled_on_site: Boolean(calculatorReadiness.summary?.mflg_calculators_enabled_on_site),
    direct_cached_downloads_enabled: false,
    sensitive_public_collection_enabled: false
  },
  options,
  reviewed_routes: primaryRoutes,
  official_jurisdictions: officialJurisdictions,
  calculators,
  public_message: "Start from a public selection, then move to Guided Intake with only the issue, county, packet, or calculator starting point needed to stay organized."
};

writeJSON("data/forms-tools-intake-readiness.json", output);
console.log(`Built Forms & Tools Intake readiness: ${output.summary.safe_start_options} start options, ${output.summary.reviewed_routes} reviewed routes.`);
