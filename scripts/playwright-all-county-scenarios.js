const { chromium } = require("playwright");

const BASE_URL = process.env.MFLG_TEST_BASE_URL || "http://127.0.0.1:4173";
const COUNTIES = [
  "Apache",
  "Cochise",
  "Coconino",
  "Gila",
  "Graham",
  "Greenlee",
  "La Paz",
  "Maricopa",
  "Mohave",
  "Navajo",
  "Pima",
  "Pinal",
  "Santa Cruz",
  "Yavapai",
  "Yuma",
  "Not sure"
];

const SCENARIOS = [
  { name: "divorce new filing without minor children", issue: "divorce", posture: "New filing", children: "no-minor-children" },
  { name: "divorce new filing with minor children", issue: "divorce", posture: "New filing", children: "minor-children" },
  { name: "child support establishment", issue: "parenting", posture: "New filing", children: "minor-children" },
  { name: "child support modification", issue: "support", posture: "Existing order", children: "minor-children" },
  { name: "parenting-time modification", issue: "parenting", posture: "Existing order", children: "minor-children" },
  { name: "parentage new filing", issue: "parenting", posture: "New filing", children: "minor-children" },
  { name: "annulment public grouping", issue: "annulment", guidedIssue: "divorce", posture: "New filing", children: "no-minor-children" },
  { name: "enforcement public grouping", issue: "enforcement", guidedIssue: "parenting", posture: "Existing order", children: "minor-children" },
  { name: "protective-order safety public grouping", issue: "safety", guidedIssue: "all", posture: "Existing order", children: "any" },
  { name: "calculator-first route", calculator: true }
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function newPage(browser) {
  const context = await browser.newContext({ viewport: { width: 1365, height: 900 } });
  await context.clearCookies();
  const page = await context.newPage();
  await page.route("**/*", (route) => route.continue({
    headers: { ...route.request().headers(), "Cache-Control": "no-cache" }
  }));
  return { context, page };
}

async function clearStorage(page) {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

async function answers(page) {
  return page.evaluate(() => JSON.parse(sessionStorage.getItem("mflgPublicAnswers") || "{}"));
}

async function optionValues(page, selector) {
  return page.locator(selector).evaluate((select) => Array.from(select.options).map((option) => option.value || option.textContent.trim()));
}

async function selectIfAvailable(page, selector, value) {
  const values = await optionValues(page, selector);
  if (!values.includes(value)) return false;
  await page.selectOption(selector, value);
  await page.waitForTimeout(30);
  return true;
}

async function chooseGuided(page, value, label) {
  const locator = page.locator(`[data-guided-answer="${value}"]`).first();
  await locator.waitFor({ state: "visible", timeout: 8000 });
  await locator.click();
  await page.waitForTimeout(60);
  const clicked = await answers(page);
  assert(clicked, `${label}: guided click did not leave readable state`);
}

async function assertNoExternalPdfAnchors(page, label) {
  const hrefs = await page.evaluate(() => Array.from(document.querySelectorAll("a[href]"))
    .map((link) => link.getAttribute("href") || "")
    .filter((href) => /^https?:\/\//i.test(href) && /\.pdf(?:$|[?#])/i.test(href)));
  assert(hrefs.length === 0, `${label}: external PDF anchors visible: ${hrefs.join(", ")}`);
}

async function assertNoUnsupportedExactClaim(page, county, label) {
  const body = await page.locator("body").innerText();
  if (county !== "Maricopa" && county !== "Pima" && county !== "Cochise" && county !== "Yavapai") {
    assert(!new RegExp(`Matched forms for ${county} County`, "i").test(body), `${label}: unsupported exact county claim for ${county}`);
  }
  assert(!/\bChildren:\s*any\b/i.test(body), `${label}: children any rendered publicly`);
  assert(!/\bIssue:\s*all\b/i.test(body), `${label}: issue all rendered publicly`);
}

async function runFormsScenario(page, county, scenario) {
  await page.goto(`${BASE_URL}/forms/`, { waitUntil: "networkidle" });
  await clearStorage(page);
  await page.reload({ waitUntil: "networkidle" });

  assert((await optionValues(page, "[data-form-county]")).includes(county), `${scenario.name}/${county}: county option missing`);
  await chooseGuided(page, "forms", `${scenario.name}/${county}`);
  await chooseGuided(page, county, `${scenario.name}/${county}`);
  await chooseGuided(page, scenario.posture, `${scenario.name}/${county}`);
  await chooseGuided(page, scenario.guidedIssue || scenario.issue, `${scenario.name}/${county}`);
  if (scenario.children && scenario.children !== "any") await chooseGuided(page, scenario.children, `${scenario.name}/${county}`);
  await page.waitForTimeout(100);

  const state = await answers(page);
  assert(state.county === county, `${scenario.name}/${county}: user county changed to ${state.county}`);
  assert(state.issue === (scenario.guidedIssue || scenario.issue), `${scenario.name}/${county}: issue changed to ${state.issue}`);
  assert(state.posture === scenario.posture, `${scenario.name}/${county}: posture changed to ${state.posture}`);
  if (county !== "Maricopa") assert(state.county !== "Maricopa", `${scenario.name}/${county}: Maricopa default manufactured`);
  assert(!state.selectedPacket || !/^maricopa-divorce-new-/.test(state.selectedPacket), `${scenario.name}/${county}: default divorce packet selected`);
  if (state.packetSourceCounty && state.packetSourceCounty !== "Not sure" && state.packetSourceCounty !== state.county) {
    assert(state.fieldSources?.packetSourceCounty, `${scenario.name}/${county}: packet source lacks provenance`);
  }
  await assertNoUnsupportedExactClaim(page, county, `${scenario.name}/${county}`);
  await assertNoExternalPdfAnchors(page, `${scenario.name}/${county}`);
}

async function runCalculatorScenario(page, county) {
  await page.goto(`${BASE_URL}/forms/`, { waitUntil: "networkidle" });
  await clearStorage(page);
  await page.reload({ waitUntil: "networkidle" });
  await page.click('[data-smart-lane="calculator"]');
  await page.waitForTimeout(100);
  await page.locator("[data-calculator-precheck-action]").first().click();
  await page.waitForTimeout(100);
  const state = await answers(page);
  assert(state.need === "calculator", `calculator/${county}: need not persisted as calculator`);
  assert(state.selectedCalculator, `calculator/${county}: calculator selection not persisted`);
  assert(!state.county || state.county === "Not sure", `calculator/${county}: calculator-first manufactured county ${state.county}`);
  await assertNoExternalPdfAnchors(page, `calculator/${county}`);
}

(async () => {
  const browser = await chromium.launch();
  const results = [];
  try {
    const { context, page } = await newPage(browser);
    for (const scenario of SCENARIOS) {
      for (const county of COUNTIES) {
        if (scenario.calculator) await runCalculatorScenario(page, county);
        else await runFormsScenario(page, county, scenario);
        results.push({ scenario: scenario.name, county, pass: true });
      }
    }
    await context.close();
  } finally {
    await browser.close();
  }
  console.log("ALL_COUNTY_SCENARIOS_PASS");
  console.log(JSON.stringify({ scenarios: SCENARIOS.length, counties: COUNTIES.length, assertions: results.length }, null, 2));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
