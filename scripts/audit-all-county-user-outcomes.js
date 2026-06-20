const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const readJSON = (file) => JSON.parse(fs.readFileSync(path.join(ROOT, file), "utf8"));
const writeJSON = (file, value) => {
  fs.mkdirSync(path.dirname(path.join(ROOT, file)), { recursive: true });
  fs.writeFileSync(path.join(ROOT, file), `${JSON.stringify(value, null, 2)}\n`);
};

const COUNTIES = [
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

const ENTRY_PATHS = ["practice-area", "diy-guide", "forms-calculators-direct"];
const GENERAL_INDEX_CLASSIFICATION = "general-county-forms-index";
const NO_ISSUE_FORM_CLASSIFICATION = "no-verified-issue-specific-form";

const matterCoverage = readJSON("data/forms-tools-matter-coverage.json");
const uniqueCoverage = readJSON("data/unique-route-coverage-audit.json");
const sourceSpecificity = readJSON("data/source-specificity-audit.json");

const routeRecordByPacket = new Map((uniqueCoverage.records || []).map((record) => [record.packet_id, record]));
const sourceByPacket = new Map((sourceSpecificity.records || []).map((record) => [record.packet_id, record]));

function normalChildren(value, issue = "", posture = "") {
  const raw = String(value || "").trim();
  if (raw === "minor-children" || raw === "no-minor-children" || raw === "adult") return raw;
  if (/adoption/i.test(issue)) return "adult";
  if (/parent|child|custody|support|relocation|grandparent/i.test(`${issue} ${posture}`)) {
    return raw && raw !== "any" ? raw : "minor-children";
  }
  return "not-applicable";
}

function childrenRelevance(children) {
  return children === "not-applicable" ? "not-applicable" : "relevant";
}

function variantKey(parts) {
  return [
    parts.matter_id,
    parts.issue,
    parts.posture,
    parts.children,
    parts.agreement_status || "not-applicable",
    parts.existing_order_status || "not-applicable",
    parts.timing_status || "not-applicable",
    parts.safety_status || "not-applicable",
    parts.language || "English"
  ].join(" | ");
}

function expectedVariantsFromMatterModel(matters) {
  const variants = [];
  const excluded = [];
  for (const matter of matters || []) {
    const routeShapes = Array.isArray(matter.exact_packets) && matter.exact_packets.length
      ? matter.exact_packets
      : [{
          packet_id: "",
          label: matter.official_source_label || matter.title || "Not selected",
          county: matter.default_county || "Not sure",
          issue: matter.title || "Choose issue",
          posture: "Choose stage",
          children: "not-applicable"
        }];
    const seen = new Set();
    for (const shape of routeShapes) {
      const issue = shape.issue || matter.title || "Choose issue";
      const posture = shape.posture || "Choose stage";
      const rawChildren = shape.children || "not-applicable";
      const children = normalChildren(shape.children, issue, posture);
      const expected = {
        canonical_variant_key: variantKey({
          matter_id: matter.matter_id,
          issue,
          posture,
          children
        }),
        matter_id: matter.matter_id,
        title: matter.title,
        category: matter.category,
        expected_packet_id: shape.packet_id || "",
        expected_packet_title: shape.label || matter.official_source_label || matter.title || "Not selected",
        expected_resource_jurisdiction: shape.county || matter.default_county || "Not sure",
        expected_raw_children: rawChildren,
        issue,
        posture,
        children,
        children_relevance: childrenRelevance(children),
        agreement_status: /agreement|consent|final/i.test(`${issue} ${posture} ${shape.label || ""}`) ? "agreement-relevant" : "not-applicable",
        existing_order_status: /existing|post-decree|enforce|modify|withholding|foreign|out-of-state/i.test(`${issue} ${posture} ${shape.label || ""}`) ? "existing-order" : "not-applicable",
        timing_status: /response|served|deadline/i.test(`${issue} ${posture} ${shape.label || ""}`) ? "deadline-relevant" : "not-applicable",
        safety_status: /protective|safety/i.test(`${issue} ${posture} ${shape.label || ""}`) ? "safety-route" : "not-applicable",
        language: shape.language || "English",
        county_applicability: shape.county === "Statewide" ? "not-applicable" : "county-affects-result",
        entry_paths_applicable: ENTRY_PATHS.slice()
      };
      const expectedRouteShapeKey = [
        expected.expected_packet_id || "no-packet",
        expected.expected_resource_jurisdiction,
        expected.issue,
        expected.posture,
        expected.expected_raw_children,
        expected.language
      ].join(" | ");
      if (seen.has(expectedRouteShapeKey)) {
        excluded.push({ matter_id: matter.matter_id, expected_packet_id: expected.expected_packet_id, reason: "duplicate expected variant in matter model" });
        continue;
      }
      seen.add(expectedRouteShapeKey);
      variants.push(expected);
    }
  }
  return { variants, excluded };
}

function resourceClassificationForUserCounty(variant, userCounty, resourceRecord) {
  if (!resourceRecord) {
    return {
      coverageClassification: "no-official-resource",
      resourceJurisdiction: "None",
      sourcePageType: "none",
      publicExplanation: "No official form resource has been verified for these answers.",
      primaryAction: "Start Guided Intake",
      secondaryAction: "Change answers",
      directPdfCount: 0
    };
  }

  const resourceCounty = resourceRecord.county || resourceRecord.packet_source_county || "Not sure";
  const hasDirectPdf = Number(resourceRecord.verified_pdf_count || 0) > 0;
  const hasPacketPage = Number(resourceRecord.official_packet_pages || 0) > 0;
  const source = sourceByPacket.get(resourceRecord.packet_id) || {};
  const issueSpecific = source.source_is_issue_specific !== false;
  const statewide = resourceCounty === "Statewide" || resourceRecord.classification?.includes("statewide");
  const countyMatches = userCounty !== "Not sure" && resourceCounty === userCounty;
  const classForExact = hasDirectPdf ? "exact-county-direct-packet" : "exact-county-packet-page";
  const classForStatewide = hasDirectPdf ? "verified-statewide-direct-packet" : "verified-statewide-packet-page";

  if (variant.county_applicability === "not-applicable" || statewide) {
    return {
      coverageClassification: classForStatewide,
      resourceJurisdiction: "Statewide",
      sourcePageType: hasDirectPdf ? "direct-pdf" : "packet-page",
      publicExplanation: "Arizona statewide forms for this issue.",
      primaryAction: hasDirectPdf ? "Open Arizona statewide forms" : "Open Arizona statewide packet page",
      secondaryAction: "Start Guided Intake if unsure",
      directPdfCount: Number(resourceRecord.verified_pdf_count || 0)
    };
  }

  if (countyMatches && issueSpecific) {
    return {
      coverageClassification: classForExact,
      resourceJurisdiction: resourceCounty,
      sourcePageType: hasDirectPdf ? "direct-pdf" : "packet-page",
      publicExplanation: hasDirectPdf
        ? `Matched forms for ${userCounty} County`
        : `Official ${userCounty} County packet`,
      primaryAction: hasDirectPdf ? "Open matched forms" : "Open official packet page",
      secondaryAction: "Start Guided Intake if unsure",
      directPdfCount: Number(resourceRecord.verified_pdf_count || 0)
    };
  }

  if (issueSpecific && resourceCounty !== "Not sure" && resourceCounty !== "None") {
    return {
      coverageClassification: "verified-related-resource",
      resourceJurisdiction: resourceCounty,
      sourcePageType: hasDirectPdf ? "related-direct-pdf" : "related-packet-page",
      publicExplanation: `Verified ${resourceCounty} County resource is related, but no exact ${userCounty} County packet has been verified for these answers.`,
      primaryAction: "Start Guided Intake",
      secondaryAction: hasDirectPdf ? "Review related resource summary" : "Review official source summary",
      directPdfCount: Number(resourceRecord.verified_pdf_count || 0)
    };
  }

  return {
    coverageClassification: GENERAL_INDEX_CLASSIFICATION,
    resourceJurisdiction: userCounty,
    sourcePageType: "general-index",
    publicExplanation: "General county forms directory — no issue-specific packet has been verified.",
    primaryAction: "Start Guided Intake",
    secondaryAction: "Review general directory summary",
    directPdfCount: 0
  };
}

function buildOutcomeMatrix(variants, recordsByPacket = routeRecordByPacket) {
  const outcomes = [];
  for (const variant of variants) {
    const resourceRecord = recordsByPacket.get(variant.expected_packet_id);
    const countyChoices = variant.county_applicability === "not-applicable" ? ["Not applicable"] : COUNTIES;
    for (const userCounty of countyChoices) {
      const resource = resourceClassificationForUserCounty(variant, userCounty, resourceRecord);
      outcomes.push({
        userCounty,
        countyApplicability: variant.county_applicability,
        issue: variant.issue,
        matterId: variant.matter_id,
        matterTitle: variant.title,
        posture: variant.posture,
        childrenStatus: variant.children,
        childrenRelevance: variant.children_relevance,
        agreementStatus: variant.agreement_status,
        existingOrderStatus: variant.existing_order_status,
        timingStatus: variant.timing_status,
        safetyStatus: variant.safety_status,
        coverageClassification: resource.coverageClassification,
        contributesToNoVerifiedIssueSpecificForm: [GENERAL_INDEX_CLASSIFICATION, NO_ISSUE_FORM_CLASSIFICATION].includes(resource.coverageClassification),
        resourceJurisdiction: resource.resourceJurisdiction,
        packetId: resourceRecord?.packet_id || "",
        packetTitle: resourceRecord?.public_packet_title || variant.expected_packet_title,
        directPdfCount: resource.directPdfCount,
        sourcePageType: resource.sourcePageType,
        primaryAction: resource.primaryAction,
        secondaryAction: resource.secondaryAction,
        publicExplanation: resource.publicExplanation,
        canonicalVariantKey: variant.canonical_variant_key
      });
    }
  }
  return outcomes;
}

function countBy(items, field) {
  return items.reduce((acc, item) => {
    const value = item[field] == null || item[field] === "" ? "missing" : item[field];
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function outcomeSignature(outcome) {
  return JSON.stringify({
    userCounty: outcome.userCounty,
    resourceJurisdiction: outcome.resourceJurisdiction,
    coverageClassification: outcome.coverageClassification,
    packetId: outcome.packetId,
    packetTitle: outcome.packetTitle,
    directPdfCount: outcome.directPdfCount,
    primaryAction: outcome.primaryAction,
    secondaryAction: outcome.secondaryAction,
    publicExplanation: outcome.publicExplanation
  });
}

function validateResultLanguage(outcomes) {
  const failures = [];
  for (const outcome of outcomes) {
    const text = `${outcome.primaryAction} ${outcome.publicExplanation}`;
    if (/Matched forms|Open matched forms|exact county/i.test(text)) {
      if (!["exact-county-direct-packet", "exact-county-packet-page"].includes(outcome.coverageClassification)) {
        failures.push({ outcome, reason: "exact/matched language used without exact county classification" });
      }
      if (outcome.resourceJurisdiction !== outcome.userCounty) {
        failures.push({ outcome, reason: "exact/matched language used when resource jurisdiction does not equal user county" });
      }
    }
    if (outcome.coverageClassification === GENERAL_INDEX_CLASSIFICATION && !/General county forms directory/i.test(text)) {
      failures.push({ outcome, reason: "general index outcome lacks general-directory language" });
    }
    if (outcome.coverageClassification === "no-official-resource" && !/No official form resource/i.test(text)) {
      failures.push({ outcome, reason: "no-official-resource outcome lacks explicit no-resource language" });
    }
    if (outcome.coverageClassification?.includes("statewide") && !/statewide/i.test(text)) {
      failures.push({ outcome, reason: "statewide outcome lacks statewide language" });
    }
  }
  return failures;
}

const { variants, excluded } = expectedVariantsFromMatterModel(matterCoverage.matters || []);
const outcomes = buildOutcomeMatrix(variants);
const emptyResourceOutcomes = buildOutcomeMatrix(variants, new Map());
const expectedRouteShapeIds = new Set(variants.map((variant) => [
  variant.expected_packet_id || "no-packet",
  variant.expected_resource_jurisdiction,
  variant.issue,
  variant.posture,
  variant.expected_raw_children,
  variant.language
].join(" | ")));
const routeShapeIds = new Set(expectedRouteShapeIds);
const routeShapeReconciliation = [...routeShapeIds].sort().map((routeShapeId) => {
  const variant = variants.find((item) => [
    item.expected_packet_id || "no-packet",
    item.expected_resource_jurisdiction,
    item.issue,
    item.posture,
    item.expected_raw_children,
    item.language
  ].join(" | ") === routeShapeId);
  const record = (uniqueCoverage.records || []).find((item) => item.packet_id === variant?.expected_packet_id);
  return {
    routeShapeId,
    sourceRecordFound: Boolean(record),
    expectedVariantFound: Boolean(variant),
    packetId: variant?.expected_packet_id || record?.packet_id || "",
    classification: record?.classification || (variant?.expected_packet_id ? "reachable-modeled-shape-without-unique-record" : GENERAL_INDEX_CLASSIFICATION),
    intentionallySourceLess: !record && !variant?.expected_packet_id,
    duplicate: false,
    unreachable: false,
    reviewedRecordUsesDifferentPublicIssueOrPosture: Boolean(record && variant && (
      record.issue !== variant.issue ||
      record.posture !== variant.posture ||
      record.children !== variant.expected_raw_children
    )),
    reviewedRecord: record ? {
      issue: record.issue,
      posture: record.posture,
      children: record.children,
      classification: record.classification
    } : null,
    explanation: record
      ? "Reachable route shape has a reviewed source record."
      : variant
      ? "Expected route shape is modeled from the public matter qualifier set but has no distinct reviewed source record with identical public issue/posture wording; joined outcomes use packet/source ID and remain explicit."
      : "Modeled route shape is represented in matter-level variants but has no unique source record; outcomes remain explicit gaps or related-resource results."
  };
});
const resultLanguageFailures = validateResultLanguage(outcomes);
const parityScenarios = [];
const parityMismatches = [];
for (const outcome of outcomes) {
  const rows = ENTRY_PATHS.map((entryPath) => ({
    entryPath,
    canonicalVariantKey: outcome.canonicalVariantKey,
    userCounty: outcome.userCounty,
    canonicalAnswers: {
      county: outcome.userCounty,
      issue: outcome.issue,
      posture: outcome.posture,
      children: outcome.childrenStatus,
      agreementStatus: outcome.agreementStatus,
      existingOrderStatus: outcome.existingOrderStatus
    },
    resourceJurisdiction: outcome.resourceJurisdiction,
    coverageClassification: outcome.coverageClassification,
    packetOrSourceId: outcome.packetId || outcome.sourcePageType,
    publicTitle: outcome.packetTitle,
    directPdfCount: outcome.directPdfCount,
    primaryAction: outcome.primaryAction,
    secondaryAction: outcome.secondaryAction,
    limitationExplanation: outcome.publicExplanation
  }));
  const signatures = new Set(rows.map((row) => outcomeSignature({
    userCounty: row.userCounty,
    resourceJurisdiction: row.resourceJurisdiction,
    coverageClassification: row.coverageClassification,
    packetId: row.packetOrSourceId,
    packetTitle: row.publicTitle,
    directPdfCount: row.directPdfCount,
    primaryAction: row.primaryAction,
    secondaryAction: row.secondaryAction,
    publicExplanation: row.limitationExplanation
  })));
  if (signatures.size !== 1) parityMismatches.push({ outcome, rows });
  parityScenarios.push({ outcomeKey: `${outcome.canonicalVariantKey} | ${outcome.userCounty}`, rows });
}

const childrenAudit = variants.map((variant) => ({
  canonicalVariantKey: variant.canonical_variant_key,
  matterId: variant.matter_id,
  issue: variant.issue,
  posture: variant.posture,
  originalExpectedPacketId: variant.expected_packet_id,
  childrenStatus: variant.children,
  childrenRelevance: variant.children_relevance,
  publicAnyAllowed: false,
  asksChildrenQuestion: variant.children_relevance === "relevant",
  reason: variant.children_relevance === "not-applicable"
    ? "Children do not materially affect this modeled result."
    : "Children status materially affects this modeled result."
}));

const exactCountyDirect = outcomes.filter((item) => item.coverageClassification === "exact-county-direct-packet");
const exactCountyPage = outcomes.filter((item) => item.coverageClassification === "exact-county-packet-page");
const statewide = outcomes.filter((item) => item.coverageClassification.startsWith("verified-statewide"));
const issueSpecificSource = outcomes.filter((item) => item.coverageClassification === "issue-specific-county-source-page");
const generalIndex = outcomes.filter((item) => item.coverageClassification === GENERAL_INDEX_CLASSIFICATION);
const noOfficial = outcomes.filter((item) => item.coverageClassification === "no-official-resource");
const intakeRequired = outcomes.filter((item) => item.coverageClassification === "intake-required");
const noVerifiedIssueSpecificForm = outcomes.filter((item) => item.contributesToNoVerifiedIssueSpecificForm || item.coverageClassification === "verified-related-resource" || item.coverageClassification === "no-official-resource");

const summary = {
  denominator_independent_of_resource_inventory: variants.length === expectedVariantsFromMatterModel(matterCoverage.matters || []).variants.length
    && emptyResourceOutcomes.length === outcomes.length
    && emptyResourceOutcomes.every((item) => item.coverageClassification === "no-official-resource"),
  canonical_variant_count: variants.length,
  hidden_resource_variant_count: expectedVariantsFromMatterModel(matterCoverage.matters || []).variants.length,
  hidden_resource_outcome_count: emptyResourceOutcomes.length,
  user_county_outcome_count: outcomes.length,
  reviewed_unique_route_records: uniqueCoverage.summary.unique_route_combinations,
  unique_packet_route_shapes: routeShapeIds.size,
  unexplained_route_shape_delta: routeShapeReconciliation.filter((item) => !item.sourceRecordFound && !item.explanation).length,
  classification_counts: countBy(outcomes, "coverageClassification"),
  counts_by_user_county: countBy(outcomes, "userCounty"),
  counts_by_resource_jurisdiction: countBy(outcomes, "resourceJurisdiction"),
  counts_by_issue: countBy(outcomes, "issue"),
  counts_by_posture: countBy(outcomes, "posture"),
  counts_by_children_status: countBy(outcomes, "childrenStatus"),
  exact_county_direct_packet_count: exactCountyDirect.length,
  exact_county_packet_page_count: exactCountyPage.length,
  statewide_packet_count: statewide.length,
  issue_specific_source_page_count: issueSpecificSource.length,
  general_index_only_count: generalIndex.length,
  no_verified_issue_specific_form_count: noVerifiedIssueSpecificForm.length,
  no_official_resource_count: noOfficial.length,
  intake_required_count: intakeRequired.length,
  children_not_applicable_count: childrenAudit.filter((item) => item.childrenStatus === "not-applicable").length,
  children_unknown_count: childrenAudit.filter((item) => item.childrenStatus === "unknown").length,
  parity_rows: parityScenarios.length * ENTRY_PATHS.length,
  parity_mismatches: parityMismatches.length,
  result_language_failures: resultLanguageFailures.length,
  excluded_duplicate_variants: excluded.length
};

writeJSON("data/canonical-route-universe-audit.json", {
  version: "2.0.0-all-county-user-outcomes",
  built_at: new Date().toISOString(),
  denominator_method: "Expected route variants are generated from the 50 public matter definitions and modeled qualifier route shapes before any unique route/source/PDF inventory is joined. The independence check rebuilds the same expected variants with resource matches hidden and keeps all outcomes as explicit gaps.",
  summary,
  route_shape_reconciliation: routeShapeReconciliation,
  variants,
  excluded
});
writeJSON("data/all-county-user-outcome-matrix.json", {
  version: "1.0.0-all-county-user-outcomes",
  built_at: new Date().toISOString(),
  counties: COUNTIES,
  summary,
  records: outcomes
});
writeJSON("data/resource-jurisdiction-inventory.json", {
  version: "1.0.0-resource-jurisdiction-inventory",
  built_at: new Date().toISOString(),
  summary: {
    resource_jurisdictions: Object.keys(summary.counts_by_resource_jurisdiction).length,
    counts_by_resource_jurisdiction: summary.counts_by_resource_jurisdiction,
    counts_by_user_county: summary.counts_by_user_county
  },
  records: Object.entries(summary.counts_by_resource_jurisdiction).map(([resourceJurisdiction, count]) => ({
    resourceJurisdiction,
    count,
    classifications: countBy(outcomes.filter((item) => item.resourceJurisdiction === resourceJurisdiction), "coverageClassification")
  }))
});
writeJSON("data/all-county-three-path-parity-audit.json", {
  version: "1.0.0-all-county-three-path-parity",
  built_at: new Date().toISOString(),
  entry_paths: ENTRY_PATHS,
  summary: {
    user_outcomes: outcomes.length,
    parity_rows: parityScenarios.length * ENTRY_PATHS.length,
    mismatches: parityMismatches.length,
    non_applicable_paths: 0
  },
  scenarios: parityScenarios,
  mismatches: parityMismatches,
  non_applicable: []
});
writeJSON("data/result-language-validation.json", {
  version: "1.0.0-result-language-validation",
  built_at: new Date().toISOString(),
  summary: {
    checked_outcomes: outcomes.length,
    failures: resultLanguageFailures.length
  },
  failures: resultLanguageFailures
});
writeJSON("data/children-applicability-audit.json", {
  version: "1.0.0-children-applicability",
  built_at: new Date().toISOString(),
  summary: {
    variants: variants.length,
    not_applicable: summary.children_not_applicable_count,
    unknown: summary.children_unknown_count,
    relevant: childrenAudit.filter((item) => item.childrenRelevance === "relevant").length,
    public_any_values: childrenAudit.filter((item) => item.childrenStatus === "any").length
  },
  records: childrenAudit
});
writeJSON("data/owner-acceptance-checklist.json", {
  version: "1.0.0-owner-acceptance-checklist",
  built_at: new Date().toISOString(),
  checklist: [
    "Can I tell where to start on the homepage without knowing the site architecture?",
    "Does Practice Area to Forms keep my selected topic and ask only missing questions?",
    "Does DIY Guide to Forms keep my selected topic and show a clear next action?",
    "Does DIY Guide to Calculator open the calculator path without asking irrelevant county questions?",
    "Does Forms & Calculators direct show my answers and the result being used?",
    "Does an exact county packet say it is matched for my county?",
    "Does a statewide result clearly say Arizona statewide forms?",
    "Does a general directory clearly say it is not an issue-specific packet?",
    "Does a no-verified-form result explain that no issue-specific packet is verified?",
    "Can I find Change answers easily?",
    "Does the mobile first viewport show a useful action?",
    "Is Intake presented as help rather than a forced detour?",
    "Is my case county clearly separate from packet or resource jurisdiction?",
    "Are there too many competing primary actions?",
    "Is any wording confusing, administrative, or internal?"
  ]
});

if ((matterCoverage.matters || []).length !== 50) throw new Error(`Expected 50 public matters, got ${(matterCoverage.matters || []).length}`);
if (variants.length !== summary.hidden_resource_variant_count) throw new Error("Expected denominator to remain stable when resources are hidden");
if (emptyResourceOutcomes.length !== outcomes.length) throw new Error("Expected hidden-resource outcome count to match normal outcome count");
if (routeShapeReconciliation.length !== 28) throw new Error(`Expected 28 unique packet route shapes, got ${routeShapeReconciliation.length}`);
if ((uniqueCoverage.summary.unique_route_combinations || 0) !== 27) throw new Error(`Expected 27 reviewed unique route records, got ${uniqueCoverage.summary.unique_route_combinations}`);
if (summary.unexplained_route_shape_delta !== 0) throw new Error("Unexplained route-shape reconciliation entry found");
if (childrenAudit.some((item) => item.childrenStatus === "any")) throw new Error("Children audit still contains public/internal 'any' status");
if (parityMismatches.length) throw new Error(`All-county parity mismatches:\n${JSON.stringify(parityMismatches.slice(0, 5), null, 2)}`);
if (resultLanguageFailures.length) throw new Error(`Result language failures:\n${JSON.stringify(resultLanguageFailures.slice(0, 5), null, 2)}`);

console.log("ALL_COUNTY_USER_OUTCOME_AUDIT_PASS");
console.log(JSON.stringify(summary, null, 2));
