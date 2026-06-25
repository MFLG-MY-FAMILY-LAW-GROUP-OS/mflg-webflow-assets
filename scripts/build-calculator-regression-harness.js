#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

function readJSON(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeJSON(relativePath, value) {
  const outputPath = path.join(root, relativePath);
  ensureDir(path.dirname(outputPath));
  fs.writeFileSync(outputPath, `${JSON.stringify(value, null, 2)}\n`);
}

const formulaMap = readJSON("internal/calculator-formula-map.json");
const namedCells = formulaMap.named_cells || [];
const namedByName = new Map(namedCells.map((item) => [item.name, item]));

const requiredOutputs = [
  "AdjustedChildSupportIncomeA",
  "AdjustedChildSupportIncomeB",
  "CombinedAdjustedChildSupportIncome",
  "BasicChildSupportObligation",
  "CombinedChildSupportObligation",
  "ObligationPercentageA",
  "ObligationPercentageB",
  "ObligationShareA",
  "ObligationShareB",
  "ParentingTimePercentage",
  "ParentingTimeAdjustmentA",
  "ParentingTimeAdjustmentB",
  "ProportionateChildSupportObligationA",
  "ProportionateChildSupportObligationB",
  "SelfSupportReserveAdjustmentA",
  "SelfSupportReserveAdjustmentB",
  "FinalChildSupportObligationA",
  "FinalChildSupportObligationB"
].map((name) => {
  const cell = namedByName.get(name) || {};
  return {
    name,
    target: cell.target || null,
    formula_hash: cell.formula_hash || null,
    dependencies: cell.dependencies || []
  };
});

const requiredInputs = [
  {
    key: "parent_a_monthly_income",
    public_label: "Parent A monthly income",
    workbook_target_candidates: ["Worksheet!J51", "Worksheet!M51", "Worksheet!P51", "Worksheet!S51"],
    sensitive: true
  },
  {
    key: "parent_b_monthly_income",
    public_label: "Parent B monthly income",
    workbook_target_candidates: ["Worksheet!J52", "Worksheet!M52", "Worksheet!P52", "Worksheet!S52"],
    sensitive: true
  },
  {
    key: "children_count",
    public_label: "Number of children in this worksheet",
    workbook_target_candidates: ["Worksheet!G64"],
    sensitive: false
  },
  {
    key: "parenting_plan_type",
    public_label: "Parenting plan type",
    workbook_target_candidates: ["DefinedNames!B15"],
    sensitive: false
  },
  {
    key: "parenting_time_value",
    public_label: "Parenting time count or percentage",
    workbook_target_candidates: ["Worksheet!K74", "Worksheet!O74"],
    sensitive: false
  },
  {
    key: "medical_insurance_cost",
    public_label: "Monthly medical insurance cost for children",
    workbook_target_candidates: ["Worksheet!U65", "Worksheet!Y65"],
    sensitive: true
  },
  {
    key: "childcare_cost",
    public_label: "Monthly childcare cost",
    workbook_target_candidates: ["Worksheet!U66", "Worksheet!Y66"],
    sensitive: true
  },
  {
    key: "other_children_adjustment",
    public_label: "Adjustment for other children, if applicable",
    workbook_target_candidates: ["Worksheet!G57", "Worksheet!G58"],
    sensitive: true
  }
];

const scenarioTemplates = [
  {
    fixture_id: "az-cs-review-001-basic-two-parent-one-child",
    status: "needs_official_output",
    purpose: "Basic one-child worksheet path with both parents' monthly income and no special adjustments.",
    required_official_outputs: requiredOutputs.map((item) => item.name)
  },
  {
    fixture_id: "az-cs-review-002-parenting-time-adjustment",
    status: "needs_official_output",
    purpose: "Worksheet path where parenting-time adjustment changes the proportional obligation.",
    required_official_outputs: requiredOutputs.map((item) => item.name)
  },
  {
    fixture_id: "az-cs-review-003-self-support-reserve",
    status: "needs_official_output",
    purpose: "Worksheet path that exercises the self-support reserve branch.",
    required_official_outputs: requiredOutputs.map((item) => item.name)
  },
  {
    fixture_id: "az-cs-review-004-other-children-adjustment",
    status: "needs_official_output",
    purpose: "Worksheet path that exercises other-children adjustment fields.",
    required_official_outputs: requiredOutputs.map((item) => item.name)
  }
];

const approvedFixtures = [];
const pendingFixtures = scenarioTemplates.filter((item) => item.status !== "approved");

const internalHarness = {
  version: "1.0.0-calculator-regression-harness",
  built_at: new Date().toISOString(),
  public_exposure: "blocked by Worker /internal/ route",
  source_formula_map_version: formulaMap.version,
  source_workbook_sha256: formulaMap.source?.workbook_sha256 || null,
  safety: {
    contains_sensitive_user_data: false,
    contains_raw_formula_text: false,
    public_results_enabled: false,
    reviewer_approval_required: true,
    intended_use: "Internal official-output regression test planning only."
  },
  required_inputs: requiredInputs,
  required_outputs: requiredOutputs,
  scenario_templates: scenarioTemplates,
  approved_fixtures: approvedFixtures,
  pending_fixtures: pendingFixtures,
  next_steps: [
    "Enter official calculator outputs for each scenario template after reviewer confirmation.",
    "Build local evaluator tests that compare MFLG engine outputs to official worksheet outputs.",
    "Require zero material mismatches before enabling public MFLG child-support results.",
    "Keep sensitive fixture values out of public data files."
  ]
};

const publicReadiness = {
  version: "1.0.0-calculator-regression-readiness",
  built_at: internalHarness.built_at,
  public_safety: {
    raw_formula_text_exposed: false,
    sensitive_fixture_values_exposed: false,
    public_results_enabled: false,
    reviewer_approval_required: true
  },
  summary: {
    regression_harness_ready: true,
    scenario_templates_ready: scenarioTemplates.length,
    approved_regression_fixtures: approvedFixtures.length,
    pending_official_output_fixtures: pendingFixtures.length,
    required_output_checks: requiredOutputs.length,
    local_formula_engine_enabled: false
  },
  public_message: "Regression-test templates are ready internally. Public MFLG child-support results remain locked until official-output fixtures are approved and pass."
};

writeJSON("internal/calculator-regression-harness.json", internalHarness);
writeJSON("data/calculator-regression-readiness.json", publicReadiness);
console.log(`Built calculator regression harness: ${scenarioTemplates.length} templates, ${approvedFixtures.length} approved fixtures, ${requiredOutputs.length} output checks.`);
