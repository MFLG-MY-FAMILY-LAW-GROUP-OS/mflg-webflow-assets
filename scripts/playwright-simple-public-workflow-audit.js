const { chromium } = require("playwright");

const baseUrl = process.env.MFLG_TEST_BASE_URL || "http://127.0.0.1:8787";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function clear(page) {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

async function visibleCount(locator) {
  return locator.evaluateAll((nodes) => nodes.filter((node) => {
    const rect = node.getBoundingClientRect();
    const style = getComputedStyle(node);
    return !node.hidden && style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
  }).length);
}

async function auditHero(page) {
  await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
  await clear(page);
  const state = await page.evaluate(() => {
    const hero = document.querySelector(".hero-features");
    const labels = Array.from(hero?.querySelectorAll("span") || []);
    const taskChoices = Array.from(document.querySelectorAll(".hero-task-grid .hero-task-pill"));
    return {
      viewportWidth: window.innerWidth,
      rows: new Set(labels.map((label) => Math.round(label.getBoundingClientRect().top))).size,
      labels: labels.map((label) => label.textContent.trim()),
      taskChoiceRows: new Set(taskChoices.map((choice) => Math.round(choice.getBoundingClientRect().top))).size,
      taskChoiceCount: taskChoices.length,
      taskChoiceLabels: taskChoices.map((choice) => choice.textContent.trim()),
      interactive: hero ? hero.querySelectorAll("a,button,[tabindex], [role='button'], [role='tab']").length : -1,
      helpIcons: Array.from(document.querySelectorAll(".hero .legal-term-help,.hero-features .legal-term-help")).filter((node) => {
        const rect = node.getBoundingClientRect();
        const style = getComputedStyle(node);
        return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
      }).length,
      homepageIssueCards: Array.from(document.querySelectorAll("[data-service-card]")).filter((node) => {
        const rect = node.getBoundingClientRect();
        const style = getComputedStyle(node);
        return !node.hidden && style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
      }).length,
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      firstSections: Array.from(document.querySelectorAll("[data-page-root] > section")).slice(0, 4).map((section) => section.querySelector("h1,h2")?.textContent?.trim() || "")
    };
  });
  assert(state.rows === 1, `hero labels wrapped to ${state.rows} rows`);
  assert(state.labels.length === 4, `hero label count ${state.labels.length}`);
  assert(state.taskChoiceCount === 4, `task choice count ${state.taskChoiceCount}`);
  assert(state.taskChoiceLabels.join("|") === "Find forms|Use calculator|Read DIY guide|Start Guided Intake", `hero task labels wrong: ${state.taskChoiceLabels.join(" / ")}`);
  if (state.viewportWidth >= 1000) {
    assert(state.taskChoiceRows === 1, `desktop task choices wrapped to ${state.taskChoiceRows} rows`);
  }
  assert(state.interactive === 0, "hero labels are interactive");
  assert(state.helpIcons === 0, "hero question/help icons present");
  assert(!state.overflow, "homepage has horizontal overflow");
  assert(/Find your issue/i.test(state.firstSections[1] || ""), `issue finder does not immediately follow hero: ${state.firstSections.join(" / ")}`);
  assert(/Before services begin/i.test(state.firstSections[2] || ""), `process proof order wrong: ${state.firstSections.join(" / ")}`);
  assert(state.homepageIssueCards > 0 && state.homepageIssueCards <= 8, `homepage exposes too many issue cards early: ${state.homepageIssueCards}`);
}

async function auditCatalog(page, path, cardSelector, ctaSelector, expectedLabel, filterSelector, resetSelector, searchSelector, countSelector) {
  await page.goto(`${baseUrl}${path}`, { waitUntil: "networkidle" });
  await clear(page);
  const revealSelector = path.includes("guides") ? "[data-guide-reveal]" : "[data-service-reveal]";
  const reveal = page.locator(revealSelector);
  if (await reveal.count()) await reveal.click();
  const total = await page.locator(cardSelector).count();
  assert(total === 50, `${path}: expected 50 cards, found ${total}`);
  const failures = await page.locator(cardSelector).evaluateAll((cards, args) => cards.map((card, index) => {
    const ctas = Array.from(card.querySelectorAll(args.ctaSelector)).filter((node) => {
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return !node.hidden && style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    });
    return {
      index,
      title: card.querySelector("h3")?.textContent?.trim() || "",
      ctaCount: ctas.length,
      ctaText: ctas.map((node) => node.textContent.trim()),
      tablists: card.querySelectorAll("[role='tablist'], [role='tab'], .w-tab-menu, .w-tab-content, [data-w-tab]").length,
      roleButton: card.getAttribute("role") === "button",
      tabindex: card.hasAttribute("tabindex")
    };
  }), { ctaSelector });
  const bad = failures.filter((item) => item.ctaCount !== 1 || item.ctaText[0] !== expectedLabel || item.tablists || item.roleButton || item.tabindex);
  assert(!bad.length, `${path}: card CTA/tab failures ${JSON.stringify(bad.slice(0, 5))}`);
  const firstFilter = page.locator(filterSelector).nth(1);
  await firstFilter.click();
  const pressed = await firstFilter.getAttribute("aria-pressed");
  assert(pressed === "true", `${path}: filter did not set aria-pressed`);
  const filteredVisible = await visibleCount(page.locator(cardSelector));
  assert(filteredVisible > 0 && filteredVisible < 50, `${path}: filter did not change visible card count (${filteredVisible})`);
  await page.locator(searchSelector).fill("zzzz no match");
  const emptyVisible = await visibleCount(page.locator(cardSelector));
  assert(emptyVisible === 0, `${path}: no-results search still shows ${emptyVisible} cards`);
  await page.locator(resetSelector).click();
  const resetVisible = await visibleCount(page.locator(cardSelector));
  assert(resetVisible > 0, `${path}: reset did not restore visible cards`);
  const countText = await page.locator(countSelector).textContent();
  assert(/Showing/i.test(countText || ""), `${path}: count text missing`);
}

async function auditWorkspace(page) {
  await page.goto(`${baseUrl}/practice-areas/`, { waitUntil: "networkidle" });
  const reveal = page.locator("[data-service-reveal]");
  if (await reveal.count()) await reveal.click();
  await page.locator("[data-service-card] [data-service-detail-toggle]").first().click();
  await page.locator("[data-task-workspace]").waitFor({ state: "visible" });
  let visibleStates = await visibleCount(page.locator("[data-task-workspace] .task-workspace-state"));
  assert(visibleStates === 1, `practice workspace visible states ${visibleStates}`);
  await page.locator("[data-task-workspace] [data-service-action='forms']").first().click();
  visibleStates = await visibleCount(page.locator("[data-task-workspace] .task-workspace-state"));
  assert(visibleStates === 1, `practice forms state visible states ${visibleStates}`);
  const hiddenInteractive = await page.locator("[data-task-workspace] .task-workspace-state[hidden] a, [data-task-workspace] .task-workspace-state[hidden] button").count();
  assert(hiddenInteractive === 0 || await page.locator("[data-task-workspace] .task-workspace-state[hidden][inert]").count() > 0, "hidden states are not inert");

  await page.goto(`${baseUrl}/guides/`, { waitUntil: "networkidle" });
  await page.locator("[data-guide-reveal]").click();
  await page.locator("[data-guide-card] [data-guide-open]").first().click();
  await page.locator("[data-task-workspace]").waitFor({ state: "visible" });
  visibleStates = await visibleCount(page.locator("[data-task-workspace] .task-workspace-state"));
  assert(visibleStates === 1, `guide workspace visible states ${visibleStates}`);
}

async function auditPdfLinks(page) {
  await page.goto(`${baseUrl}/forms/`, { waitUntil: "networkidle" });
  const external = await page.evaluate(() => Array.from(document.querySelectorAll("a[href$='.pdf'], a[href*='.pdf?'], [data-site-pdf-view-url], [data-site-pdf-download-url]"))
    .map((node) => node.getAttribute("href") || node.dataset.sitePdfViewUrl || node.dataset.sitePdfDownloadUrl || "")
    .filter(Boolean)
    .filter((href) => href.includes(".pdf") || href.includes("/api/official-pdf/"))
    .filter((href) => !href.startsWith("/api/official-pdf/")));
  assert(external.length === 0, `external public PDF routes found: ${external.slice(0, 5).join(", ")}`);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await auditHero(page);
    await auditCatalog(page, "/practice-areas/", "[data-service-card]", "[data-service-detail-toggle]", "Choose this issue", "[data-service-category-filter]", "[data-service-category-reset]", "[data-service-search]", "[data-service-count]");
    await auditCatalog(page, "/guides/", "[data-guide-card]", "[data-guide-open]", "Open guide", "[data-guide-category-filter]", "[data-guide-category-reset]", "[data-guide-search]", "[data-guide-count]");
    await auditWorkspace(page);
    await auditPdfLinks(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await auditHero(page);
    console.log("SIMPLE_PUBLIC_WORKFLOW_AUDIT_PASS");
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
