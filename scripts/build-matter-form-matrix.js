#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readJSON(relativePath) {
  return JSON.parse(read(relativePath));
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
  const source = read("js/mflg-public-site.js");
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

function makeRecord(item, config) {
  const exactPackets = config.exact_packets || [];
  const relatedPackets = config.related_packets || [];
  const confidence = config.confidence || (exactPackets.length ? "county-exact" : relatedPackets.length ? "related-only" : "intake-required");
  return {
    matter_id: slugify(item.title),
    title: item.title,
    category: item.category,
    confidence,
    exact_packet_available: exactPackets.length > 0,
    direct_pdf_available: exactPackets.length > 0 && confidence !== "intake-required",
    county_controls_forms: config.county_controls_forms !== false,
    default_county: config.default_county || "Maricopa",
    children: config.children || "unknown",
    posture: config.posture || "unknown",
    exact_packets: exactPackets,
    related_packets: relatedPackets,
    official_source_url: config.official_source_url || "https://www.azcourts.gov/selfservicecenter/forms",
    official_source_label: config.official_source_label || "Arizona and county family-law forms",
    public_guidance: config.public_guidance || "Use the matched forms only after confirming county, case stage, and whether children are involved.",
    intake_fallback_required: confidence === "intake-required" || confidence === "related-only",
    safety_note: config.safety_note || "If this does not sound like your situation, use Guided Intake before choosing forms."
  };
}

const packet = (packet_id, label, route = {}) => ({
  packet_id,
  label,
  county: route.county || "Maricopa",
  issue: route.issue || "",
  posture: route.posture || "",
  children: route.children || "any"
});

const P = {
  divorceNoChildren: packet("maricopa-divorce-new-no-children", "Divorce or legal separation without minor children", { issue: "divorce", posture: "New filing", children: "no-minor-children" }),
  divorceWithChildren: packet("maricopa-divorce-new-with-children", "Divorce or legal separation with minor children", { issue: "divorce", posture: "New filing", children: "minor-children" }),
  response: packet("maricopa-response-family-court", "Response to served family-court papers", { issue: "response", posture: "Served / response" }),
  agreement: packet("maricopa-consent-decree-agreement", "Agreement, consent decree, and final orders", { issue: "agreement", posture: "Agreement / final orders" }),
  parenting: packet("maricopa-parenting-parentage-support", "Parenting, parentage, and support orders", { issue: "parenting", posture: "New filing", children: "minor-children" }),
  modification: packet("maricopa-modification-existing-order", "Modification of existing family-court orders", { issue: "modification", posture: "Existing order" }),
  enforcement: packet("maricopa-enforcement-existing-order", "Enforcement or contempt for existing orders", { issue: "enforcement", posture: "Existing order" }),
  disclosure: packet("maricopa-disclosure-and-hearing-readiness", "Disclosure, exhibit, and hearing readiness", { issue: "disclosure", posture: "Hearing / disclosure" }),
  nameAddress: packet("maricopa-name-address-update", "Name or address update in a court record", { issue: "name or address update", posture: "Existing order" }),
  foreignSupport: packet("maricopa-foreign-support-order", "Register or enforce foreign support order", { issue: "child support", posture: "Existing order", children: "minor-children" }),
  foreignCustody: packet("maricopa-foreign-custody-order", "Register foreign custody or UCCJEA order", { issue: "parenting", posture: "Existing order", children: "minor-children" }),
  foreignHearing: packet("maricopa-foreign-order-hearing", "Hearing request for registered foreign order", { issue: "foreign order", posture: "Existing order" }),
  withholding: packet("maricopa-income-withholding-order", "Income withholding order", { issue: "child support", posture: "Existing order" }),
  propertyEnforcement: packet("maricopa-property-division-enforcement", "Enforce property division order", { issue: "property", posture: "Existing order" }),
  outOfStateCustodyEnforcement: packet("maricopa-out-of-state-custody-enforcement", "Enforce out-of-state physical custody order", { issue: "parenting", posture: "Existing order", children: "minor-children" }),
  postDecreeTemporary: packet("maricopa-post-decree-temporary-orders", "Post-decree temporary orders", { issue: "modification", posture: "Existing order" }),
  protective: packet("maricopa-protective-order-resources", "Protective order and safety resources", { issue: "safety", posture: "Safety" }),
  adultNameNoChild: packet("maricopa-name-change-adult-no-minor-children", "Adult name change, no minor children", { issue: "name change", posture: "New filing", children: "no-minor-children" }),
  adultNameWithChild: packet("maricopa-name-change-adult-with-minor-child", "Adult name change, adult has minor child", { issue: "name change", posture: "New filing", children: "minor-children" }),
  minorName: packet("maricopa-name-change-minor-child", "Minor child name change", { issue: "name change", posture: "New filing", children: "minor-children" }),
  familyName: packet("maricopa-name-change-family", "Family name change", { issue: "name change", posture: "New filing", children: "minor-children" })
};

function configFor(item) {
  const title = item.title.toLowerCase();
  const category = item.category.toLowerCase();
  const standard = (...exact_packets) => ({ confidence: "county-exact", exact_packets });
  const relatedOnly = (guidance, ...related_packets) => ({ confidence: "related-only", related_packets, public_guidance: guidance });
  const intakeRequired = (guidance, sourceUrl, ...related_packets) => ({
    confidence: "intake-required",
    related_packets,
    official_source_url: sourceUrl || "https://www.azcourts.gov/selfservicecenter/forms",
    public_guidance: guidance
  });

  if (title.includes("annulment")) {
    return intakeRequired(
      "Annulment has its own official packet path. Confirm county and annulment facts before using divorce or separation forms.",
      "https://superiorcourt.maricopa.gov/llrc/fc_group_28/",
      P.divorceNoChildren
    );
  }
  if (title.includes("relocation")) {
    return intakeRequired(
      "Relocation depends on existing orders, distance, timing, and the A.R.S. 25-408 notice rules. Do not guess from a generic parenting packet.",
      "https://www.azleg.gov/ars/25/00408.htm",
      P.parenting,
      P.modification
    );
  }
  if (title.includes("name change")) return standard(P.adultNameNoChild, P.adultNameWithChild, P.minorName, P.familyName, P.nameAddress);
  if (title.includes("divorce") || title.includes("dissolution") || title.includes("legal separation")) return standard(P.divorceNoChildren, P.divorceWithChildren, P.agreement);
  if (title.includes("consent") || title.includes("settlement") || title.includes("agreement")) return standard(P.agreement, P.divorceNoChildren, P.divorceWithChildren);
  if (title.includes("temporary orders")) return standard(P.postDecreeTemporary, P.disclosure);
  if (title.includes("property") || title.includes("debt") || title.includes("real estate") || title.includes("home")) return standard(P.agreement, P.propertyEnforcement);
  if (title.includes("uccjea") || title.includes("interstate")) return standard(P.foreignCustody, P.outOfStateCustodyEnforcement, P.foreignHearing);
  if (title.includes("grandparent") || title.includes("third-party")) return relatedOnly("Grandparent and third-party rights can require specialized pleadings. Use parenting forms only after confirming the correct posture.", P.parenting, P.modification);
  if (title.includes("withheld") || title.includes("missed time")) return standard(P.enforcement, P.modification, P.parenting);
  if (category.includes("parenting") || title.includes("legal decision") || title.includes("parenting plan")) return standard(P.parenting, P.modification, P.enforcement);
  if (category.includes("child support") || title.includes("child support") || title.includes("support worksheet") || title.includes("arrears")) return standard(P.parenting, P.foreignSupport, P.withholding, P.enforcement);
  if (category.includes("maintenance") || title.includes("spousal")) return standard(P.divorceNoChildren, P.divorceWithChildren, P.agreement, P.modification, P.enforcement);
  if (category.includes("parentage") || title.includes("paternity") || title.includes("parentage") || title.includes("dna") || title.includes("birth certificate") || title.includes("same-sex")) return standard(P.parenting);
  if (title.includes("modification")) return standard(P.modification, P.postDecreeTemporary);
  if (title.includes("enforcement") || title.includes("contempt")) return standard(P.enforcement, P.propertyEnforcement, P.outOfStateCustodyEnforcement);
  if (title.includes("protective") || category.includes("safety")) return { confidence: "statewide-generic", exact_packets: [P.protective], default_county: "Statewide", county_controls_forms: false, official_source_url: "https://azpoint.azcourts.gov/", public_guidance: "Protective orders should start through the official AZPOINT safety path." };
  if (title.includes("mediation") || title.includes("negotiation") || title.includes("conference") || category.includes("resolution")) return standard(P.agreement, P.disclosure);
  if (category.includes("documents") || title.includes("document")) return standard(P.divorceNoChildren, P.divorceWithChildren, P.parenting, P.agreement, P.disclosure);
  if (title.includes("petition") || title.includes("new filing")) return standard(P.divorceNoChildren, P.divorceWithChildren, P.parenting);
  if (title.includes("response") || title.includes("served")) return standard(P.response);
  if (title.includes("filing") || title.includes("service")) return standard(P.response, P.divorceNoChildren, P.divorceWithChildren, P.parenting);
  if (title.includes("hearing") || title.includes("court appearance")) return standard(P.disclosure, P.postDecreeTemporary);
  if (title.includes("financial") || title.includes("exhibit")) return standard(P.disclosure, P.agreement);
  if (title.includes("adoption") || title.includes("scope") || title.includes("referral")) return intakeRequired("This issue can fall outside standard public family-law packets. Use Guided Intake before choosing forms.", "https://www.azcourts.gov/selfservicecenter/forms");
  if (title.includes("not sure")) return { confidence: "statewide-generic", exact_packets: [P.divorceNoChildren, P.divorceWithChildren, P.parenting, P.response], public_guidance: "Use this as a starting point only. Guided Intake is the safest path if the issue is unclear." };
  return intakeRequired("Use Guided Intake before choosing forms for this issue.", "https://www.azcourts.gov/selfservicecenter/forms");
}

const serviceItems = extractServiceItems();
const publicActions = readJSON("data/form-pdf-public-actions.json");
const actionPacketIds = new Set((publicActions.actions || []).map((action) => action.packet_id).filter(Boolean));
const records = serviceItems.map((item) => {
  const record = makeRecord(item, configFor(item));
  record.exact_packets = record.exact_packets.map((entry) => ({
    ...entry,
    has_approved_pdf_actions: actionPacketIds.has(entry.packet_id)
  }));
  record.related_packets = record.related_packets.map((entry) => ({
    ...entry,
    has_approved_pdf_actions: actionPacketIds.has(entry.packet_id)
  }));
  record.direct_pdf_available = record.exact_packets.some((entry) => entry.has_approved_pdf_actions) && record.confidence !== "intake-required";
  return record;
});

const byConfidence = records.reduce((acc, record) => {
  acc[record.confidence] = (acc[record.confidence] || 0) + 1;
  return acc;
}, {});

const output = {
  version: "1.0.0-matter-form-matrix",
  built_at: new Date().toISOString(),
  source_manifests: [
    "js/mflg-public-site.js",
    "data/form-pdf-public-actions.json",
    "data/form-packet-catalog.json"
  ],
  public_safety: {
    contains_sensitive_user_data: false,
    exactness_audit_only: true,
    county_specific_warning_enabled: true,
    no_unverified_exact_claims: true
  },
  summary: {
    matters: records.length,
    exact_or_county_exact: records.filter((record) => record.confidence === "exact" || record.confidence === "county-exact").length,
    statewide_generic: records.filter((record) => record.confidence === "statewide-generic").length,
    related_only: records.filter((record) => record.confidence === "related-only").length,
    intake_required: records.filter((record) => record.confidence === "intake-required").length,
    direct_pdf_available: records.filter((record) => record.direct_pdf_available).length,
    confidence_counts: byConfidence
  },
  records
};

writeJSON("data/matter-form-matrix.json", output);
console.log(`Built matter form matrix: ${records.length} matters, ${output.summary.exact_or_county_exact} exact/county-exact, ${output.summary.intake_required} intake-required.`);
