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
      countyGateVisible: Boolean(document.querySelector("[data-guide-county-choice]")),
      viewerFrameVisible: Boolean(document.querySelector("[data-guide-pdf-frame]"))
    }));
    assert(initialState.title.length > 0, "Guide bridge title did not render");
    assert(/Open matched forms/i.test(initialState.cta), `Guide bridge CTA missing: ${initialState.cta}`);
    assert(initialState.route.length > 0, "Guide bridge did not carry a forms route");
    assert(initialState.countyGateVisible === false, "Old county gate should not render in the guide bridge");
    assert(initialState.viewerFrameVisible === false, "Guide bridge should not render an embedded PDF frame");

    const packetChoice = page.locator("[data-guide-packet-choice]");
    if ((await packetChoice.count()) > 1) {
      await page.locator("[data-guide-packet-chooser]").first().evaluate((node) => {
        if (node.tagName === "DETAILS") node.open = true;
      });
      const firstChoice = packetChoice.first();
      const beforeLabel = await page.locator("[data-guide-pdf-panel]").first().getAttribute("data-guide-packet-label");
      await packetChoice.nth(1).click();
      const afterLabel = await page.locator("[data-guide-pdf-panel]").first().getAttribute("data-guide-packet-label");
      assert(afterLabel && afterLabel !== beforeLabel, "Selected packet label did not update in the guide bridge");
      await firstChoice.click();
    }

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
    assert(annulmentState.actions.some((text) => /Open matched forms|View forms/i.test(text)), "Annulment should expose forms path");
    assert(annulmentState.actions.some((text) => /Intake/i.test(text)), "Annulment should expose Intake path");
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
