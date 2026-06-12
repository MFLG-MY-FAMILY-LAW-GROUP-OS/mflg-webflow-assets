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
const regressionHarness = readJSON("internal/calculator-regression-harness.json");
const formulaCells = formulaMap.formula_cells || [];
const namedCells = formulaMap.named_cells || [];
const requiredOutputs = regressionHarness.required_outputs || [];
const requiredInputs = regressionHarness.required_inputs || [];

const knownExcelFunctions = [
  "ABS", "ADDRESS", "AND", "AVERAGE", "CEILING", "CHOOSE", "COLUMN", "COLUMNS",
  "CHAR", "CONCAT", "CONCATENATE", "COUNT", "COUNTA", "COUNTBLANK", "COUNTIF", "DATE",
  "DAY", "DAYS", "EDATE", "EOMONTH", "EVEN", "EXACT", "FALSE", "FIND",
  "FLOOR", "HLOOKUP", "IF", "IFERROR", "INDEX", "INDIRECT", "ISBLANK",
  "ISEVEN", "ISNUMBER", "ISTEXT", "LEFT", "LEN", "LOOKUP", "LOWER", "MATCH",
  "MAX", "MID", "MIN", "MOD", "MONTH", "MROUND", "NOT", "ODD", "OR", "PROPER",
  "ROUND", "ROUNDDOWN", "ROUNDUP", "ROW", "ROWS", "SEARCH", "SUBSTITUTE", "SUM",
  "SUMIF", "TEXT", "TODAY", "TRUE", "TRIM", "UPPER", "VLOOKUP", "YEAR"
];
const functionPattern = /\b([A-Z][A-Z0-9.]*)\s*\(/g;
function stripQuotedExcelStrings(formula) {
  return String(formula || "").replace(/"(?:""|[^"])*"/g, "\"\"");
}
const functionsUsed = new Set();
for (const cell of formulaCells) {
  for (const match of stripQuotedExcelStrings(cell.formula).matchAll(functionPattern)) {
    functionsUsed.add(match[1].toUpperCase());
  }
}
const functionList = Array.from(functionsUsed).sort();
const supportedFunctions = functionList.filter((name) => knownExcelFunctions.includes(name));
const unsupportedFunctions = functionList.filter((name) => !knownExcelFunctions.includes(name));

const namedOutputMap = requiredOutputs.map((output) => {
  const cell = namedCells.find((item) => item.name === output.name) || {};
  return {
    name: output.name,
    target: output.target || cell.target || null,
    formula_hash: output.formula_hash || cell.formula_hash || null,
    dependency_count: (output.dependencies || cell.dependencies || []).length,
    evaluator_status: "waiting_for_fixture"
  };
});

const engineScaffold = {
  version: "1.0.0-calculator-engine-scaffold",
  built_at: new Date().toISOString(),
  public_exposure: "blocked by Worker /internal/ route",
  source_formula_map_version: formulaMap.version,
  source_regression_harness_version: regressionHarness.version,
  source_workbook_sha256: formulaMap.source?.workbook_sha256 || null,
  safety: {
    contains_sensitive_user_data: false,
    contains_raw_formula_text: false,
    public_results_enabled: false,
    local_formula_engine_enabled: false,
    reviewer_approval_required: true,
    intended_use: "Internal child-support evaluator scaffold and test gating only."
  },
  summary: {
    required_input_fields: requiredInputs.length,
    required_output_checks: requiredOutputs.length,
    formula_cells_available: formulaCells.length,
    named_outputs_mapped: namedOutputMap.length,
    excel_functions_used: functionList.length,
    excel_functions_supported_in_scaffold: supportedFunctions.length,
    unsupported_excel_functions: unsupportedFunctions.length,
    approved_regression_fixtures: (regressionHarness.approved_fixtures || []).length,
    executable_regression_tests: 0,
    material_mismatches: 0,
    public_unlock_ready: false
  },
  evaluator_contract: {
    input_policy: "Use approved internal fixtures only until public collection and formula outputs are separately approved.",
    output_policy: "Do not return child-support dollar results publicly until every approved fixture passes and reviewer approval is recorded.",
    comparison_tolerance: {
      currency: "exact dollars unless reviewer approves rounding tolerance",
      percentage: "exact to workbook output unless reviewer approves rounding tolerance"
    }
  },
  required_inputs: requiredInputs.map((item) => ({
    key: item.key,
    workbook_target_candidates: item.workbook_target_candidates || [],
    sensitive: Boolean(item.sensitive)
  })),
  required_outputs: namedOutputMap,
  excel_function_inventory: {
    supported: supportedFunctions,
    unsupported: unsupportedFunctions
  },
  gates: [
    {
      key: "formula_map_ready",
      status: formulaCells.length > 0 ? "pass" : "blocked"
    },
    {
      key: "regression_fixtures_approved",
      status: (regressionHarness.approved_fixtures || []).length > 0 ? "pass" : "blocked"
    },
    {
      key: "unsupported_excel_functions_resolved",
      status: unsupportedFunctions.length === 0 ? "pass" : "review"
    },
    {
      key: "public_results_enabled",
      status: "blocked"
    }
  ],
  next_steps: [
    "Enter reviewer-approved official-output fixtures into the internal harness.",
    "Implement formula evaluator functions only for formulas needed by required outputs.",
    "Run fixture comparisons and record mismatches internally.",
    "Enable public MFLG results only after approved fixtures pass and reviewer approval is recorded."
  ]
};

const publicReadiness = {
  version: "1.0.0-calculator-engine-readiness",
  built_at: engineScaffold.built_at,
  public_safety: {
    raw_formula_text_exposed: false,
    sensitive_fixture_values_exposed: false,
    public_results_enabled: false,
    local_formula_engine_enabled: false,
    reviewer_approval_required: true
  },
  summary: {
    engine_scaffold_ready: true,
    required_input_fields: engineScaffold.summary.required_input_fields,
    required_output_checks: engineScaffold.summary.required_output_checks,
    excel_functions_used: engineScaffold.summary.excel_functions_used,
    unsupported_excel_functions: engineScaffold.summary.unsupported_excel_functions,
    approved_regression_fixtures: engineScaffold.summary.approved_regression_fixtures,
    executable_regression_tests: 0,
    material_mismatches: 0,
    public_unlock_ready: false
  },
  public_message: "The internal MFLG child-support engine scaffold is ready for approved fixture testing. Public formula results remain locked."
};

writeJSON("internal/calculator-engine-scaffold.json", engineScaffold);
writeJSON("data/calculator-engine-readiness.json", publicReadiness);
console.log(`Built calculator engine scaffold: ${namedOutputMap.length} outputs, ${functionList.length} Excel functions, ${unsupportedFunctions.length} unsupported functions.`);
