const { chromium } = require("playwright");

const baseUrl = process.env.MFLG_TEST_BASE_URL || "http://127.0.0.1:8787";
const viewports = [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "mobile", width: 390, height: 844 }
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function capture(page, viewport, state) {
  await page.screenshot({
    path: `test-results/forms-tools-${viewport.name}-${state}.png`,
    fullPage: true
  });
}

async function pageState(page) {
  return page.evaluate(() => ({
    routerHidden: document.querySelector("#forms-official-router")?.classList.contains("forms-flow-hidden"),
    packetsHidden: document.querySelector("#forms-packets")?.classList.contains("forms-flow-hidden"),
    calculatorHidden: document.querySelector("#forms-calculator-hub")?.classList.contains("forms-flow-hidden"),
    matterHidden: document.querySelector("#forms-matter-coverage")?.classList.contains("forms-flow-hidden"),
    laneVisible: getComputedStyle(document.querySelector(".forms-entry-lanes")).display !== "none",
    activeCalc: document.body.classList.contains("forms-active-need-calculator"),
    activeDeadline: document.body.classList.contains("forms-active-need-deadline"),
    action: document.querySelector("[data-guided-result-action]")?.textContent?.trim(),
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
  }));
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const viewport of viewports) {
      const page = await browser.newPage({ viewport });
      await page.goto(`${baseUrl}/tools/`, { waitUntil: "networkidle" });
      await capture(page, viewport, "initial");
      const initial = await pageState(page);
      assert(initial.routerHidden, `${viewport.name}: router should start hidden`);
      assert(initial.packetsHidden, `${viewport.name}: packets should start hidden`);
      assert(initial.calculatorHidden, `${viewport.name}: calculator should start hidden`);
      assert(initial.matterHidden, `${viewport.name}: matter coverage should start hidden`);
      assert(initial.laneVisible, `${viewport.name}: four quick-start cards should be visible`);
      assert(!initial.overflow, `${viewport.name}: initial page has horizontal overflow`);

      await page.click('[data-guided-answer="forms"]');
      await page.click('[data-guided-answer="Maricopa"]');
      await page.click('[data-guided-answer="New filing"]');
      await page.click('[data-guided-answer="divorce"]');
      await page.click('[data-guided-answer="minor-children"]');
      const forms = await pageState(page);
      assert(!forms.routerHidden, `${viewport.name}: form router should reveal after forms path`);
      assert(!forms.packetsHidden, `${viewport.name}: packets should reveal after forms path`);
      assert(forms.calculatorHidden, `${viewport.name}: calculator should remain hidden on forms path`);
      assert(/Open matched forms/i.test(forms.action || ""), `${viewport.name}: forms CTA should open matched forms`);
      assert(!forms.overflow, `${viewport.name}: forms path has horizontal overflow`);
      await capture(page, viewport, "forms-path");

      await page.click("[data-smart-reset]");
      await page.click('[data-smart-lane="calculator"]');
      const calc = await pageState(page);
      assert(calc.routerHidden, `${viewport.name}: router should stay hidden on calculator path`);
      assert(calc.packetsHidden, `${viewport.name}: packets should stay hidden on calculator path`);
      assert(!calc.calculatorHidden, `${viewport.name}: calculator hub should reveal`);
      assert(calc.activeCalc, `${viewport.name}: calculator body state should be active`);
      assert(!calc.overflow, `${viewport.name}: calculator path has horizontal overflow`);
      await capture(page, viewport, "calculator-path");

      await page.click("[data-smart-reset]");
      await page.click('[data-smart-lane="deadline"]');
      const deadline = await page.evaluate(() => {
        const calcHub = document.querySelector("#forms-calculator-hub");
        const deadlineTool = document.querySelector("#deadline-readiness-planner");
        return {
          routerHidden: document.querySelector("#forms-official-router")?.classList.contains("forms-flow-hidden"),
          packetsHidden: document.querySelector("#forms-packets")?.classList.contains("forms-flow-hidden"),
          calculatorHidden: calcHub?.classList.contains("forms-flow-hidden"),
          activeDeadline: document.body.classList.contains("forms-active-need-deadline"),
          calcHeadDisplay: getComputedStyle(calcHub.querySelector(".section-head")).display,
          deadlineDisplay: getComputedStyle(deadlineTool).display,
          overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
        };
      });
      assert(!deadline.routerHidden, `${viewport.name}: router should reveal for deadline path`);
      assert(deadline.packetsHidden, `${viewport.name}: packets should remain hidden for deadline path`);
      assert(!deadline.calculatorHidden, `${viewport.name}: deadline container should reveal`);
      assert(deadline.activeDeadline, `${viewport.name}: deadline body state should be active`);
      assert(deadline.calcHeadDisplay === "none", `${viewport.name}: calculator hub chrome should be hidden in deadline path`);
      assert(deadline.deadlineDisplay !== "none", `${viewport.name}: deadline tool should be visible`);
      assert(!deadline.overflow, `${viewport.name}: deadline path has horizontal overflow`);
      await capture(page, viewport, "deadline-path");
      await page.close();
    }
  } finally {
    await browser.close();
  }
  console.log("PLAYWRIGHT_FORMS_TOOLS_GUIDED_FLOW_PASS");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
