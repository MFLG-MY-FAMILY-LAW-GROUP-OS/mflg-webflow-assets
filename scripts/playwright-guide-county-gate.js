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

    await page.locator("[data-guide-pdf-panel]").first().waitFor({ state: "visible", timeout: 10000 });
    const hasCountyGate = await page.locator("[data-guide-county-choice]").first().isVisible().catch(() => false);
    assert(hasCountyGate, "Guide PDF panel did not show the county gate");

    await page.selectOption("[data-guide-county-choice]", "Gila");
    const gilaState = await page.evaluate(() => ({
      buttonText: document.querySelector("[data-guide-county-confirm]")?.textContent?.trim() || "",
      buttonDisabled: document.querySelector("[data-guide-county-confirm]")?.disabled === true,
      sourceText: document.querySelector("[data-guide-county-source]")?.textContent?.trim() || "",
      noteText: document.querySelector("[data-guide-county-note]")?.textContent?.trim() || "",
      intakeRoute: document.querySelector("[data-guide-county-intake]")?.getAttribute("data-intake-route") || "",
      externalCountyLinks: Array.from(document.querySelectorAll(".guide-county-gate a[href^='http']")).map((link) => link.href)
    }));
    assert(gilaState.buttonText === "Confirm Gila County in Intake", `Gila primary action did not update: ${gilaState.buttonText}`);
    assert(!gilaState.buttonDisabled, "Gila primary action should be enabled");
    assert(/Gila County forms need Intake confirmation/.test(gilaState.sourceText), `Gila source text did not update: ${gilaState.sourceText}`);
    assert(/Gila County selected/.test(gilaState.noteText), `Gila note did not update: ${gilaState.noteText}`);
    assert(/"formCounty":"Gila"/.test(gilaState.intakeRoute), `Gila was not carried into Intake route: ${gilaState.intakeRoute}`);
    assert(gilaState.externalCountyLinks.length === 0, `County gate exposes external links: ${gilaState.externalCountyLinks.join(", ")}`);

    await page.selectOption("[data-guide-county-choice]", "Maricopa");
    const maricopaState = await page.evaluate(() => ({
      buttonText: document.querySelector("[data-guide-county-confirm]")?.textContent?.trim() || "",
      buttonDisabled: document.querySelector("[data-guide-county-confirm]")?.disabled === true,
      noteText: document.querySelector("[data-guide-county-note]")?.textContent?.trim() || ""
    }));
    assert(maricopaState.buttonText === "Open Maricopa PDFs", `Maricopa primary action did not update: ${maricopaState.buttonText}`);
    assert(!maricopaState.buttonDisabled, "Maricopa primary action should be enabled");
    assert(/Maricopa selected/.test(maricopaState.noteText), `Maricopa note did not update: ${maricopaState.noteText}`);

    await page.click("[data-guide-county-confirm]");
    await page.locator("[data-guide-pdf-title]").first().waitFor({ state: "visible", timeout: 10000 });
    const pdfTitle = await page.locator("[data-guide-pdf-title]").first().textContent();
    assert(pdfTitle && pdfTitle.trim().length > 0, "Maricopa PDF viewer did not open after county confirmation");
    await page.close();
  } finally {
    await browser.close();
  }
  console.log("PLAYWRIGHT_GUIDE_COUNTY_GATE_PASS");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
