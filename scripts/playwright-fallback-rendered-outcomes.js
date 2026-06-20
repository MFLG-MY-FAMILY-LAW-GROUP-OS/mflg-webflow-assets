const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..");
const BASE_URL = process.env.MFLG_TEST_BASE_URL || "http://127.0.0.1:4173";
const REPORT_DIR = path.join(ROOT, "reports");
const SHOT_DIR = path.join(REPORT_DIR, "world-class-owner-acceptance-assets");
const COUNTIES = [
  "Apache", "Cochise", "Coconino", "Gila", "Graham", "Greenlee", "La Paz", "Maricopa",
  "Mohave", "Navajo", "Pima", "Pinal", "Santa Cruz", "Yavapai", "Yuma", "Not sure"
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function writeJSON(file, value) {
  fs.mkdirSync(path.dirname(path.join(ROOT, file)), { recursive: true });
  fs.writeFileSync(path.join(ROOT, file), `${JSON.stringify(value, null, 2)}\n`);
}

async function freshPage(browser, viewport = { width: 1365, height: 900 }) {
  const context = await browser.newContext({ viewport });
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

async function choose(page, value) {
  const locator = page.locator(`[data-guided-answer="${value}"]`).first();
  await locator.waitFor({ state: "visible", timeout: 8000 });
  await locator.click();
  await page.waitForTimeout(80);
}

async function answers(page) {
  return page.evaluate(() => JSON.parse(sessionStorage.getItem("mflgPublicAnswers") || "{}"));
}

async function visibleState(page) {
  return page.evaluate(() => {
    const text = document.body.innerText;
    const primaryActions = Array.from(document.querySelectorAll("a.button.primary,button.button.primary"))
      .filter((node) => node.offsetParent !== null)
      .map((node) => ({
        text: node.textContent.trim().replace(/\s+/g, " "),
        href: node.getAttribute("href") || "",
        target: node.getAttribute("data-guided-target") || "",
        packet: node.getAttribute("data-form-route-decision-packet") || ""
      }));
    const secondaryActions = Array.from(document.querySelectorAll("a.button.outline,button.button.outline,a.button.ghost,button.button.ghost"))
      .filter((node) => node.offsetParent !== null)
      .map((node) => node.textContent.trim().replace(/\s+/g, " "))
      .filter(Boolean);
    const visiblePdfLinks = Array.from(document.querySelectorAll("[data-official-pdf-link]"))
      .filter((node) => !node.hidden && node.offsetParent !== null);
    const externalPdfAnchors = Array.from(document.querySelectorAll("a[href]"))
      .map((link) => link.getAttribute("href") || "")
      .filter((href) => /^https?:\/\//i.test(href) && /\.pdf(?:$|[?#])/i.test(href));
    return {
      text,
      primaryActions,
      secondaryActions,
      visiblePdfCount: visiblePdfLinks.length,
      externalPdfAnchors,
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    };
  });
}

async function renderFormsOutcome(page, county) {
  await page.goto(`${BASE_URL}/forms/`, { waitUntil: "networkidle" });
  await clearStorage(page);
  await page.reload({ waitUntil: "networkidle" });
  for (const value of ["forms", county, "New filing", "divorce", "no-minor-children"]) {
    await choose(page, value);
  }
  const state = await answers(page);
  const rendered = await visibleState(page);
  const exact = county === "Maricopa";
  assert(state.county === county, `${county}: user county changed to ${state.county}`);
  assert(state.selectedPacket === "all" || !state.selectedPacket, `${county}: packet auto-selected ${state.selectedPacket}`);
  assert(!rendered.externalPdfAnchors.length, `${county}: external PDF anchors visible`);
  assert(!rendered.overflow, `${county}: horizontal overflow`);
  if (exact) {
    assert(rendered.primaryActions.some((item) => /Open matched forms|Open exact forms/i.test(item.text)), `${county}: exact result missing matched primary action`);
    assert(rendered.visiblePdfCount > 0, `${county}: exact result did not expose same-site PDFs`);
  } else {
    assert(!rendered.primaryActions.some((item) => /Open matched forms|Open exact forms/i.test(item.text)), `${county}: fallback exposed matched/exact primary action`);
    assert(rendered.visiblePdfCount === 0, `${county}: fallback exposed enabled PDF links`);
    assert(rendered.primaryActions.some((item) => /Start Guided Intake|Open form chooser/i.test(item.text)), `${county}: fallback lacks safe primary action`);
  }
  return {
    county,
    classification: exact ? "exact-county-direct-packet" : county === "Not sure" ? "no-verified-issue-specific-form" : "verified-related-resource",
    userCounty: state.county,
    packetSourceCounty: state.packetSourceCounty || "Not sure",
    primaryActions: rendered.primaryActions,
    secondaryActions: rendered.secondaryActions,
    visiblePdfCount: rendered.visiblePdfCount,
    externalPdfAnchors: rendered.externalPdfAnchors,
    overflow: rendered.overflow,
    pass: true
  };
}

async function renderCalculatorOutcome(page) {
  await page.goto(`${BASE_URL}/forms/`, { waitUntil: "networkidle" });
  await clearStorage(page);
  await page.reload({ waitUntil: "networkidle" });
  await choose(page, "calculator");
  await page.locator("[data-calculator-precheck-action]").first().click();
  await page.waitForTimeout(100);
  const state = await answers(page);
  const rendered = await visibleState(page);
  assert(state.need === "calculator", "calculator: need was not persisted");
  assert(state.selectedCalculator, "calculator: selected calculator was not persisted after visible action");
  assert(!state.county || state.county === "Not sure", `calculator: county was required/manufactured as ${state.county}`);
  assert(rendered.primaryActions.some((item) => /Open calculator|Use calculator/i.test(item.text)) || /calculator/i.test(rendered.text), "calculator: calculator action not visible");
  return {
    county: "Not applicable",
    classification: "calculator-no-county-required",
    selectedCalculator: state.selectedCalculator,
    primaryActions: rendered.primaryActions,
    visiblePdfCount: rendered.visiblePdfCount,
    pass: true
  };
}

async function renderResetOutcome(page) {
  await page.goto(`${BASE_URL}/forms/`, { waitUntil: "networkidle" });
  await clearStorage(page);
  await page.reload({ waitUntil: "networkidle" });
  for (const value of ["forms", "Apache", "New filing", "divorce", "no-minor-children"]) await choose(page, value);
  await page.locator("[data-smart-reset]").first().click();
  await page.waitForTimeout(120);
  const state = await answers(page);
  const rendered = await visibleState(page);
  assert(state.county === "Not sure", `reset: county should reset to Not sure, got ${state.county}`);
  assert(state.resetFields?.county === true, "reset: county tombstone missing");
  assert(rendered.visiblePdfCount === 0, "reset: PDFs visible after reset fallback");
  return {
    classification: "reset-fallback",
    userCounty: state.county,
    resetFields: state.resetFields || {},
    primaryActions: rendered.primaryActions,
    visiblePdfCount: rendered.visiblePdfCount,
    pass: true
  };
}

async function createOwnerPackage(browser) {
  fs.mkdirSync(SHOT_DIR, { recursive: true });
  const shots = [];
  const pages = [
    ["homepage-task-choice", "/", { width: 1365, height: 900 }],
    ["practice-area-forms", "/practice-areas/", { width: 1365, height: 900 }],
    ["diy-guide-forms", "/guides/", { width: 1365, height: 900 }],
    ["forms-direct", "/forms/", { width: 1365, height: 900 }],
    ["calculator-first", "/calculators/", { width: 1365, height: 900 }],
    ["mobile-first-viewport", "/forms/", { width: 390, height: 844 }]
  ];
  for (const [name, route, viewport] of pages) {
    const { context, page } = await freshPage(browser, viewport);
    await page.goto(`${BASE_URL}${route}`, { waitUntil: "networkidle" });
    await clearStorage(page);
    await page.reload({ waitUntil: "networkidle" });
    const file = path.join(SHOT_DIR, `${name}.png`);
    await page.screenshot({ path: file, fullPage: false });
    shots.push(path.relative(ROOT, file));
    await context.close();
  }
  const checklist = [
    "Is the first action obvious?",
    "Is there only one dominant action?",
    "Does the result clearly say exact, statewide, related, or unavailable?",
    "Is your selected county clearly different from the packet source?",
    "Does any result appear to promise a form that is not actually matched?",
    "Is Guided Intake help rather than an unnecessary detour?",
    "Is Change answers easy to find?",
    "Is any screen too crowded?",
    "Is any wording technical or administrative?",
    "Can you open the result without understanding the site architecture?"
  ];
  const md = `# World-Class Owner Acceptance\n\nStatus: Pending owner sign-off\n\n## Screenshot Set\n\n${shots.map((shot) => `- ${shot}`).join("\n")}\n\n## Checklist\n\n${checklist.map((item) => `- [ ] ${item}`).join("\n")}\n\n## Sign-Off\n\n- [ ] Accepted\n- [ ] Accepted with changes\n- [ ] Rejected\n\nNotes:\n\n`;
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  fs.writeFileSync(path.join(REPORT_DIR, "world-class-owner-acceptance.md"), md);
  writeJSON("data/world-class-owner-acceptance.json", {
    version: "1.0.0-owner-acceptance",
    built_at: new Date().toISOString(),
    status: "pending",
    screenshots: shots,
    checklist,
    signoff_options: ["Accepted", "Accepted with changes", "Rejected"],
    notes: ""
  });
  return { shots, checklist };
}

(async () => {
  const browser = await chromium.launch();
  const outcomes = [];
  try {
    const { context, page } = await freshPage(browser);
    for (const county of COUNTIES) outcomes.push(await renderFormsOutcome(page, county));
    outcomes.push(await renderCalculatorOutcome(page));
    outcomes.push(await renderResetOutcome(page));
    await context.close();
    const ownerPackage = await createOwnerPackage(browser);
    const output = {
      version: "1.0.0-fallback-rendered-outcomes",
      built_at: new Date().toISOString(),
      base_url: BASE_URL,
      summary: {
        rendered_outcomes: outcomes.length,
        counties_checked: COUNTIES.length,
        exact_county_direct_packet: outcomes.filter((item) => item.classification === "exact-county-direct-packet").length,
        verified_related_resource: outcomes.filter((item) => item.classification === "verified-related-resource").length,
        no_verified_issue_specific_form: outcomes.filter((item) => item.classification === "no-verified-issue-specific-form").length,
        calculator_no_county_required: outcomes.filter((item) => item.classification === "calculator-no-county-required").length,
        unsupported_matched_claims: 0,
        visible_external_pdf_anchors: 0,
        owner_screenshots: ownerPackage.shots.length
      },
      outcomes,
      owner_package: {
        markdown: "reports/world-class-owner-acceptance.md",
        json: "data/world-class-owner-acceptance.json",
        screenshots: ownerPackage.shots
      },
      not_applicable_rendered_classes: [
        {
          classification: "verified-statewide-direct-packet",
          reason: "The current direct Forms guided path does not expose the special-scope statewide route as a first-level county-driven result; data contract remains verified."
        },
        {
          classification: "exact-county-packet-page",
          reason: "Packet-page-only routes are route-evidence verified but are not first-level direct guided issue buttons in the current public Forms wizard."
        },
        {
          classification: "general-county-forms-index",
          reason: "No primary all-county outcome currently uses general-index-only as its primary classification."
        },
        {
          classification: "no-official-resource",
          reason: "No-official-resource outcomes are data-verified and fallback actions are contract-checked; the direct guided public issue set does not expose the response route as a first-level issue."
        }
      ]
    };
    writeJSON("data/fallback-rendered-outcomes.json", output);
    console.log("FALLBACK_RENDERED_OUTCOMES_PASS");
    console.log(JSON.stringify(output.summary, null, 2));
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
