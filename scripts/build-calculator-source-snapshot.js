#!/usr/bin/env node
const crypto = require("crypto");
const fs = require("fs");
const https = require("https");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const root = path.resolve(__dirname, "..");

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
      timeout: 25000,
      headers: { "user-agent": "MFLG calculator source snapshot" }
    }, (res) => {
      if (res.statusCode < 200 || res.statusCode >= 400) {
        file.close();
        fs.rmSync(outputPath, { force: true });
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      const headers = res.headers;
      res.pipe(file);
      file.on("finish", () => file.close(() => resolve(headers)));
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
      timeout: 25000,
      headers: { "user-agent": "MFLG calculator source snapshot" }
    }, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const body = Buffer.concat(chunks);
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 400,
          status: res.statusCode,
          headers: res.headers,
          body
        });
      });
    });
    req.on("timeout", () => {
      req.destroy();
      resolve({ ok: false, status: 0, headers: {}, body: Buffer.from(""), error: "timeout" });
    });
    req.on("error", (error) => resolve({ ok: false, status: 0, headers: {}, body: Buffer.from(""), error: error.message }));
  });
}

function unzipList(zipPath) {
  return execFileSync("unzip", ["-Z1", zipPath], { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 })
    .split(/\r?\n/)
    .filter(Boolean);
}

function unzipText(zipPath, entry) {
  return execFileSync("unzip", ["-p", zipPath, entry], { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
}

function workbookSignature(zipPath) {
  const entries = unzipList(zipPath);
  const workbookXml = entries.includes("xl/workbook.xml") ? unzipText(zipPath, "xl/workbook.xml") : "";
  const worksheets = entries.filter((entry) => /^xl\/worksheets\/sheet\d+\.xml$/.test(entry));
  const sheetNames = Array.from(workbookXml.matchAll(/<sheet[^>]*name="([^"]+)"/g)).map((match) => match[1]);
  const definedNames = Array.from(workbookXml.matchAll(/<definedName\b[^>]*name="([^"]+)"[^>]*>([\s\S]*?)<\/definedName>/g)).map((match) => ({
    name: match[1],
    target_hash: sha256(match[2]).slice(0, 16)
  }));
  let formulaCount = 0;
  const worksheetSignatures = worksheets.map((entry, index) => {
    const xml = unzipText(zipPath, entry);
    const formulas = Array.from(xml.matchAll(/<f\b[^>]*>([\s\S]*?)<\/f>/g)).map((match) => match[1]);
    formulaCount += formulas.length;
    return {
      sheet_entry: entry,
      sheet_name: sheetNames[index] || `Sheet ${index + 1}`,
      formula_count: formulas.length,
      sheet_formula_hash: sha256(formulas.join("\n")).slice(0, 24)
    };
  });
  return {
    workbook_entry_count: entries.length,
    worksheet_count: worksheets.length,
    sheet_names: sheetNames,
    defined_name_count: definedNames.length,
    formula_count: formulaCount,
    defined_name_hash: sha256(JSON.stringify(definedNames)).slice(0, 24),
    worksheet_signatures: worksheetSignatures
  };
}

function maintenanceSignature(body) {
  const text = body.toString("utf8");
  const currentApiDetected = text.includes("CalculateSelfSufficiency");
  const effectiveDates = Array.from(new Set(Array.from(text.matchAll(/Effective as of\s+([0-9/]+)/gi)).map((match) => match[1])));
  const versionTokens = new Set();
  for (const match of text.matchAll(/version=([0-9.]+)/gi)) versionTokens.add(match[1]);
  if (currentApiDetected) versionTokens.add("current");
  return {
    page_sha256: sha256(body),
    byte_length: body.length,
    current_api_detected: currentApiDetected,
    effective_dates_detected: effectiveDates,
    api_versions_detected: Array.from(versionTokens)
  };
}

async function main() {
  const builtAt = new Date().toISOString();
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "mflg-calc-source-"));
  const childSupportUrl = "https://superiorcourt.maricopa.gov/media/pktkahu4/cs_calculator.xlsx";
  const maintenanceUrl = "https://www.superiorcourt.maricopa.gov/app/selfsuffcalc/";
  const workbookPath = path.join(tmpDir, "cs_calculator.xlsx");
  const workbookHeaders = await download(childSupportUrl, workbookPath);
  const workbookBytes = fs.readFileSync(workbookPath);
  const maintenance = await request(maintenanceUrl);

  const internalSnapshot = {
    version: "1.0.0-calculator-source-snapshot",
    built_at: builtAt,
    public_exposure: "blocked by Worker /internal/ route",
    safety: {
      contains_sensitive_user_data: false,
      contains_real_fixture_values: false,
      contains_raw_formula_text: false,
      public_results_enabled: false,
      intended_use: "Internal official-source snapshot for source drift detection and calculator engine preparation."
    },
    child_support_workbook: {
      source_url: childSupportUrl,
      content_type: workbookHeaders["content-type"] || "",
      content_length: Number(workbookHeaders["content-length"] || workbookBytes.length),
      last_modified: workbookHeaders["last-modified"] || "",
      workbook_sha256: sha256(workbookBytes),
      ...workbookSignature(workbookPath)
    },
    spousal_maintenance_calculator: {
      source_url: maintenanceUrl,
      status: maintenance.status,
      ok: maintenance.ok,
      content_type: maintenance.headers["content-type"] || "",
      last_modified: maintenance.headers["last-modified"] || "",
      ...maintenanceSignature(maintenance.body)
    },
    next_steps: [
      "Use this snapshot to detect official-source drift before every calculator release check.",
      "Regenerate formula maps and regression fixtures whenever the workbook hash changes.",
      "Keep public MFLG formula results locked until source drift, fixtures, regression comparisons, and final approval all pass."
    ]
  };

  const publicStatus = {
    version: "1.0.0-calculator-source-snapshot-status",
    built_at: builtAt,
    public_safety: {
      raw_workbook_exposed: false,
      raw_formula_text_exposed: false,
      raw_hashes_exposed: false,
      sensitive_fixture_values_exposed: false,
      public_results_enabled: false
    },
    summary: {
      source_snapshot_ready: true,
      child_support_workbook_reachable: true,
      child_support_worksheet_count: internalSnapshot.child_support_workbook.worksheet_count,
      child_support_formula_count: internalSnapshot.child_support_workbook.formula_count,
      child_support_defined_name_count: internalSnapshot.child_support_workbook.defined_name_count,
      maintenance_page_reachable: maintenance.ok,
      maintenance_current_api_detected: internalSnapshot.spousal_maintenance_calculator.current_api_detected,
      source_drift_review_required: true,
      public_results_enabled: false
    },
    public_message: "Official calculator source snapshots are tracked for review. MFLG-branded formula outputs remain locked until source review, fixtures, comparisons, and final approval are complete."
  };

  writeJSON("internal/calculator-source-snapshot.json", internalSnapshot);
  writeJSON("data/calculator-source-snapshot-status.json", publicStatus);
  fs.rmSync(tmpDir, { recursive: true, force: true });
  console.log(`Built calculator source snapshot: ${internalSnapshot.child_support_workbook.formula_count} child-support formulas tracked, public results locked.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
