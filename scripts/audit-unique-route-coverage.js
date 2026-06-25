const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const readJSON = (file) => JSON.parse(fs.readFileSync(path.join(ROOT, file), "utf8"));
const writeJSON = (file, value) => {
  fs.mkdirSync(path.dirname(path.join(ROOT, file)), { recursive: true });
  fs.writeFileSync(path.join(ROOT, file), `${JSON.stringify(value, null, 2)}\n`);
};

const routeMap = readJSON("data/forms-tools-route-intake-map.json");
const routeIndex = readJSON("data/form-pdf-route-index.json");
const pdfActions = readJSON("data/form-pdf-public-actions.json");
const matterCoverage = readJSON("data/forms-tools-matter-coverage.json");

const officialHostPatterns = [
  /\.azcourts\.gov$/i,
  /\.maricopa\.gov$/i,
  /superiorcourt\.maricopa\.gov$/i,
  /www\.sc\.pima\.gov$/i,
  /www\.pima\.gov$/i,
  /www\.yavapaiaz\.gov$/i,
  /courts\.yavapaiaz\.gov$/i,
  /www\.cochise\.az\.gov$/i
];

function officialUrl(url) {
  if (!url) return false;
  try {
    const host = new URL(url).hostname;
    return officialHostPatterns.some((pattern) => pattern.test(host));
  } catch (_) {
    return false;
  }
}

function routeKey(route = {}, packetId = "") {
  return [
    packetId || "no-packet",
    route.county || "Not sure",
    route.issue || "Choose issue",
    route.posture || "Choose stage",
    route.children || "Choose one",
    route.agreement || "not-applicable",
    route.existingOrder || "not-applicable",
    route.timing || "not-applicable",
    route.safety || "not-applicable",
    route.language || "English"
  ].join(" | ");
}

function classificationFor(item) {
  const county = item.route?.county || "Not sure";
  const hasDirectPdfs = Number(item.approved_pdfs || 0) > 0;
  const hasPacketPage = Number(item.official_packet_pages || 0) > 0;
  if (county === "Statewide") {
    return hasDirectPdfs ? "verified-statewide-direct-packet" : "verified-statewide-packet-page";
  }
  if (hasDirectPdfs) return "exact-county-direct-packet";
  if (hasPacketPage) return "exact-county-packet-page";
  return "no-verified-form";
}

function publicExplanationFor(record) {
  const county = record.county;
  if (record.classification === "exact-county-direct-packet") return `Matched direct forms for ${county} County.`;
  if (record.classification === "exact-county-packet-page") return `Official ${county} County packet page for this route.`;
  if (record.classification === "verified-statewide-direct-packet") return "Arizona statewide direct forms verified for this route.";
  if (record.classification === "verified-statewide-packet-page") return "Arizona statewide packet page verified for this route.";
  if (record.classification === "issue-specific-county-source-page") return `Official ${county} County source page specific to this issue.`;
  if (record.classification === "general-county-forms-index") return "General county forms directory only; not counted as issue-specific matched forms.";
  return "No verified form packet is currently available for these answers.";
}

const packetById = new Map((routeIndex.packets || []).map((packet) => [packet.packet_id, packet]));
const actionByPacket = new Map();
for (const action of pdfActions.actions || []) {
  if (!actionByPacket.has(action.packet_id)) actionByPacket.set(action.packet_id, []);
  actionByPacket.get(action.packet_id).push(action);
}

const seen = new Set();
const records = [];
for (const item of routeMap.routes || []) {
  const packet = packetById.get(item.packet_id) || {};
  const actions = actionByPacket.get(item.packet_id) || [];
  const route = item.route || {};
  const key = routeKey(route, item.packet_id || "");
  if (seen.has(key)) continue;
  seen.add(key);
  const sourceUrl = item.primary_official_packet_page_url || actions[0]?.official_pdf_url || "";
  const record = {
    route_key: key,
    packet_id: item.packet_id || "",
    public_packet_title: item.packet_label || packet.packet_label || item.packet_id || "Not selected",
    county: route.county || "Not sure",
    issue: route.issue || "Choose issue",
    posture: route.posture || "Choose stage",
    children: route.children || "Choose one",
    language: (item.languages || packet.languages || ["English"])[0] || "English",
    classification: classificationFor(item),
    source_type: Number(item.approved_pdfs || 0) > 0 ? "direct-pdf" : Number(item.official_packet_pages || 0) > 0 ? "packet-page" : "none",
    packet_source_county: route.county === "Statewide" ? "Statewide" : route.county || "Not sure",
    verified_pdf_count: Number(item.approved_pdfs || 0),
    official_packet_pages: Number(item.official_packet_pages || 0),
    official_url: sourceUrl,
    official_source_ok: officialUrl(sourceUrl),
    same_site_public_action: actions[0]?.site_pdf_view_url || "",
    result_confidence: classificationFor(item),
    public_explanation: ""
  };
  record.public_explanation = publicExplanationFor(record);
  records.push(record);
}

const generalIndexMatters = [];
for (const matter of matterCoverage.matters || []) {
  const sourceUrl = matter.official_source_url || "";
  const isGeneralIndex = /azcourts\.gov\/selfservicecenter\/forms\/?$/i.test(sourceUrl);
  if (isGeneralIndex) {
    generalIndexMatters.push({
      matter_id: matter.matter_id,
      title: matter.title,
      classification: "general-county-forms-index",
      official_url: sourceUrl,
      public_explanation: "General statewide/county forms directory only; this is not issue-specific coverage."
    });
  }
}

const classificationCounts = records.reduce((acc, record) => {
  acc[record.classification] = (acc[record.classification] || 0) + 1;
  return acc;
}, {});

const countsByCounty = records.reduce((acc, record) => {
  acc[record.county] = (acc[record.county] || 0) + 1;
  return acc;
}, {});

const countsByIssue = records.reduce((acc, record) => {
  acc[record.issue] = (acc[record.issue] || 0) + 1;
  return acc;
}, {});

const countsByPostureChildren = records.reduce((acc, record) => {
  const key = `${record.posture} | ${record.children}`;
  acc[key] = (acc[key] || 0) + 1;
  return acc;
}, {});

const invalid = [];
for (const record of records) {
  if (!record.official_source_ok) invalid.push(`${record.packet_id}: unofficial source ${record.official_url}`);
  if (record.classification.startsWith("exact-county") && record.county === "Statewide") invalid.push(`${record.packet_id}: exact county route is statewide`);
  if (record.classification === "general-county-forms-index") invalid.push(`${record.packet_id}: general index cannot be route coverage`);
  if (record.county !== "Maricopa" && /^maricopa-/.test(record.packet_id) && record.classification.startsWith("exact-county")) {
    invalid.push(`${record.packet_id}: Maricopa packet counted for ${record.county}`);
  }
}

const output = {
  version: "1.0.0-unique-route-coverage",
  built_at: new Date().toISOString(),
  source_manifests: [
    "data/forms-tools-route-intake-map.json",
    "data/form-pdf-route-index.json",
    "data/form-pdf-public-actions.json",
    "data/forms-tools-matter-coverage.json"
  ],
  summary: {
    unique_route_combinations: records.length,
    classification_counts: classificationCounts,
    counts_by_county: countsByCounty,
    counts_by_issue: countsByIssue,
    counts_by_posture_children: countsByPostureChildren,
    general_index_matters: generalIndexMatters.length,
    rejected_or_downgraded_source_pages: generalIndexMatters.length,
    invalid_records: invalid.length
  },
  records,
  general_index_matters: generalIndexMatters,
  invalid
};

writeJSON("data/unique-route-coverage-audit.json", output);

if (records.length !== 27) throw new Error(`Expected 27 unique reviewed routes, got ${records.length}`);
if (invalid.length) throw new Error(`Unique coverage audit found invalid records:\n${invalid.join("\n")}`);
if ((classificationCounts["general-county-forms-index"] || 0) !== 0) throw new Error("General county indexes must not be route coverage records");
if (generalIndexMatters.length < 1) throw new Error("Expected matter-level general index downgrades to be recorded separately");

console.log("UNIQUE_ROUTE_COVERAGE_AUDIT_PASS");
console.log(JSON.stringify(output.summary, null, 2));
