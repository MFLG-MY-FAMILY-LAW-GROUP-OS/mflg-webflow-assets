const { chromium } = require("playwright");

const baseUrl = process.env.MFLG_TEST_BASE_URL || "http://127.0.0.1:4173";
const counties = [
  "Not sure",
  "Apache",
  "Cochise",
  "Coconino",
  "Gila",
  "Graham",
  "Greenlee",
  "La Paz",
  "Maricopa",
  "Mohave",
  "Navajo",
  "Pima",
  "Pinal",
  "Santa Cruz",
  "Yavapai",
  "Yuma"
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function newPage(browser, viewport = { width: 1440, height: 1000 }) {
  const context = await browser.newContext({ viewport });
  await context.clearCookies();
  const page = await context.newPage();
  await page.route("**/*", (route) => {
    const headers = { ...route.request().headers(), "Cache-Control": "no-cache" };
    route.continue({ headers });
  });
  return { context, page };
}

async function resetStorage(page) {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

async function assertNoOverflow(page, label) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  assert(!overflow, `${label}: horizontal overflow`);
}

async function visibleText(page) {
  return page.locator("body").innerText();
}

async function assertNoPublicInternals(page, label) {
  const structuredText = await page.evaluate(() => {
    const selectors = [
      "[data-guided-summary]",
      "[data-form-route-decision-meta]",
      "[data-guide-bridge-chips]",
      ".guide-forms-bridge-grid",
      ".forms-coverage-routes",
      ".service-panel",
      ".guide-panel"
    ];
    return selectors.map((selector) => Array.from(document.querySelectorAll(selector))
      .filter((node) => node.offsetParent !== null)
      .map((node) => node.innerText)
      .join("\n")).join("\n");
  });
  const blocked = [
    /\bIssue:\s*all\b/i,
    /\bChildren:\s*any\b/i,
    /\bCase stage:\s*Any posture\b/i,
    /\bundefined\b/i,
    /\bnull\b/i,
    /\bmaricopa-divorce-new-(with|no)-children\b/i,
    /\bofficial-pdf-[a-z0-9-]+\b/i,
    /\bpacket metadata\b/i,
    /\broute metadata\b/i,
    /\broute confidence\b/i
  ];
  blocked.forEach((pattern) => {
    assert(!pattern.test(structuredText), `${label}: internal value visible in structured text: ${pattern}`);
  });
}

async function assertNoExternalPdfAnchors(page, label) {
  const externalPdfHrefs = await page.evaluate(() => Array.from(document.querySelectorAll("a[href]"))
    .map((link) => link.getAttribute("href") || "")
    .filter((href) => /^https?:\/\//i.test(href) && /\.pdf(?:$|[?#])/i.test(href)));
  assert(externalPdfHrefs.length === 0, `${label}: external PDF anchors visible: ${externalPdfHrefs.join(", ")}`);
}

async function assertCountyOptions(page, selector, label) {
  const options = await page.locator(selector).evaluate((select) => Array.from(select.options).map((option) => option.value || option.textContent.trim()));
  assert(JSON.stringify(options) === JSON.stringify(counties), `${label}: county options mismatch: ${options.join(", ")}`);
}

async function chooseGuided(page, value, label) {
  const locator = page.locator(`[data-guided-answer="${value}"]`).first();
  await locator.waitFor({ state: "visible", timeout: 5000 });
  await locator.click();
  await page.waitForTimeout(80);
  await assertNoPublicInternals(page, label);
}

async function canonicalAnswers(page) {
  return page.evaluate(() => JSON.parse(sessionStorage.getItem("mflgPublicAnswers") || "{}"));
}

async function runFormsScenario(page, scenario) {
  await page.goto(`${baseUrl}/forms/`, { waitUntil: "networkidle" });
  await resetStorage(page);
  await page.reload({ waitUntil: "networkidle" });
  await assertCountyOptions(page, "[data-smart-county]", `${scenario.name} smart county`);
  await assertCountyOptions(page, "[data-form-county]", `${scenario.name} form county`);
  await chooseGuided(page, "forms", scenario.name);
  await chooseGuided(page, scenario.county, scenario.name);
  await chooseGuided(page, scenario.posture, scenario.name);
  await chooseGuided(page, scenario.issue, scenario.name);
  if (scenario.children) await chooseGuided(page, scenario.children, scenario.name);
  const answers = await canonicalAnswers(page);
  assert(answers.county === scenario.county, `${scenario.name}: canonical county ${answers.county}`);
  assert(answers.issue === scenario.issue, `${scenario.name}: canonical issue ${answers.issue}`);
  assert(answers.posture === scenario.posture, `${scenario.name}: canonical posture ${answers.posture}`);
  if (scenario.children) assert(answers.children === scenario.children, `${scenario.name}: canonical children ${answers.children}`);
  if (scenario.county !== "Maricopa") {
    assert(answers.county !== "Maricopa", `${scenario.name}: Maricopa manufactured`);
  }
  const selectedPacket = answers.selectedPacket || "";
  assert(!/^maricopa-divorce-new-/.test(selectedPacket), `${scenario.name}: first/default packet selected automatically`);
  await assertNoExternalPdfAnchors(page, scenario.name);
  await assertNoOverflow(page, scenario.name);
}

async function runDirectFormControlsScenario(page, scenario) {
  await page.goto(`${baseUrl}/forms/`, { waitUntil: "networkidle" });
  await resetStorage(page);
  await page.reload({ waitUntil: "networkidle" });
  await page.locator(".forms-smart-path-controls summary").click();
  await page.selectOption("[data-smart-county]", scenario.county);
  await page.selectOption("[data-smart-posture]", scenario.posture);
  if (scenario.children) await page.selectOption("[data-smart-children]", scenario.children);
  await page.locator("[data-smart-show-all]").click();
  await page.selectOption("[data-form-county]", scenario.county);
  await page.selectOption("[data-form-posture]", scenario.posture);
  await page.selectOption("[data-form-issue]", scenario.issue);
  if (scenario.children) await page.selectOption("[data-form-children]", scenario.children);
  await page.waitForTimeout(150);
  const answers = await canonicalAnswers(page);
  assert(answers.county === scenario.county, `${scenario.name}: canonical county ${answers.county}`);
  assert(answers.issue === scenario.issue, `${scenario.name}: canonical issue ${answers.issue}`);
  assert(answers.posture === scenario.posture, `${scenario.name}: canonical posture ${answers.posture}`);
  if (scenario.children) assert(answers.children === scenario.children, `${scenario.name}: canonical children ${answers.children}`);
  assert(answers.county !== "Maricopa", `${scenario.name}: Maricopa manufactured`);
  assert(!answers.selectedPacket || answers.selectedPacket === "all", `${scenario.name}: packet should not auto-select, got ${answers.selectedPacket}`);
  await assertNoExternalPdfAnchors(page, scenario.name);
  await assertNoOverflow(page, scenario.name);
}

async function verifyFirstViewport(page, path, label) {
  await page.goto(`${baseUrl}${path}`, { waitUntil: "networkidle" });
  await resetStorage(page);
  await page.reload({ waitUntil: "networkidle" });
  const snapshot = await page.evaluate(() => {
    const viewportBottom = window.innerHeight;
    const visibleButtons = Array.from(document.querySelectorAll("a,button"))
      .filter((node) => {
        const rect = node.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && rect.top >= 0 && rect.top < viewportBottom;
      })
      .map((node) => node.textContent.trim().replace(/\s+/g, " "))
      .filter(Boolean);
    const primaryLike = Array.from(document.querySelectorAll(".button.primary, a.primary, .decision-option.primary"))
      .filter((node) => {
        const rect = node.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && rect.top >= 0 && rect.top < viewportBottom;
      })
      .map((node) => node.textContent.trim().replace(/\s+/g, " "));
    return {
      heading: document.querySelector("h1,h2,h3")?.textContent?.trim() || "",
      visibleButtons,
      primaryLike,
      bodyText: document.body.innerText
    };
  });
  assert(snapshot.heading, `${label}: missing first heading`);
  assert(snapshot.visibleButtons.length > 0, `${label}: no visible first-viewport action`);
  assert(snapshot.primaryLike.length <= 2, `${label}: too many dominant first-viewport actions: ${snapshot.primaryLike.join(" | ")}`);
  if (["/", "/forms/", "/tools/", "/calculators/"].includes(path)) {
    ["Find forms", "Use calculator"].forEach((phrase) => {
      assert(new RegExp(phrase, "i").test(snapshot.bodyText), `${label}: missing task-first action ${phrase}`);
    });
  }
  assert(!/Question 1 of 5/i.test(snapshot.bodyText), `${label}: restarts at Question 1 of 5`);
  await assertNoPublicInternals(page, label);
  await assertNoExternalPdfAnchors(page, label);
  await assertNoOverflow(page, label);
}

async function verifyPathwayClick(page, path, cardText, expectedIssue, label) {
  await page.goto(`${baseUrl}${path}`, { waitUntil: "networkidle" });
  await resetStorage(page);
  await page.reload({ waitUntil: "networkidle" });
  const openedTitle = await page.evaluate(({ path, cardText }) => {
    if (path.includes("practice-areas")) {
      document.querySelector("[data-service-category-reset]")?.click();
      const reveal = document.querySelector("[data-service-reveal]");
      if (reveal?.getAttribute("aria-expanded") !== "true") reveal?.click();
      const cards = Array.from(document.querySelectorAll("[data-service-card]"));
      const card = cards.find((item) => (item.querySelector("h3")?.textContent || "").toLowerCase().includes(cardText.toLowerCase()));
      card?.scrollIntoView({ block: "center" });
      card?.querySelector("[data-service-detail-toggle]")?.click();
      return card?.querySelector("h3")?.textContent?.trim() || "";
    }
    const reveal = document.querySelector("[data-guide-reveal]");
    if (reveal && !document.querySelector(".guide-reveal")?.classList.contains("revealed")) reveal.click();
    const cards = Array.from(document.querySelectorAll("[data-guide-card]"));
    const card = cards.find((item) => (item.querySelector("h3")?.textContent || "").toLowerCase().includes(cardText.toLowerCase()));
    card?.scrollIntoView({ block: "center" });
    card?.querySelector("[data-guide-open]")?.click();
    return card?.querySelector("h3")?.textContent?.trim() || "";
  }, { path, cardText });
  assert(openedTitle, `${label}: card not found for ${cardText}`);
  await page.waitForTimeout(250);
  const panelTitle = await page.locator(path.includes("practice-areas") ? ".service-row-panel .guide-panel-heading h3" : ".guide-row-panel .guide-panel-heading h3").first().textContent();
  assert((panelTitle || "").trim() === openedTitle, `${label}: stale panel opened ${panelTitle} for ${openedTitle}`);
  const answers = await canonicalAnswers(page);
  const issueText = await visibleText(page);
  assert(new RegExp(expectedIssue, "i").test(issueText) || new RegExp(expectedIssue, "i").test(answers.issue || ""), `${label}: expected issue context ${expectedIssue}`);
  assert(!answers.county || answers.county === "Not sure", `${label}: county should remain missing until selected, got ${answers.county}`);
  assert(!answers.selectedPacket || answers.selectedPacket === "all", `${label}: packet should not auto-select, got ${answers.selectedPacket}`);
  await assertNoPublicInternals(page, label);
}

async function verifyPacketSourceSeparation(page) {
  await page.goto(`${baseUrl}/forms/`, { waitUntil: "networkidle" });
  await resetStorage(page);
  await page.evaluate(() => {
    sessionStorage.setItem("mflgPublicAnswers", JSON.stringify({
      county: "Pima",
      issue: "divorce",
      posture: "New filing",
      children: "no-minor-children",
      confirmedFields: { county: true, issue: true, posture: true, children: true },
      fieldSources: { county: "test-user", issue: "test-user", posture: "test-user", children: "test-user" }
    }));
    sessionStorage.setItem("mflgFormsRouteContext", JSON.stringify({
      county: "Maricopa",
      sourcePathway: "packet-metadata",
      pdfPacket: "maricopa-divorce-new-no-children"
    }));
  });
  await page.reload({ waitUntil: "networkidle" });
  const answers = await canonicalAnswers(page);
  assert(answers.county === "Pima", `packet source separation: Pima county overwritten by ${answers.county}`);
  assert(answers.packetSourceCounty === "Maricopa", `packet source separation: Maricopa source county not preserved separately (${answers.packetSourceCounty})`);
  assert(answers.confirmedFields?.county === true, "packet source separation: confirmed county metadata lost");
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const desktop = await newPage(browser);
    const page = desktop.page;
    for (const [path, label] of [
      ["/", "home"],
      ["/practice-areas/", "practice areas"],
      ["/guides/", "diy guides"],
      ["/forms/", "forms"],
      ["/tools/", "tools"],
      ["/calculators/", "calculators"],
      ["/fees/", "fees"]
    ]) {
      await verifyFirstViewport(page, path, label);
    }
    await runFormsScenario(page, { name: "Pima divorce without minor children", county: "Pima", posture: "New filing", issue: "divorce", children: "no-minor-children" });
    await runFormsScenario(page, { name: "Maricopa child support existing order", county: "Maricopa", posture: "Existing order", issue: "support", children: "minor-children" });
    await runDirectFormControlsScenario(page, { name: "Yavapai parenting-time modification", county: "Yavapai", posture: "Existing order", issue: "modification", children: "minor-children" });
    await runDirectFormControlsScenario(page, { name: "Pinal paternity new filing", county: "Pinal", posture: "New filing", issue: "parentage", children: "minor-children" });
    await runFormsScenario(page, { name: "County not sure", county: "Not sure", posture: "New filing", issue: "divorce", children: "no-minor-children" });
    await verifyPathwayClick(page, "/practice-areas/", "Annulment", "Annulment", "Practice Area to Forms");
    await verifyPathwayClick(page, "/guides/", "Child Support", "Child Support", "DIY Guide to Forms");
    await verifyPacketSourceSeparation(page);
    await desktop.context.close();

    const mobile = await newPage(browser, { width: 390, height: 844 });
    for (const path of ["/", "/practice-areas/", "/guides/", "/forms/", "/tools/", "/calculators/", "/fees/"]) {
      await verifyFirstViewport(mobile.page, path, `mobile ${path}`);
    }
    await mobile.context.close();
  } finally {
    await browser.close();
  }
  console.log("PLAYWRIGHT_NEW_USER_SCENARIOS_PASS");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
