const { chromium } = require("playwright");

const baseUrl = process.env.MFLG_TEST_BASE_URL || "http://127.0.0.1:4173";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function clearStorage(page) {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

async function openFresh(page, path) {
  await page.goto(`${baseUrl}${path}`, { waitUntil: "domcontentloaded" });
  await clearStorage(page);
  await page.reload({ waitUntil: "domcontentloaded" });
}

async function belowHeader(page, selector, label) {
  const locator = page.locator(selector).first();
  let state = null;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    state = await locator.evaluate((node) => {
      const header = document.querySelector(".site-header");
      const headerBottom = header ? header.getBoundingClientRect().bottom : 0;
      const rect = node.getBoundingClientRect();
      return {
        top: rect.top,
        headerBottom,
        visible: rect.top >= headerBottom + 2 && rect.top < window.innerHeight * 0.78
      };
    });
    if (state.visible) break;
    await page.waitForTimeout(120);
  }
  assert(state.visible, `${label} did not reveal below sticky header: ${JSON.stringify(state)}`);
}

async function checkAcceptedNavigation(page) {
  await openFresh(page, "/");
  const navText = await page.locator(".site-nav").innerText();
  assert(/Practice Areas/i.test(navText), "Accepted Practice Areas nav item is missing");
  assert(/DIY Guides/i.test(navText), "Accepted DIY Guides nav item is missing");
  assert(/Forms & Calculators/i.test(navText), "Accepted Forms & Calculators nav item is missing");
  assert(!/Forms & Guides/i.test(navText), "Rejected merged Forms & Guides label is visible");
}

async function checkPracticeReveal(page) {
  await openFresh(page, "/practice-areas/");
  const revealAll = page.locator("[data-service-reveal]").first();
  if (await revealAll.isVisible().catch(() => false)) await revealAll.click();
  const relocationCard = page.locator("[data-service-card]").filter({ hasText: /Relocation/i }).first();
  await relocationCard.locator("[data-service-detail-toggle]").click();
  await belowHeader(page, ".service-row-panel", "Practice Area reveal");
  const chooseText = await page.locator(".service-row-panel").innerText();
  assert(/Find the right forms/i.test(chooseText), "Practice reveal should ask users to find the right forms first");
  assert(!/View forms for this issue/i.test(chooseText), "Practice reveal promises forms before prerequisites");
  await page.locator('.service-row-panel [data-service-action="forms"]').first().click();
  await belowHeader(page, '.service-row-panel [data-service-panel-section="forms"]', "Practice Area forms state");
  const formsText = await page.locator('.service-row-panel [data-service-panel-section="forms"]').innerText();
  assert(/Answer these before viewing a form/i.test(formsText), "Practice reveal does not show prerequisites before forms");
  assert(/relocation notice/i.test(formsText), "Relocation reveal does not show relocation-specific prerequisite logic");
  const prematureViewForm = await page.locator('.service-row-panel [data-service-panel-section="forms"] >> text=/^View form$/i').count();
  assert(prematureViewForm === 0, "Practice reveal shows View form before prerequisites/result");
}

async function checkGuideReveal(page) {
  await openFresh(page, "/guides/");
  const revealAll = page.locator("[data-guide-reveal]").first();
  if (await revealAll.isVisible().catch(() => false)) await revealAll.click();
  const guideCard = page.locator("[data-guide-card]").filter({ hasText: /Child Support/i }).first();
  await guideCard.locator("[data-guide-open]").click();
  await belowHeader(page, ".guide-row-panel", "DIY Guide reveal");
  const chooseText = await page.locator(".guide-row-panel").innerText();
  assert(/Find forms/i.test(chooseText), "Guide reveal should keep the forms option");
  assert(/Ask for office review/i.test(chooseText), "Guide reveal should use softer office-review lead capture");
  await page.locator('.guide-row-panel [data-guide-next-choice="forms"]').first().click();
  const formsText = await page.locator('.guide-row-panel [data-guide-panel-section="forms"]').innerText();
  assert(/Answer these before viewing a form/i.test(formsText), "Guide reveal does not show prerequisites before forms");
  assert(/support/i.test(formsText), "Child Support guide does not show support-specific prerequisite logic");
}

async function checkDirectFormsPath(page) {
  await openFresh(page, "/forms/");
  const initialText = await page.locator("[data-forms-guided-start]").innerText();
  assert(/What do you need right now/i.test(initialText), "Direct forms path does not start with the guided question");
  assert(!/^View form$/im.test(initialText), "Direct forms path shows View form before answers");
  const hiddenPdfButtons = await page.evaluate(() => Array.from(document.querySelectorAll("[data-official-pdf-preview]"))
    .filter((node) => node.offsetParent !== null && !node.closest("[hidden]")).length);
  assert(hiddenPdfButtons === 0, "Direct forms path exposes PDF viewer buttons before qualification");
}

async function checkHero(page) {
  await openFresh(page, "/");
  const state = await page.evaluate(() => {
    const grid = document.querySelector(".hero-task-grid");
    const pills = Array.from(document.querySelectorAll(".hero-task-pill"));
    const tops = new Set(pills.map((pill) => Math.round(pill.getBoundingClientRect().top)));
    const featureControls = Array.from(document.querySelectorAll(".hero-features a,.hero-features button,.hero-features [tabindex]")).length;
    const video = document.querySelector(".hero-video");
    return {
      pillCount: pills.length,
      taskRows: tops.size,
      gridWidth: grid ? Math.round(grid.getBoundingClientRect().width) : 0,
      featureWidth: document.querySelector(".hero-features") ? Math.round(document.querySelector(".hero-features").getBoundingClientRect().width) : 0,
      featureControls,
      pageOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      loopGuard: video?.dataset.loopGuard || ""
    };
  });
  assert(state.pillCount === 4, `Expected 4 hero task pills, found ${state.pillCount}`);
  assert(state.taskRows === 1, `Hero task pills should be one desktop row, got ${state.taskRows}`);
  assert(Math.abs(state.gridWidth - state.featureWidth) <= 2, `Hero task width ${state.gridWidth} does not match feature row ${state.featureWidth}`);
  assert(state.featureControls === 0, "Hero capability labels should be static");
  assert(!state.pageOverflow, "Homepage has horizontal overflow");
  assert(state.loopGuard === "true", "Hero video loop guard did not initialize");
}

(async () => {
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.route("**/*", (route) => route.continue({
      headers: { ...route.request().headers(), "Cache-Control": "no-cache" }
    }));
    await checkAcceptedNavigation(page);
    await checkHero(page);
    await checkPracticeReveal(page);
    await checkGuideReveal(page);
    await checkDirectFormsPath(page);
    await context.close();
  } finally {
    await browser.close();
  }
  console.log("LEAD_MAGNET_REVEAL_FLOW_PASS");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
