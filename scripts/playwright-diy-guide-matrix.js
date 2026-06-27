const { chromium } = require("playwright");

const baseUrl = process.env.MFLG_TEST_BASE_URL || "http://127.0.0.1:8787";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const internalIssue = /^(all|any|undefined|null|support|parentage|parenting|modification|enforcement|safety|annulment|divorce|mediation|documents|agreement)$/;
const rawRouteToken = /^[a-z0-9]+(?:[-_][a-z0-9]+)+$/;
const expectedCardCount = 50;
const forbiddenStructuredValues = new Set([
  "paternity / parenting time / child support",
  "income withholding / support",
  "temporary orders / court readiness",
  "property division enforcement",
  "foreign support order",
  "name or address update",
  "foreign family-court order",
  "out-of-state custody enforcement",
  "post-decree temporary orders"
]);
const visibleMachineToken = /\b(?:maricopa|pima|cochise|yavapai|azcourts)-[a-z0-9]+(?:-[a-z0-9]+)+\b|\bofficial-pdf-[a-z0-9-]+\b|\bforms-tools-[a-z0-9-]+\b|\b[a-z]+_[a-z0-9_]+\b/;

function assertPublicIssueLabel(value, title) {
  assert(value && value.trim(), `${title}: public issue label missing`);
  assert(!internalIssue.test(value.trim()), `${title}: raw internal issue label visible: ${value}`);
  assert(!forbiddenStructuredValues.has(value.trim().toLowerCase()), `${title}: unmapped composite issue label visible: ${value}`);
  assert(!rawRouteToken.test(value.trim()), `${title}: raw route token visible as issue: ${value}`);
  assert(/[A-Z]/.test(value), `${title}: issue label is not public-formatted: ${value}`);
}

async function openGuide(page, index) {
  const cardTitle = await page.evaluate((guideIndex) => {
    const reveal = document.querySelector("[data-guide-reveal]");
    if (reveal && !document.querySelector(".guide-reveal")?.classList.contains("revealed")) reveal.click();
    const cards = Array.from(document.querySelectorAll("[data-guide-card]"));
    const card = cards[guideIndex];
    const title = card?.querySelector("h3")?.textContent?.trim() || "";
    card?.scrollIntoView({ block: "center" });
    card?.querySelector("[data-guide-open]")?.click();
    return title;
  }, index);
  await page.locator(".guide-row-panel [data-guide-next-choice='forms']").first().click();
  await page.locator(".guide-row-panel [data-guide-pdf-panel]").waitFor({ state: "visible", timeout: 10000 });
  return cardTitle;
}

async function readGuide(page) {
  return page.evaluate(() => {
    const panel = document.querySelector(".guide-row-panel");
    const bridge = panel?.querySelector("[data-guide-pdf-panel]");
    const cells = Array.from(bridge?.querySelectorAll(".guide-forms-bridge-grid article") || []).map((item) => ({
      label: item.querySelector("span")?.textContent?.trim() || "",
      value: item.querySelector("strong")?.textContent?.trim() || ""
    }));
    const valueFor = (label) => cells.find((item) => item.label === label)?.value || "";
    const visibleActions = Array.from(panel?.querySelectorAll("a.button, button.button, [data-guide-next-choice]") || [])
      .filter((item) => !!(item.offsetWidth || item.offsetHeight || item.getClientRects().length))
      .map((item) => ({
        text: item.textContent.trim(),
        className: item.className,
        href: item.getAttribute("href") || "",
        primary: item.classList.contains("primary")
      }));
    const packetChoices = Array.from(panel?.querySelectorAll("[data-guide-packet-choice]") || []).map((item) => ({
      text: item.textContent.replace(/\s+/g, " ").trim(),
      active: item.classList.contains("active"),
      className: item.className
    }));
    return {
      title: panel?.querySelector(".guide-panel-heading h3")?.textContent?.trim() || "",
      county: valueFor("County"),
      issue: valueFor("Issue"),
      posture: valueFor("Case stage"),
      children: valueFor("Children"),
      visibleActions,
      packetChoices,
      hasForms: visibleActions.some((action) => /forms?/i.test(action.text)),
      hasCalculator: visibleActions.some((action) => /calculator|planner|counter/i.test(action.text)),
      intakePrimary: visibleActions.some((action) => action.primary && /intake/i.test(action.text)),
      bridgeHidden: bridge?.hidden === true,
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      visibleText: panel?.textContent?.replace(/\s+/g, " ").trim() || ""
    };
  });
}

async function assertGuideFilterReset(page) {
  await page.goto(`${baseUrl}/guides/`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Documents & safety" }).click();
  await page.waitForTimeout(150);
  const filtered = await page.evaluate(() => ({
    count: document.querySelector("[data-guide-count]")?.textContent?.trim() || "",
    visibleCards: Array.from(document.querySelectorAll("[data-guide-card]")).filter((card) => !card.hidden).length,
    resetVisible: !!document.querySelector("[data-guide-clear-all]:not([hidden])")
  }));
  assert(filtered.count === "Showing 12 guides for Documents & safety", `Filtered guide count should be situation-specific, got ${filtered.count}`);
  assert(filtered.visibleCards === 12, `Documents & safety should show 12 guides, got ${filtered.visibleCards}`);
  assert(filtered.resetVisible, "Show every guide reset should be visible while a situation filter is active");
  await page.getByRole("button", { name: "Show every guide" }).click();
  await page.waitForTimeout(150);
  const reset = await page.evaluate(() => ({
    count: document.querySelector("[data-guide-count]")?.textContent?.trim() || "",
    note: document.querySelector("[data-guide-note]")?.textContent?.trim() || "",
    visibleCards: Array.from(document.querySelectorAll("[data-guide-card]")).filter((card) => !card.hidden).length,
    resetVisible: !!document.querySelector("[data-guide-clear-all]:not([hidden])")
  }));
  assert(reset.count === "Showing 50 of 50 DIY guides", `Show every guide should reset to all guides, got ${reset.count}`);
  assert(reset.visibleCards === expectedCardCount, `Show every guide should reveal ${expectedCardCount} cards, got ${reset.visibleCards}`);
  assert(/Showing all 50 DIY guides/i.test(reset.note), `Reset note should confirm all guides, got ${reset.note}`);
  assert(!reset.resetVisible, "Show every guide reset should hide after returning to the full list");
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const failures = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await page.goto(`${baseUrl}/guides/`, { waitUntil: "networkidle" });
    const count = await page.locator("[data-guide-card]").count();
    assert(count === expectedCardCount, `Expected ${expectedCardCount} DIY guide cards, found ${count}`);
    await assertGuideFilterReset(page);
    let opened = 0;
    let asserted = 0;
    let skipped = 0;
    for (let index = 0; index < count; index += 1) {
      try {
        await page.goto(`${baseUrl}/guides/`, { waitUntil: "networkidle" });
        const cardTitle = await openGuide(page, index);
        opened += 1;
        const state = await readGuide(page);
        assert(state.title, `guide ${index}: title missing`);
        assert(state.title === cardTitle, `guide ${index}: opened panel ${state.title} did not match clicked card ${cardTitle}`);
        assertPublicIssueLabel(state.issue, state.title);
        if (/^Mediation Preparation$/i.test(state.title)) {
          assert(state.issue === "Mediation / ADR", `Mediation Preparation should show Mediation / ADR, got ${state.issue}`);
        }
        assert(!state.bridgeHidden, `${state.title}: bridge state is hidden-only`);
        assert(!/^Maricopa$/i.test(state.county), `${state.title}: fake-selected County Maricopa`);
        assert(!/^New filing$/i.test(state.posture), `${state.title}: fake-selected New filing`);
        assert(!/^any$/i.test(state.children), `${state.title}: fake-selected Children any`);
        assert(/Choose county|Not selected|Statewide/i.test(state.county), `${state.title}: missing/suggested county label absent: ${state.county}`);
        assert(/Choose stage|Not selected|Safety/i.test(state.posture), `${state.title}: missing/suggested stage label absent: ${state.posture}`);
        assert(/Choose one|Not selected|Minor children|No minor children/i.test(state.children), `${state.title}: missing/suggested children label absent: ${state.children}`);
        assert(!state.packetChoices.some((choice) => choice.active), `${state.title}: packet choice should not be selected before user confirmation`);
        assert(!visibleMachineToken.test(state.visibleText), `${state.title}: visible machine token leaked`);
        assert(state.hasForms || state.hasCalculator, `${state.title}: forms/calculator paths not visible`);
        assert(!state.intakePrimary, `${state.title}: Intake should be secondary when guide tools are available`);
        assert(!state.overflow, `${state.title}: horizontal overflow`);
        asserted += 1;
      } catch (error) {
        skipped += 1;
        failures.push(error.message);
      }
    }
    assert(opened === expectedCardCount, `Expected ${expectedCardCount} opened guides, got ${opened}`);
    assert(asserted === expectedCardCount, `Expected ${expectedCardCount} asserted guides, got ${asserted}`);
    assert(skipped === 0, `Expected 0 skipped guides, got ${skipped}`);
    console.log(`DIY_GUIDE_MATRIX_COUNTS expected=${expectedCardCount} discovered=${count} opened=${opened} asserted=${asserted} skipped=${skipped}`);
    await page.close();
  } finally {
    await browser.close();
  }
  if (failures.length) {
    console.error("DIY_GUIDE_MATRIX_FAILED");
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }
  console.log("DIY_GUIDE_MATRIX_PASS");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
