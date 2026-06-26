const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const baseUrl = process.env.MFLG_TEST_BASE_URL || "http://127.0.0.1:4173";
const outDir = path.join(process.cwd(), "reports", "final-public-text-layout-qa");
const routes = ["/", "/practice-areas/", "/guides/", "/forms/", "/tools/", "/calculators/", "/fees/", "/about/", "/faq/", "/contact/", "/start/"];
const widths = [320, 360, 390, 430, 768, 1024, 1280, 1365, 1440, 1536, 1728, 1920];

const forbiddenTerms = [
  "classification",
  "route-action",
  "source metadata",
  "packet metadata",
  "packet candidate",
  "fallback",
  "rendered outcome",
  "matrix",
  "record",
  "model",
  "canonical",
  "source label",
  "asset key",
  "hash",
  "deployment",
  "branch",
  "tag",
  "release",
  "source jurisdiction",
  "resource jurisdiction",
  "verified-related-resource",
  "exact-county-direct-packet",
  "no-official-resource",
  "selectedPacket",
  "userCounty",
  "PDF route",
  "same-site route",
  "issue-to-resource map",
  "matter ID",
  "data link",
  "runtime",
  "debug",
  "stale context",
  "carried forward",
  "carried into",
  "lead magnet"
];

const rawTokenPattern = /\b(undefined|null|not-applicable)\b|(?:^|\s)(selectedPacket|userCounty)(?:\s|$)/i;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function issueFor(text) {
  const normalized = String(text || "").replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  if (rawTokenPattern.test(normalized)) return "raw-token";
  const lower = normalized.toLowerCase();
  const found = forbiddenTerms.find((term) => {
    if (/^[a-z]+[A-Z]/.test(term) || term.includes("-")) return lower.includes(term.toLowerCase());
    return new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(normalized);
  });
  return found ? `internal-term:${found}` : "";
}

async function visibleTextInventory(page, route, state, viewport) {
  const rows = await page.evaluate(({ route, state, viewport }) => {
    function visible(el) {
      const style = getComputedStyle(el);
      const box = el.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && box.width > 0 && box.height > 0;
    }
    return Array.from(document.body.querySelectorAll("body *"))
      .filter(visible)
      .map((el) => {
        const text = Array.from(el.childNodes)
          .filter((node) => node.nodeType === Node.TEXT_NODE)
          .map((node) => node.textContent.trim())
          .filter(Boolean)
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();
        if (!text) return null;
        return {
          route,
          viewport,
          component: el.tagName.toLowerCase() + (el.className ? `.${String(el.className).split(/\s+/)[0]}` : ""),
          state,
          visibleText: text,
          issueType: "",
          recommendedRewrite: "",
          status: "fixed"
        };
      })
      .filter(Boolean);
  }, { route, state, viewport });
  return rows.map((row) => ({ ...row, issueType: issueFor(row.visibleText) }));
}

async function layoutState(page, label) {
  return page.evaluate((label) => {
    const interactiveSelector = "a[href],button,input,select,textarea,summary,[role='button']";
    const boxes = [];
    const seen = new Set();

    function isVisibleElement(el) {
      const style = getComputedStyle(el);
      const box = el.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && box.width > 0 && box.height > 0;
    }

    function pushBox(owner, rect, text, kind) {
      if (!rect || rect.width <= 0 || rect.height <= 0) return;
      if (rect.bottom < -2 || rect.top > window.innerHeight + 2) return;
      const key = `${kind}:${Math.round(rect.x)}:${Math.round(rect.y)}:${Math.round(rect.width)}:${Math.round(rect.height)}:${text}`;
      if (seen.has(key)) return;
      seen.add(key);
      boxes.push({
        kind,
        text: String(text || "").replace(/\s+/g, " ").trim().slice(0, 120),
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        owner
      });
    }

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.textContent.trim()) return NodeFilter.FILTER_REJECT;
        const parent = node.parentElement;
        if (!parent || !isVisibleElement(parent)) return NodeFilter.FILTER_REJECT;
        if (parent.closest("script,style,noscript,svg,iframe,canvas")) return NodeFilter.FILTER_REJECT;
        if (parent.closest(interactiveSelector)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    let node;
    while ((node = walker.nextNode())) {
      const range = document.createRange();
      range.selectNodeContents(node);
      for (const rect of Array.from(range.getClientRects())) {
        pushBox(node.parentElement, rect, node.textContent, "text");
      }
      range.detach();
    }

    for (const el of Array.from(document.querySelectorAll(interactiveSelector))) {
      if (!isVisibleElement(el)) continue;
      pushBox(el, el.getBoundingClientRect(), el.innerText || el.value || el.getAttribute("aria-label") || el.textContent, "control");
    }

    const meaningfulBoxes = boxes.filter((box) => box.text && box.text.length > 1).slice(0, 260);
    const overlaps = [];
    for (let i = 0; i < meaningfulBoxes.length; i += 1) {
      for (let j = i + 1; j < meaningfulBoxes.length; j += 1) {
        const a = meaningfulBoxes[i];
        const b = meaningfulBoxes[j];
        if (!a.text || !b.text) continue;
        if (a.owner === b.owner || a.owner.contains?.(b.owner) || b.owner.contains?.(a.owner)) continue;
        const x = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
        const y = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
        if (x > 2 && y > 2) overlaps.push({ label, a: { ...a, owner: undefined }, b: { ...b, owner: undefined }, overlapX: x, overlapY: y });
      }
    }

    const clipped = Array.from(document.querySelectorAll("a,button,.button,.pill"))
      .filter(isVisibleElement)
      .filter((el) => !el.matches(".skip-link,.legal-term-help,.scroll-cue"))
      .filter((el) => el.scrollWidth > el.clientWidth + 2 || el.scrollHeight > el.clientHeight + 2)
      .map((el) => ({ label, text: (el.innerText || el.textContent || el.getAttribute("aria-label") || "").replace(/\s+/g, " ").trim(), tag: el.tagName.toLowerCase(), scrollWidth: el.scrollWidth, clientWidth: el.clientWidth, scrollHeight: el.scrollHeight, clientHeight: el.clientHeight }));

    return {
      label,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
      duplicateIds: Array.from(document.querySelectorAll("[id]")).map((el) => el.id).filter((id, index, all) => id && all.indexOf(id) !== index),
      emptyNames: Array.from(document.querySelectorAll(interactiveSelector)).filter((el) => isVisibleElement(el) && !el.closest("[aria-hidden='true'],[hidden],[inert]")).map((el) => ({ tag: el.tagName.toLowerCase(), text: (el.innerText || el.textContent || el.value || el.getAttribute("aria-label") || el.getAttribute("placeholder") || el.getAttribute("title") || "").replace(/\s+/g, " ").trim() })).filter((item) => !item.text),
      positiveTabindex: Array.from(document.querySelectorAll("[tabindex]")).map((el) => el.getAttribute("tabindex")).filter((value) => Number(value) > 0),
      hiddenInteractive: Array.from(document.querySelectorAll(interactiveSelector)).filter((el) => isVisibleElement(el) && (el.getAttribute("aria-hidden") === "true" || el.closest("[hidden],[inert]"))).map((el) => el.outerHTML.slice(0, 120)),
      clipped,
      overlaps: overlaps.slice(0, 20)
    };
  }, label);
}

async function revealAll(page, selector) {
  const button = page.locator(selector).first();
  if (await button.count()) {
    await button.click();
    await page.waitForTimeout(250);
  }
}

async function clickCardAndCollect(page, cardSelector, triggerSelector, index) {
  const card = page.locator(cardSelector).nth(index);
  await card.scrollIntoViewIfNeeded();
  const trigger = card.locator(triggerSelector).first();
  if (await trigger.count()) await trigger.click();
  else await card.click();
  await page.waitForTimeout(200);
}

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const inventory = [];
  const layout = [];
  const screenshots = [];
  const cardResults = { practice: [], guides: [] };
  let viewerState = {};

  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    page.setDefaultTimeout(10000);
    for (const route of routes) {
      console.log(`inventory:${route}`);
      await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded" });
      inventory.push(...await visibleTextInventory(page, route, "initial", "390"));
    }

    console.log("practice:begin");
    await page.goto(`${baseUrl}/practice-areas/`, { waitUntil: "domcontentloaded" });
    await revealAll(page, "[data-service-reveal]");
    const practiceCount = await page.locator("[data-service-card]").count();
    for (let i = 0; i < practiceCount; i += 1) {
      if (i % 10 === 0) console.log(`practice:${i}/${practiceCount}`);
      await clickCardAndCollect(page, "[data-service-card]", "[data-service-detail-toggle]", i);
      const result = await page.evaluate((i) => {
        const card = document.querySelectorAll("[data-service-card]")[i];
        const panel = document.querySelector(".service-row-panel");
        return {
          index: i,
          title: card?.querySelector("h3")?.textContent?.trim() || "",
          subtitle: card?.querySelector("p")?.textContent?.trim() || "",
          revealText: panel?.textContent?.replace(/\s+/g, " ").trim() || "",
          duplicateCtas: (() => {
            const labels = Array.from(panel?.querySelectorAll("a.button,button.button") || []).filter((el) => el.offsetParent !== null).map((el) => el.textContent.trim());
            return labels.filter((label, index, all) => label && all.indexOf(label) !== index);
          })()
        };
      }, i);
      cardResults.practice.push(result);
      inventory.push(...await visibleTextInventory(page, "/practice-areas/", `practice-card-${i}`, "390"));
    }

    console.log("guides:begin");
    await page.goto(`${baseUrl}/guides/`, { waitUntil: "domcontentloaded" });
    await revealAll(page, "[data-guide-reveal]");
    const guideCount = await page.locator("[data-guide-card]").count();
    for (let i = 0; i < guideCount; i += 1) {
      if (i % 10 === 0) console.log(`guides:${i}/${guideCount}`);
      await clickCardAndCollect(page, "[data-guide-card]", "[data-guide-open]", i);
      const result = await page.evaluate((i) => {
        const card = document.querySelectorAll("[data-guide-card]")[i];
        const panel = document.querySelector(".guide-row-panel");
        return {
          index: i,
          title: card?.querySelector("h3")?.textContent?.trim() || "",
          subtitle: card?.querySelector("p")?.textContent?.trim() || "",
          revealText: panel?.textContent?.replace(/\s+/g, " ").trim() || "",
          duplicateCtas: (() => {
            const labels = Array.from(panel?.querySelectorAll("a.button,button.button") || []).filter((el) => el.offsetParent !== null).map((el) => el.textContent.trim());
            return labels.filter((label, index, all) => label && all.indexOf(label) !== index);
          })()
        };
      }, i);
      cardResults.guides.push(result);
      inventory.push(...await visibleTextInventory(page, "/guides/", `guide-card-${i}`, "390"));
    }

    console.log("forms-viewer:begin");
    await page.goto(`${baseUrl}/tools/`, { waitUntil: "domcontentloaded" });
    await page.click('[data-guided-answer="forms"]');
    await page.click('[data-guided-answer="Maricopa"]');
    await page.click('[data-guided-answer="New filing"]');
    await page.click('[data-guided-answer="divorce"]');
    await page.click('[data-guided-answer="minor-children"]');
    inventory.push(...await visibleTextInventory(page, "/tools/", "forms-ready", "390"));
    await page.locator(".official-pdf-link:not([hidden]) [data-official-pdf-preview]").first().click();
    await page.waitForTimeout(500);
    viewerState = await page.evaluate(() => ({
      frameSrc: document.querySelector("[data-official-pdf-frame]")?.getAttribute("src") || "",
      viewerTitle: document.querySelector("[data-official-pdf-viewer-title]")?.textContent?.trim() || "",
      visibleControls: Array.from(document.querySelectorAll("[data-official-pdf-download], [data-official-pdf-source-fallback], [data-official-pdf-viewer-close]")).filter((el) => el.offsetParent !== null).map((el) => el.textContent.trim() || el.getAttribute("aria-label") || "")
    }));
    inventory.push(...await visibleTextInventory(page, "/tools/", "viewer", "390"));

    const layoutScenarios = [
      { route: "/", label: "homepage" },
      { route: "/practice-areas/", label: "practice-grid", setup: async (p) => revealAll(p, "[data-service-reveal]") },
      { route: "/guides/", label: "guide-grid", setup: async (p) => revealAll(p, "[data-guide-reveal]") },
      { route: "/forms/", label: "forms-prereq" },
      { route: "/tools/", label: "forms-ready", setup: async (p) => {
        await p.click('[data-guided-answer="forms"]');
        await p.click('[data-guided-answer="Maricopa"]');
        await p.click('[data-guided-answer="New filing"]');
        await p.click('[data-guided-answer="divorce"]');
        await p.click('[data-guided-answer="minor-children"]');
      } },
      { route: "/fees/", label: "fees" },
      { route: "/contact/", label: "contact" },
      { route: "/start/", label: "start" }
    ];

    for (const width of widths) {
      console.log(`layout:${width}`);
      const p = await browser.newPage({ viewport: { width, height: width < 768 ? 900 : 1000 } });
      p.setDefaultTimeout(10000);
      for (const scenario of layoutScenarios) {
        await p.goto(`${baseUrl}${scenario.route}`, { waitUntil: "domcontentloaded" });
        if (scenario.setup) await scenario.setup(p);
        await p.evaluate(() => {
          window.scrollTo({ top: 0, left: 0, behavior: "instant" });
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
        });
        await p.waitForTimeout(160);
        layout.push(await layoutState(p, `${scenario.label}-${width}`));
      }
      await p.close();
    }

    console.log("screenshots:begin");
    const shotPage = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    shotPage.setDefaultTimeout(10000);
    const shots = [
      ["homepage-desktop", "/", null],
      ["practice-grid", "/practice-areas/", async (p) => revealAll(p, "[data-service-reveal]")],
      ["practice-reveal", "/practice-areas/", async (p) => { await revealAll(p, "[data-service-reveal]"); await clickCardAndCollect(p, "[data-service-card]", "[data-service-detail-toggle]", 0); }],
      ["forms-prereq", "/forms/", null],
      ["forms-ready", "/tools/", async (p) => { await p.click('[data-guided-answer="forms"]'); await p.click('[data-guided-answer="Maricopa"]'); await p.click('[data-guided-answer="New filing"]'); await p.click('[data-guided-answer="divorce"]'); await p.click('[data-guided-answer="minor-children"]'); }],
      ["onsite-viewer", "/tools/", async (p) => { await p.click('[data-guided-answer="forms"]'); await p.click('[data-guided-answer="Maricopa"]'); await p.click('[data-guided-answer="New filing"]'); await p.click('[data-guided-answer="divorce"]'); await p.click('[data-guided-answer="minor-children"]'); await p.locator(".official-pdf-link:not([hidden]) [data-official-pdf-preview]").first().click(); await p.waitForTimeout(500); }],
      ["guide-grid", "/guides/", async (p) => revealAll(p, "[data-guide-reveal]")],
      ["guide-reveal", "/guides/", async (p) => { await revealAll(p, "[data-guide-reveal]"); await clickCardAndCollect(p, "[data-guide-card]", "[data-guide-open]", 0); }],
      ["fees", "/fees/", null],
      ["contact", "/contact/", null],
      ["start", "/start/", null],
      ["footer", "/", async (p) => p.locator("footer").scrollIntoViewIfNeeded()]
    ];
    for (const [name, route, setup] of shots) {
      await shotPage.setViewportSize({ width: name.includes("mobile") ? 390 : 1440, height: name.includes("mobile") ? 844 : 1000 });
      await shotPage.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });
      await shotPage.evaluate(() => sessionStorage.clear());
      await shotPage.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded" });
      if (setup) await setup(shotPage);
      const screenshotPath = path.join(outDir, `${name}.png`);
      await shotPage.screenshot({ path: screenshotPath, fullPage: true });
      screenshots.push(screenshotPath);
    }
    await shotPage.setViewportSize({ width: 390, height: 844 });
    await shotPage.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });
    await shotPage.locator("[data-nav-toggle]").click();
    const mobileMenuPath = path.join(outDir, "mobile-menu.png");
    await shotPage.screenshot({ path: mobileMenuPath, fullPage: true });
    screenshots.push(mobileMenuPath);
    const mobileHomePath = path.join(outDir, "homepage-mobile.png");
    await shotPage.locator("[data-nav-toggle]").click();
    await shotPage.screenshot({ path: mobileHomePath, fullPage: true });
    screenshots.push(mobileHomePath);
    await shotPage.close();
  } finally {
    await browser.close();
  }

  const issues = inventory.filter((row) => row.issueType);
  const layoutFailures = layout.filter((item) => item.horizontalOverflow || item.duplicateIds.length || item.emptyNames.length || item.positiveTabindex.length || item.hiddenInteractive.length || item.clipped.length || item.overlaps.length);
  const practiceFailures = cardResults.practice.filter((item) => !item.title || !item.subtitle || !item.revealText.includes(item.title) || item.duplicateCtas.length);
  const guideFailures = cardResults.guides.filter((item) => !item.title || !item.subtitle || !item.revealText.includes(item.title) || item.duplicateCtas.length);

  fs.writeFileSync(path.join(outDir, "public-text-inventory.json"), JSON.stringify(inventory, null, 2));
  fs.writeFileSync(path.join(outDir, "layout-qa.json"), JSON.stringify(layout, null, 2));
  fs.writeFileSync(path.join(outDir, "card-reveal-qa.json"), JSON.stringify(cardResults, null, 2));
  fs.writeFileSync(path.join(outDir, "screenshot-contact-sheet.html"), `<!doctype html><html><head><meta charset="utf-8"><title>MFLG Final Public QA Contact Sheet</title><style>body{font-family:Arial,sans-serif;margin:24px;background:#f7f4ef;color:#1c2520}img{max-width:100%;border:1px solid #d8d0c5}section{margin:0 0 32px}h2{font-size:18px}</style></head><body><h1>MFLG Final Public QA Contact Sheet</h1>${screenshots.map((file) => `<section><h2>${path.basename(file)}</h2><img src="${path.basename(file)}" alt="${path.basename(file)}"></section>`).join("")}</body></html>`);

  assert(issues.length === 0, `public text inventory has forbidden/internal terms: ${JSON.stringify(issues.slice(0, 10), null, 2)}`);
  assert(cardResults.practice.length === 50, `expected 50 practice cards, got ${cardResults.practice.length}`);
  assert(cardResults.guides.length === 50, `expected 50 DIY guide cards, got ${cardResults.guides.length}`);
  assert(practiceFailures.length === 0, `practice card text QA failed: ${JSON.stringify(practiceFailures.slice(0, 5), null, 2)}`);
  assert(guideFailures.length === 0, `DIY guide text QA failed: ${JSON.stringify(guideFailures.slice(0, 5), null, 2)}`);
  assert(viewerState.frameSrc.startsWith("/api/official-pdf/"), `same-site viewer did not open from ready View form: ${JSON.stringify(viewerState)}`);
  assert(layoutFailures.length === 0, `layout QA failures: ${JSON.stringify(layoutFailures.slice(0, 5), null, 2)}`);

  console.log(JSON.stringify({
    status: "PUBLIC_TEXT_LAYOUT_QA_PASS",
    inventoryRows: inventory.length,
    practiceCards: cardResults.practice.length,
    guideCards: cardResults.guides.length,
    widths,
    screenshots: screenshots.map((file) => path.relative(process.cwd(), file)),
    viewerState
  }, null, 2));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
