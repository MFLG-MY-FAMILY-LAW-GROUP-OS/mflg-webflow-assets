const { chromium } = require("playwright");

const baseUrl = process.env.MFLG_TEST_BASE_URL || "http://127.0.0.1:8787";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await page.goto(`${baseUrl}/guides/`, { waitUntil: "networkidle" });

    const opened = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("[data-guide-open]"));
      const button = buttons.find((item) => /name change|divorce|dissolution/i.test(item.closest("[data-guide-card]")?.textContent || "")) || buttons[0];
      button?.click();
      return Boolean(button);
    });
    assert(opened, "No guide card could be opened");
    await page.locator("[data-guide-next-choice='forms']").first().click();

    const bridge = page.locator("[data-guide-pdf-panel]").first();
    await bridge.waitFor({ state: "visible", timeout: 10000 });

    const initialState = await page.evaluate(() => ({
      title: document.querySelector("[data-guide-pdf-panel] strong")?.textContent?.trim() || "",
      cta: document.querySelector("[data-guide-pdf-panel] a.button.primary")?.textContent?.trim() || "",
      route: document.querySelector("[data-guide-pdf-panel] a.button.primary")?.getAttribute("data-guide-forms-route") || "",
      calculatorChoice: document.querySelector("[data-guide-pdf-panel] a.button.primary")?.getAttribute("data-guide-calculator-choice") || "",
      packetChooserVisible: Boolean(document.querySelector("[data-guide-packet-chooser]")),
      countyGateVisible: Boolean(document.querySelector("[data-guide-county-choice]")),
      viewerFrameVisible: Boolean(document.querySelector("[data-guide-pdf-frame]"))
    }));
    assert(initialState.title.length > 0, "Guide bridge title did not render");
    assert(/Answer questions to find forms|Continue to form viewer/i.test(initialState.cta), `Guide bridge CTA missing: ${initialState.cta}`);
    assert(initialState.route.length > 0, "Guide bridge did not carry a forms route");
    const initialRoute = JSON.parse(initialState.route);
    assert(initialState.calculatorChoice === "", "Guide form-check CTA should not carry calculator state");
    assert(!initialRoute.suggestedPacket && !initialRoute.suggestedPacketLabel, "Guide form-check route should not preselect a packet");
    assert(!initialState.packetChooserVisible, "Guide reveal should not show a packet chooser before form questions");
    assert(initialState.countyGateVisible === false, "Old county gate should not render in the guide bridge");
    assert(initialState.viewerFrameVisible === false, "Guide bridge should not render an embedded PDF frame");

    await page.locator("[data-guide-pdf-panel] a.button.primary").first().click();
    await page.waitForFunction(() => window.location.pathname.replace(/\/$/, "") === "/tools");
    await page.locator("[data-forms-smart-path]").waitFor({ state: "visible", timeout: 10000 });
    const toolsHandoffState = await page.evaluate(() => ({
      progressLabel: document.querySelector("[data-guided-progress-label]")?.textContent?.trim() || "",
      question: document.querySelector("[data-guided-question]")?.textContent?.trim() || "",
      copy: document.querySelector("[data-guided-copy]")?.textContent?.replace(/\s+/g, " ").trim() || "",
      action: document.querySelector("[data-guided-result-action]")?.textContent?.trim() || "",
      actionDisabled: document.querySelector("[data-guided-result-action]")?.disabled || false,
      smartCounty: document.querySelector("[data-smart-county]")?.value || "",
      smartPosture: document.querySelector("[data-smart-posture]")?.value || "",
      smartChildren: document.querySelector("[data-smart-children]")?.value || "",
      formCounty: document.querySelector("[data-form-county]")?.value || "",
      formPosture: document.querySelector("[data-form-posture]")?.value || "",
      formChildren: document.querySelector("[data-form-children]")?.value || "",
      packetSelect: document.querySelector("[data-forms-packet-select]")?.value || "",
      summaryChips: Array.from(document.querySelectorAll("[data-guided-summary] span")).map((chip) => chip.textContent.trim()),
      routerHidden: document.querySelector("#forms-official-router")?.classList.contains("forms-flow-hidden"),
      packetsHidden: document.querySelector("#forms-packets")?.classList.contains("forms-flow-hidden"),
      resumeActive: document.querySelector("[data-forms-smart-path]")?.classList.contains("forms-guided-resume") || false,
      guidedComplete: document.querySelector("[data-forms-smart-path]")?.classList.contains("forms-guided-complete") || false,
      text: document.body.innerText.replace(/\s+/g, " ").trim()
    }));
    assert(/Guide context added/i.test(toolsHandoffState.progressLabel), `Tools handoff should show guide context, got ${toolsHandoffState.progressLabel}`);
    assert(/not selected for you/i.test(toolsHandoffState.copy), `Guide handoff should say answers are not selected, got ${toolsHandoffState.copy}`);
    assert(toolsHandoffState.action === "Choose one answer above", `Guide handoff CTA should require an answer, got ${toolsHandoffState.action}`);
    assert(toolsHandoffState.actionDisabled, "Guide handoff CTA should stay disabled until the user answers the current question");
    assert(toolsHandoffState.smartCounty === "Not sure", `Guide handoff should not preselect county, got ${toolsHandoffState.smartCounty}`);
    assert(toolsHandoffState.smartPosture === "Any posture", `Guide handoff should not preselect stage, got ${toolsHandoffState.smartPosture}`);
    assert(toolsHandoffState.smartChildren === "any", `Guide handoff should not preselect children, got ${toolsHandoffState.smartChildren}`);
    assert(toolsHandoffState.formCounty === "Not sure", `Form finder should not preselect county, got ${toolsHandoffState.formCounty}`);
    assert(toolsHandoffState.formPosture === "Any posture", `Form finder should not preselect stage, got ${toolsHandoffState.formPosture}`);
    assert(toolsHandoffState.formChildren === "any", `Form finder should not preselect children, got ${toolsHandoffState.formChildren}`);
    assert(toolsHandoffState.packetSelect === "all", `Packet builder should not default to a county packet, got ${toolsHandoffState.packetSelect}`);
    assert(toolsHandoffState.summaryChips.length === 0, `Guide handoff should not show answer chips before the user answers, got ${toolsHandoffState.summaryChips.join(", ")}`);
    assert(toolsHandoffState.routerHidden, "Guide handoff should keep the lower form router hidden until answers are complete");
    assert(toolsHandoffState.packetsHidden, "Guide handoff should keep packet forms hidden until answers are complete");
    assert(!toolsHandoffState.resumeActive, "Guide handoff should not look like saved answers were already selected");
    assert(!toolsHandoffState.guidedComplete, "Guide handoff should not mark unanswered form questions complete");
    assert(!/Maricopa County Forms|Starting a Maricopa divorce/i.test(toolsHandoffState.text), "Guide handoff should not expose Maricopa default packet copy before answers");

    await page.goto(`${baseUrl}/practice-areas/`, { waitUntil: "networkidle" });
    const annulmentOpened = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll("[data-service-card]"));
      const card = cards.find((item) => /^Annulment$/i.test(item.querySelector("h3")?.textContent?.trim() || ""));
      card?.querySelector("[data-service-detail-toggle]")?.click();
      return Boolean(card);
    });
    assert(annulmentOpened, "Annulment practice-area card could not be opened");
    await page.locator("[data-service-action='forms']").first().click();
    await page.locator("[data-guide-pdf-panel]").first().waitFor({ state: "visible", timeout: 10000 });
    const annulmentState = await page.evaluate(() => {
      const panel = document.querySelector("[data-guide-pdf-panel]");
      const gridText = Array.from(panel?.querySelectorAll(".guide-forms-bridge-grid article") || []).map((item) => ({
        label: item.querySelector("span")?.textContent?.trim() || "",
        value: item.querySelector("strong")?.textContent?.trim() || ""
      }));
      const valueFor = (label) => gridText.find((item) => item.label === label)?.value || "";
      return {
        title: panel?.querySelector("strong")?.textContent?.trim() || "",
        text: panel?.textContent?.replace(/\s+/g, " ").trim() || "",
        county: valueFor("County"),
        issue: valueFor("Issue"),
        stage: valueFor("Case stage"),
        children: valueFor("Children"),
        actions: Array.from(document.querySelectorAll(".service-row-panel a.button, .service-row-panel button.button")).map((item) => item.textContent.trim()),
        intakePrimaryCount: Array.from(document.querySelectorAll(".service-row-panel a.button.primary")).filter((item) => /intake/i.test(item.textContent || "")).length,
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
      };
    });
    assert(/Annulment/i.test(annulmentState.title), `Annulment bridge should preserve issue title, got ${annulmentState.title}`);
    assert(/Choose county|county/i.test(annulmentState.text), "Annulment bridge should keep county-confirmation context visible");
    assert(/^annulment$/i.test(annulmentState.issue), `Annulment issue should be preserved, got ${annulmentState.issue}`);
    assert(!/Maricopa/i.test(annulmentState.county), `Annulment county should not default to Maricopa, got ${annulmentState.county}`);
    assert(/Choose county|Not selected/i.test(annulmentState.county), `Annulment county should show missing qualifier, got ${annulmentState.county}`);
    assert(!/New filing/i.test(annulmentState.stage), `Annulment stage should not default to New filing, got ${annulmentState.stage}`);
    assert(/Choose stage|Not selected/i.test(annulmentState.stage), `Annulment stage should show missing qualifier, got ${annulmentState.stage}`);
    assert(!/^any$/i.test(annulmentState.children), `Annulment children should not show fake any value`);
    assert(/Choose one|Not selected/i.test(annulmentState.children), `Annulment children should show missing qualifier, got ${annulmentState.children}`);
    assert(annulmentState.actions.some((text) => /Find the right forms|Answer questions to find forms|Continue to form viewer/i.test(text)), "Annulment should expose forms path");
    assert(annulmentState.actions.some((text) => /office review|Intake/i.test(text)), "Annulment should expose office-review path");
    assert(annulmentState.intakePrimaryCount === 0, "Annulment forms path should not make Intake the only primary action");
    assert(!annulmentState.overflow, "Practice Areas Annulment view has horizontal overflow");

    await page.close();
  } finally {
    await browser.close();
  }
  console.log("PLAYWRIGHT_GUIDE_COUNTY_GATE_PASS");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
