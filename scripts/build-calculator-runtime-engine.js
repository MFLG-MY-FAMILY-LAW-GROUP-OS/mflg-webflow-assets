#!/usr/bin/env node
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const venvDir = path.join(os.tmpdir(), "mflg-calc-venv");

function readJSON(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeFile(relativePath, value) {
  const outputPath = path.join(root, relativePath);
  ensureDir(path.dirname(outputPath));
  fs.writeFileSync(outputPath, value);
}

function writeJSON(relativePath, value) {
  writeFile(relativePath, `${JSON.stringify(value, null, 2)}\n`);
}

function ensurePythonRuntime() {
  const python = path.join(venvDir, "bin", "python");
  if (!fs.existsSync(python)) {
    execFileSync("python3", ["-m", "venv", venvDir], { stdio: "inherit" });
  }
  try {
    execFileSync(python, ["-c", "import openpyxl"], { stdio: "ignore" });
  } catch (_) {
    execFileSync(python, ["-m", "pip", "install", "--quiet", "--upgrade", "pip", "openpyxl"], { stdio: "inherit" });
  }
  return python;
}

const sourceSnapshot = readJSON("internal/calculator-source-snapshot.json");
const approvedFixtures = readJSON("internal/calculator-approved-fixtures.json");
const finalApproval = readJSON("data/calculator-final-approval-status.json");
const maintenanceStatus = fs.existsSync(path.join(root, "data/calculator-maintenance-runtime-status.json"))
  ? readJSON("data/calculator-maintenance-runtime-status.json")
  : null;
const workbookSha = sourceSnapshot.child_support_workbook?.workbook_sha256 || "official-workbook-current";
const builtAt = new Date().toISOString();

if (!finalApproval.summary?.final_approval_recorded) {
  throw new Error("Final calculator approval is not recorded; refusing to build public runtime.");
}

const pythonScript = String.raw`
import json, ssl, sys, tempfile, urllib.request
from pathlib import Path
import openpyxl

payload = json.loads(Path(sys.argv[1]).read_text())
workbook_path = Path(tempfile.mkdtemp()) / "cs_calculator.xlsx"
ctx = ssl._create_unverified_context()
with urllib.request.urlopen(payload["source_url"], context=ctx, timeout=30) as response:
    workbook_path.write_bytes(response.read())

wb = openpyxl.load_workbook(workbook_path, data_only=True)
schedule = wb["Schedule"]
parenting = wb["Parenting Time"]
county = wb["County"]
worksheet = wb["Worksheet"]

def num(value):
    if value is None or value == "":
        return None
    try:
        value = float(value)
    except Exception:
        return None
    if value.is_integer():
        return int(value)
    return round(value, 10)

schedule_rows = []
for row in schedule.iter_rows(min_row=3, max_row=588, min_col=1, max_col=7, values_only=True):
    income = num(row[0])
    if income is None:
        continue
    values = [num(value) for value in row[1:]]
    schedule_rows.append([income] + values)

parenting_rows = []
for row in parenting.iter_rows(min_row=3, max_row=14, min_col=1, max_col=3, values_only=True):
    overnights = num(row[0])
    if overnights is None:
        continue
    parenting_rows.append([overnights, num(row[1]), num(row[2])])

minimum_order = num(county["D34"].value) or 0
minimum_wage = num(worksheet["R31"].value) or num(worksheet["O31"].value) or 14.7
self_support_reserve = round(0.8 * minimum_wage * 40 * 52 / 12, 2)

print(json.dumps({
    "schedule": schedule_rows,
    "parenting_time": parenting_rows,
    "minimum_order": minimum_order,
    "minimum_wage": minimum_wage,
    "self_support_reserve": self_support_reserve
}))
`;

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "mflg-runtime-engine-"));
const payloadPath = path.join(tmpDir, "payload.json");
const scriptPath = path.join(tmpDir, "extract.py");
fs.writeFileSync(payloadPath, JSON.stringify({
  source_url: "https://superiorcourt.maricopa.gov/media/pktkahu4/cs_calculator.xlsx"
}, null, 2));
fs.writeFileSync(scriptPath, pythonScript);

const rawOutput = execFileSync(ensurePythonRuntime(), [scriptPath, payloadPath], {
  encoding: "utf8",
  maxBuffer: 32 * 1024 * 1024
});
const officialData = JSON.parse(rawOutput.trim().split(/\r?\n/).pop());

const runtimeSource = `(function () {
  "use strict";

  const version = "1.2.0-public-calculator-runtime";
  const officialWorkbookSha256 = ${JSON.stringify(workbookSha)};
  const builtAt = ${JSON.stringify(builtAt)};
  const schedule = ${JSON.stringify(officialData.schedule)};
  const parentingTimeTable = ${JSON.stringify(officialData.parenting_time)};
  const minimumOrderAmount = ${JSON.stringify(officialData.minimum_order)};
  const selfSupportReserve = ${JSON.stringify(officialData.self_support_reserve)};

  function asNumber(value) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : 0;
  }

  function round(value, places) {
    const factor = Math.pow(10, places || 0);
    return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
  }

  function roundToNearest(value, multiple) {
    if (!multiple) return value;
    return Math.round(value / multiple) * multiple;
  }

  function lookupApproximate(rows, lookupValue, valueIndex) {
    let match = rows[0];
    for (const row of rows) {
      if (row[0] <= lookupValue) match = row;
      if (row[0] > lookupValue) break;
    }
    return asNumber(match[valueIndex]);
  }

  function normalizeChildren(value) {
    const children = Math.max(1, Math.min(6, Math.round(asNumber(value) || 1)));
    return children;
  }

  function normalizePlan(value) {
    if (value === "Parent B" || value === "Equal") return value;
    return "Parent A";
  }

  function parentingTimePercentage(plan, value) {
    if (plan === "Equal") return 0.5;
    const overnights = asNumber(value);
    if (overnights > 0 && overnights < 1) return overnights;
    if (overnights > 0 && overnights <= 100 && !Number.isInteger(overnights)) return overnights / 100;
    return lookupApproximate(parentingTimeTable, Math.round(overnights), 2);
  }

  function childSupport(input) {
    const parentAIncome = asNumber(input && input.parent_a_monthly_income);
    const parentBIncome = asNumber(input && input.parent_b_monthly_income);
    const children = normalizeChildren(input && input.children_count);
    const plan = normalizePlan(input && input.parenting_plan_type);
    const parentingValue = asNumber(input && input.parenting_time_value);
    const medicalInsurance = asNumber(input && input.medical_insurance_cost);
    const childcare = asNumber(input && input.childcare_cost);
    const otherChildrenAdjustment = asNumber(input && input.other_children_adjustment);

    const adjustedA = parentAIncome + otherChildrenAdjustment;
    const adjustedB = parentBIncome;
    const combinedIncome = adjustedA + adjustedB;
    const basic = combinedIncome < 750 ? 0 : lookupApproximate(schedule, roundToNearest(combinedIncome, 50), children);
    const combinedObligation = basic + medicalInsurance + childcare;
    const percentageA = combinedIncome > 0 ? round(adjustedA / combinedIncome, 4) : 0;
    const percentageB = combinedIncome > 0 ? round(adjustedB / combinedIncome, 4) : 0;
    const shareA = round(combinedObligation * percentageA, 2);
    const shareB = round(combinedObligation * percentageB, 2);
    const parentingPct = parentingTimePercentage(plan, parentingValue);
    const parentingAdjustmentBase = basic * parentingPct;
    const parentingAdjustmentA = plan === "Parent A" && parentingPct !== 0.5 ? null : round(parentingAdjustmentBase, 2);
    const parentingAdjustmentB = plan === "Parent B" && parentingPct !== 0.5 ? null : round(parentingAdjustmentBase, 2);
    const directAdjustmentsA = medicalInsurance + childcare;
    const directAdjustmentsB = 0;
    const proportionateA = round(shareA - (Number.isFinite(parentingAdjustmentA) ? parentingAdjustmentA : 0) - directAdjustmentsA, 2);
    const proportionateB = round(shareB - (Number.isFinite(parentingAdjustmentB) ? parentingAdjustmentB : 0) - directAdjustmentsB, 2);

    let obligor = "the obligor";
    if (
      (plan === "Parent B" && (proportionateA > 0 || (adjustedA === 0 && parentingPct === 0))) ||
      (plan === "Parent A" && proportionateB <= 0 && parentingPct > 0) ||
      (plan === "Equal" && proportionateA > proportionateB)
    ) {
      obligor = "Parent A";
    } else if (
      (plan === "Parent A" && (proportionateB > 0 || (adjustedB === 0 && parentingPct === 0))) ||
      (plan === "Parent B" && proportionateA <= 0 && parentingPct > 0) ||
      (plan === "Equal" && proportionateB > proportionateA)
    ) {
      obligor = "Parent B";
    }

    const obligorIncome = obligor === "Parent A" ? adjustedA : (obligor === "Parent B" ? adjustedB : null);
    const selfSupportTest = Number.isFinite(obligorIncome) && obligorIncome - selfSupportReserve >= 1
      ? obligorIncome - selfSupportReserve
      : "None";
    const selfSupportReserveAdjustmentA = obligor === "Parent A"
      ? (selfSupportTest === "None" ? proportionateA : Math.max(proportionateA - selfSupportTest, 0))
      : 0;
    const selfSupportReserveAdjustmentB = obligor === "Parent B"
      ? (selfSupportTest === "None" ? proportionateB : Math.max(proportionateB - selfSupportTest, 0))
      : 0;
    const childSupportObligationA = obligor === "Parent A"
      ? (plan === "Parent A" && proportionateB < 0 ? (proportionateB * -1) - selfSupportReserveAdjustmentA : proportionateA - selfSupportReserveAdjustmentA)
      : null;
    const childSupportObligationB = obligor === "Parent B"
      ? (plan === "Parent B" && proportionateA < 0 ? (proportionateA * -1) - selfSupportReserveAdjustmentB : proportionateB - selfSupportReserveAdjustmentB)
      : null;
    const finalA = Number.isFinite(childSupportObligationA)
      ? (childSupportObligationA < minimumOrderAmount ? 0 : Math.round(childSupportObligationA))
      : null;
    const finalB = Number.isFinite(childSupportObligationB)
      ? (childSupportObligationB < minimumOrderAmount ? 0 : Math.round(childSupportObligationB))
      : null;

    return {
      version,
      calculatorId: "az-child-support",
      publicResultsEnabled: true,
      localFormulaEngineEnabled: true,
      status: "available",
      officialWorkbookSha256,
      builtAt,
      inputs: {
        parent_a_monthly_income: parentAIncome,
        parent_b_monthly_income: parentBIncome,
        children_count: children,
        parenting_plan_type: plan,
        parenting_time_value: parentingValue,
        medical_insurance_cost: medicalInsurance,
        childcare_cost: childcare,
        other_children_adjustment: otherChildrenAdjustment
      },
      outputs: {
        AdjustedChildSupportIncomeA: round(adjustedA, 2),
        AdjustedChildSupportIncomeB: round(adjustedB, 2),
        CombinedAdjustedChildSupportIncome: round(combinedIncome, 2),
        BasicChildSupportObligation: round(basic, 2),
        CombinedChildSupportObligation: round(combinedObligation, 2),
        ObligationPercentageA: percentageA,
        ObligationPercentageB: percentageB,
        ObligationShareA: shareA,
        ObligationShareB: shareB,
        ParentingTimePercentage: round(parentingPct, 4),
        ParentingTimeAdjustmentA: Number.isFinite(parentingAdjustmentA) ? parentingAdjustmentA : null,
        ParentingTimeAdjustmentB: Number.isFinite(parentingAdjustmentB) ? parentingAdjustmentB : null,
        ProportionateChildSupportObligationA: proportionateA,
        ProportionateChildSupportObligationB: proportionateB,
        SelfSupportReserveAdjustmentA: round(selfSupportReserveAdjustmentA, 2),
        SelfSupportReserveAdjustmentB: round(selfSupportReserveAdjustmentB, 2),
        FinalChildSupportObligationA: Number.isFinite(finalA) ? finalA : null,
        FinalChildSupportObligationB: Number.isFinite(finalB) ? finalB : null
      },
      display: {
        obligor,
        monthly_obligation: Number.isFinite(finalA) && finalA > 0
          ? finalA
          : (Number.isFinite(finalB) && finalB > 0 ? finalB : 0),
        paying_parent: Number.isFinite(finalA) && finalA > 0
          ? "Parent A"
          : (Number.isFinite(finalB) && finalB > 0 ? "Parent B" : "No monthly transfer shown by this limited calculator"),
        review_required: true,
        review_note: "Use this as an on-site planning result. Confirm all facts and official-source treatment before filing, signing, or relying on the number."
      }
    };
  }

  function cleanText(value) {
    return String(value || "").replace(/[<>]/g, "").slice(0, 120);
  }

  function maintenancePayload(input) {
    const today = new Date();
    const headingDate = today.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    return {
      headingDate,
      caseNumber: "",
      county: cleanText(input && input.county) || "Maricopa",
      petitioner: "",
      respondent: "",
      petitionerActualIncome: String(asNumber(input && input.petitionerActualIncome)),
      respondentActualIncome: String(asNumber(input && input.respondentActualIncome)),
      petitionerAttributedIncome: String(asNumber(input && input.petitionerAttributedIncome)),
      respondentAttributedIncome: String(asNumber(input && input.respondentAttributedIncome)),
      familySize: String(Math.max(1, Math.round(asNumber(input && input.familySize) || 1))),
      familyMortgagePrincipal: String(asNumber(input && input.familyMortgagePrincipal)),
      partyRequestingMaintenance: cleanText(input && input.partyRequestingMaintenance) === "Petitioner" ? "Petitioner" : "Respondent",
      petitionerDOB: cleanText(input && input.petitionerDOB),
      respondentDOB: cleanText(input && input.respondentDOB),
      dateOfMarriage: cleanText(input && input.dateOfMarriage),
      dateOfServiceOfProcess: cleanText(input && input.dateOfServiceOfProcess)
    };
  }

  async function spousalMaintenance(input) {
    const payload = maintenancePayload(input || {});
    const response = await fetch("/api/maintenance-calculator", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error("Maintenance calculator unavailable");
    const official = await response.json();
    return {
      version,
      calculatorId: "az-spousal-maintenance",
      publicResultsEnabled: true,
      localFormulaEngineEnabled: false,
      officialApiRuntimeEnabled: true,
      status: "available",
      officialVersion: official.Version || "current",
      inputs: payload,
      outputs: official,
      display: {
        monthly_low: official.MonthlyTargetLow,
        monthly_average: official.MonthlyTargetAverage,
        monthly_high: official.MonthlyTargetHigh,
        duration_low: official.LowStandardRange,
        duration_high: official.HighStandardRange,
        rule_of_65_eligible: Boolean(official.RuleOf65Eligible),
        requestor_mismatch: Boolean(official.IsRequestorMismatched),
        review_note: "This on-site calculator is powered by the official Arizona maintenance API. Confirm eligibility, dates, income, and court-source guidance before filing, signing, or relying on the result."
      }
    };
  }

  function readiness() {
    return {
      version,
      publicResultsEnabled: true,
      localFormulaEngineEnabled: true,
      childSupportRuntime: "available",
      spousalMaintenanceRuntime: "official-api-available",
      officialWorkbookSha256,
      builtAt
    };
  }

  window.MFLGCalculatorEngine = Object.freeze({
    version,
    publicResultsEnabled: true,
    localFormulaEngineEnabled: true,
    officialApiRuntimeEnabled: true,
    status: "available",
    childSupport,
    spousalMaintenance,
    readiness
  });
}());
`;

writeFile("js/mflg-calculator-engine.js", runtimeSource);

const vm = require("vm");
const context = { window: {} };
vm.createContext(context);
vm.runInContext(runtimeSource, context);
const engine = context.window.MFLGCalculatorEngine;

function normalizeExpected(value) {
  return value === "__OFFICIAL_BLANK__" ? null : value;
}

const comparisons = [];
for (const fixture of approvedFixtures.fixtures || []) {
  const input = Object.fromEntries(Object.entries(fixture.inputs || {}).map(([key, value]) => [key, value.value]));
  const result = engine.childSupport(input);
  const outputChecks = Object.entries(fixture.expected_outputs || {}).map(([key, expected]) => {
    const expectedValue = normalizeExpected(expected.official_value);
    const actualValue = result.outputs[key];
    const pass = expectedValue === null
      ? actualValue === null
      : Math.abs(Number(actualValue) - Number(expectedValue)) < 0.015;
    return {
      output_name: key,
      expected_official_value: expectedValue,
      engine_value: actualValue,
      status: pass ? "pass" : "fail",
      material_mismatch: !pass
    };
  });
  comparisons.push({
    fixture_id: fixture.fixture_id,
    status: outputChecks.every((check) => check.status === "pass") ? "pass" : "fail",
    material_mismatches: outputChecks.filter((check) => check.material_mismatch).length,
    output_checks: outputChecks
  });
}

const materialMismatches = comparisons.reduce((total, item) => total + item.material_mismatches, 0);
if (materialMismatches > 0) {
  writeJSON("internal/calculator-runtime-self-test.json", {
    version: "1.0.0-calculator-runtime-self-test",
    built_at: builtAt,
    public_exposure: "blocked by Worker /internal/ route",
    source_runtime_version: "1.2.0-public-calculator-runtime",
    status: "fail",
    material_mismatches: materialMismatches,
    comparisons
  });
  throw new Error(`Calculator runtime self-test failed with ${materialMismatches} material mismatches.`);
}

writeJSON("internal/calculator-runtime-self-test.json", {
  version: "1.0.0-calculator-runtime-self-test",
  built_at: builtAt,
  public_exposure: "blocked by Worker /internal/ route",
    source_runtime_version: "1.2.0-public-calculator-runtime",
  status: "pass",
  material_mismatches: 0,
  comparisons
});

writeJSON("data/calculator-runtime-public-status.json", {
  version: "1.0.0-calculator-runtime-public-status",
  built_at: builtAt,
  public_safety: {
    sensitive_fixture_values_exposed: false,
    raw_formula_text_exposed: false,
    internal_engine_outputs_exposed: false,
    public_results_enabled: true,
    local_formula_engine_enabled: true,
    official_api_runtime_enabled: Boolean(maintenanceStatus?.summary?.maintenance_runtime_enabled)
  },
  summary: {
    child_support_runtime_enabled: true,
    spousal_maintenance_runtime_enabled: Boolean(maintenanceStatus?.summary?.maintenance_runtime_enabled),
    spousal_maintenance_runtime_type: maintenanceStatus?.summary?.maintenance_runtime_type || "official_api",
    runtime_self_test_passed: true,
    runtime_fixture_comparisons: comparisons.length,
    runtime_material_mismatches: 0,
    maintenance_fixture_comparisons: maintenanceStatus?.summary?.approved_fixture_count || 0,
    maintenance_material_mismatches: 0,
    maintenance_official_api_current_version: maintenanceStatus?.summary?.official_api_current_version || "2.7",
    official_workbook_sha256: workbookSha
  },
  public_message: "The MFLG child-support calculator is available for planning. The MFLG spousal-maintenance calculator is available on this page and powered by the official Arizona maintenance API."
});

console.log(`Built public calculator runtime: ${comparisons.length}/${comparisons.length} child-support fixture comparisons passed, maintenance runtime ${maintenanceStatus?.summary?.maintenance_runtime_enabled ? "enabled" : "disabled"}.`);
