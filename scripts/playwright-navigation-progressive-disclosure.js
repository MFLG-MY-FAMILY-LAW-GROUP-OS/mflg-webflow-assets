const { chromium } = require("playwright");

const baseUrl = process.env.MFLG_TEST_BASE_URL || "http://127.0.0.1:4173";
const viewports = [
  { name: "desktop", width: 1365, height: 900 },
  { name: "mobile", width: 390, height: 844 }
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function freshPage(browser, viewport) {
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

async function topIsClear(page, selector, label) {
  const locator = page.locator(selector).first();
  let result = null;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    result = await locator.evaluate((node) => {
      const header = document.querySelector(".site-header");
      const headerBottom = header ? header.getBoundingClientRect().bottom : 0;
      const rect = node.getBoundingClientRect();
      return {
        top: rect.top,
        headerBottom,
        visible: rect.top >= headerBottom + 2 && rect.top < window.innerHeight * 0.65,
        activeInside: node.contains(document.activeElement) || node === document.activeElement
      };
    });
    if (result.visible) break;
    await page.waitForTimeout(100);
  }
  assert(result.visible, `${label}: reveal target not below sticky header: ${JSON.stringify(result)}`);
}

async function choose(page, value) {
  const button = page.locator(`[data-guided-answer="${value}"]`).first();
  await button.waitFor({ state: "visible", timeout: 10000 });
  await button.click();
  await page.waitForTimeout(120);
}

async function assertNoExternalPdf(page, label) {
  const external = await page.evaluate(() => Array.from(document.querySelectorAll("a[href]"))
    .map((link) => link.getAttribute("href") || "")
    .filter((href) => /^https?:\/\//i.test(href) && /\.pdf(?:$|[?#])/i.test(href)));
  assert(external.length === 0, `${label}: external PDF anchors visible: ${external.join(", ")}`);
}

async function assertNoOverflow(page, label) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  assert(!overflow, `${label}: horizontal overflow`);
}

async function formsWorkflow(page, label) {
  await page.goto(`${baseUrl}/forms/`, { waitUntil: "domcontentloaded" });
  await clearStorage(page);
  await page.reload({ waitUntil: "domcontentloaded" });
  let state = await page.evaluate(() => ({
    activeQuestions: Array.from(document.querySelectorAll("[data-guided-options]")).filter((node) => !node.hidden && !node.inert && node.offsetParent !== null).length,
    hiddenFlowTabbables: Array.from(document.querySelectorAll(".forms-flow-hidden a,.forms-flow-hidden button,.forms-flow-hidden input,.forms-flow-hidden select")).filter((node) => node.tabIndex >= 0 && !node.closest("[inert]")).length,
    visiblePdfCards: Array.from(document.querySelectorAll("[data-official-pdf-link]")).filter((node) => !node.hidden && node.offsetParent !== null).length
  }));
  assert(state.activeQuestions === 1, `${label}: initial should show one active question, got ${state.activeQuestions}`);
  assert(state.hiddenFlowTabbables === 0, `${label}: hidden flow controls remain tabbable`);
  assert(state.visiblePdfCards === 0, `${label}: PDF cards visible before qualification`);

  for (const value of ["forms", "Maricopa", "New filing", "divorce", "no-minor-children"]) await choose(page, value);
  state = await page.evaluate(() => ({
    activeQuestions: Array.from(document.querySelectorAll("[data-guided-options]")).filter((node) => !node.hidden && !node.inert && node.offsetParent !== null).length,
    optionsHidden: document.querySelector("[data-guided-options]")?.hidden === true,
    progress: document.querySelector("[data-guided-progress-label]")?.textContent?.trim() || "",
    primaryButtons: Array.from(document.querySelectorAll(".forms-guided-result-actions .button.primary")).filter((node) => node.offsetParent !== null).map((node) => node.textContent.trim()),
    visiblePdfCards: Array.from(document.querySelectorAll("[data-official-pdf-link]")).filter((node) => !node.hidden && node.offsetParent !== null).length,
    sourceButtons: Array.from(document.querySelectorAll(".official-pdf-link:not([hidden]) .official-pdf-source")).map((node) => node.textContent.trim()),
    previewButtons: Array.from(document.querySelectorAll(".official-pdf-link:not([hidden]) [data-official-pdf-preview]")).length,
    downloadLinks: Array.from(document.querySelectorAll(".official-pdf-link:not([hidden]) .official-pdf-direct-download")).map((node) => node.textContent.trim())
  }));
  assert(state.activeQuestions === 0 && state.optionsHidden, `${label}: completed answers should collapse`);
  assert(/Answers confirmed/i.test(state.progress), `${label}: confirmed progress missing`);
  assert(state.primaryButtons.length === 1, `${label}: expected one dominant guided primary action, got ${state.primaryButtons.join(" | ")}`);
  assert(state.visiblePdfCards > 0, `${label}: matched PDF cards did not render`);
  assert(state.sourceButtons.every((text) => /View form/i.test(text)), `${label}: unified View form label missing`);
  assert(state.previewButtons === state.visiblePdfCards, `${label}: each visible PDF should have one view action`);
  assert(state.downloadLinks.every((text) => /Download PDF/i.test(text)), `${label}: secondary download label missing`);
  await page.locator(".official-pdf-link:not([hidden]) [data-official-pdf-preview]").first().click();
  await topIsClear(page, "[data-official-pdf-viewer]", `${label} viewer`);
  const viewer = await page.evaluate(() => ({
    src: document.querySelector("[data-official-pdf-frame]")?.getAttribute("src") || "",
    title: document.querySelector("[data-official-pdf-viewer-title]")?.textContent?.trim() || "",
    downloads: Array.from(document.querySelectorAll("[data-official-pdf-download]")).filter((node) => !node.hidden && node.offsetParent !== null).map((node) => node.getAttribute("href") || ""),
    publicAnswers: JSON.parse(sessionStorage.getItem("mflgPublicAnswers") || "{}")
  }));
  assert(viewer.src.startsWith("/api/official-pdf/"), `${label}: viewer is not same-site: ${viewer.src}`);
  assert(viewer.downloads.every((href) => href.startsWith("/api/official-pdf/")), `${label}: download is not same-site`);
  assert(viewer.publicAnswers.county === "Maricopa", `${label}: viewer reset county state`);
  await assertNoExternalPdf(page, label);
  await assertNoOverflow(page, label);
}

async function revealActions(page, label) {
  await page.goto(`${baseUrl}/practice-areas/`, { waitUntil: "domcontentloaded" });
  await clearStorage(page);
  await page.reload({ waitUntil: "domcontentloaded" });
  const reveal = page.locator("[data-service-reveal]").first();
  if (await reveal.isVisible().catch(() => false)) await reveal.click();
  const card = page.locator("[data-service-card]").filter({ hasText: "Divorce" }).first();
  await card.locator("[data-service-detail-toggle]").click();
  await topIsClear(page, ".service-row-panel", `${label} practice issue`);
  await page.locator('.service-row-panel [data-service-action="forms"]').first().click();
  await topIsClear(page, '.service-row-panel [data-service-panel-section="forms"]', `${label} practice forms`);
  const buttons = await page.evaluate(() => Array.from(document.querySelectorAll(".service-row-panel [data-service-action]")).map((node) => ({
    label: node.textContent.trim(),
    pressed: node.getAttribute("aria-pressed")
  })));
  assert(buttons.some((item) => /forms/i.test(item.label) && item.pressed === "true"), `${label}: forms action did not become active`);

  await page.goto(`${baseUrl}/guides/`, { waitUntil: "domcontentloaded" });
  await clearStorage(page);
  await page.reload({ waitUntil: "domcontentloaded" });
  const guideReveal = page.locator("[data-guide-reveal]").first();
  if (await guideReveal.isVisible().catch(() => false)) await guideReveal.click();
  const guide = page.locator("[data-guide-card]").filter({ hasText: "Divorce" }).first();
  await guide.locator("[data-guide-open]").click();
  await topIsClear(page, ".guide-row-panel", `${label} guide panel`);
}

async function heroChecks(page, viewport) {
  await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });
  await clearStorage(page);
  await page.reload({ waitUntil: "domcontentloaded" });
  const state = await page.evaluate(() => {
    const hero = document.querySelector(".hero-features");
    const spans = Array.from(hero?.querySelectorAll("span") || []);
    return {
      rows: new Set(spans.map((span) => Math.round(span.getBoundingClientRect().top))).size,
      heroOverflow: hero ? hero.scrollWidth > hero.clientWidth : false,
      pageOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      helpIcons: Array.from(document.querySelectorAll(".hero .legal-term-help,.hero-features .legal-term-help"))
        .filter((el) => getComputedStyle(el).display !== "none" && el.getBoundingClientRect().width > 0).length,
      staticInteractive: Array.from(document.querySelectorAll(".hero-features a,.hero-features button,.hero-features [tabindex]")).length
    };
  });
  assert(state.rows === 1, `${viewport.name}: hero feature pills wrapped to ${state.rows} rows`);
  assert(!state.pageOverflow, `${viewport.name}: hero created page overflow`);
  assert(state.helpIcons === 0, `${viewport.name}: hero glossary icons visible`);
  assert(state.staticInteractive === 0, `${viewport.name}: static hero pills are interactive`);
}

(async () => {
  const browser = await chromium.launch();
  try {
    for (const viewport of viewports) {
      const { context, page } = await freshPage(browser, viewport);
      await heroChecks(page, viewport);
      await formsWorkflow(page, viewport.name);
      await revealActions(page, viewport.name);
      await context.close();
    }
  } finally {
    await browser.close();
  }
  console.log("NAVIGATION_PROGRESSIVE_DISCLOSURE_PASS");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
