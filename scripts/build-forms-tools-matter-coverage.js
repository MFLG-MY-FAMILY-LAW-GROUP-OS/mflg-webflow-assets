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

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function extractServiceItems() {
  const source = fs.readFileSync(path.join(root, "js/mflg-public-site.js"), "utf8");
  const start = source.indexOf("const serviceItems = [");
  const end = source.indexOf("];", start);
  if (start === -1 || end === -1) return [];
  const block = source.slice(start, end);
  const items = [];
  const itemPattern = /\{\s*icon:\s*"[^"]*",\s*category:\s*"([^"]+)",\s*title:\s*"([^"]+)",\s*copy:\s*"([^"]*)"\s*\}/g;
  let match;
  while ((match = itemPattern.exec(block))) {
    items.push({ category: match[1], title: match[2], copy: match[3] });
  }
  return items;
}

const routeMap = readJSON("data/forms-tools-route-intake-map.json");
const jurisdiction = readJSON("data/jurisdiction-readiness.json");
const calculators = readJSON("data/calculator-readiness.json");
const reviewRoadmap = readJSON("data/forms-tools-review-roadmap.json");
const matterFormMatrix = readJSON("data/matter-form-matrix.json");
const matrixByMatterId = new Map((matterFormMatrix.records || []).map((record) => [record.matter_id, record]));

const reviewedCategoryFit = new Set([
  "Marriage",
  "Agreements",
  "Parenting",
  "Child support",
  "Parentage",
  "Post-decree",
  "Court requests",
  "Court",
  "Disclosure",
  "Documents",
  "Resolution",
  "Property",
  "Identity",
  "Jurisdiction",
  "Maintenance",
  "Safety"
]);

const officialSourceByCategory = new Map([
  ["Safety", { label: "AZPOINT protective order resources", url: "https://azpoint.azcourts.gov/" }],
  ["Scope review", { label: "Guided Intake scope review", url: "/start" }],
  ["Triage", { label: "Guided Intake triage", url: "/start" }],
  ["Jurisdiction", { label: "Arizona family-law source routing", url: "https://www.azcourts.gov/familylaw/Family-Law-Forms" }]
]);

const defaultSource = {
  label: "Arizona and county family-law forms",
  url: "https://www.azcourts.gov/selfservicecenter/forms"
};

const matters = extractServiceItems().map((item) => {
  const matterId = slugify(item.title);
  const formMatrix = matrixByMatterId.get(matterId);
  const source = officialSourceByCategory.get(item.category) || defaultSource;
  const isReviewed = reviewedCategoryFit.has(item.category);
  const hasDirectPdf = Boolean(formMatrix?.direct_pdf_available);
  const needsScope = item.category === "Scope review" || item.category === "Safety" || item.category === "Jurisdiction" || item.category === "Triage";
  const matrixStatus = formMatrix?.confidence === "intake-required"
    ? "intake-required-before-forms"
    : formMatrix?.confidence === "related-only"
      ? "related-forms-only"
      : formMatrix?.confidence === "statewide-generic"
        ? "statewide-source-first"
        : "";
  const status = matrixStatus || (isReviewed
    ? "reviewed-route-or-official-source"
    : needsScope ? "guided-intake-or-official-source" : "official-source-first");
  return {
    matter_id: matterId,
    title: item.title,
    category: item.category,
    public_status: status,
    form_confidence: formMatrix?.confidence || "unknown",
    exact_packet_available: Boolean(formMatrix?.exact_packet_available),
    county_controls_forms: formMatrix?.county_controls_forms !== false,
    default_county: formMatrix?.default_county || "Maricopa",
    exact_packets: formMatrix?.exact_packets || [],
    related_packets: formMatrix?.related_packets || [],
    public_guidance: formMatrix?.public_guidance || "Use the matched forms only after confirming county, case stage, and whether children are involved.",
    official_source_label: formMatrix?.official_source_label || source.label,
    official_source_url: formMatrix?.official_source_url || source.url,
    reviewed_route_available: isReviewed,
    direct_pdf_available: hasDirectPdf,
    guided_intake_available: true,
    safe_intake_payload: {
      matterTitle: item.title,
      matterCategory: item.category,
      sourceType: "Forms & Tools matter coverage / public planning"
    }
  };
});

const categories = Array.from(new Set(matters.map((matter) => matter.category))).sort().map((category) => {
  const categoryMatters = matters.filter((matter) => matter.category === category);
  return {
    category,
    matters: categoryMatters.length,
    reviewed_route_available: categoryMatters.filter((matter) => matter.reviewed_route_available).length,
    guided_intake_available: categoryMatters.length
  };
});

const output = {
  version: "1.0.0-forms-tools-matter-coverage",
  built_at: new Date().toISOString(),
  source_manifests: [
    "js/mflg-public-site.js",
    "data/forms-tools-route-intake-map.json",
    "data/jurisdiction-readiness.json",
    "data/calculator-readiness.json",
    "data/forms-tools-review-roadmap.json",
    "data/matter-form-matrix.json"
  ],
  public_safety: {
    contains_sensitive_user_data: false,
    safe_route_metadata_only: true,
    all_public_matters_accounted_for: matters.length === 50,
    sensitive_public_collection_enabled: false,
    formula_logic_enabled_on_site: false,
    direct_cached_downloads_enabled: false
  },
  summary: {
    public_matters: matters.length,
    categories: categories.length,
    matters_with_reviewed_route_or_source: matters.length,
    matters_with_guided_intake_start: matters.length,
    matters_with_reviewed_route_fit: matters.filter((matter) => matter.reviewed_route_available).length,
    matters_with_direct_pdf_fit: matters.filter((matter) => matter.direct_pdf_available).length,
    matters_with_exact_packet: matters.filter((matter) => matter.exact_packet_available).length,
    matters_requiring_intake_before_forms: matters.filter((matter) => matter.form_confidence === "intake-required").length,
    matters_with_related_forms_only: matters.filter((matter) => matter.form_confidence === "related-only").length,
    reviewed_route_starts: routeMap.summary?.reviewed_route_starts || 0,
    approved_pdf_actions: routeMap.summary?.approved_pdf_actions || 0,
    pdf_route_packets: routeMap.summary?.routes_with_approved_pdfs || 0,
    official_sources_ok: jurisdiction.summary?.monitored_sources_ok || 0,
    official_sources_checked: jurisdiction.summary?.monitored_sources_total || 0,
    calculator_choices: calculators.summary?.calculators || 0,
    review_only_candidates: reviewRoadmap.summary?.packet_candidates_review_only || 0,
    direct_cached_downloads_enabled: false,
    sensitive_public_collection_enabled: false
  },
  categories,
  matters,
  public_message: "All 50 public matter issues are represented, but exact form status now depends on county, case stage, children, and packet confidence."
};

writeJSON("data/forms-tools-matter-coverage.json", output);
console.log(`Built Forms & Tools matter coverage: ${output.summary.public_matters} matters across ${output.summary.categories} categories.`);
