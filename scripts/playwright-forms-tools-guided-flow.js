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
    visibleResultTier: (() => {
      const el = document.querySelector("[data-guided-result-tier]");
      return el && !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length) ? el.textContent.replace(/\s+/g, " ").trim() : "";
    })(),
    visibleResultReason: (() => {
      const el = document.querySelector("[data-guided-reason]");
      return el && !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length) ? el.textContent.replace(/\s+/g, " ").trim() : "";
    })(),
    visibleUnifiedSummary: (() => {
      const el = document.querySelector("[data-unified-result-summary]");
      return el && !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length) ? el.textContent.replace(/\s+/g, " ").trim() : "";
    })(),
    routerHidden: document.querySelector("#forms-official-router")?.classList.contains("forms-flow-hidden"),
    packetsHidden: document.querySelector("#forms-packets")?.classList.contains("forms-flow-hidden"),
    calculatorHidden: document.querySelector("#forms-calculator-hub")?.classList.contains("forms-flow-hidden"),
    matterHidden: document.querySelector("#forms-matter-coverage")?.classList.contains("forms-flow-hidden"),
    laneVisible: getComputedStyle(document.querySelector(".forms-entry-lanes")).display !== "none",
    smartControlsVisible: getComputedStyle(document.querySelector(".forms-smart-path-controls")).display !== "none",
    smartModeVisible: getComputedStyle(document.querySelector("[data-smart-mode]")).display !== "none",
    showAllText: document.querySelector("[data-smart-show-all]")?.textContent?.trim() || "",
    activeCalc: document.body.classList.contains("forms-active-need-calculator"),
    activeDeadline: document.body.classList.contains("forms-active-need-deadline"),
    action: document.querySelector("[data-guided-result-action]")?.textContent?.trim(),
    actionDisabled: document.querySelector("[data-guided-result-action]")?.disabled || false,
    progressLabel: document.querySelector("[data-guided-progress-label]")?.textContent?.trim() || "",
    guidedCopy: document.querySelector("[data-guided-copy]")?.textContent?.trim() || "",
    resultCopy: document.querySelector("[data-guided-result-copy]")?.textContent?.trim() || "",
    resultTier: document.querySelector("[data-guided-result-tier]")?.textContent?.replace(/\s+/g, " ").trim() || "",
    resultReason: document.querySelector("[data-guided-reason]")?.textContent?.replace(/\s+/g, " ").trim() || "",
    unifiedSummary: document.querySelector("[data-unified-result-summary]")?.textContent?.replace(/\s+/g, " ").trim() || "",
    stepRail: Array.from(document.querySelectorAll("[data-guided-jump]")).map((button) => button.textContent.replace(/\s+/g, " ").trim()),
    stepNames: Array.from(document.querySelectorAll("[data-guided-jump]")).map((button) => button.getAttribute("aria-label") || ""),
    summaryChips: Array.from(document.querySelectorAll("[data-guided-summary] span")).map((chip) => chip.textContent.trim()),
    editButtons: Array.from(document.querySelectorAll("[data-guided-edit]")).filter((button) => button.offsetParent !== null).map((button) => button.textContent.trim()),
    lowerResultText: document.body.innerText.replace(/\s+/g, " ").trim(),
    duplicateVisibleLabels: (document.body.innerText.replace(/\s+/g, " ").trim().match(/\b[1-5](Need|County|Stage|Issue|Children)\b|Find forms Find forms|Calculator Use a calculator|DIY guide Read a DIY guide|Help me choose Help me choose/g) || []),
    fakeLinks: Array.from(document.querySelectorAll('a[href="#"]')).map((link) => link.textContent.trim()),
    exposedSourceAttributes: Array.from(document.querySelectorAll("[data-url], [data-official-url]")).map((item) => item.outerHTML.slice(0, 120)),
    sameSiteOfficialPdfActions: Array.from(document.querySelectorAll(".official-pdf-link:not([hidden]) [data-official-pdf-preview]"))
      .filter((button) => button.offsetParent !== null && getComputedStyle(button).visibility !== "hidden")
      .map((button) => button.textContent.trim()),
    sameSiteOfficialPdfDownloads: Array.from(document.querySelectorAll(".official-pdf-link:not([hidden]) .official-pdf-direct-download"))
      .filter((link) => link.offsetParent !== null && getComputedStyle(link).visibility !== "hidden")
      .map((link) => link.getAttribute("href") || "")
      .filter((href) => href.startsWith("/api/official-pdf/")),
    matchedFormsHeading: document.querySelector("#forms-approved-pdfs h2")?.textContent?.trim() || "",
    matchedFormsEscapeVisible: (() => {
      const panel = document.querySelector("[data-official-pdf-secondary-path]");
      return Boolean(panel && (panel.offsetWidth || panel.offsetHeight || panel.getClientRects().length) && getComputedStyle(panel).visibility !== "hidden");
    })(),
    matchedFormsBrowseButtons: Array.from(document.querySelectorAll("[data-official-pdf-show-all]"))
      .filter((button) => button.offsetParent !== null && getComputedStyle(button).visibility !== "hidden")
      .map((button) => button.textContent.trim()),
    otherFormGroupBrowserOpen: document.querySelector("[data-official-pdf-route-index]")?.open || false,
    packetBrowserPresent: Boolean(document.querySelector("[data-forms-packet-browser]")),
    packetBrowserOpen: document.querySelector("[data-forms-packet-browser]")?.open || false,
    packetSelectVisible: (() => {
      const select = document.querySelector("[data-forms-packet-select]");
      return Boolean(select && select.offsetParent !== null && getComputedStyle(select).visibility !== "hidden");
    })(),
    packetCurrentVisible: (() => {
      const current = document.querySelector("[data-forms-packet-current]");
      return Boolean(current && !current.hidden && (current.offsetWidth || current.offsetHeight || current.getClientRects().length));
    })(),
    publicExternalHrefs: Array.from(document.querySelectorAll("a[href]"))
      .map((link) => link.getAttribute("href") || "")
      .filter((href) => /^https?:\/\//i.test(href)),
    externalPdfHrefs: Array.from(document.querySelectorAll("[data-guide-pdf-download], [data-official-pdf-download]"))
      .map((link) => link.getAttribute("href") || "")
      .filter((href) => /^https?:\/\//i.test(href)),
    legalHelpCount: document.querySelectorAll("[data-legal-definition], .legal-term, .legal-term-help, .legal-glossary").length,
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
      assert(!initial.smartControlsVisible, `${viewport.name}: advanced controls should start hidden`);
      assert(!initial.smartModeVisible, `${viewport.name}: browse/reset controls should start hidden`);
      assert(initial.fakeLinks.length === 0, `${viewport.name}: page should not render fake href=# links: ${initial.fakeLinks.join(", ")}`);
      assert(initial.exposedSourceAttributes.length === 0, `${viewport.name}: page should not expose raw source URL attributes`);
      assert(initial.sameSiteOfficialPdfActions.length === 0, `${viewport.name}: same-site PDF actions should not render before forms are shown`);
      assert(initial.publicExternalHrefs.length === 0, `${viewport.name}: page should not render external public hrefs: ${initial.publicExternalHrefs.join(", ")}`);
      assert(initial.legalHelpCount === 0, `${viewport.name}: legal-term help should not render`);
      assert(initial.action === "Choose one answer above", `${viewport.name}: initial CTA should point to the current question, got ${initial.action}`);
      assert(initial.actionDisabled, `${viewport.name}: initial CTA should not skip unanswered questions`);
      assert(initial.summaryChips.length === 0, `${viewport.name}: initial summary should not show default answers: ${initial.summaryChips.join(", ")}`);
      assert(/Need|County|Stage|Issue|Children/i.test(initial.stepRail.join(" ")), `${viewport.name}: step rail labels should be visible: ${initial.stepRail.join(", ")}`);
      assert(initial.stepNames.every((name) => /^Step [1-5]: /.test(name)), `${viewport.name}: step buttons need clear accessible names: ${initial.stepNames.join(", ")}`);
      assert(initial.duplicateVisibleLabels.length === 0, `${viewport.name}: duplicate or mashed labels visible: ${initial.duplicateVisibleLabels.join(", ")}`);
      assert(initial.visibleResultTier === "", `${viewport.name}: pending recommended result should stay hidden, got ${initial.visibleResultTier}`);
      assert(initial.visibleResultReason === "", `${viewport.name}: pending reason should stay hidden, got ${initial.visibleResultReason}`);
      assert(initial.visibleUnifiedSummary === "", `${viewport.name}: pending unified summary should stay hidden, got ${initial.visibleUnifiedSummary}`);
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
      assert(!forms.laneVisible, `${viewport.name}: quick-start cards should hide after forms path is active`);
      assert(!forms.smartControlsVisible, `${viewport.name}: advanced controls should stay hidden unless browsing other options`);
      assert(forms.smartModeVisible, `${viewport.name}: browse/reset controls should show after forms path is active`);
      assert(forms.showAllText === "Browse other options", `${viewport.name}: browse control should use plain label, got ${forms.showAllText}`);
      assert(/View matched forms/i.test(forms.action || ""), `${viewport.name}: forms CTA should view matched forms`);
      assert(!forms.actionDisabled, `${viewport.name}: matched forms CTA should be enabled`);
      assert(/Recommended form path/i.test(forms.visibleResultTier), `${viewport.name}: forms result tier should identify the primary path, got ${forms.visibleResultTier}`);
      assert(/because/i.test(forms.visibleResultReason) && /Maricopa County/i.test(forms.visibleResultReason), `${viewport.name}: forms result should explain why it appeared, got ${forms.visibleResultReason}`);
      assert(forms.summaryChips.includes("Maricopa County"), `${viewport.name}: forms summary should show selected county`);
      assert(forms.editButtons.includes("Change county") && forms.editButtons.includes("Change issue"), `${viewport.name}: completed helper should expose direct answer edit controls`);
      assert(/Your form result/i.test(forms.visibleUnifiedSummary) && /Recommended forms/i.test(forms.visibleUnifiedSummary) && /Based on/i.test(forms.visibleUnifiedSummary) && /Main action/i.test(forms.visibleUnifiedSummary) && /Maricopa County/i.test(forms.visibleUnifiedSummary), `${viewport.name}: unified result summary should carry the final result, got ${forms.visibleUnifiedSummary}`);
      assert(forms.packetBrowserPresent, `${viewport.name}: alternate form-group browser should render`);
      assert(!forms.packetBrowserOpen, `${viewport.name}: alternate form-group browser should be closed by default`);
      assert(!forms.packetSelectVisible, `${viewport.name}: form-group dropdown should not appear above the matched forms by default`);
      assert(!forms.packetCurrentVisible, `${viewport.name}: matched packet should not auto-open a form before the user clicks View form`);
      assert(forms.duplicateVisibleLabels.length === 0, `${viewport.name}: forms path duplicate or mashed labels visible: ${forms.duplicateVisibleLabels.join(", ")}`);
      assert(!/Suggested form starting point|Form starting point|starting points shown|Choose one starting point/i.test(forms.lowerResultText), `${viewport.name}: lower form results should use form-path language`);
      assert(/Recommended form path/i.test(forms.lowerResultText), `${viewport.name}: lower form results should expose recommended form path language`);
      assert(forms.fakeLinks.length === 0, `${viewport.name}: forms path should not render fake href=# links: ${forms.fakeLinks.join(", ")}`);
      assert(forms.exposedSourceAttributes.length === 0, `${viewport.name}: forms path should not expose raw source URL attributes`);
      assert(forms.sameSiteOfficialPdfActions.length > 0, `${viewport.name}: forms path should render same-site official PDF actions`);
      assert(forms.sameSiteOfficialPdfActions.every((label) => /View form/i.test(label)), `${viewport.name}: primary PDF action should be View form`);
      assert(forms.sameSiteOfficialPdfDownloads.length > 0, `${viewport.name}: forms path should render same-site PDF download links`);
      assert(forms.publicExternalHrefs.length === 0, `${viewport.name}: forms path should not render external public hrefs: ${forms.publicExternalHrefs.join(", ")}`);
      assert(!forms.overflow, `${viewport.name}: forms path has horizontal overflow`);
      await page.click("[data-guided-result-action]");
      const matchedForms = await pageState(page);
      assert(/Recommended forms/i.test(matchedForms.matchedFormsHeading), `${viewport.name}: matched forms landing should use a plain heading, got ${matchedForms.matchedFormsHeading}`);
      assert(matchedForms.matchedFormsEscapeVisible, `${viewport.name}: matched forms view should expose a different-form-group escape hatch`);
      assert(matchedForms.matchedFormsBrowseButtons.length === 1 && /See other form groups/i.test(matchedForms.matchedFormsBrowseButtons[0]), `${viewport.name}: matched forms view should have one visible See other form groups control, got ${matchedForms.matchedFormsBrowseButtons.join(", ")}`);
      assert(!matchedForms.otherFormGroupBrowserOpen, `${viewport.name}: other form-group browser should stay closed until the user asks for it`);
      await page.locator(".official-pdf-link:not([hidden]) [data-official-pdf-preview]").first().click();
      const viewerState = await page.evaluate(() => ({
        officialPdfFrameSrc: document.querySelector("[data-official-pdf-frame]")?.getAttribute("src") || "",
        guidePdfFrameSrc: document.querySelector("[data-guide-pdf-frame]")?.getAttribute("src") || "",
        packetDownloadHrefs: Array.from(document.querySelectorAll("[data-guide-pdf-download], [data-official-pdf-download]")).map((link) => link.getAttribute("href") || ""),
        officialFallbackHrefs: Array.from(document.querySelectorAll("[data-official-pdf-source-fallback], [data-official-pdf-download]")).map((link) => link.getAttribute("href") || "").filter(Boolean)
      }));
      const activeFrameSrc = viewerState.officialPdfFrameSrc || viewerState.guidePdfFrameSrc;
      assert(activeFrameSrc.startsWith("/api/official-pdf/"), `${viewport.name}: PDF viewer should use same-origin official PDF route, got ${activeFrameSrc}`);
      assert(viewerState.officialFallbackHrefs.some((href) => href.startsWith("/api/official-pdf/")), `${viewport.name}: PDF viewer should expose same-site PDF fallback links`);
      await capture(page, viewport, "forms-path");

      await page.goto(`${baseUrl}/forms/`, { waitUntil: "networkidle" });
      const transferredAnswers = await page.evaluate(() => ({
        smartCounty: document.querySelector("[data-smart-county]")?.value || "",
        smartChildren: document.querySelector("[data-smart-children]")?.value || "",
        smartPosture: document.querySelector("[data-smart-posture]")?.value || "",
        formCounty: document.querySelector("[data-form-county]")?.value || "",
        formChildren: document.querySelector("[data-form-children]")?.value || "",
        formPosture: document.querySelector("[data-form-posture]")?.value || "",
        formIssue: document.querySelector("[data-form-issue]")?.value || "",
        progressLabel: document.querySelector("[data-guided-progress-label]")?.textContent?.trim() || "",
        resultTitle: document.querySelector("[data-guided-result-title]")?.textContent?.trim() || "",
        resultAction: document.querySelector("[data-guided-result-action]")?.textContent?.trim() || "",
        changeAnswersVisible: document.querySelector("[data-guided-change-answers]")?.hidden === false,
        resumeActive: document.querySelector("[data-forms-smart-path]")?.classList.contains("forms-guided-resume") || false,
        guidedComplete: document.querySelector("[data-forms-smart-path]")?.classList.contains("forms-guided-complete") || false,
        storedRoute: JSON.parse(window.sessionStorage.getItem("mflgFormsRouteContext") || "{}")
      }));
      assert(transferredAnswers.smartCounty === "Maricopa", `${viewport.name}: smart path should retain county on /forms, got ${transferredAnswers.smartCounty}`);
      assert(transferredAnswers.smartChildren === "minor-children", `${viewport.name}: smart path should retain children on /forms, got ${transferredAnswers.smartChildren}`);
      assert(transferredAnswers.smartPosture === "New filing", `${viewport.name}: smart path should retain posture on /forms, got ${transferredAnswers.smartPosture}`);
      assert(transferredAnswers.formCounty === "Maricopa", `${viewport.name}: form finder should retain county on /forms, got ${transferredAnswers.formCounty}`);
      assert(transferredAnswers.formChildren === "minor-children", `${viewport.name}: form finder should retain children on /forms, got ${transferredAnswers.formChildren}`);
      assert(transferredAnswers.formPosture === "New filing", `${viewport.name}: form finder should retain posture on /forms, got ${transferredAnswers.formPosture}`);
      assert(transferredAnswers.formIssue === "divorce", `${viewport.name}: form finder should retain issue on /forms, got ${transferredAnswers.formIssue}`);
      assert(transferredAnswers.resumeActive, `${viewport.name}: transferred answers should show saved-answer resume state`);
      assert(/Saved answers applied/i.test(transferredAnswers.progressLabel), `${viewport.name}: progress label should show saved answers, got ${transferredAnswers.progressLabel}`);
      assert(/Using answers from this session/i.test(transferredAnswers.resultTitle), `${viewport.name}: result title should show saved answers, got ${transferredAnswers.resultTitle}`);
      assert(/Continue with saved answers/i.test(transferredAnswers.resultAction), `${viewport.name}: resume CTA should use saved answers, got ${transferredAnswers.resultAction}`);
      assert(transferredAnswers.changeAnswersVisible, `${viewport.name}: resume state should expose Change answers`);
      assert(!transferredAnswers.guidedComplete, `${viewport.name}: transferred answers should wait for saved-answer confirmation on /forms`);
      assert(transferredAnswers.storedRoute.county === "Maricopa", `${viewport.name}: session route should retain county`);
      await page.click("[data-guided-result-action]");
      const resumedForms = await pageState(page);
      assert(!resumedForms.routerHidden, `${viewport.name}: using saved answers should reveal form router`);
      assert(!resumedForms.packetsHidden, `${viewport.name}: using saved answers should reveal packets`);
      assert(/View matched forms/i.test(resumedForms.action || ""), `${viewport.name}: saved-answer CTA should become matched forms CTA`);
      assert(/Answers confirmed/i.test(resumedForms.progressLabel || ""), `${viewport.name}: confirmed saved answers should not return to Question 1, got ${resumedForms.progressLabel}`);
      await page.goto(`${baseUrl}/tools/`, { waitUntil: "networkidle" });

      await page.click("[data-smart-reset]");
      await page.click('[data-smart-lane="calculator"]');
      const calc = await pageState(page);
      assert(calc.routerHidden, `${viewport.name}: router should stay hidden on calculator path`);
      assert(calc.packetsHidden, `${viewport.name}: packets should stay hidden on calculator path`);
      assert(!calc.calculatorHidden, `${viewport.name}: calculator hub should reveal`);
      assert(!calc.laneVisible, `${viewport.name}: quick-start cards should hide after calculator path is active`);
      assert(!calc.smartControlsVisible, `${viewport.name}: advanced controls should stay hidden on calculator path`);
      assert(calc.smartModeVisible, `${viewport.name}: browse/reset controls should show after calculator path is active`);
      assert(calc.activeCalc, `${viewport.name}: calculator body state should be active`);
      assert(/Answers confirmed/i.test(calc.progressLabel || ""), `${viewport.name}: calculator path should show confirmed answers, got ${calc.progressLabel}`);
      assert(/Calculator tools will use only the fields that apply/i.test(calc.guidedCopy || ""), `${viewport.name}: calculator path should explain carried context, got ${calc.guidedCopy}`);
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
          laneVisible: getComputedStyle(document.querySelector(".forms-entry-lanes")).display !== "none",
          smartControlsVisible: getComputedStyle(document.querySelector(".forms-smart-path-controls")).display !== "none",
          smartModeVisible: getComputedStyle(document.querySelector("[data-smart-mode]")).display !== "none",
          showAllText: document.querySelector("[data-smart-show-all]")?.textContent?.trim() || "",
          bodyText: document.body.innerText.replace(/\s+/g, " ").trim(),
          overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
        };
      });
      assert(deadline.routerHidden, `${viewport.name}: form router should stay hidden on deadline path`);
      assert(deadline.packetsHidden, `${viewport.name}: packets should remain hidden for deadline path`);
      assert(!deadline.calculatorHidden, `${viewport.name}: deadline container should reveal`);
      assert(deadline.activeDeadline, `${viewport.name}: deadline body state should be active`);
      assert(deadline.calcHeadDisplay === "none", `${viewport.name}: calculator hub chrome should be hidden in deadline path`);
      assert(deadline.deadlineDisplay !== "none", `${viewport.name}: deadline tool should be visible`);
      assert(!deadline.laneVisible, `${viewport.name}: quick-start cards should hide after deadline path is active`);
      assert(!deadline.smartControlsVisible, `${viewport.name}: advanced controls should stay hidden on deadline path`);
      assert(deadline.smartModeVisible, `${viewport.name}: browse/reset controls should show after deadline path is active`);
      assert(deadline.showAllText === "Browse other options", `${viewport.name}: browse control should use plain label on deadline path, got ${deadline.showAllText}`);
      assert(!/Step 1 Answer these questions first/i.test(deadline.bodyText), `${viewport.name}: stale form-finder Step 1 copy should not show on deadline path`);
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
