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

function decodeXml(value) {
  return String(value || "")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function download(url, outputPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outputPath);
    const req = https.get(url, {
      rejectUnauthorized: false,
      timeout: 20000,
      headers: { "user-agent": "MFLG calculator formula mapper" }
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

function unzipText(zipPath, entry) {
  return execFileSync("unzip", ["-p", zipPath, entry], { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
}

function unzipList(zipPath) {
  return execFileSync("unzip", ["-Z1", zipPath], { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 })
    .split(/\r?\n/)
    .filter(Boolean);
}

function parseAttrs(xml) {
  const attrs = {};
  for (const match of String(xml || "").matchAll(/([\w:]+)="([^"]*)"/g)) {
    attrs[match[1]] = decodeXml(match[2]);
  }
  return attrs;
}

function parseSharedStrings(zipPath, entries) {
  if (!entries.includes("xl/sharedStrings.xml")) return [];
  const xml = unzipText(zipPath, "xl/sharedStrings.xml");
  return Array.from(xml.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)).map((match) => {
    const parts = Array.from(match[1].matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)).map((text) => decodeXml(text[1]));
    return parts.join("");
  });
}

function parseWorkbook(zipPath, entries) {
  const workbookXml = unzipText(zipPath, "xl/workbook.xml");
  const sheetNames = Array.from(workbookXml.matchAll(/<sheet\b([^>]*)\/>/g)).map((match) => {
    const attrs = parseAttrs(match[1]);
    return {
      name: attrs.name,
      sheet_id: attrs.sheetId,
      relationship_id: attrs["r:id"],
      hidden: attrs.state === "hidden"
    };
  });
  const definedNames = Array.from(workbookXml.matchAll(/<definedName\b([^>]*)>([\s\S]*?)<\/definedName>/g)).map((match) => {
    const attrs = parseAttrs(match[1]);
    return {
      name: attrs.name,
      local_sheet_id: attrs.localSheetId || null,
      target: decodeXml(match[2])
    };
  });
  return { sheetNames, definedNames };
}

function parseCellValue(cellXml, attrs, sharedStrings) {
  const valueMatch = cellXml.match(/<v>([\s\S]*?)<\/v>/);
  const inlineMatch = cellXml.match(/<is>([\s\S]*?)<\/is>/);
  if (attrs.t === "s" && valueMatch) {
    return sharedStrings[Number(valueMatch[1])] || "";
  }
  if (inlineMatch) {
    return Array.from(inlineMatch[1].matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)).map((match) => decodeXml(match[1])).join("");
  }
  return valueMatch ? decodeXml(valueMatch[1]) : "";
}

function parseFormula(cellXml) {
  const match = cellXml.match(/<f\b[^>]*>([\s\S]*?)<\/f>/);
  return match ? decodeXml(match[1]) : "";
}

function parseCells(zipPath, entry, sheet, sharedStrings) {
  const xml = unzipText(zipPath, entry);
  const cells = [];
  for (const match of xml.matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)) {
    const attrs = parseAttrs(match[1]);
    const formula = parseFormula(match[2]);
    const value = parseCellValue(match[2], attrs, sharedStrings);
    cells.push({
      sheet: sheet.name,
      sheet_entry: entry,
      cell: attrs.r,
      type: attrs.t || null,
      style: attrs.s || null,
      formula: formula || null,
      value: value || null,
      formula_hash: formula ? sha256(formula).slice(0, 16) : null
    });
  }
  return cells;
}

function targetToSheetCell(target) {
  const match = String(target || "").match(/^'?([^'!]+)'?!\$?([A-Z]+)\$?([0-9]+)$/);
  if (!match) return null;
  return {
    sheet: match[1].replace(/''/g, "'"),
    cell: `${match[2]}${match[3]}`
  };
}

function classifyNamedCell(name, cell) {
  const text = `${name || ""} ${cell?.formula || ""}`.toLowerCase();
  if (/final|obligation|support|reserve|percentage|share|adjustment|combined|basic|older|parentingtime/.test(text) && cell?.formula) return "calculation_output_or_intermediate";
  if (/income|children|county|parenting|case|date|petitioner|respondent|order|stipulation|tax|deduction/.test(text) && !cell?.formula) return "input_candidate";
  if (cell?.formula) return "formula_cell";
  return "data_cell";
}

function formulaDependencies(formula, definedNames) {
  const tokens = new Set();
  const names = new Set(definedNames.map((item) => item.name));
  for (const match of String(formula || "").matchAll(/\b[A-Z]{1,3}\$?[0-9]{1,7}\b/g)) tokens.add(match[0].replace(/\$/g, ""));
  for (const match of String(formula || "").matchAll(/\b[A-Za-z_][A-Za-z0-9_.]*\b/g)) {
    if (names.has(match[0])) tokens.add(match[0]);
  }
  return Array.from(tokens).sort();
}

async function main() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "mflg-formula-map-"));
  const childSupportUrl = "https://superiorcourt.maricopa.gov/media/pktkahu4/cs_calculator.xlsx";
  const workbookPath = path.join(tmpDir, "cs_calculator.xlsx");
  const headers = await download(childSupportUrl, workbookPath);
  const entries = unzipList(workbookPath);
  const worksheetEntries = entries.filter((entry) => /^xl\/worksheets\/sheet\d+\.xml$/.test(entry));
  const sharedStrings = parseSharedStrings(workbookPath, entries);
  const workbook = parseWorkbook(workbookPath, entries);
  const sheets = worksheetEntries.map((entry, index) => workbook.sheetNames[index] || {
    name: `Sheet ${index + 1}`,
    sheet_id: String(index + 1),
    relationship_id: null,
    hidden: false
  });
  const cells = [];
  sheets.forEach((sheet, index) => {
    cells.push(...parseCells(workbookPath, worksheetEntries[index], sheet, sharedStrings));
  });
  const cellByKey = new Map(cells.map((cell) => [`${cell.sheet}!${cell.cell}`, cell]));
  const formulaCells = cells.filter((cell) => cell.formula).map((cell) => ({
    sheet: cell.sheet,
    cell: cell.cell,
    formula: cell.formula,
    formula_hash: cell.formula_hash,
    dependencies: formulaDependencies(cell.formula, workbook.definedNames),
    cached_value: cell.value
  }));
  const namedCells = workbook.definedNames.map((definedName) => {
    const target = targetToSheetCell(definedName.target);
    const cell = target ? cellByKey.get(`${target.sheet}!${target.cell}`) : null;
    return {
      name: definedName.name,
      target: definedName.target,
      sheet: target?.sheet || null,
      cell: target?.cell || null,
      role: classifyNamedCell(definedName.name, cell),
      formula: cell?.formula || null,
      formula_hash: cell?.formula_hash || null,
      dependencies: formulaDependencies(cell?.formula || "", workbook.definedNames),
      cached_value: cell?.value || null
    };
  });
  const roleCounts = namedCells.reduce((acc, item) => {
    acc[item.role] = (acc[item.role] || 0) + 1;
    return acc;
  }, {});

  const internalMap = {
    version: "1.0.0-calculator-formula-map",
    built_at: new Date().toISOString(),
    public_exposure: "blocked by Worker /internal/ route",
    source: {
      calculator_id: "az-child-support-official",
      source_url: childSupportUrl,
      content_type: headers["content-type"] || "",
      content_length: headers["content-length"] || "",
      last_modified: headers["last-modified"] || "",
      workbook_sha256: sha256(fs.readFileSync(workbookPath))
    },
    safety: {
      contains_raw_formula_text: true,
      public_results_enabled: false,
      reviewer_approval_required: true,
      intended_use: "Internal formula mapping and regression-test preparation only."
    },
    summary: {
      sheets: sheets.length,
      hidden_sheets: sheets.filter((sheet) => sheet.hidden).length,
      shared_strings: sharedStrings.length,
      cells: cells.length,
      formula_cells: formulaCells.length,
      defined_names: namedCells.length,
      named_input_candidates: roleCounts.input_candidate || 0,
      named_formula_outputs_or_intermediates: roleCounts.calculation_output_or_intermediate || 0
    },
    sheets,
    named_cells: namedCells,
    formula_cells: formulaCells,
    next_steps: [
      "Review named input candidates against the official workbook UI.",
      "Build local formula functions only after dependency chains are mapped.",
      "Create regression fixtures from known official calculator outputs.",
      "Keep public MFLG formula results disabled until reviewer approval."
    ]
  };

  const publicReadiness = {
    version: "1.0.0-calculator-formula-engine-readiness",
    built_at: internalMap.built_at,
    public_safety: {
      raw_formula_text_exposed: false,
      contains_sensitive_user_data: false,
      public_results_enabled: false,
      reviewer_approval_required: true
    },
    summary: {
      child_support_formula_map_ready: true,
      child_support_named_input_candidates: internalMap.summary.named_input_candidates,
      child_support_named_formula_outputs_or_intermediates: internalMap.summary.named_formula_outputs_or_intermediates,
      child_support_formula_cells_mapped: internalMap.summary.formula_cells,
      local_formula_engine_enabled: false,
      regression_fixtures_ready: 0,
      reviewer_approved_calculators: 0
    },
    public_message: "The official child-support workbook has been mapped internally for engine development. Public MFLG formula results remain locked until regression tests and reviewer approval are complete."
  };

  writeJSON("internal/calculator-formula-map.json", internalMap);
  writeJSON("data/calculator-formula-engine-readiness.json", publicReadiness);
  fs.rmSync(tmpDir, { recursive: true, force: true });
  console.log(`Built calculator formula map: ${formulaCells.length} child-support formulas, ${namedCells.length} defined names, ${internalMap.summary.named_input_candidates} input candidates.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
