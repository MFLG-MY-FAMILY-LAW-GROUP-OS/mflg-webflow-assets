#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

function readJSON(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function fail(message) {
  console.error(`MATTER_FORM_MATRIX_FAIL: ${message}`);
  process.exit(1);
}

const matrix = readJSON("data/matter-form-matrix.json");
const coverage = readJSON("data/forms-tools-matter-coverage.json");
const publicJs = fs.readFileSync(path.join(root, "js/mflg-public-site.js"), "utf8");

const records = Array.isArray(matrix.records) ? matrix.records : [];
if (records.length !== 50) fail(`expected 50 matter records, found ${records.length}`);

const byId = new Map(records.map((record) => [record.matter_id, record]));
const coverageById = new Map((coverage.matters || []).map((record) => [record.matter_id, record]));

function requireRecord(id) {
  const record = byId.get(id);
  if (!record) fail(`missing matrix record: ${id}`);
  return record;
}

[
  "annulment",
  "relocation",
  "family-case-name-change",
  "grandparent-third-party-rights",
  "protective-orders-safety-terms"
].forEach(requireRecord);

for (const record of records) {
  if (record.confidence === "intake-required") {
    if (record.direct_pdf_available) fail(`${record.matter_id} is intake-required but direct_pdf_available=true`);
    if ((record.exact_packets || []).length) fail(`${record.matter_id} is intake-required but has exact packets`);
  }
  if (record.confidence === "related-only" && record.direct_pdf_available) {
    fail(`${record.matter_id} is related-only but direct_pdf_available=true`);
  }
  const covered = coverageById.get(record.matter_id);
  if (!covered) fail(`coverage missing for ${record.matter_id}`);
  if (covered.form_confidence !== record.confidence) {
    fail(`${record.matter_id} coverage confidence ${covered.form_confidence} does not match matrix ${record.confidence}`);
  }
  if (covered.direct_pdf_available !== record.direct_pdf_available) {
    fail(`${record.matter_id} coverage direct_pdf_available mismatch`);
  }
}

if (requireRecord("annulment").confidence !== "intake-required") fail("annulment must remain intake-required");
if (requireRecord("relocation").confidence !== "intake-required") fail("relocation must remain intake-required");
if (requireRecord("family-case-name-change").confidence !== "county-exact") fail("name change must remain county-exact");
if (requireRecord("grandparent-third-party-rights").confidence !== "related-only") fail("grandparent/third-party rights must remain related-only");

[
  "Maricopa packet available",
  "Confirm before forms",
  "guide-county-gate",
  "data-guide-county-choice",
  "data-guide-county-confirm"
].forEach((marker) => {
  if (!publicJs.includes(marker)) fail(`public JS missing marker: ${marker}`);
});

if (publicJs.includes("County-specific form path")) {
  fail("public JS still uses overbroad County-specific form path label");
}

console.log("MATTER_FORM_MATRIX_VALIDATION_PASS");
