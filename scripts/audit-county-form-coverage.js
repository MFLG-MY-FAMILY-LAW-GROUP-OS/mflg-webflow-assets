#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const outputPath = path.join(root, "data", "county-form-coverage-audit.json");
const write = process.argv.includes("--write");

const counties = [
  "Apache",
  "Cochise",
  "Coconino",
  "Gila",
  "Graham",
  "Greenlee",
  "La Paz",
  "Maricopa",
  "Mohave",
  "Navajo",
  "Pima",
  "Pinal",
  "Santa Cruz",
  "Yavapai",
  "Yuma",
  "Not sure"
];

function readJSON(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function normalizeIssue(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ");
}

function publicIssueLabel(matter) {
  const raw = normalizeIssue(matter.issue || matter.title || matter.matter_id);
  if (/annul/.test(raw)) return "Annulment";
  if (/divorce|separation|dissolution/.test(raw)) return "Divorce / Legal Separation";
  if (/support/.test(raw) && !/worksheet/.test(raw)) return "Child Support";
  if (/worksheet/.test(raw)) return "Child Support Worksheet";
  if (/parentage|paternity/.test(raw)) return "Paternity / Parentage";
  if (/parenting|custody|decision/.test(raw)) return "Parenting Time / Legal Decision-Making";
  if (/modif|clarif/.test(raw)) return "Modification";
  if (/enforce|contempt/.test(raw)) return "Enforcement / Contempt";
  if (/protect|safety|injunction/.test(raw)) return "Protective Orders / Safety";
  if (/relocat/.test(raw)) return "Relocation";
  if (/maintenance/.test(raw)) return "Spousal Maintenance";
  if (/grandparent|third/.test(raw)) return "Third-Party / Grandparent Rights";
  if (/foreign|uccjea|interstate/.test(raw)) return "UCCJEA / Interstate Custody";
  if (/mediat|adr|settlement/.test(raw)) return "Mediation / ADR";
  if (/name change|identity/.test(raw)) return "Name Change";
  if (/adoption/.test(raw)) return "Adult Adoption";
  if (/document|filing|service|disclosure|property|deadline|response/.test(raw)) return matter.title || "Document Preparation / Filing Help";
  return matter.title || "Choose issue";
}

function issueMatches(packetIssue, matter) {
  const packet = normalizeIssue(packetIssue);
  const title = normalizeIssue(matter.title);
  const id = normalizeIssue(matter.matter_id);
  const haystack = `${title} ${id}`;
  if (!packet || packet === "all" || packet === "any") return false;
  if (packet === "divorce") return /divorce|separation|dissolution/.test(haystack);
  if (packet === "parenting") return /parenting|custody|decision|relocation/.test(haystack);
  if (packet === "child support") return /support|income withholding/.test(haystack);
  if (packet === "paternity") return /paternity|parentage/.test(haystack);
  if (packet === "relocation") return /relocation/.test(haystack);
  if (packet === "name change") return /name change|identity/.test(haystack);
  if (packet === "safety") return /protective|safety/.test(haystack);
  return haystack.includes(packet);
}

function packetPdfCount(actionsByPacket, packetId) {
  return actionsByPacket.get(packetId) || 0;
}

function sourceForCounty(jurisdictions, county) {
  const target = county === "Not sure" ? "Statewide" : county;
  const exact = jurisdictions.find((item) => item.county === target && item.official_url);
  if (exact) return exact;
  if (county === "Not sure") return jurisdictions.find((item) => item.county === "Statewide" && item.official_url) || null;
  return null;
}

function classifyRecord({ matter, county, entryPath, routeIndexPackets, actionsByPacket, jurisdictions }) {
  const exactPackets = [...(matter.exact_packets || []), ...(matter.related_packets || [])]
    .filter((packet) => packet && packet.packet_id);
  const countyPackets = exactPackets.filter((packet) => packet.county === county && packetPdfCount(actionsByPacket, packet.packet_id) > 0);
  const exactPacket = countyPackets[0] || null;
  if (exactPacket) {
    return {
      classification: "exact-county-packet",
      packet: exactPacket,
      source: {
        type: "approved-pdf-packet",
        county: exactPacket.county,
        label: exactPacket.label || exactPacket.packet_id,
        url: exactPacket.official_source_url || ""
      },
      confidence: "exact"
    };
  }

  const statewidePacket = routeIndexPackets.find((packet) => {
    const route = packet.route || {};
    return route.county === "Statewide" && issueMatches(route.issue, matter) && packetPdfCount(actionsByPacket, packet.packet_id) > 0;
  });
  if (statewidePacket) {
    return {
      classification: "verified-statewide-packet",
      packet: {
        packet_id: statewidePacket.packet_id,
        label: statewidePacket.packet_label,
        county: "Statewide",
        issue: statewidePacket.route?.issue || "",
        posture: statewidePacket.route?.posture || "",
        children: statewidePacket.route?.children || "any"
      },
      source: {
        type: "approved-statewide-packet",
        county: "Statewide",
        label: statewidePacket.packet_label || statewidePacket.packet_id,
        url: ""
      },
      confidence: "statewide"
    };
  }

  const source = sourceForCounty(jurisdictions, county);
  if (source) {
    return {
      classification: "verified-county-source-page",
      packet: null,
      source: {
        type: source.county === "Statewide" ? "official-statewide-source-page" : "official-county-source-page",
        county: source.county,
        label: source.label,
        url: source.official_url
      },
      confidence: source.county === "Statewide" ? "statewide-source-page" : "source-page"
    };
  }

  if (matter.guided_intake_available) {
    return {
      classification: "intake-required",
      packet: null,
      source: { type: "guided-intake", county: "", label: "Guided Intake", url: "/start" },
      confidence: "intake"
    };
  }

  return {
    classification: "no-verified-form",
    packet: null,
    source: { type: "none", county: "", label: "", url: "" },
    confidence: "none"
  };
}

const matterCoverage = readJSON("data/forms-tools-matter-coverage.json");
const routeIndex = readJSON("data/form-pdf-route-index.json");
const publicActions = readJSON("data/form-pdf-public-actions.json");
const jurisdictionReadiness = readJSON("data/jurisdiction-readiness.json");

const matters = matterCoverage.matters || [];
const routeIndexPackets = routeIndex.packets || [];
const actions = publicActions.actions || [];
const jurisdictions = jurisdictionReadiness.jurisdictions || [];
const actionsByPacket = new Map();
actions.forEach((action) => {
  if (!action.packet_id || !action.site_pdf_view_url?.startsWith("/api/official-pdf/")) return;
  actionsByPacket.set(action.packet_id, (actionsByPacket.get(action.packet_id) || 0) + 1);
});

const records = [];
const entryPaths = ["practice-area", "diy-guide"];
for (const entryPath of entryPaths) {
  for (const matter of matters) {
    for (const county of counties) {
      const result = classifyRecord({ matter, county, entryPath, routeIndexPackets, actionsByPacket, jurisdictions });
      const packet = result.packet || {};
      const exactOtherCountyMisuse = result.classification === "exact-county-packet" && packet.county !== county;
      const verifiedPdfCount = packet.packet_id ? packetPdfCount(actionsByPacket, packet.packet_id) : 0;
      records.push({
        entryPath,
        county,
        issue: publicIssueLabel(matter),
        matterId: matter.matter_id,
        matterTitle: matter.title,
        posture: packet.posture || "Choose stage",
        childrenRelevance: packet.children && packet.children !== "any" ? packet.children : "Choose one",
        packetId: packet.packet_id || "",
        publicPacketTitle: packet.label || result.source.label || "",
        packetSourceCounty: packet.county || result.source.county || "",
        sourceType: result.source.type,
        sourceUrl: result.source.url || "",
        verifiedPdfCount,
        resultConfidence: result.confidence,
        classification: result.classification,
        publicExplanation: explanationFor(result.classification, county, result.source, packet),
        exactOtherCountyMisuse
      });
    }
  }
}

function explanationFor(classification, county, source, packet) {
  if (classification === "exact-county-packet") return `Matched forms for ${county} County.`;
  if (classification === "verified-statewide-packet") return "Arizona statewide forms or source page; confirm county requirements before filing.";
  if (classification === "verified-county-source-page") return county === "Not sure"
    ? "Official Arizona forms source; choose the county before treating any county packet as exact."
    : `Official ${county} County forms source; use the county page rather than another county packet.`;
  if (classification === "verified-related-resource") return "Related official resource only; confirm fit before relying on it.";
  if (classification === "calculator-no-county-required") return "Calculator path; county is not required for this result.";
  if (classification === "intake-required") return "No verified self-help packet is ready for these answers; use Guided Intake.";
  return "No verified county packet is currently available for these answers.";
}

const classificationCounts = records.reduce((acc, record) => {
  acc[record.classification] = (acc[record.classification] || 0) + 1;
  return acc;
}, {});

const exactCountyPacketCounts = records
  .filter((record) => record.classification === "exact-county-packet")
  .reduce((acc, record) => {
    acc[record.county] = (acc[record.county] || 0) + 1;
    return acc;
  }, {});

const gaps = records
  .filter((record) => record.county !== "Not sure" && record.classification !== "exact-county-packet")
  .map((record) => ({
    entryPath: record.entryPath,
    county: record.county,
    matterId: record.matterId,
    matterTitle: record.matterTitle,
    classification: record.classification,
    fallback: record.publicPacketTitle
  }));

const audit = {
  version: "2026-06-20-new-user-path-simplicity",
  generatedAt: new Date().toISOString(),
  counties,
  sourceFiles: [
    "data/forms-tools-matter-coverage.json",
    "data/form-pdf-route-index.json",
    "data/form-pdf-public-actions.json",
    "data/jurisdiction-readiness.json"
  ],
  summary: {
    counties: counties.length,
    matters: matters.length,
    entryPaths: entryPaths.length,
    records: records.length,
    classificationCounts,
    exactCountyPacketCounts,
    exactCountyPacketGaps: gaps.length
  },
  records,
  exactCountyPacketGaps: gaps
};

const failures = [];
if (matters.length !== 50) failures.push(`expected 50 matters, got ${matters.length}`);
if (counties.length !== 16) failures.push(`expected 15 Arizona counties plus Not sure, got ${counties.length}`);
if (records.length !== matters.length * counties.length * entryPaths.length) failures.push(`unexpected record count ${records.length}`);
records.forEach((record, index) => {
  if (record.exactOtherCountyMisuse) failures.push(`record ${index} counts another county packet as exact`);
  if (record.classification === "exact-county-packet" && record.verifiedPdfCount < 1) failures.push(`record ${index} exact packet lacks approved PDF`);
  if (record.classification === "exact-county-packet" && record.packetSourceCounty !== record.county) failures.push(`record ${index} exact packet source county mismatch`);
  if (/^maricopa-/i.test(record.packetId) && record.county !== "Maricopa" && record.classification === "exact-county-packet") failures.push(`record ${index} treats Maricopa packet as exact for ${record.county}`);
});

if (write) {
  fs.writeFileSync(outputPath, `${JSON.stringify(audit, null, 2)}\n`);
}

if (failures.length) {
  console.error("COUNTY_FORM_COVERAGE_AUDIT_FAILED");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("COUNTY_FORM_COVERAGE_AUDIT_PASS");
console.log(JSON.stringify(audit.summary, null, 2));
