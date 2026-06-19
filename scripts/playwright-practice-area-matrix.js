const { chromium } = require("playwright");

const baseUrl = process.env.MFLG_TEST_BASE_URL || "http://127.0.0.1:8787";
const fakeCounty = /^Maricopa$/i;
const fakePosture = /^New filing$/i;
const fakeChildren = /^any$/i;
const missingCounty = /Choose county|Not selected|Statewide/i;
const missingPosture = /Choose stage|Not selected|Safety/i;
const missingChildren = /Choose one|Not selected|Minor children|No minor children/i;
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

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertPublicIssueLabel(value, title) {
  assert(value && value.trim(), `${title}: public issue label missing`);
  assert(!internalIssue.test(value.trim()), `${title}: raw internal issue label visible: ${value}`);
  assert(!forbiddenStructuredValues.has(value.trim().toLowerCase()), `${title}: unmapped composite issue label visible: ${value}`);
  assert(!rawRouteToken.test(value.trim()), `${title}: raw route token visible as issue: ${value}`);
  assert(/[A-Z]/.test(value), `${title}: issue label is not public-formatted: ${value}`);
}

function readPanelInPage() {
    const panel = document.querySelector(".service-row-panel");
    const bridge = panel?.querySelector("[data-guide-pdf-panel]");
    const cells = Array.from(bridge?.querySelectorAll(".guide-forms-bridge-grid article") || []).map((item) => ({
      label: item.querySelector("span")?.textContent?.trim() || "",
      value: item.querySelector("strong")?.textContent?.trim() || ""
    }));
    const valueFor = (label) => cells.find((item) => item.label === label)?.value || "";
    const actions = Array.from(panel?.querySelectorAll("a.button, button.button") || [])
      .filter((item) => !!(item.offsetWidth || item.offsetHeight || item.getClientRects().length))
      .map((item) => ({
        text: item.textContent.trim(),
        className: item.className,
        href: item.getAttribute("href") || "",
        primary: item.classList.contains("primary")
      }));
    const packetChoices = Array.from(panel?.querySelectorAll("[data-guide-packet-choice]") || []).map((item) => ({
      text: item.textContent.replace(/\s+/g, " ").trim(),
      className: item.className,
      active: item.classList.contains("active"),
      issue: item.dataset.routeIssue || "",
      posture: item.dataset.routePosture || "",
      children: item.dataset.routeChildren || "",
      packet: item.dataset.packetId || ""
    }));
    const title = panel?.querySelector(".guide-panel-heading h3")?.textContent?.trim() || "";
    return {
      title,
      county: valueFor("County"),
      issue: valueFor("Issue"),
      posture: valueFor("Case stage"),
      children: valueFor("Children"),
      actions,
      packetChoices,
      hasForms: actions.some((action) => /form/i.test(action.text)),
      hasCalculator: actions.some((action) => /calculator|planner|counter/i.test(action.text)),
      hasGuide: actions.some((action) => /steps|guide/i.test(action.text)),
      intakePrimary: actions.some((action) => action.primary && /intake/i.test(action.text)),
      formsPrimary: actions.some((action) => action.primary && /form/i.test(action.text)),
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      visibleText: panel?.textContent?.replace(/\s+/g, " ").trim() || ""
    };
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const failures = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await page.goto(`${baseUrl}/practice-areas/`, { waitUntil: "networkidle" });
    await page.evaluate(() => {
      document.querySelector("[data-service-category-reset]")?.click();
      const reveal = document.querySelector("[data-service-reveal]");
      if (reveal?.getAttribute("aria-expanded") !== "true") reveal?.click();
    });
    await page.waitForFunction(() => Array.from(document.querySelectorAll("[data-service-card]")).every((card) => !card.hidden), null, { timeout: 10000 });
    const count = await page.locator("[data-service-card]").count();
    assert(count === expectedCardCount, `Expected ${expectedCardCount} practice-area cards, found ${count}`);
    const states = await page.evaluate(async () => {
      const readPanel = () => {
        const panel = document.querySelector(".service-row-panel");
        const bridge = panel?.querySelector("[data-guide-pdf-panel]");
        const cells = Array.from(bridge?.querySelectorAll(".guide-forms-bridge-grid article") || []).map((item) => ({
          label: item.querySelector("span")?.textContent?.trim() || "",
          value: item.querySelector("strong")?.textContent?.trim() || ""
        }));
        const valueFor = (label) => cells.find((item) => item.label === label)?.value || "";
        const actions = Array.from(panel?.querySelectorAll("a.button, button.button") || [])
          .filter((item) => !!(item.offsetWidth || item.offsetHeight || item.getClientRects().length))
          .map((item) => ({
            text: item.textContent.trim(),
            className: item.className,
            href: item.getAttribute("href") || "",
            primary: item.classList.contains("primary")
          }));
        const packetChoices = Array.from(panel?.querySelectorAll("[data-guide-packet-choice]") || []).map((item) => ({
          text: item.textContent.replace(/\s+/g, " ").trim(),
          className: item.className,
          active: item.classList.contains("active"),
          issue: item.dataset.routeIssue || "",
          posture: item.dataset.routePosture || "",
          children: item.dataset.routeChildren || "",
          packet: item.dataset.packetId || ""
        }));
        const title = panel?.querySelector(".guide-panel-heading h3")?.textContent?.trim() || "";
        return {
          title,
          county: valueFor("County"),
          issue: valueFor("Issue"),
          posture: valueFor("Case stage"),
          children: valueFor("Children"),
          actions,
          packetChoices,
          hasForms: actions.some((action) => /form/i.test(action.text)),
          hasCalculator: actions.some((action) => /calculator|planner|counter/i.test(action.text)),
          hasGuide: actions.some((action) => /steps|guide/i.test(action.text)),
          intakePrimary: actions.some((action) => action.primary && /intake/i.test(action.text)),
          formsPrimary: actions.some((action) => action.primary && /form/i.test(action.text)),
          overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
          visibleText: panel?.textContent?.replace(/\s+/g, " ").trim() || ""
        };
      };
      const cards = Array.from(document.querySelectorAll("[data-service-card]"));
      const output = [];
      for (let index = 0; index < cards.length; index += 1) {
        const card = cards[index];
        if (card.hidden) {
          output.push({ index, hidden: true, title: card.querySelector("h3")?.textContent?.trim() || "" });
          continue;
        }
        const cardTitle = card.querySelector("h3")?.textContent?.trim() || "";
        card.scrollIntoView({ block: "center" });
        card.querySelector("[data-service-detail-toggle]")?.click();
        await new Promise((resolve) => requestAnimationFrame(() => resolve()));
        output.push({ index, cardTitle, ...readPanel() });
      }
      return output;
    });
    let opened = 0;
    let asserted = 0;
    let skipped = 0;
    for (const state of states) {
      try {
        assert(!state.hidden, `${state.title || `card ${state.index}`}: card hidden or unavailable`);
        opened += 1;
        assert(state.title, `card ${state.index}: title missing`);
        assert(state.title === state.cardTitle, `card ${state.index}: opened panel ${state.title} did not match clicked card ${state.cardTitle}`);
        assertPublicIssueLabel(state.issue, state.title);
        if (/^Mediation Preparation$/i.test(state.title)) {
          assert(state.issue === "Mediation / ADR", `Mediation Preparation should show Mediation / ADR, got ${state.issue}`);
        }
        assert(!fakeCounty.test(state.county), `${state.title}: fake-selected County Maricopa`);
        assert(!fakePosture.test(state.posture), `${state.title}: fake-selected New filing`);
        assert(!fakeChildren.test(state.children), `${state.title}: fake-selected Children any`);
        assert(missingCounty.test(state.county), `${state.title}: county must be missing/suggested, got ${state.county}`);
        assert(missingPosture.test(state.posture), `${state.title}: case stage must be missing/suggested, got ${state.posture}`);
        assert(missingChildren.test(state.children), `${state.title}: children must be missing/suggested, got ${state.children}`);
        assert(!state.packetChoices.some((choice) => choice.active), `${state.title}: packet choice should not be selected before user confirmation`);
        assert(!visibleMachineToken.test(state.visibleText), `${state.title}: visible machine token leaked`);
        assert(!state.intakePrimary, `${state.title}: Intake should not be primary when forms/tools are available`);
        assert(state.hasForms || state.hasCalculator || state.hasGuide, `${state.title}: no forms/calculator/guide path visible`);
        if (state.hasForms) assert(state.actions.some((action) => /form/i.test(action.text)), `${state.title}: forms path missing`);
        assert(!state.overflow, `${state.title}: horizontal overflow`);
        asserted += 1;
      } catch (error) {
        if (state.hidden) skipped += 1;
        failures.push(error.message);
      }
    }
    assert(opened === expectedCardCount, `Expected ${expectedCardCount} opened cards, got ${opened}`);
    assert(asserted === expectedCardCount, `Expected ${expectedCardCount} asserted cards, got ${asserted}`);
    assert(skipped === 0, `Expected 0 skipped cards, got ${skipped}`);
    console.log(`PRACTICE_AREA_MATRIX_COUNTS expected=${expectedCardCount} discovered=${count} opened=${opened} asserted=${asserted} skipped=${skipped}`);
    await page.close();
  } finally {
    await browser.close();
  }
  if (failures.length) {
    console.error("PRACTICE_AREA_MATRIX_FAILED");
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }
  console.log("PRACTICE_AREA_MATRIX_PASS");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
