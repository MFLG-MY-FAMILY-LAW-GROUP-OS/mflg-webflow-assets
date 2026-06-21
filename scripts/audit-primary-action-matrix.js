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

const PRIMARY_ACTION_TYPES = [
  "open-exact-forms",
  "open-official-packet-page",
  "open-statewide-forms",
  "view-related-resource",
  "browse-general-directory",
  "change-answers",
  "use-calculator",
  "read-guide",
  "start-intake"
];

function countBy(items, keyer) {
  return items.reduce((acc, item) => {
    const key = typeof keyer === "function" ? keyer(item) : item[keyer];
    const label = key || "missing";
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});
}

function primaryActionFor(outcome) {
  switch (outcome.coverageClassification) {
    case "exact-county-direct-packet":
      return {
        type: "open-exact-forms",
        label: "Open matched forms",
        destination: "/api/official-pdf/...",
        reason: "A verified direct packet exists for the selected county and route qualifiers."
      };
    case "exact-county-packet-page":
      return {
        type: "open-official-packet-page",
        label: `Open official ${outcome.userCounty} packet`,
        destination: "same-site packet page summary",
        reason: "A verified official county packet page exists for the selected county and route qualifiers."
      };
    case "verified-statewide-direct-packet":
      return {
        type: "open-statewide-forms",
        label: "Open Arizona statewide forms",
        destination: "/api/official-pdf/...",
        reason: "A verified Arizona statewide form applies regardless of the selected county for this issue."
      };
    case "verified-statewide-packet-page":
      return {
        type: "open-statewide-forms",
        label: "Open Arizona statewide packet",
        destination: "same-site statewide packet page summary",
        reason: "A verified Arizona statewide packet page applies regardless of selected county for this issue."
      };
    case "issue-specific-county-source-page":
      return {
        type: "view-related-resource",
        label: `View official ${outcome.userCounty} forms source for this issue`,
        destination: "same-site source summary",
        reason: "A verified issue-specific county source exists, but direct matched PDFs are not individually verified."
      };
    case "general-county-forms-index":
      return {
        type: "browse-general-directory",
        label: "Browse general county forms directory",
        destination: "same-site source summary",
        reason: "Only a general official forms directory is verified, so it must not be presented as a matched packet."
      };
    case "verified-related-resource":
      return {
        type: "start-intake",
        label: "Start Guided Intake",
        destination: "/start",
        reason: "The verified resource is related or from another jurisdiction, not a matched packet for the selected county; Intake is the safest useful next action."
      };
    case "no-official-resource":
      return {
        type: "start-intake",
        label: "Start Guided Intake",
        destination: "/start",
        reason: "No official form resource has been verified for this route; Intake is operationally required before choosing forms."
      };
    case "intake-required":
      return {
        type: "start-intake",
        label: "Start Guided Intake",
        destination: "/start",
        reason: "The route is safety, scope, or review sensitive and requires Intake before self-help routing."
      };
    case "calculator-no-county-required":
      return {
        type: "use-calculator",
        label: "Use calculator",
        destination: "/calculators",
        reason: "A calculator is the applicable self-help result and county is not a required input."
      };
    default:
      return {
        type: "",
        label: "",
        destination: "",
        reason: `No action contract exists for ${outcome.coverageClassification || "missing classification"}.`
      };
  }
}

function intakeReason(outcome, action) {
  if (action.type !== "start-intake") return "not-intake-primary";
  if (outcome.coverageClassification === "no-official-resource" || outcome.coverageClassification === "intake-required") return "intake-required";
  if (outcome.coverageClassification === "verified-related-resource") return "intake-best-safe-action";
  return "insufficient-evidence";
}

const records = [];
const violations = [];

for (const outcome of outcomes) {
  const action = primaryActionFor(outcome);
  const intakeClassification = intakeReason(outcome, action);
  const record = {
    userCounty: outcome.userCounty,
    resourceJurisdiction: outcome.resourceJurisdiction,
    issue: outcome.issue,
    posture: outcome.posture,
    childrenStatus: outcome.childrenStatus,
    coverageClassification: outcome.coverageClassification,
    primaryActionType: action.type,
    primaryActionLabel: action.label,
    primaryDestination: action.destination,
    secondaryActions: [
      action.type === "start-intake" ? "Change answers" : "Change answers",
      action.type === "open-exact-forms" ? "Preview on this page" : "",
      action.type !== "start-intake" ? "Start Guided Intake if unsure" : ""
    ].filter(Boolean),
    primaryActionReason: action.reason,
    relatedResourceId: outcome.coverageClassification === "verified-related-resource" ? outcome.packetId : "",
    guideAvailability: outcome.matterId ? "available-by-matter" : "not-proven",
    calculatorAvailability: /support|maintenance|calculator/i.test(`${outcome.issue} ${outcome.matterTitle}`) ? "potentially-applicable" : "not-applicable",
    changeAnswersCouldProduceDifferentResult: outcome.countyApplicability === "county-affects-result",
    intakeNeedClassification: intakeClassification,
    intakeLegallyOrSafelyNecessary: ["intake-required", "intake-best-safe-action"].includes(intakeClassification),
    sourceEntryPath: "canonical-outcome-matrix"
  };
  if (!PRIMARY_ACTION_TYPES.includes(record.primaryActionType)) violations.push({ ...record, failure: "unknown primary action type" });
  if (record.primaryActionType === "start-intake" && record.intakeNeedClassification === "insufficient-evidence") violations.push({ ...record, failure: "intake primary lacks sufficient evidence" });
  if (outcome.resourceJurisdiction === "Maricopa" && outcome.userCounty !== "Maricopa" && /Open matched forms|Matched forms for|exact county forms|exact county packet/i.test(`${record.primaryActionLabel} ${record.primaryActionReason}`)) {
    violations.push({ ...record, failure: "non-Maricopa outcome presents Maricopa resource as matched/exact" });
  }
  records.push(record);
}

const primaryActionCounts = countBy(records, "primaryActionType");
for (const type of PRIMARY_ACTION_TYPES) if (!primaryActionCounts[type]) primaryActionCounts[type] = 0;
const primaryActionSum = Object.values(primaryActionCounts).reduce((sum, count) => sum + count, 0);
const intakeNeedCounts = countBy(records.filter((record) => record.primaryActionType === "start-intake"), "intakeNeedClassification");
for (const key of ["intake-required", "intake-best-safe-action", "intake-unnecessarily-primary", "insufficient-evidence"]) {
  if (!intakeNeedCounts[key]) intakeNeedCounts[key] = 0;
}

const output = {
  version: "1.0.0-primary-action-matrix",
  built_at: new Date().toISOString(),
  summary: {
    outcomes: outcomes.length,
    primary_action_counts: primaryActionCounts,
    primary_action_equation: Object.entries(primaryActionCounts)
      .filter(([, count]) => count > 0)
      .map(([type, count]) => `${type} ${count}`)
      .join(" + ") + ` = ${primaryActionSum}`,
    primary_action_sum: primaryActionSum,
    counts_by_classification: countBy(records, "coverageClassification"),
    counts_by_user_county: countBy(records, "userCounty"),
    counts_by_issue: countBy(records, "issue"),
    counts_by_entry_path: countBy(records, "sourceEntryPath"),
    intake_need_counts: intakeNeedCounts,
    related_resource_primary_count: primaryActionCounts["view-related-resource"],
    change_answers_primary_count: primaryActionCounts["change-answers"],
    guide_primary_count: primaryActionCounts["read-guide"],
    calculator_primary_count: primaryActionCounts["use-calculator"],
    general_directory_primary_count: primaryActionCounts["browse-general-directory"],
    unresolved_no_action_count: records.filter((record) => !record.primaryActionType).length,
    violations: violations.length
  },
  records,
  violations
};

writeJSON("data/primary-action-matrix.json", output);

if (primaryActionSum !== outcomes.length) throw new Error(`Primary action counts do not sum to ${outcomes.length}: ${primaryActionSum}`);
if (intakeNeedCounts["intake-unnecessarily-primary"] !== 0) throw new Error("Found unnecessarily primary Intake outcomes");
if (intakeNeedCounts["insufficient-evidence"] !== 0) throw new Error("Found Intake-primary outcomes with insufficient evidence");
if (violations.length) throw new Error(`Primary-action matrix violations:\n${JSON.stringify(violations.slice(0, 10), null, 2)}`);

console.log("PRIMARY_ACTION_MATRIX_PASS");
console.log(JSON.stringify(output.summary, null, 2));
