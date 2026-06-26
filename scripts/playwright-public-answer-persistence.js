const { chromium } = require("playwright");

const baseUrl = process.env.MFLG_TEST_BASE_URL || "http://127.0.0.1:8787";
const counties = ["Apache", "Cochise", "Coconino", "Gila", "Graham", "Greenlee", "La Paz", "Maricopa", "Mohave", "Navajo", "Pima", "Pinal", "Santa Cruz", "Yavapai", "Yuma", "Not sure"];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function chooseFormsAnswers(page, county = "Pima", posture = "Existing order", issue = "parenting", children = "minor-children") {
  await page.goto(`${baseUrl}/tools/`, { waitUntil: "networkidle" });
  if (!(await page.locator('[data-guided-answer="forms"]').first().isVisible().catch(() => false))) {
    const change = page.locator("[data-guided-change-answers]").first();
    if (await change.isVisible().catch(() => false)) await change.click();
    else if (await page.locator("[data-smart-reset]").first().isVisible().catch(() => false)) await page.locator("[data-smart-reset]").first().click();
  }
  await page.click('[data-guided-answer="forms"]');
  await page.click(`[data-guided-answer="${county}"]`);
  await page.click(`[data-guided-answer="${posture}"]`);
  await page.click(`[data-guided-answer="${issue}"]`);
  await page.click(`[data-guided-answer="${children}"]`);
}

async function toolsState(page) {
  return page.evaluate(() => ({
    smartCountyOptions: Array.from(document.querySelectorAll("[data-smart-county] option")).map((item) => item.textContent.trim()),
    formCountyOptions: Array.from(document.querySelectorAll("[data-form-county] option")).map((item) => item.textContent.trim()),
    smartCounty: document.querySelector("[data-smart-county]")?.value || "",
    smartPosture: document.querySelector("[data-smart-posture]")?.value || "",
    smartChildren: document.querySelector("[data-smart-children]")?.value || "",
    formCounty: document.querySelector("[data-form-county]")?.value || "",
    formPosture: document.querySelector("[data-form-posture]")?.value || "",
    formIssue: document.querySelector("[data-form-issue]")?.value || "",
    formChildren: document.querySelector("[data-form-children]")?.value || "",
    resultTitle: document.querySelector("[data-guided-result-title]")?.textContent?.trim() || "",
    resultAction: document.querySelector("[data-guided-result-action]")?.textContent?.trim() || "",
    sameSitePdfLinks: Array.from(document.querySelectorAll(".official-pdf-source"))
      .filter((item) => !!(item.offsetWidth || item.offsetHeight || item.getClientRects().length))
      .map((item) => item.getAttribute("href") || ""),
    externalPdfButtons: Array.from(document.querySelectorAll(".official-pdf-source, [data-official-pdf-download], [data-forms-packet-view], [data-forms-packet-download]"))
      .map((item) => item.getAttribute("href") || item.dataset.sitePdfViewUrl || "")
      .filter((href) => /^https?:\/\//i.test(href)),
    publicAnswers: JSON.parse(sessionStorage.getItem("mflgPublicAnswers") || "{}"),
    oldFormsRoute: JSON.parse(sessionStorage.getItem("mflgFormsRouteContext") || "{}"),
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
  }));
}

async function seedState(page, publicAnswers = {}, legacyRoute = {}) {
  await page.goto(`${baseUrl}/tools/`, { waitUntil: "networkidle" });
  await page.evaluate(({ publicAnswers, legacyRoute }) => {
    sessionStorage.clear();
    if (publicAnswers) sessionStorage.setItem("mflgPublicAnswers", JSON.stringify(publicAnswers));
    if (legacyRoute) sessionStorage.setItem("mflgFormsRouteContext", JSON.stringify(legacyRoute));
  }, { publicAnswers, legacyRoute });
}

async function showFormsControls(page) {
  const formCounty = page.locator("[data-form-county]").first();
  if (await formCounty.isVisible().catch(() => false)) return;
  if (!(await formCounty.isVisible().catch(() => false))) {
    const showAll = page.locator("[data-smart-show-all]").first();
    if (await showAll.isVisible().catch(() => false)) await showAll.click();
  }
  if (!(await formCounty.isVisible().catch(() => false))) {
    const resultAction = page.locator("[data-guided-result-action]").first();
    const label = await resultAction.textContent().catch(() => "");
    if (/Continue with saved answers/i.test(label || "") && await resultAction.isVisible().catch(() => false)) {
      await resultAction.click();
    }
  }
  if (!(await formCounty.isVisible().catch(() => false))) {
    const change = page.locator("[data-guided-change-answers]").first();
    if (await change.isVisible().catch(() => false)) await change.click();
  }
  await formCounty.waitFor({ state: "visible", timeout: 10000 });
}

async function openMediationPracticeArea(page) {
  await page.goto(`${baseUrl}/practice-areas/`, { waitUntil: "networkidle" });
  await page.evaluate(() => {
    document.querySelector("[data-service-category-reset]")?.click();
    const reveal = document.querySelector("[data-service-reveal]");
    if (reveal?.getAttribute("aria-expanded") !== "true") reveal.click();
    const card = Array.from(document.querySelectorAll("[data-service-card]"))
      .find((item) => /^Mediation Preparation$/i.test(item.querySelector("h3")?.textContent?.trim() || ""));
    card?.scrollIntoView({ block: "center" });
    card?.querySelector("[data-service-detail-toggle]")?.click();
  });
  await page.locator('.service-row-panel [data-service-action="forms"]').first().click();
  await page.locator(".service-row-panel [data-guide-pdf-panel]").waitFor({ state: "visible", timeout: 10000 });
  return page.evaluate(() => {
    const cells = Array.from(document.querySelectorAll(".service-row-panel .guide-forms-bridge-grid article")).map((item) => ({
      label: item.querySelector("span")?.textContent?.trim() || "",
      value: item.querySelector("strong")?.textContent?.trim() || ""
    }));
    return {
      issue: cells.find((item) => item.label === "Issue")?.value || "",
      text: document.querySelector(".service-row-panel")?.textContent?.replace(/\s+/g, " ").trim() || ""
    };
  });
}

async function clickMediationFormsDataLink(page) {
  await page.goto(`${baseUrl}/practice-areas/`, { waitUntil: "networkidle" });
  await page.evaluate(() => {
    document.querySelector("[data-service-category-reset]")?.click();
    const reveal = document.querySelector("[data-service-reveal]");
    if (reveal?.getAttribute("aria-expanded") !== "true") reveal.click();
    const card = Array.from(document.querySelectorAll("[data-service-card]"))
      .find((item) => /^Mediation Preparation$/i.test(item.querySelector("h3")?.textContent?.trim() || ""));
    card?.scrollIntoView({ block: "center" });
    card?.querySelector("[data-service-detail-toggle]")?.click();
  });
  await page.locator('.service-row-panel [data-service-action="forms"]').first().click();
  await page.locator('.service-row-panel a[data-guide-forms-route]').first().waitFor({ state: "visible", timeout: 10000 });
  await page.locator('.service-row-panel a[data-guide-forms-route]').first().click();
  await page.waitForTimeout(400);
  return toolsState(page);
}

async function clickFirstPacketFocus(page) {
  await page.goto(`${baseUrl}/tools/`, { waitUntil: "networkidle" });
  const actionDisabled = await page.locator("[data-guided-result-action]").first().evaluate((button) => button.disabled).catch(() => false);
  if (actionDisabled) {
    await page.click('[data-guided-answer="forms"]');
    await page.click('[data-guided-answer="Pima"]');
    await page.click('[data-guided-answer="Existing order"]');
    await page.click('[data-guided-answer="parenting"]');
    await page.click('[data-guided-answer="minor-children"]');
  }
  await page.click("[data-guided-result-action]");
  await page.evaluate(() => {
    const group = document.querySelector(".official-pdf-group");
    if (group) group.open = true;
  });
  const source = page.locator(".official-pdf-source").first();
  const visible = await source.isVisible().catch(() => false);
  if (visible) {
    await source.click({ modifiers: ["Meta"] }).catch(async () => {
      await page.locator("[data-official-pdf-preview]").first().click();
    });
  }
  await page.waitForTimeout(250);
  return toolsState(page);
}

async function clickFirstMatterCard(page) {
  await page.goto(`${baseUrl}/tools/`, { waitUntil: "networkidle" });
  const issueLane = page.locator('[data-smart-lane="issue"]').first();
  if (await issueLane.isVisible().catch(() => false)) {
    await issueLane.click();
  } else {
    const showAll = page.locator("[data-smart-show-all]").first();
    if (await showAll.isVisible().catch(() => false)) await showAll.click();
  }
  if (!(await page.locator("[data-forms-matter-open]").first().isVisible().catch(() => false))) {
    await page.evaluate(() => document.querySelector("[data-smart-show-all]")?.click());
    await page.waitForTimeout(300);
  }
  await page.locator("[data-forms-matter-open]").first().click();
  await page.waitForTimeout(400);
  return toolsState(page);
}

async function clickGuideCalculatorLink(page) {
  await page.goto(`${baseUrl}/guides/`, { waitUntil: "networkidle" });
  const cards = page.locator("[data-guide-card]");
  const count = await cards.count();
  let opened = false;
  for (let index = 0; index < count; index += 1) {
    await cards.nth(index).scrollIntoViewIfNeeded();
    const openButton = cards.nth(index).locator("[data-guide-open]");
    if ((await openButton.count()) > 0) await openButton.click();
    await page.waitForTimeout(80);
    if ((await page.locator('.guide-row-panel [data-guide-next-choice="calculator"]').count()) > 0) {
      opened = true;
      break;
    }
  }
  assert(opened, "no visible guide calculator path found");
  await page.locator('.guide-row-panel [data-guide-next-choice="calculator"]').first().click();
  await page.locator('.guide-row-panel a[href*="forms-calculator-hub"][data-guide-calculator-choice], .guide-row-panel button[data-guide-calculator-choice]').first().click();
  await page.waitForTimeout(400);
  return toolsState(page);
}

async function routeSummaryState(page) {
  await page.route(`${baseUrl}/route-summary-fixture/`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/html; charset=utf-8",
      body: `<!doctype html><html><head><meta charset="utf-8"><title>Route Summary Fixture</title></head><body><header data-header><a class="brand" href="/">MFLG</a><button type="button" data-nav-toggle aria-expanded="false">Menu</button><nav data-nav><a href="/tools">Forms & Calculators</a></nav></header><main data-page-root></main><section data-forms-tools-route-intake-map></section><script src="/js/mflg-public-site.js"></script></body></html>`
    });
  });
  await page.goto(`${baseUrl}/route-summary-fixture/`, { waitUntil: "networkidle" });
  await page.locator("[data-forms-tools-route-intake-map] article").first().waitFor({ state: "visible", timeout: 10000 });
  return page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll("[data-forms-tools-route-intake-map] article"));
    const visibleText = cards.map((card) => card.textContent.replace(/\s+/g, " ").trim());
    return {
      count: cards.length,
      visibleText,
      routes: Array.from(document.querySelectorAll("[data-route-map-card-intake]")).map((link) => JSON.parse(link.getAttribute("data-intake-route") || "{}"))
    };
  });
}

async function clickDirectCalculatorChoice(page, selector = '[data-calculator-jump="maintenance"]') {
  await page.goto(`${baseUrl}/tools/`, { waitUntil: "networkidle" });
  await page.click('[data-smart-lane="calculator"]');
  const showAll = page.locator("[data-smart-show-all]").first();
  if ((await showAll.count()) > 0 && await showAll.isVisible().catch(() => false)) await showAll.click();
  await page.locator(selector).first().click();
  await page.waitForTimeout(300);
  return toolsState(page);
}

async function clickCalculatorReadinessAction(page) {
  await page.goto(`${baseUrl}/tools/`, { waitUntil: "networkidle" });
  const showAll = page.locator("[data-smart-show-all]").first();
  if ((await showAll.count()) > 0) await showAll.click();
  await page.locator("[data-calculator-precheck-action]").first().click();
  await page.waitForTimeout(300);
  return toolsState(page);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await page.goto(`${baseUrl}/tools/`, { waitUntil: "networkidle" });
    let state = await toolsState(page);
    counties.forEach((county) => {
      assert(state.smartCountyOptions.includes(county), `Smart county missing ${county}`);
      assert(state.formCountyOptions.includes(county), `Form county missing ${county}`);
    });

    await seedState(page, {
      county: "Pima",
      issue: "parenting",
      posture: "Existing order",
      children: "minor-children",
      sourcePathway: "confirmed-test"
    }, {
      county: "Maricopa",
      issue: "divorce",
      posture: "New filing",
      children: "any",
      pdfPacket: "maricopa-divorce-new-no-children"
    });
    await page.goto(`${baseUrl}/forms/`, { waitUntil: "networkidle" });
    state = await toolsState(page);
    assert(state.publicAnswers.county === "Pima", "canonical county was overwritten by legacy Maricopa");
    assert(state.publicAnswers.issue === "parenting", "canonical issue was overwritten by legacy issue");
    assert(state.publicAnswers.posture === "Existing order", "canonical posture was overwritten by legacy New filing");
    assert(state.publicAnswers.children === "minor-children", "canonical children were overwritten by legacy any");
    assert(state.formCounty === "Pima", `canonical county not rendered, got ${state.formCounty}`);

    await seedState(page, {
      county: "Not sure",
      issue: "all",
      posture: "Any posture",
      children: "any"
    }, {
      county: "Pima",
      issue: "parenting",
      posture: "Existing order",
      children: "minor-children",
      pdfPacket: "pima-notice-of-intent-to-relocate",
      userConfirmed: true
    });
    await page.goto(`${baseUrl}/forms/`, { waitUntil: "networkidle" });
    state = await toolsState(page);
    assert(state.publicAnswers.county === "Pima", "safe legacy county did not migrate");
    assert(state.publicAnswers.issue === "parenting", "safe legacy issue did not migrate");
    assert(state.publicAnswers.posture === "Existing order", "safe legacy posture did not migrate");
    assert(state.publicAnswers.children === "minor-children", "safe legacy children did not migrate");

    await seedState(page, {}, {
      county: "Maricopa",
      issue: "all",
      posture: "New filing",
      children: "any",
      pdfPacket: "maricopa-divorce-new-no-children"
    });
	    await page.goto(`${baseUrl}/forms/`, { waitUntil: "networkidle" });
	    state = await toolsState(page);
	    assert(state.formCounty === "Not sure", `default-like legacy county should remain missing, got ${state.formCounty}`);
	    assert(state.formPosture === "Any posture", `default-like legacy posture should remain missing, got ${state.formPosture}`);
	    assert(state.formChildren === "any", `default-like legacy children should remain missing, got ${state.formChildren}`);

	    await seedState(page, {}, {
	      county: "Maricopa",
	      issue: "divorce",
	      posture: "Finalizing agreement",
	      children: "any",
	      pdfPacket: "maricopa-consent-decree-agreement",
	      packetLabel: "Maricopa consent decree and agreement finalization",
	      sourcePathway: "packet-metadata"
	    });
	    await page.goto(`${baseUrl}/forms/`, { waitUntil: "networkidle" });
	    state = await toolsState(page);
	    assert(state.publicAnswers.county !== "Maricopa", "stale packet metadata migrated Maricopa into canonical county");
	    assert(state.formCounty !== "Maricopa", `stale packet metadata rendered as user county: ${state.formCounty}`);
	    assert(!state.publicAnswers.confirmedFields?.county, "stale packet metadata confirmed county");
	    assert(state.publicAnswers.packetSourceCounty === "Maricopa", `packet metadata did not migrate to packetSourceCounty, got ${state.publicAnswers.packetSourceCounty || ""}`);
	    assert(state.publicAnswers.fieldSources?.packetSourceCounty === "legacy-packet-metadata", "packet source metadata provenance missing");

	    await seedState(page, {
	      county: "Pima",
	      issue: "parenting",
	      posture: "Existing order",
	      children: "minor-children",
	      confirmedFields: { county: true, issue: true, posture: true, children: true },
	      fieldSources: { county: "seed", issue: "seed", posture: "seed", children: "seed" }
	    }, {
	      county: "Maricopa",
	      issue: "divorce",
	      posture: "Finalizing agreement",
	      children: "any",
	      pdfPacket: "maricopa-consent-decree-agreement",
	      sourcePathway: "packet-metadata"
	    });
	    await page.goto(`${baseUrl}/forms/`, { waitUntil: "networkidle" });
	    state = await toolsState(page);
	    assert(state.publicAnswers.county === "Pima", "packet metadata overwrote confirmed Pima county");
	    assert(state.publicAnswers.packetSourceCounty === "Maricopa", "packet source county not preserved with confirmed Pima");

	    await seedState(page, {
	      county: "Not sure",
	      explicitUnknownFields: { county: true },
	      confirmedFields: { county: true },
	      fieldSources: { county: "forms-router" }
	    }, {
	      county: "Maricopa",
	      pdfPacket: "maricopa-consent-decree-agreement",
	      sourcePathway: "packet-metadata"
	    });
	    await page.goto(`${baseUrl}/forms/`, { waitUntil: "networkidle" });
	    state = await toolsState(page);
	    assert(state.publicAnswers.county === "Not sure", "packet metadata overwrote explicit unknown county");
	    assert(state.publicAnswers.explicitUnknownFields?.county === true, "explicit unknown provenance lost after packet metadata hydration");

	    await seedState(page, {
	      county: "",
	      resetFields: { county: true },
	      fieldSources: { county: "forms-router-reset" }
	    }, {
	      county: "Maricopa",
	      pdfPacket: "maricopa-consent-decree-agreement",
	      sourcePathway: "packet-metadata"
	    });
	    await page.goto(`${baseUrl}/forms/`, { waitUntil: "networkidle" });
	    state = await toolsState(page);
	    assert(state.publicAnswers.county !== "Maricopa", "packet metadata rehydrated reset county");
	    assert(state.publicAnswers.resetFields?.county === true, "packet metadata cleared county reset tombstone");

	    await seedState(page, {}, {
	      county: "Maricopa",
	      issue: "divorce",
	      posture: "Existing order",
	      children: "minor-children",
	      userConfirmed: true,
	      sourcePathway: "forms-router"
	    });
	    await page.goto(`${baseUrl}/forms/`, { waitUntil: "networkidle" });
	    state = await toolsState(page);
	    assert(state.publicAnswers.county === "Maricopa", "legitimate confirmed legacy Maricopa did not migrate");
	    assert(state.publicAnswers.fieldSources?.county === "legacy-confirmed-migration", "confirmed legacy Maricopa provenance missing");

	    await seedState(page, {}, {
	      county: "Maricopa",
	      issue: "divorce",
	      posture: "Finalizing agreement",
	      children: "any",
	      pdfPacket: "maricopa-consent-decree-agreement",
	      sourcePathway: "packet-metadata"
	    });
	    await page.goto(`${baseUrl}/forms/`, { waitUntil: "networkidle" });
	    await page.goto(`${baseUrl}/guides/`, { waitUntil: "networkidle" });
	    await page.goto(`${baseUrl}/forms/`, { waitUntil: "networkidle" });
	    await page.reload({ waitUntil: "networkidle" });
	    state = await toolsState(page);
	    assert(state.publicAnswers.county !== "Maricopa", "repeated hydration restored packet metadata as county");
	    assert(state.publicAnswers.packetSourceCounty === "Maricopa", "repeated hydration lost packet source metadata");

		    const mediationState = await openMediationPracticeArea(page);
	    assert(mediationState.issue === "Mediation / ADR", `Mediation issue label leaked taxonomy: ${mediationState.issue}`);
	    assert(!/Issue\\s+all\\b/i.test(mediationState.text), "Mediation panel visibly contains Issue all");

	    const routeSummary = await routeSummaryState(page);
	    assert(routeSummary.count > 0, "route-intake summary cards did not render");
	    const routeSummaryText = routeSummary.visibleText.join("\\n");
	    assert(!/\\b(all|any|Any posture|undefined|null)\\b/.test(routeSummaryText), `route summary leaked internal placeholder: ${routeSummaryText}`);
	    assert(!/\\b(?:maricopa|pima|cochise|yavapai|azcourts)-[a-z0-9]+(?:-[a-z0-9]+)+\\b/.test(routeSummaryText), "route summary leaked raw packet or route token");
	    assert(routeSummary.visibleText.some((text) => /Mediation|ADR|Child Support|Parenting|Divorce|Legal Separation|Document Preparation|Enforcement|Modification/.test(text)), "route summary did not render professional issue labels");
	    assert(routeSummary.routes.some((route) => route.presetAnswers?.formIssue), "route summary test did not preserve internal route payloads");

    await seedState(page, {
      county: "Pima",
      issue: "parenting",
      posture: "Existing order",
      children: "minor-children",
      selectedPacket: "pima-notice-of-intent-to-relocate",
      sourcePathway: "confirmed-test"
    }, {});
    state = await clickMediationFormsDataLink(page);
    assert(state.publicAnswers.county === "Pima", "generic Practice Area data-link erased canonical county");
    assert(state.publicAnswers.issue === "parenting", "generic Practice Area data-link erased canonical issue");
    assert(state.publicAnswers.posture === "Existing order", "generic Practice Area data-link erased canonical posture");
    assert(state.publicAnswers.children === "minor-children", "generic Practice Area data-link erased canonical children");
    assert(state.publicAnswers.selectedPacket === "pima-notice-of-intent-to-relocate", "generic Practice Area data-link selected a first/default packet");
    assert(state.publicAnswers.confirmedFields?.county !== false, "canonical metadata unexpectedly removed");

    await seedState(page, {}, {});
    state = await clickFirstPacketFocus(page);
    assert(state.publicAnswers.county !== "Maricopa", "PDF action manufactured Maricopa without confirmed county");
    assert(state.publicAnswers.posture !== "New filing", "PDF action manufactured New filing without confirmed posture");

    await chooseFormsAnswers(page, "Pima", "Existing order", "parenting", "minor-children");
    state = await toolsState(page);
    assert(state.smartCounty === "Pima", `smart county did not update, got ${state.smartCounty}`);
    assert(state.formCounty === "Pima", `form county did not update, got ${state.formCounty}`);
    assert(state.formPosture === "Existing order", `posture did not update, got ${state.formPosture}`);
    assert(state.formIssue === "parenting", `issue did not update, got ${state.formIssue}`);
    assert(state.formChildren === "minor-children", `children did not update, got ${state.formChildren}`);
    assert(state.publicAnswers.county === "Pima", "shared public answer state did not persist county");
    assert(state.publicAnswers.issue === "parenting", "shared public answer state did not persist issue");
    assert(!state.overflow, "forms answer path has horizontal overflow");

    await page.goto(`${baseUrl}/forms/`, { waitUntil: "networkidle" });
    state = await toolsState(page);
    assert(state.smartCounty === "Pima", `answers did not carry to /forms smart controls, got ${state.smartCounty}`);
    assert(state.formCounty === "Pima", `answers did not carry to /forms router, got ${state.formCounty}`);
    assert(/Saved answers applied|Using answers from this session|Continue with saved answers/i.test(`${state.resultTitle} ${state.resultAction}`), "carried answers are not exposed as saved state");

    await page.click("[data-guided-result-action]");
    state = await toolsState(page);
    assert(state.publicAnswers.county === "Pima", "confirmed saved answers lost county");
    assert(state.publicAnswers.confirmedFields?.county === true, "confirmed saved answers lost county provenance");

    await page.goto(`${baseUrl}/forms/`, { waitUntil: "networkidle" });
    await showFormsControls(page);
    const countySelect = page.locator("[data-form-county]").first();
    await countySelect.selectOption("Yavapai");
    state = await toolsState(page);
    assert(state.formCounty === "Yavapai", "changing county did not update form result");
    assert(state.publicAnswers.county === "Yavapai", "changing county did not update shared state");
    assert(state.publicAnswers.confirmedFields?.county === true, "explicit county change did not mark county confirmed");
    assert(state.publicAnswers.fieldSources?.county === "forms-router", "explicit county change source not recorded");

    await countySelect.selectOption("Not sure");
    state = await toolsState(page);
    assert(state.formCounty === "Not sure", "explicit Not sure did not update form control");
    assert(state.publicAnswers.county === "Not sure", "explicit Not sure was not preserved as an explicit answer");
    assert(state.publicAnswers.confirmedFields?.county === true, "explicit Not sure did not stay confirmed");
    assert(state.publicAnswers.explicitUnknownFields?.county === true, "explicit Not sure was not marked as explicit unknown");

	    await countySelect.selectOption("Pima");
	    await page.locator("[data-form-reset]").first().click();
	    state = await toolsState(page);
    assert(state.formCounty === "Not sure", `reset did not clear county, got ${state.formCounty}`);
    assert(state.formIssue === "all", `reset did not clear issue, got ${state.formIssue}`);
    assert(state.formPosture === "Any posture", `reset did not clear posture, got ${state.formPosture}`);
    assert(state.formChildren === "any", `reset did not clear children, got ${state.formChildren}`);
    assert(state.publicAnswers.county === "Not sure", "reset did not persist cleared county state");
	    assert(!state.publicAnswers.confirmedFields?.county, "reset did not clear county provenance");
	    assert(!state.publicAnswers.explicitUnknownFields?.county, "reset did not clear explicit unknown provenance");
	    assert(state.publicAnswers.resetFields?.county === true, "reset did not create county tombstone");
	    await page.evaluate(() => {
	      sessionStorage.setItem("mflgFormsRouteContext", JSON.stringify({
	        county: "Maricopa",
	        issue: "divorce",
	        posture: "New filing",
	        children: "minor-children",
	        userConfirmed: true
	      }));
	    });
	    await page.goto(`${baseUrl}/guides/`, { waitUntil: "networkidle" });
	    await page.goto(`${baseUrl}/forms/`, { waitUntil: "networkidle" });
	    state = await toolsState(page);
	    assert(state.publicAnswers.county === "Not sure", "reset tombstone allowed legacy county rehydration after navigation");
	    assert(state.publicAnswers.posture === "Any posture", "reset tombstone allowed legacy posture rehydration after navigation");
	    assert(state.publicAnswers.children === "any", "reset tombstone allowed legacy children rehydration after navigation");
	    await page.reload({ waitUntil: "networkidle" });
	    state = await toolsState(page);
	    assert(state.publicAnswers.county === "Not sure", "reset tombstone allowed legacy county rehydration after reload");

	    await chooseFormsAnswers(page, "Yavapai", "Existing order", "parenting", "minor-children");
	    state = await toolsState(page);
	    assert(state.publicAnswers.county === "Yavapai", "reselected county after reset did not persist");
	    assert(!state.publicAnswers.resetFields?.county, "explicit county selection did not clear reset tombstone");
	    await page.evaluate(() => {
	      sessionStorage.setItem("mflgFormsRouteContext", JSON.stringify({ county: "Maricopa", issue: "divorce", posture: "New filing", children: "any", userConfirmed: true }));
	    });
	    await page.goto(`${baseUrl}/forms/`, { waitUntil: "networkidle" });
		    state = await toolsState(page);
		    assert(state.publicAnswers.county === "Yavapai", "stale legacy county returned after explicit new selection");

		    await showFormsControls(page);
			    await countySelect.selectOption("Not sure");
	    await page.evaluate(() => {
	      sessionStorage.setItem("mflgFormsRouteContext", JSON.stringify({ county: "Maricopa", issue: "divorce", posture: "New filing", children: "any", userConfirmed: true }));
	    });
	    await page.reload({ waitUntil: "networkidle" });
		    state = await toolsState(page);
		    assert(state.publicAnswers.county === "Not sure", "explicit unknown county was overwritten by legacy");
		    assert(state.publicAnswers.explicitUnknownFields?.county === true, "explicit unknown provenance did not survive legacy conflict");

		    await showFormsControls(page);
		    await page.locator("[data-form-reset]").first().click();
	    state = await clickFirstMatterCard(page);
	    assert(state.publicAnswers.resetFields?.county === true, "system suggestion cleared reset tombstone");
	    assert(!state.publicAnswers.confirmedFields?.county, "system suggestion confirmed reset county");

	    await chooseFormsAnswers(page, "Yavapai", "Existing order", "parenting", "minor-children");
	    await page.click('[data-smart-lane="calculator"]');
	    state = await toolsState(page);
    assert(state.publicAnswers.need === "calculator", "calculator toggle did not update shared state");
    assert(state.publicAnswers.county === "Yavapai", "calculator toggle did not preserve county");
    assert(state.publicAnswers.issue === "parenting", "calculator toggle replaced confirmed issue");

    await page.click('[data-smart-lane="forms"]');
    state = await toolsState(page);
	    assert(state.publicAnswers.need === "forms", "forms toggle did not update shared state");
	    assert(state.publicAnswers.county === "Yavapai", "forms toggle did not preserve county");

	    await seedState(page, {
	      county: "Pima",
	      issue: "parenting",
	      posture: "Existing order",
	      children: "minor-children",
	      confirmedFields: { county: true, issue: true, posture: true, children: true },
	      fieldSources: { county: "seed", issue: "seed", posture: "seed", children: "seed" }
	    }, {});
	    state = await clickDirectCalculatorChoice(page);
	    assert(state.publicAnswers.need === "calculator", "direct calculator chooser did not persist calculator need");
	    assert(state.publicAnswers.selectedCalculator === "maintenance", `direct calculator chooser did not persist selected calculator, got ${state.publicAnswers.selectedCalculator}`);
	    assert(state.publicAnswers.confirmedFields?.selectedCalculator === true, "direct calculator chooser did not confirm calculator");
	    assert(state.publicAnswers.issue === "parenting", "direct calculator chooser overwrote confirmed issue");
	    assert(state.publicAnswers.county === "Pima", "direct calculator chooser overwrote confirmed county");
	    await page.goto(`${baseUrl}/guides/`, { waitUntil: "networkidle" });
	    await page.goto(`${baseUrl}/tools/`, { waitUntil: "networkidle" });
	    state = await toolsState(page);
	    assert(state.publicAnswers.selectedCalculator === "maintenance", "direct calculator selection did not survive navigation");

	    await seedState(page, {
	      county: "Pima",
	      issue: "parenting",
	      posture: "Existing order",
	      children: "minor-children",
	      confirmedFields: { county: true, issue: true, posture: true, children: true },
	      fieldSources: { county: "seed", issue: "seed", posture: "seed", children: "seed" }
	    }, {});
	    state = await clickCalculatorReadinessAction(page);
	    assert(state.publicAnswers.need === "calculator", "calculator readiness action did not persist calculator need");
	    assert(state.publicAnswers.confirmedFields?.selectedCalculator === true, "calculator readiness action did not confirm calculator");
	    assert(state.publicAnswers.issue === "parenting", "calculator readiness action forced a support issue");

    await seedState(page, {
      county: "Pima",
      issue: "parenting",
      posture: "Existing order",
      children: "minor-children",
      confirmedFields: { county: true, issue: true, posture: true, children: true },
      fieldSources: { county: "seed", issue: "seed", posture: "seed", children: "seed" }
    }, {});
    state = await clickFirstMatterCard(page);
    assert(state.publicAnswers.confirmedFields?.issue === true, "matter card did not confirm issue context");
    assert(state.publicAnswers.confirmedFields?.county === true, "matter card erased existing county provenance");
    assert(state.publicAnswers.county === "Pima", "matter card changed confirmed county");

    await seedState(page, {
      county: "Pima",
      issue: "parenting",
      posture: "Existing order",
      children: "minor-children",
      confirmedFields: { county: true, issue: true, posture: true, children: true },
      fieldSources: { county: "seed", issue: "seed", posture: "seed", children: "seed" }
    }, {});
    state = await clickGuideCalculatorLink(page);
    assert(state.publicAnswers.need === "calculator", "global calculator link did not set calculator need");
    assert(state.publicAnswers.confirmedFields?.selectedCalculator === true, "global calculator link did not confirm selected calculator");
    assert(state.publicAnswers.issue === "parenting", "global calculator link overwrote confirmed issue");
    const expectedAfterNavigation = { ...state.publicAnswers };

    await page.goto(`${baseUrl}/practice-areas/`, { waitUntil: "networkidle" });
    await page.goto(`${baseUrl}/tools/`, { waitUntil: "networkidle" });
    await page.goto(`${baseUrl}/guides/`, { waitUntil: "networkidle" });
    await page.goto(`${baseUrl}/tools/`, { waitUntil: "networkidle" });
    state = await toolsState(page);
    assert(state.publicAnswers.county === expectedAfterNavigation.county, "repeated navigation decayed county into a placeholder");
    assert(state.publicAnswers.issue === expectedAfterNavigation.issue, "repeated navigation decayed issue into a placeholder");
    assert(state.publicAnswers.posture === expectedAfterNavigation.posture, "repeated navigation decayed posture into a placeholder");
    assert(state.publicAnswers.children === expectedAfterNavigation.children, "repeated navigation decayed children into a placeholder");
    assert(state.publicAnswers.confirmedFields?.issue === true, "repeated navigation lost issue provenance");

    await page.goto(`${baseUrl}/fees/`, { waitUntil: "networkidle" });
    const feeState = await page.evaluate(() => ({
      titles: Array.from(document.querySelectorAll(".fee-card h3")).map((item) => item.textContent.trim()),
      ctas: Array.from(document.querySelectorAll(".fee-card a.button")).map((item) => item.textContent.trim()),
      routes: Array.from(document.querySelectorAll(".fee-card a.button")).map((item) => item.getAttribute("data-intake-route") || "")
    }));
    assert(feeState.titles.includes("Uncontested Divorce without Minor Children"), "professional without-minor-children fee label missing");
    assert(feeState.titles.includes("Uncontested Divorce with Minor Children"), "professional with-minor-children fee label missing");
    assert(!feeState.titles.concat(feeState.ctas).some((text) => /No-kids|No Kids|No-Kids|with Kids|With Kids/.test(text)), "casual fee label returned");
    assert(feeState.routes.every((route) => !/No Kids|With Kids|No-Kids|with Kids/.test(route)), "casual fee route label returned");

    await page.goto(`${baseUrl}/tools/`, { waitUntil: "networkidle" });
    await page.click("[data-guided-result-action]");
    state = await toolsState(page);
    assert(state.sameSitePdfLinks.every((href) => href.startsWith("/api/official-pdf/")), "same-site PDF links missing or invalid");
    assert(state.externalPdfButtons.length === 0, `external PDF public hrefs found: ${state.externalPdfButtons.join(", ")}`);

    await page.close();
  } finally {
    await browser.close();
  }
  console.log("PUBLIC_ANSWER_PERSISTENCE_PASS");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
