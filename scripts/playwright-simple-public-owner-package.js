const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const productionUrl = process.env.MFLG_PRODUCTION_URL || "https://myfamilylawgroup.com";
const previewUrl = process.env.MFLG_PREVIEW_URL || "https://68d22b81.mflg-public-website.pages.dev";
const previewAssetKey = "mflg-live-20260622-213314-hero-pill-refine";
const productionAssetKey = "mflg-live-20260620-211200-current-release-action-integrity";
const outDir = path.join(process.cwd(), "reports", "simple-public-workflow-owner-assets");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function esc(value) {
  return String(value || "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
}

async function newPage(browser, viewport) {
  const context = await browser.newContext({ viewport });
  await context.route("**/*", (route) => route.continue({
    headers: { ...route.request().headers(), "Cache-Control": "no-cache" }
  }));
  const page = await context.newPage();
  return { context, page };
}

async function identity(page) {
  return page.evaluate(() => {
    const assets = Array.from(document.querySelectorAll("link[href],script[src],img[src]"))
      .map((node) => node.getAttribute("href") || node.getAttribute("src") || "")
      .filter(Boolean);
    const keys = assets.map((asset) => {
      try {
        return new URL(asset, location.origin).searchParams.get("v");
      } catch {
        return "";
      }
    }).filter(Boolean);
    return {
      url: location.href,
      assetKeys: Array.from(new Set(keys)).filter((key) => key.startsWith("mflg-")),
      js: Array.from(document.scripts).map((script) => script.src).find((src) => src.includes("mflg-public-site.js")) || "",
      css: Array.from(document.querySelectorAll("link[rel='stylesheet']")).map((link) => link.href).find((href) => href.includes("mflg-public-site.css")) || ""
    };
  });
}

async function shot(page, name, selector = "body") {
  const file = `${name}.png`;
  let target = page.locator(selector).first();
  if (!(await target.count()) || !(await target.isVisible().catch(() => false))) {
    target = page.locator("body").first();
  }
  await target.screenshot({ path: path.join(outDir, file), animations: "disabled" });
  return file;
}

async function openPracticeForms(page, base) {
  await page.goto(`${base}/practice-areas/`, { waitUntil: "networkidle" });
  const reveal = page.locator("[data-service-reveal]");
  if (await reveal.count()) await reveal.click();
  await page.locator("[data-service-card] [data-service-detail-toggle]").first().click();
  const forms = page.locator("[data-service-action='forms']").first();
  if (await forms.count()) await forms.click();
  await page.locator("[data-guide-pdf-panel]").first().waitFor({ state: "visible", timeout: 10000 });
}

async function openGuideForms(page, base) {
  await page.goto(`${base}/guides/`, { waitUntil: "networkidle" });
  const reveal = page.locator("[data-guide-reveal]");
  if (await reveal.count()) await reveal.click();
  await page.locator("[data-guide-card] [data-guide-open]").first().click();
  await page.locator("[data-guide-next-choice='forms']").first().click();
  await page.locator("[data-guide-pdf-panel]").first().waitFor({ state: "visible", timeout: 10000 });
}

async function openFormsResult(page, base, county = "Maricopa") {
  await page.goto(`${base}/forms/`, { waitUntil: "networkidle" });
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload({ waitUntil: "networkidle" });
  const answers = ["forms", county, "New filing", "divorce", "no-minor-children"];
  for (const answer of answers) {
    const locator = page.locator(`[data-guided-answer="${answer}"]`).first();
    if (await locator.count()) {
      await locator.waitFor({ state: "visible", timeout: 10000 });
      await locator.click();
      await page.waitForTimeout(80);
    }
  }
  const action = page.locator("[data-guided-result-action]").first();
  if (await action.count()) await action.click();
  await page.waitForTimeout(600);
}

async function openViewer(page) {
  const showAll = page.locator("[data-official-pdf-show-all]").first();
  if (await showAll.count()) {
    await showAll.click().catch(() => {});
  }
  const firstGroup = page.locator(".official-pdf-group").first();
  if (await firstGroup.count()) {
    await page.locator(".official-pdf-group").evaluateAll((nodes) => {
      nodes.forEach((node) => { node.open = true; });
    });
  }
  const preview = page.locator(".official-pdf-link:not([hidden]) [data-official-pdf-preview]").first();
  if (await preview.count()) {
    await preview.click();
    await page.locator("[data-official-pdf-viewer]").first().waitFor({ state: "visible", timeout: 10000 });
  }
}

async function captureSet(browser, label, base, expectedKey) {
  const records = [];
  const desktop = await newPage(browser, { width: 1440, height: 900 });
  const page = desktop.page;
  const add = async (name, route, action, selector = "body") => {
    const id = await identity(page);
    if (!id.assetKeys.includes(expectedKey)) throw new Error(`${label}/${name}: expected ${expectedKey}, got ${id.assetKeys.join(", ")}`);
    records.push({
      label,
      name,
      route,
      action,
      viewport: "1440x900",
      identity: id,
      file: await shot(page, `${label}-${name}`, selector)
    });
  };

  await page.goto(`${base}/`, { waitUntil: "networkidle" });
  await add("hero", "/", "fresh load", ".hero");
  await add("post-hero-order", "/", "fresh load", "[data-page-root]");

  await page.goto(`${base}/practice-areas/`, { waitUntil: "networkidle" });
  await add("practice-catalog", "/practice-areas/", "fresh load", "[data-service-tools]");
  await page.locator("[data-service-category-filter]").nth(1).click();
  await add("practice-filtered", "/practice-areas/", "filter click", "[data-service-list]");
  await openPracticeForms(page, base);
  await add("practice-selected-issue", "/practice-areas/", "choose first issue and forms task", ".service-row-panel");

  await page.goto(`${base}/guides/`, { waitUntil: "networkidle" });
  await add("diy-guide-catalog", "/guides/", "fresh load", "[data-guide-list]");
  await openGuideForms(page, base);
  await add("diy-guide-selected", "/guides/", "open guide and choose forms", ".guide-row-panel");

  await openFormsResult(page, base, "Maricopa");
  await add("exact-result", "/forms/", "guided Maricopa divorce no children", "[data-forms-smart-path]");
  await openViewer(page);
  await add("viewer-desktop", "/forms/", "open first same-site PDF", "[data-official-pdf-viewer]");
  await openFormsResult(page, base, "Apache");
  await add("fallback-result", "/forms/", "guided Apache divorce no children", "[data-forms-smart-path]");

  await page.goto(`${base}/calculators/`, { waitUntil: "networkidle" });
  await page.locator("[data-smart-lane='calculator']").first().click();
  await add("calculator", "/calculators/", "choose calculator task", "[data-forms-smart-path]");
  await desktop.context.close();

  const mobile = await newPage(browser, { width: 390, height: 844 });
  const mobilePage = mobile.page;
  await mobilePage.goto(`${base}/`, { waitUntil: "networkidle" });
  records.push({
    label,
    name: "mobile-first-viewport",
    route: "/",
    action: "fresh load",
    viewport: "390x844",
    identity: await identity(mobilePage),
    file: await shot(mobilePage, `${label}-mobile-first-viewport`, "body")
  });
  await openFormsResult(mobilePage, base, "Maricopa");
  await openViewer(mobilePage);
  records.push({
    label,
    name: "viewer-mobile",
    route: "/forms/",
    action: "guided result then open viewer",
    viewport: "390x844",
    identity: await identity(mobilePage),
    file: await shot(mobilePage, `${label}-viewer-mobile`, "[data-official-pdf-viewer]")
  });
  await mobile.context.close();
  return records;
}

(async () => {
  ensureDir(outDir);
  const browser = await chromium.launch();
  try {
    const production = await captureSet(browser, "production", productionUrl, productionAssetKey);
    const preview = await captureSet(browser, "preview", previewUrl, previewAssetKey);
    const records = [...production, ...preview];
    fs.writeFileSync(path.join(outDir, "evidence.json"), JSON.stringify({
      productionUrl,
      previewUrl,
      productionAssetKey,
      previewAssetKey,
      records
    }, null, 2));
    const rows = records.map((record) => `<figure>
      <img src="${esc(record.file)}" alt="${esc(`${record.label} ${record.name}`)}">
      <figcaption><strong>${esc(record.label)} / ${esc(record.name)}</strong><br>${esc(record.viewport)} / ${esc(record.action)}<br>${esc(record.identity.assetKeys.join(", "))}</figcaption>
    </figure>`).join("\n");
    fs.writeFileSync(path.join(outDir, "contact-sheet.html"), `<!doctype html>
<html><head><meta charset="utf-8"><title>MFLG Simple Public Workflow Evidence</title>
<style>body{font-family:Inter,Arial,sans-serif;margin:24px;background:#f3eee6;color:#111820}main{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}figure{margin:0;background:white;border:1px solid #ddd;padding:12px}img{max-width:100%;height:auto;display:block}figcaption{font-size:12px;line-height:1.4;margin-top:8px}</style></head>
<body><h1>MFLG Simple Public Workflow Evidence</h1><p>Production and preview screenshots captured from live URLs with cache bypassed.</p><main>${rows}</main></body></html>`);
    console.log("SIMPLE_PUBLIC_OWNER_PACKAGE_PASS");
    console.log(JSON.stringify({ production: production.length, preview: preview.length, outDir }, null, 2));
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
