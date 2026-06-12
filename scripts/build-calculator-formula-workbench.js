#!/usr/bin/env node
const crypto = require("crypto");
const fs = require("fs");
const https = require("https");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const internalDir = path.join(root, "internal");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeJSON(relativePath, value) {
  const outputPath = path.join(root, relativePath);
  ensureDir(path.dirname(outputPath));
  fs.writeFileSync(outputPath, `${JSON.stringify(value, null, 2)}\n`);
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function download(url, outputPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outputPath);
    const req = https.get(url, {
      rejectUnauthorized: false,
      headers: { "user-agent": "MFLG formula workbench" },
      timeout: 20000
    }, (res) => {
      if (res.statusCode < 200 || res.statusCode >= 400) {
        file.close();
        fs.rmSync(outputPath, { force: true });
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      const headers = res.headers;
      res.pipe(file);
      file.on("finish", () => {
        file.close(() => resolve(headers));
      });
    });
    req.on("timeout", () => req.destroy(new Error(`timeout for ${url}`)));
    req.on("error", (error) => {
      file.close();
      fs.rmSync(outputPath, { force: true });
      reject(error);
    });
  });
}

function request(url) {
  return new Promise((resolve) => {
    const req = https.get(url, {
      rejectUnauthorized: false,
      headers: { "user-agent": "MFLG formula workbench" },
      timeout: 20000
    }, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => resolve({
        ok: res.statusCode >= 200 && res.statusCode < 400,
        status: res.statusCode,
        headers: res.headers,
        body: Buffer.concat(chunks).toString("utf8")
      }));
    });
    req.on("timeout", () => {
      req.destroy();
      resolve({ ok: false, status: 0, headers: {}, body: "", error: "timeout" });
    });
    req.on("error", (error) => resolve({ ok: false, status: 0, headers: {}, body: "", error: error.message }));
  });
}

function unzipText(zipPath, entry) {
  return execFileSync("unzip", ["-p", zipPath, entry], { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
}

function unzipList(zipPath) {
  return execFileSync("unzip", ["-Z1", zipPath], { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 })
    .split(/\r?\n/)
    .filter(Boolean);
}

function parseWorkbook(zipPath) {
  const entries = unzipList(zipPath);
  const worksheetEntries = entries.filter((entry) => /^xl\/worksheets\/sheet\d+\.xml$/.test(entry));
  const workbookXml = entries.includes("xl/workbook.xml") ? unzipText(zipPath, "xl/workbook.xml") : "";
  const sheetNames = Array.from(workbookXml.matchAll(/<sheet[^>]*name="([^"]+)"/g)).map((match) => match[1]);
  const definedNames = Array.from(workbookXml.matchAll(/<definedName[^>]*name="([^"]+)"[^>]*>(.*?)<\/definedName>/g)).map((match) => ({
    name: match[1],
    target_hash: sha256(match[2]).slice(0, 16)
  }));

  const sheets = worksheetEntries.map((entry, index) => {
    const xml = unzipText(zipPath, entry);
    const formulas = Array.from(xml.matchAll(/<c[^>]*r="([^"]+)"[^>]*>[\s\S]*?<f[^>]*>([\s\S]*?)<\/f>/g)).map((match) => ({
      cell: match[1],
      hash: sha256(match[2]).slice(0, 16),
      length: match[2].length
    }));
    return {
      sheet_entry: entry,
      sheet_name: sheetNames[index] || `Sheet ${index + 1}`,
      formula_count: formulas.length,
      formula_cells: formulas.slice(0, 80)
    };
  });

  return {
    worksheet_count: worksheetEntries.length,
    formula_count: sheets.reduce((sum, sheet) => sum + sheet.formula_count, 0),
    defined_name_count: definedNames.length,
    sheet_names: sheetNames,
    defined_names: definedNames,
    sheets
  };
}

function parseMaintenance(html) {
  const ids = new Set();
  for (const match of html.matchAll(/\b(?:id|name)="([^"]+)"/g)) {
    const value = match[1];
    if (/income|amount|maintenance|duration|marriage|child|debt|asset|expense|requesting|version|case|party/i.test(value)) {
      ids.add(value);
    }
  }
  const apiVersions = new Set();
  for (const match of html.matchAll(/version=([0-9.]+)/gi)) apiVersions.add(match[1]);
  if (html.includes("CalculateSelfSufficiency")) apiVersions.add("current");
  const effectiveDates = Array.from(html.matchAll(/Effective as of\s+([0-9/]+)/gi)).map((match) => match[1]);
  return {
    current_api_detected: html.includes("CalculateSelfSufficiency"),
    api_versions_detected: Array.from(apiVersions),
    effective_dates_detected: Array.from(new Set(effectiveDates)),
    candidate_input_count: ids.size,
    candidate_inputs: Array.from(ids).sort()
  };
}

async function main() {
  ensureDir(internalDir);
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "mflg-calc-"));
  const childSupportUrl = "https://superiorcourt.maricopa.gov/media/pktkahu4/cs_calculator.xlsx";
  const maintenanceUrl = "https://www.superiorcourt.maricopa.gov/app/selfsuffcalc/";
  const workbookPath = path.join(tmpDir, "cs_calculator.xlsx");
  const workbookHeaders = await download(childSupportUrl, workbookPath);
  const workbook = parseWorkbook(workbookPath);
  const maintenance = await request(maintenanceUrl);
  const maintenanceMap = parseMaintenance(maintenance.body || "");

  const internalWorkbench = {
    version: "1.0.0-calculator-formula-workbench",
    built_at: new Date().toISOString(),
    public_exposure: "blocked by Worker /internal/ route",
    sources: {
      child_support_workbook: {
        source_url: childSupportUrl,
        content_type: workbookHeaders["content-type"] || "",
        content_length: workbookHeaders["content-length"] || "",
        last_modified: workbookHeaders["last-modified"] || "",
        workbook
      },
      spousal_maintenance_calculator: {
        source_url: maintenanceUrl,
        status: maintenance.status,
        ...maintenanceMap
      }
    },
    next_steps: [
      "Map child-support worksheet formulas to named calculation functions.",
      "Create official-output regression fixtures before any public local result is enabled.",
      "Map maintenance API request and response behavior for the current effective version.",
      "Keep public local calculator results locked until reviewer approval is recorded."
    ]
  };

  const publicSummary = {
    version: "1.0.0-calculator-formula-source-summary",
    built_at: internalWorkbench.built_at,
    public_safety: {
      raw_formula_text_exposed: false,
      raw_hashes_exposed: false,
      raw_etags_exposed: false,
      contains_sensitive_user_data: false
    },
    summary: {
      child_support_workbook_reachable: true,
      child_support_worksheet_count: workbook.worksheet_count,
      child_support_formula_count: workbook.formula_count,
      child_support_defined_name_count: workbook.defined_name_count,
      maintenance_page_reachable: maintenance.ok,
      maintenance_current_api_detected: maintenanceMap.current_api_detected,
      maintenance_candidate_input_count: maintenanceMap.candidate_input_count,
      local_formula_results_enabled: false
    },
    public_message: "Formula source inventory is available for internal mapping. Public local calculator results remain locked until formula mapping and regression tests are approved."
  };

  writeJSON("internal/calculator-formula-workbench.json", internalWorkbench);
  writeJSON("data/calculator-formula-source-summary.json", publicSummary);
  fs.rmSync(tmpDir, { recursive: true, force: true });
  console.log(`Built formula workbench: ${workbook.formula_count} child-support formulas indexed, ${maintenanceMap.candidate_input_count} maintenance inputs detected.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
