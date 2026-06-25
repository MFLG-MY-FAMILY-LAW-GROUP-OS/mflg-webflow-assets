const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..");
const BASE_URL = process.env.MFLG_TEST_BASE_URL || "http://127.0.0.1:4173";
const readJSON = (file) => JSON.parse(fs.readFileSync(path.join(ROOT, file), "utf8"));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function text(page, selector) {
  return (await page.locator(selector).first().textContent().catch(() => "")) || "";
}

(async () => {
  const uniqueCoverage = readJSON("data/unique-route-coverage-audit.json");
  const parity = readJSON("data/three-path-parity-audit.json");

  assert(uniqueCoverage.summary.unique_route_combinations === 27, "unique route count changed");
  assert((uniqueCoverage.summary.classification_counts["general-county-forms-index"] || 0) === 0, "general index counted as route coverage");
  assert(uniqueCoverage.summary.general_index_matters > 0, "general index downgrades not recorded");
  assert(parity.summary.entry_paths === 3, "three entry paths not audited");
  assert(parity.summary.mismatches === 0, "entry path parity mismatch");

  const exact = uniqueCoverage.records.find((record) => record.classification === "exact-county-direct-packet");
  const statewide = uniqueCoverage.records.find((record) => record.classification === "verified-statewide-direct-packet");
  const pageOnly = uniqueCoverage.records.find((record) => record.classification === "exact-county-packet-page");
  assert(exact, "missing exact county direct packet record");
  assert(statewide, "missing statewide direct packet record");
  assert(pageOnly, "missing exact county packet page record");
  assert(!uniqueCoverage.general_index_matters.some((item) => /matched forms|exact packet/i.test(item.public_explanation)), "general index explanation overclaims exact forms");

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1365, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${BASE_URL}/forms/`, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload({ waitUntil: "domcontentloaded" });

  const progress = await text(page, "[data-guided-progress-label]");
  assert(!/of\\s+5/i.test(progress), `fixed guided step total visible: ${progress}`);

  const body = await page.locator("body").innerText();
  assert(!/General county forms directory\\s*[\\s\\S]{0,80}Open matched forms/i.test(body), "general directory presented as matched forms");
  assert(!/General county forms directory\\s*[\\s\\S]{0,80}Open exact/i.test(body), "general directory presented as exact forms");
  assert(!/Open exact forms/i.test(body), "unsupported exact form CTA visible by default");

  await page.goto(`${BASE_URL}/calculators/`, { waitUntil: "domcontentloaded" });
  const calculatorFirstViewport = await page.locator("body").innerText();
  assert(!/Step 1 of 5/i.test(calculatorFirstViewport), "calculator path shows fixed question total");
  assert(!/Choose county[\\s\\S]{0,120}Use calculator/i.test(calculatorFirstViewport), "calculator-first path appears to require county before calculator");

  await browser.close();
  console.log("PLAYWRIGHT_RESULT_SEMANTICS_PASS");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
