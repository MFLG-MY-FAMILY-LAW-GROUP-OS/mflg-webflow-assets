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

const reviewQueue = readJSON("data/form-review-queue.json");
const pdfAudit = readJSON("data/form-pdf-promotion-audit.json");
const jurisdiction = readJSON("data/jurisdiction-readiness.json");
const calculators = readJSON("data/calculator-readiness.json");
const actionPlan = readJSON("data/forms-tools-action-plan.json");
const downloadReadiness = fs.existsSync(path.join(root, "data/form-download-readiness.json"))
  ? readJSON("data/form-download-readiness.json")
  : null;
const calculatorsEnabled = Boolean(calculators.summary?.mflg_calculators_enabled_on_site);
const sameOriginPdfDeliveryEnabled = Boolean(downloadReadiness?.summary?.same_origin_pdf_delivery_enabled);

const items = [
  {
    item_id: "packet-pages-live",
    label: "Official packet pages",
    status: "public action available",
    count: reviewQueue.summary?.open_official_page_allowed || 0,
    guidance: "Reviewed representative packets route users to the on-page PDF viewer."
  },
  {
    item_id: "packet-candidates-review-only",
    label: "Packet candidates needing review",
    status: "review-only",
    count: reviewQueue.summary?.review_before_public_action || 0,
    guidance: "Candidate packet links stay out of public action until source fit and packet mapping are reviewed."
  },
  {
    item_id: "official-pdfs-live",
    label: "Approved official PDFs",
    status: sameOriginPdfDeliveryEnabled ? "viewer and download available" : "public on-page viewer action available",
    count: pdfAudit.summary?.public_manifest_actions || 0,
    guidance: sameOriginPdfDeliveryEnabled
      ? "Approved PDF actions open in the on-page viewer and download through approved same-origin court-source delivery. Cached copies remain disabled."
      : "Approved PDF actions open in the on-page viewer. Cached website downloads remain disabled."
  },
  {
    item_id: "county-source-only",
    label: "County sources without packet review",
    status: "guided review only",
    count: jurisdiction.summary?.county_source_only || 0,
    guidance: "Monitored county sources without packet-level review should use Guided Intake instead of sending visitors to an unreviewed packet path."
  },
  {
    item_id: "mflg-calculators-live",
    label: "MFLG calculators",
    status: calculatorsEnabled ? "on-site tools available" : "official fallback available",
    count: calculatorsEnabled ? 2 : 0,
    guidance: calculatorsEnabled
      ? "Child-support and spousal-maintenance calculators are available on this page for planning, with official-source fallback."
      : "Formula-sensitive calculations use official fallback sources until MFLG tools are enabled."
  }
];

const output = {
  version: "1.0.0-forms-tools-review-roadmap",
  built_at: new Date().toISOString(),
  source_manifests: [
    "data/form-review-queue.json",
    "data/form-pdf-promotion-audit.json",
    "data/jurisdiction-readiness.json",
    "data/calculator-readiness.json",
    "data/forms-tools-action-plan.json"
  ],
  public_safety: {
    contains_sensitive_user_data: false,
    safe_route_metadata_only: true,
    formula_logic_enabled_on_site: Boolean(calculators.summary?.formula_logic_enabled_on_site),
    official_api_runtime_enabled: Boolean(calculators.summary?.official_api_runtime_enabled),
    mflg_calculators_enabled_on_site: calculatorsEnabled,
    same_origin_pdf_delivery_enabled: sameOriginPdfDeliveryEnabled,
    public_downloads_enabled: false,
    direct_cached_downloads_enabled: false,
    sensitive_public_collection_enabled: false
  },
  summary: {
    public_packet_page_actions: reviewQueue.summary?.open_official_page_allowed || 0,
    packet_candidates_review_only: reviewQueue.summary?.review_before_public_action || 0,
    public_pdf_actions: pdfAudit.summary?.public_manifest_actions || 0,
    county_source_only: jurisdiction.summary?.county_source_only || 0,
    official_sources_ok: actionPlan.summary?.official_sources_ok || 0,
    formula_logic_enabled_on_site: Boolean(calculators.summary?.formula_logic_enabled_on_site),
    official_api_runtime_enabled: Boolean(calculators.summary?.official_api_runtime_enabled),
    mflg_calculators_enabled_on_site: calculatorsEnabled,
    same_origin_pdf_delivery_enabled: sameOriginPdfDeliveryEnabled,
    direct_cached_downloads_enabled: false
  },
  items,
  public_message: sameOriginPdfDeliveryEnabled
    ? "Approved PDFs open and download on site through approved court-source delivery. MFLG calculators are available on site. Review-only packet candidates, non-reviewed county packets, and cached copies remain controlled."
    : "Approved actions open in the on-page viewer. MFLG calculators are available on site. Review-only packet candidates, non-reviewed county packets, and cached downloads remain controlled."
};

writeJSON("data/forms-tools-review-roadmap.json", output);
console.log(`Built Forms & Tools review roadmap: ${output.summary.public_packet_page_actions} packet pages live, ${output.summary.packet_candidates_review_only} review-only candidates.`);
