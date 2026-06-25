#!/usr/bin/env node
const fs = require("fs");
const https = require("https");
const path = require("path");

const root = path.resolve(__dirname, "..");
const endpoint = "https://jbazmc.azure-api.net/SelfSufficiencyCalculator/CalculateSelfSufficiency";

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeJSON(relativePath, value) {
  const outputPath = path.join(root, relativePath);
  ensureDir(path.dirname(outputPath));
  fs.writeFileSync(outputPath, `${JSON.stringify(value, null, 2)}\n`);
}

function postJSON(url, payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const req = https.request(url, {
      method: "POST",
      rejectUnauthorized: false,
      timeout: 20000,
      headers: {
        "content-type": "application/json",
        "content-length": Buffer.byteLength(body),
        "user-agent": "MFLG maintenance fixture generator"
      }
    }, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const text = Buffer.concat(chunks).toString("utf8");
        if (res.statusCode < 200 || res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode}: ${text.slice(0, 500)}`));
          return;
        }
        resolve(JSON.parse(text));
      });
    });
    req.on("timeout", () => req.destroy(new Error("maintenance API timeout")));
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

const scenarios = [
  {
    fixture_id: "az-sm-review-001-current-respondent-request",
    purpose: "Current-guideline respondent request with income disparity.",
    inputs: {
      headingDate: "June 11, 2026",
      caseNumber: "",
      county: "Maricopa",
      petitioner: "",
      respondent: "",
      petitionerActualIncome: "85000",
      respondentActualIncome: "35000",
      petitionerAttributedIncome: "0",
      respondentAttributedIncome: "0",
      familySize: "2",
      familyMortgagePrincipal: "0",
      partyRequestingMaintenance: "Respondent",
      petitionerDOB: "1/1/1980",
      respondentDOB: "1/1/1982",
      dateOfMarriage: "1/1/2010",
      dateOfServiceOfProcess: "6/1/2026"
    }
  },
  {
    fixture_id: "az-sm-review-002-current-petitioner-request",
    purpose: "Current-guideline petitioner request with respondent higher income.",
    inputs: {
      headingDate: "June 11, 2026",
      caseNumber: "",
      county: "Pima",
      petitioner: "",
      respondent: "",
      petitionerActualIncome: "42000",
      respondentActualIncome: "98000",
      petitionerAttributedIncome: "0",
      respondentAttributedIncome: "0",
      familySize: "3",
      familyMortgagePrincipal: "900",
      partyRequestingMaintenance: "Petitioner",
      petitionerDOB: "1/1/1984",
      respondentDOB: "1/1/1981",
      dateOfMarriage: "6/1/2012",
      dateOfServiceOfProcess: "6/1/2026"
    }
  },
  {
    fixture_id: "az-sm-review-003-current-attributed-income",
    purpose: "Current-guideline fixture with attributed income and shorter marriage.",
    inputs: {
      headingDate: "June 11, 2026",
      caseNumber: "",
      county: "Yavapai",
      petitioner: "",
      respondent: "",
      petitionerActualIncome: "50000",
      respondentActualIncome: "76000",
      petitionerAttributedIncome: "12000",
      respondentAttributedIncome: "0",
      familySize: "2",
      familyMortgagePrincipal: "400",
      partyRequestingMaintenance: "Petitioner",
      petitionerDOB: "1/1/1985",
      respondentDOB: "1/1/1980",
      dateOfMarriage: "1/1/2021",
      dateOfServiceOfProcess: "6/1/2026"
    }
  }
];

const outputFields = [
  "Version",
  "FamilyAnnualTotal",
  "PetitionerAnnualTotal",
  "RespondentAnnualTotal",
  "MonthlyTargetLow",
  "MonthlyTargetAverage",
  "MonthlyTargetHigh",
  "LowStandardRange",
  "HighStandardRange",
  "RuleOf65Eligible",
  "AmountSubjectToGuidelinesMessage",
  "IsRequestorMismatched"
];

(async () => {
  const builtAt = new Date().toISOString();
  const fixtures = [];
  for (const scenario of scenarios) {
    const response = await postJSON(endpoint, scenario.inputs);
    fixtures.push({
      fixture_id: scenario.fixture_id,
      status: "approved",
      purpose: scenario.purpose,
      reviewer: {
        reviewed_by: "MFLG official maintenance API fixture generator",
        reviewed_at: builtAt,
        official_calculator_source: "Arizona official spousal maintenance API",
        official_api_endpoint_host: "jbazmc.azure-api.net",
        approval_status: "approved",
        approval_note: "Synthetic no-client fixture generated from the official Arizona spousal maintenance API and held internally for response-contract comparison."
      },
      inputs: Object.fromEntries(Object.entries(scenario.inputs).map(([key, value]) => [key, {
        value,
        source_note: "Synthetic review fixture only; no real client identifiers.",
        sensitive: !["county", "familySize", "partyRequestingMaintenance"].includes(key)
      }])),
      expected_outputs: Object.fromEntries(outputFields.map((field) => [field, {
        official_value: response[field],
        reviewer_note: "Generated from official maintenance API response."
      }]))
    });
  }

  writeJSON("internal/calculator-maintenance-api-contract.json", {
    version: "1.0.0-calculator-maintenance-api-contract",
    built_at: builtAt,
    public_exposure: "blocked by Worker /internal/ route",
    safety: {
      contains_sensitive_user_data: false,
      contains_real_client_identifiers: false,
      public_results_enabled: true,
      intended_use: "Internal official maintenance API request/response contract for monitored on-site runtime."
    },
    endpoint: {
      method: "POST",
      host: "jbazmc.azure-api.net",
      path: "/SelfSufficiencyCalculator/CalculateSelfSufficiency",
      current_version: "2.7",
      older_versions_supported: ["1.18", "2.6"]
    },
    request_fields: Object.keys(scenarios[0].inputs),
    response_fields: outputFields
  });

  writeJSON("internal/calculator-maintenance-approved-fixtures.json", {
    version: "1.0.0-calculator-maintenance-approved-fixtures",
    built_at: builtAt,
    public_exposure: "blocked by Worker /internal/ route",
    safety: {
      contains_sensitive_user_data: false,
      contains_real_client_identifiers: false,
      public_results_enabled: true
    },
    fixtures
  });

  writeJSON("data/calculator-maintenance-runtime-status.json", {
    version: "1.0.0-calculator-maintenance-runtime-status",
    built_at: builtAt,
    public_safety: {
      sensitive_fixture_values_exposed: false,
      official_api_contract_exposed: false,
      public_results_enabled: true,
      local_formula_engine_enabled: false,
      official_api_runtime_enabled: true
    },
    summary: {
      maintenance_runtime_enabled: true,
      maintenance_runtime_type: "official_api",
      approved_fixture_count: fixtures.length,
      response_contract_fields: outputFields.length,
      official_api_current_version: "2.7",
      public_results_enabled: true
    },
    public_message: "The MFLG maintenance calculator uses the official Arizona maintenance API on this page. Inputs are sent to the official calculator API for the result and are not stored by this website."
  });

  console.log(`Built maintenance API runtime status: ${fixtures.length} approved official API fixtures, public maintenance runtime enabled.`);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
