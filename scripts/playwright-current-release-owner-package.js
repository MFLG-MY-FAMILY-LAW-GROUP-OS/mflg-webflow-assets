const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { chromium } = require("playwright");

const baseUrl = process.env.MFLG_TEST_BASE_URL || "https://myfamilylawgroup.com";
const expectedAssetKey = "mflg-live-20260623-163035-lead-magnet-reveal-flow";
const expectedJsHash = "53b932965f1802626504db1b93d631cb1c547fb313a526c20b2ab730a35f497d";
const reportDir = path.join("reports", "world-class-owner-acceptance-assets");
const tmpReviewDir = "/private/tmp/mflg-owner-acceptance-review-current";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function writeJSON(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

async function newPage(browser, viewport) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  await page.route("**/*", (route) => route.continue({
    headers: { ...route.request().headers(), "Cache-Control": "no-cache" }
  }));
  return { context, page };
}

async function clearStorage(page) {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

async function gotoFresh(page, route) {
  await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded" });
  await clearStorage(page);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);
}

async function identityFor(page) {
  const identity = await page.evaluate(() => {
    const publicScript = Array.from(document.scripts)
      .map((script) => script.getAttribute("src") || "")
      .find((src) => src.includes("mflg-public-site.js")) || "";
    const publicCss = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
      .map((link) => link.getAttribute("href") || "")
      .find((href) => href.includes("mflg-public-site.css")) || "";
    const keyFrom = (value) => {
      try {
        return new URL(value, window.location.origin).searchParams.get("v") || "";
      } catch (error) {
        return "";
      }
    };
    return {
      url: window.location.href,
      publicScript,
      publicCss,
      assetKey: keyFrom(publicScript) || keyFrom(publicCss)
    };
  });
  const response = await page.request.get(new URL(identity.publicScript, baseUrl).href);
  const jsHash = sha256(await response.body());
  assert(identity.assetKey === expectedAssetKey, `Captured stale asset key for ${identity.url}: ${identity.assetKey}`);
  assert(jsHash === expectedJsHash, `Captured unexpected JS hash for ${identity.url}: ${jsHash}`);
  return { ...identity, publicJsHash: jsHash };
}

async function choose(page, value) {
  const button = page.locator(`[data-guided-answer="${value}"]`).first();
  await button.waitFor({ state: "visible", timeout: 12000 });
  await button.click();
  await page.waitForTimeout(180);
}

async function qualifyExactMaricopaDivorce(page) {
  await gotoFresh(page, "/tools/");
  await choose(page, "forms");
  await choose(page, "Maricopa");
  await choose(page, "New filing");
  await choose(page, "divorce");
  await choose(page, "no-minor-children");
  await page.waitForTimeout(700);
}

async function qualifyNotSureFallback(page) {
  await gotoFresh(page, "/tools/");
  await choose(page, "forms");
  await choose(page, "Not sure");
  await choose(page, "New filing");
  await choose(page, "all");
  await page.waitForTimeout(700);
}

async function qualifyCalculator(page) {
  await gotoFresh(page, "/tools/");
  await choose(page, "calculator");
  await page.waitForTimeout(500);
}

async function controlSummary(page, rootSelector) {
  return page.evaluate((selector) => {
    const visible = (node) => {
      if (!node || node.closest("[hidden], [inert], [aria-hidden='true'], nav, footer, .site-footer")) return false;
      const rect = node.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    };
    const selectedRoot = selector ? document.querySelector(selector) : null;
    const activeRoot = selectedRoot
      || document.querySelector("[data-guided-result]:not([hidden])")
      || document.querySelector("[data-official-pdf-actions]")
      || document.querySelector("main");
    const controls = Array.from(activeRoot.querySelectorAll("a[href], button"))
      .filter((node) => visible(node) && !node.disabled && node.getAttribute("aria-disabled") !== "true")
      .map((node) => ({
        label: node.textContent.replace(/\s+/g, " ").trim(),
        tag: node.tagName.toLowerCase(),
        href: node.getAttribute("href") || node.dataset.sitePdfViewUrl || node.closest("[data-official-pdf-link]")?.dataset.sitePdfViewUrl || "",
        primary: Boolean(
          node.classList.contains("primary")
          || node.closest(".primary")
          || node.hasAttribute("data-official-pdf-preview")
          || node.hasAttribute("data-official-pdf-open")
        )
      }))
      .filter((item) => item.label);
    const pdfLinks = Array.from(activeRoot.querySelectorAll("[data-official-pdf-link]:not([hidden])"))
      .filter(visible);
    const heading = Array.from(activeRoot.querySelectorAll("h1,h2,h3,strong"))
      .find(visible)?.textContent.replace(/\s+/g, " ").trim() || "";
    const classification = document.querySelector("[data-form-route-decision-kicker]")?.textContent?.trim()
      || document.querySelector("[data-official-pdf-spotlight-kicker]")?.textContent?.trim()
      || "";
    const userCounty = JSON.parse(sessionStorage.getItem("mflgPublicAnswers") || "{}").county || "";
    const sourceJurisdiction = JSON.parse(sessionStorage.getItem("mflgPublicAnswers") || "{}").packetSourceCounty || "";
    const primaryLabels = controls.filter((item) => item.primary).map((item) => item.label);
    return {
      heading,
      classification,
      userCounty,
      sourceJurisdiction,
      primaryActions: primaryLabels,
      secondaryActions: controls.filter((item) => !item.primary).slice(0, 8).map((item) => item.label),
      activeResultPdfCount: pdfLinks.length,
      duplicateVisibleLabels: primaryLabels
        .filter((label, index, all) => all.indexOf(label) !== index)
        .filter((label, index, all) => all.indexOf(label) === index),
      externalPdfHrefs: controls.map((item) => item.href).filter((href) => /^https?:\/\//i.test(href) && /\.pdf(?:$|[?#])/i.test(href))
    };
  }, rootSelector || "");
}

async function screenshotRecord(page, scenario, viewport, expectedState, fileName, rootSelector = "") {
  const identity = await identityFor(page);
  const actualState = await controlSummary(page, rootSelector);
  assert(actualState.externalPdfHrefs.length === 0, `${scenario}: external PDF href visible`);
  const file = path.join(reportDir, `${fileName}.png`);
  await page.screenshot({ path: file, fullPage: false });
  return {
    scenario,
    viewport,
    url: identity.url,
    capturedAssetKey: identity.assetKey,
    publicJsHash: identity.publicJsHash,
    expectedState,
    actualState,
    screenshot: file,
    timestamp: new Date().toISOString()
  };
}

async function run() {
  fs.rmSync(reportDir, { recursive: true, force: true });
  fs.mkdirSync(reportDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const records = [];
  try {
    let session = await newPage(browser, { width: 1365, height: 900 });
    await gotoFresh(session.page, "/");
    records.push(await screenshotRecord(session.page, "Homepage task choices", "desktop", "Task choices visible before proof/process material", "homepage-task-choice", ".hero"));
    await session.context.close();

    session = await newPage(browser, { width: 390, height: 844 });
    await gotoFresh(session.page, "/");
    records.push(await screenshotRecord(session.page, "Mobile first viewport", "mobile", "Hero pills one row and useful first action visible", "mobile-first-viewport", ".hero"));
    await session.context.close();

    session = await newPage(browser, { width: 1365, height: 900 });
    await gotoFresh(session.page, "/practice-areas/");
    records.push(await screenshotRecord(session.page, "Practice Area issue selection", "desktop", "Issue cards/search are primary", "practice-area-issue-selection", "[data-service-tools]"));
    const divorce = session.page.locator("[data-service-card]").filter({ hasText: "Divorce" }).first();
    await divorce.locator("[data-service-detail-toggle]").click();
    await session.page.waitForTimeout(800);
    records.push(await screenshotRecord(session.page, "Practice Area forms qualification", "desktop", "Selected issue panel begins below sticky header", "practice-area-forms-qualification", ".service-row-panel"));
    await session.page.locator('.service-row-panel [data-service-action="steps"]').first().click();
    await session.page.waitForTimeout(600);
    records.push(await screenshotRecord(session.page, "Practice Area actual steps result", "desktop", "Steps/guide section visibly starts at heading", "practice-area-steps-result", ".service-row-panel [data-service-panel-section='steps']"));
    await divorce.locator("[data-service-detail-toggle]").click();
    await session.page.waitForTimeout(300);
    await divorce.locator("[data-service-detail-toggle]").click();
    await session.page.waitForTimeout(600);
    await session.page.locator('.service-row-panel [data-service-action="forms"]').first().click();
    await session.page.waitForTimeout(600);
    records.push(await screenshotRecord(session.page, "Practice Area actual forms result", "desktop", "Forms action reveals result/workspace, not a small scroll", "practice-area-forms-result", ".service-row-panel [data-service-panel-section='forms']"));
    await session.context.close();

    session = await newPage(browser, { width: 1365, height: 900 });
    await gotoFresh(session.page, "/guides/");
    await session.page.locator("[data-guide-card]").filter({ hasText: "Divorce" }).first().locator("[data-guide-open]").click();
    await session.page.waitForTimeout(700);
    records.push(await screenshotRecord(session.page, "DIY Guide selected state", "desktop", "Guide panel opens at beginning with next action", "diy-guide-selected", ".guide-row-panel"));
    const guideForms = session.page.locator("[data-guide-scroll-forms]").first();
    if (await guideForms.isVisible().catch(() => false)) {
      await guideForms.click();
      await session.page.waitForTimeout(600);
      records.push(await screenshotRecord(session.page, "DIY Guide actual forms result", "desktop", "Guide forms result is visible at top", "diy-guide-forms-result", ".guide-row-panel"));
    }
    await session.context.close();

    session = await newPage(browser, { width: 1365, height: 900 });
    await gotoFresh(session.page, "/forms/");
    records.push(await screenshotRecord(session.page, "Forms direct first state", "desktop", "Initial form finder state has one primary path", "forms-direct-first-state", "[data-forms-smart-path]"));
    await session.context.close();

    session = await newPage(browser, { width: 1365, height: 900 });
    await qualifyExactMaricopaDivorce(session.page);
    records.push(await screenshotRecord(session.page, "Exact county direct packet result", "desktop", "Matched forms show active same-site form actions", "exact-county-direct-packet", "[data-official-pdf-actions]"));
    await session.page.locator("[data-official-pdf-link]:not([hidden]) [data-official-pdf-preview]").first().click();
    await session.page.waitForTimeout(700);
    records.push(await screenshotRecord(session.page, "Unified viewer", "desktop", "One View form model opens same-site viewer", "unified-viewer", "[data-official-pdf-viewer]"));
    const change = session.page.locator("[data-guided-change-answers]").first();
    if (await change.isVisible().catch(() => false)) {
      await change.click();
      await session.page.waitForTimeout(500);
      records.push(await screenshotRecord(session.page, "Change answers", "desktop", "Change answers returns to editable controls", "change-answers", "[data-forms-smart-path]"));
    }
    await session.context.close();

    session = await newPage(browser, { width: 1365, height: 900 });
    await qualifyNotSureFallback(session.page);
    records.push(await screenshotRecord(session.page, "Explicit County Not sure final result", "desktop", "Not sure remains user county and fallback is honest", "county-not-sure-result", "[data-guided-result]"));
    await session.context.close();

    session = await newPage(browser, { width: 1365, height: 900 });
    await qualifyCalculator(session.page);
    records.push(await screenshotRecord(session.page, "DIY Guide or direct calculator workspace", "desktop", "Calculator path avoids county unless needed", "calculator-workspace", "[data-guided-result]"));
    await session.context.close();

    session = await newPage(browser, { width: 390, height: 844 });
    await qualifyExactMaricopaDivorce(session.page);
    records.push(await screenshotRecord(session.page, "Mobile exact packet result", "mobile", "Mobile result has useful action in first viewport", "mobile-exact-packet", "[data-official-pdf-actions]"));
    await session.page.locator("[data-official-pdf-link]:not([hidden]) [data-official-pdf-preview]").first().click();
    await session.page.waitForTimeout(700);
    records.push(await screenshotRecord(session.page, "Mobile unified viewer", "mobile", "Mobile viewer remains same-site and preserves context", "mobile-viewer", "[data-official-pdf-viewer]"));
    await session.context.close();
  } finally {
    await browser.close();
  }

  const missing = records.filter((record) => record.capturedAssetKey !== expectedAssetKey || record.publicJsHash !== expectedJsHash);
  assert(missing.length === 0, "Owner package contains stale capture records");
  const duplicateFailures = records.filter((record) => record.actualState.duplicateVisibleLabels.length > 0);
  const noPrimary = records.filter((record) => !record.actualState.primaryActions.length && !/homepage|issue selection|selected state|steps result|unified viewer/i.test(record.scenario));

  const json = {
    version: "2.0.0-current-release-owner-acceptance",
    status: "pending",
    assetKey: expectedAssetKey,
    publicJsHash: expectedJsHash,
    generatedAt: new Date().toISOString(),
    baseUrl,
    records,
    summary: {
      scenarios: records.length,
      staleCaptures: missing.length,
      duplicateActiveActionLabels: duplicateFailures.length,
      missingPrimaryActions: noPrimary.length
    },
    requiredOwnerResponses: [
      "ACCEPTED",
      "ACCEPTED WITH CHANGES: <notes>",
      "REJECTED: <notes>"
    ]
  };
  writeJSON("data/world-class-owner-acceptance.json", json);

  const md = [
    "# World-Class Owner Acceptance",
    "",
    `Status: Pending owner sign-off`,
    `Asset key: \`${expectedAssetKey}\``,
    `Public JavaScript SHA-256: \`${expectedJsHash}\``,
    "",
    "## Product Reality",
    "",
    "The website never substitutes another county's forms as an exact match. When a verified exact or statewide packet is available, the site opens it. When no verified issue-specific packet is available, the site recommends the safest next step rather than showing a potentially incorrect form.",
    "",
    "## Screenshot Set",
    "",
    ...records.map((record) => `- ${record.screenshot} - ${record.scenario} (${record.viewport})`),
    "",
    "## Owner Questions",
    "",
    "- Is the first action obvious?",
    "- Is there only one dominant action?",
    "- Does the result clearly distinguish exact, statewide, related, directory-only, or unavailable status?",
    "- Is the selected county distinct from the source jurisdiction?",
    "- Does any result promise a form that is not actually matched?",
    "- Is Guided Intake appropriate help rather than a forced detour?",
    "- Is Change answers easy to find?",
    "- Is anything too crowded?",
    "- Is any wording administrative or confusing?",
    "- Can the result be opened without understanding the site architecture?",
    "",
    "## Required Owner Response",
    "",
    "- `ACCEPTED`",
    "- `ACCEPTED WITH CHANGES: <notes>`",
    "- `REJECTED: <notes>`",
    ""
  ].join("\n");
  fs.writeFileSync("reports/world-class-owner-acceptance.md", md);

  fs.rmSync(tmpReviewDir, { recursive: true, force: true });
  fs.mkdirSync(tmpReviewDir, { recursive: true });
  const reviewAssets = path.join(tmpReviewDir, "assets");
  fs.mkdirSync(reviewAssets, { recursive: true });
  for (const record of records) {
    fs.copyFileSync(record.screenshot, path.join(reviewAssets, path.basename(record.screenshot)));
  }
  const html = `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<title>MFLG Owner Acceptance Review</title>
<style>
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;margin:0;background:#f8f5ee;color:#102033}
main{max-width:1120px;margin:0 auto;padding:32px}
h1{font-size:32px;margin:0 0 8px}
.meta,.card{background:white;border:1px solid #ddd4c2;border-radius:8px;padding:18px;margin:16px 0}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:18px}
img{width:100%;height:auto;border:1px solid #d8cfbe;border-radius:6px;background:white}
code{background:#efe7d7;padding:2px 5px;border-radius:4px}
</style>
<main>
<h1>MFLG Owner Acceptance Review</h1>
<p>The screenshots below were regenerated from the current live production asset key and hash.</p>
<section class="meta">
<p><strong>Asset key:</strong> <code>${expectedAssetKey}</code></p>
<p><strong>Public JS hash:</strong> <code>${expectedJsHash}</code></p>
<p><strong>Status:</strong> Pending owner decision.</p>
</section>
<section class="meta">
<p>The website never substitutes another county's forms as an exact match. When a verified exact or statewide packet is available, the site opens it. When no verified issue-specific packet is available, the site recommends the safest next step rather than showing a potentially incorrect form.</p>
</section>
<section class="grid">
${records.map((record) => `<article class="card"><h2>${record.scenario}</h2><p>${record.expectedState}</p><p><strong>Actual:</strong> ${record.actualState.heading || record.actualState.classification || "Visible state captured"}</p><img src="assets/${path.basename(record.screenshot)}" alt="${record.scenario}"></article>`).join("\n")}
</section>
<section class="meta">
<h2>Owner decision</h2>
<p>Respond with exactly one: <code>ACCEPTED</code>, <code>ACCEPTED WITH CHANGES: &lt;notes&gt;</code>, or <code>REJECTED: &lt;notes&gt;</code>.</p>
</section>
</main>`;
  fs.writeFileSync(path.join(tmpReviewDir, "index.html"), html);
  console.log(JSON.stringify({
    result: "OWNER_PACKAGE_PASS",
    assetKey: expectedAssetKey,
    publicJsHash: expectedJsHash,
    scenarios: records.length,
    staleCaptures: missing.length,
    duplicateActiveActionLabels: duplicateFailures.length,
    missingPrimaryActions: noPrimary.length,
    reviewUrl: `file://${path.join(tmpReviewDir, "index.html")}`
  }, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
