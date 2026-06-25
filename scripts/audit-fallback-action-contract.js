const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const readJSON = (file) => JSON.parse(fs.readFileSync(path.join(ROOT, file), "utf8"));
const writeJSON = (file, value) => {
  fs.mkdirSync(path.dirname(path.join(ROOT, file)), { recursive: true });
  fs.writeFileSync(path.join(ROOT, file), `${JSON.stringify(value, null, 2)}\n`);
};

const matrix = readJSON("data/all-county-user-outcome-matrix.json");
const outcomes = matrix.records || [];

const PRIMARY_CLASSES = [
  "exact-county-direct-packet",
  "exact-county-packet-page",
  "verified-statewide-direct-packet",
  "verified-statewide-packet-page",
  "issue-specific-county-source-page",
  "general-county-forms-index",
  "verified-related-resource",
  "no-verified-issue-specific-form",
  "no-official-resource",
  "intake-required",
  "calculator-no-county-required"
];

function countBy(items, field) {
  return items.reduce((acc, item) => {
    const key = item[field] || "missing";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function contractFor(classification) {
  if (classification === "exact-county-direct-packet") return {
    primary: /Open (court form PDF|matched forms)/i,
    forbidden: [],
    explanation: /Matched forms for .+ County/i
  };
  if (classification === "exact-county-packet-page") return {
    primary: /Open official .+ packet/i,
    forbidden: [/Open court form PDF/i],
    explanation: /Official .+ County packet/i
  };
  if (classification === "verified-statewide-direct-packet") return {
    primary: /Open Arizona statewide forms/i,
    forbidden: [/Matched forms for .* County/i],
    explanation: /statewide forms/i
  };
  if (classification === "verified-statewide-packet-page") return {
    primary: /Open Arizona statewide packet page/i,
    forbidden: [/Matched forms for .* County/i],
    explanation: /statewide packet/i
  };
  if (classification === "issue-specific-county-source-page") return {
    primary: /View official .+ forms source/i,
    forbidden: [/Open matched forms/i, /exact/i],
    explanation: /source for this issue/i
  };
  if (classification === "verified-related-resource") return {
    primary: /(Start Guided Intake|View related official resource)/i,
    forbidden: [/Open matched forms/i, /Matched forms for .* County/i, /exact county/i],
    explanation: /No exact issue-specific packet has been verified|no exact .* packet has been verified/i
  };
  if (classification === "general-county-forms-index") return {
    primary: /(Browse general county forms directory|Start Guided Intake)/i,
    forbidden: [/Open matched forms/i, /Exact packet/i, /Matched county forms/i],
    explanation: /general court forms directory|General county forms directory/i
  };
  if (classification === "no-verified-issue-specific-form") return {
    primary: /(Change answers|Start Guided Intake|Use calculator|Read related guide)/i,
    forbidden: [/Open matched forms/i, /Open court form PDF/i],
    explanation: /No verified issue-specific form packet/i
  };
  if (classification === "no-official-resource") return {
    primary: /Start Guided Intake/i,
    forbidden: [/Open matched forms/i, /Open court form PDF/i, /exact/i],
    explanation: /No official form resource has been verified/i
  };
  if (classification === "intake-required") return {
    primary: /Start Guided Intake/i,
    forbidden: [/Open matched forms/i, /Open court form PDF/i],
    explanation: /Guided Intake/i
  };
  if (classification === "calculator-no-county-required") return {
    primary: /Use calculator/i,
    forbidden: [/Choose county/i],
    explanation: /calculator/i
  };
  return null;
}

const records = [];
const violations = [];
const maricopaMetadata = [];
const actionBuckets = {
  intakePrimary: 0,
  intakeSecondary: 0,
  changeAnswersPrimary: 0,
  guidePrimary: 0,
  calculatorPrimary: 0,
  unresolvedNoAction: 0
};

for (const outcome of outcomes) {
  const classification = outcome.coverageClassification;
  const primary = outcome.primaryAction || "";
  const secondary = outcome.secondaryAction || "";
  const explanation = outcome.publicExplanation || "";
  const contract = contractFor(classification);
  const text = `${primary}\n${secondary}\n${explanation}`;
  const record = {
    userCounty: outcome.userCounty,
    resourceJurisdiction: outcome.resourceJurisdiction,
    issue: outcome.issue,
    posture: outcome.posture,
    childrenStatus: outcome.childrenStatus,
    coverageClassification: classification,
    packetId: outcome.packetId,
    primaryAction: primary,
    secondaryAction: secondary,
    publicExplanation: explanation,
    pass: true,
    failures: []
  };
  if (!PRIMARY_CLASSES.includes(classification)) record.failures.push(`unknown primary classification: ${classification}`);
  if (contract) {
    if (!contract.primary.test(primary)) record.failures.push(`primary action violates ${classification} contract: ${primary}`);
    if (!contract.explanation.test(explanation)) record.failures.push(`explanation violates ${classification} contract: ${explanation}`);
    for (const forbidden of contract.forbidden) {
      if (forbidden.test(text)) record.failures.push(`forbidden fallback language/action present: ${forbidden}`);
    }
  }
  if (outcome.resourceJurisdiction === "Maricopa" && outcome.userCounty !== "Maricopa") {
    maricopaMetadata.push(record);
    if (/Matched forms for .* County|Open matched forms|exact county/i.test(text) && classification !== "exact-county-direct-packet" && classification !== "exact-county-packet-page") {
      record.failures.push("Maricopa related resource exposed as matched or exact user-county result");
    }
    if (/Open matched forms/i.test(primary) && classification !== "exact-county-direct-packet") {
      record.failures.push("Open matched forms used for non-exact Maricopa related resource");
    }
  }
  if (/Start Guided Intake/i.test(primary)) actionBuckets.intakePrimary += 1;
  if (/Start Guided Intake/i.test(secondary)) actionBuckets.intakeSecondary += 1;
  if (/Change answers/i.test(primary)) actionBuckets.changeAnswersPrimary += 1;
  if (/Read related guide/i.test(primary)) actionBuckets.guidePrimary += 1;
  if (/Use calculator/i.test(primary)) actionBuckets.calculatorPrimary += 1;
  if (!primary.trim()) actionBuckets.unresolvedNoAction += 1;
  record.pass = record.failures.length === 0;
  if (!record.pass) violations.push(record);
  records.push(record);
}

const primaryCounts = countBy(outcomes, "coverageClassification");
for (const cls of PRIMARY_CLASSES) if (!primaryCounts[cls]) primaryCounts[cls] = 0;
const primarySum = Object.values(primaryCounts).reduce((sum, value) => sum + value, 0);
const noOfficialCount = primaryCounts["no-official-resource"] || 0;
const relatedCount = primaryCounts["verified-related-resource"] || 0;
const noVerifiedOverlap = outcomes.filter((outcome) => outcome.contributesToNoVerifiedIssueSpecificForm || ["verified-related-resource", "no-official-resource", "general-county-forms-index"].includes(outcome.coverageClassification)).length;

const output = {
  version: "1.0.0-fallback-action-contract",
  built_at: new Date().toISOString(),
  summary: {
    outcomes: outcomes.length,
    primary_classification_counts: primaryCounts,
    primary_classification_equation: Object.entries(primaryCounts)
      .filter(([, count]) => count > 0)
      .map(([name, count]) => `${name} ${count}`)
      .join(" + ") + ` = ${primarySum}`,
    primary_classification_sum: primarySum,
    no_verified_issue_specific_form_overlap_count: noVerifiedOverlap,
    no_official_resource_overlap_note: "no-official-resource is a mutually exclusive primary classification and also a detail within no verified issue-specific form outcomes.",
    verified_related_resource_count: relatedCount,
    no_official_resource_count: noOfficialCount,
    maricopa_resource_non_maricopa_user_count: maricopaMetadata.length,
    maricopa_match_violations: violations.filter((item) => /Maricopa/.test(item.failures.join(" "))).length,
    action_buckets: actionBuckets,
    violations: violations.length
  },
  records,
  maricopa_resource_non_maricopa_user: maricopaMetadata,
  violations
};

writeJSON("data/fallback-action-contract-audit.json", output);

if (primarySum !== outcomes.length) throw new Error(`Primary classifications do not sum to ${outcomes.length}: ${primarySum}`);
if (violations.length) throw new Error(`Fallback action contract violations:\n${JSON.stringify(violations.slice(0, 10), null, 2)}`);
if (actionBuckets.unresolvedNoAction !== 0) throw new Error("Fallback action audit found unresolved/no-action outcomes");

console.log("FALLBACK_ACTION_CONTRACT_AUDIT_PASS");
console.log(JSON.stringify(output.summary, null, 2));
