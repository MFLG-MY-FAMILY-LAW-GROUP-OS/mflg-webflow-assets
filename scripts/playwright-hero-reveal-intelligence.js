const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const baseUrl = process.env.MFLG_TEST_BASE_URL || "http://127.0.0.1:4173";
const widths = [320, 360, 390, 430, 768, 1024, 1280, 1365, 1440, 1536, 1728, 1920];
const highRisk = [
  ["Relocation", /parenting plan|notice|deadline|hearing|agree|disputed/i, /broad parenting packet\s+first/i],
  ["Child Support Establishment", /income|childcare|insurance|parenting-time days|arrears/i, /divorce packet\s+as primary/i],
  ["Temporary Orders", /case already filed|temporary relief|hearing|deadline/i, /generic family packet\s+first/i],
  ["Consent Decrees", /both parties agree|children|property|debts|support|maintenance/i, /contested divorce packet\s+as primary/i],
  ["Adoption / Family Formation Review", /adult|minor|stepchild|relative|DCS|consent|ICWA/i, /parenting[\s,]+guardianship[\s,]+paternity[\s,]+or general family-law packets/i],
  ["Enforcement of Existing Orders", /order exists|not being followed|enforcement\s+.+rather than modification/i, /modification\s+packet\s+unless change is selected/i],
  ["Modification of Existing Orders", /order exists|what changed|enforcement is a separate issue/i, /enforcement\s+packet\s+unless noncompliance is selected/i],
  ["Paternity / Parentage", /paternity|parentage|DNA|acknowledgment|support/i, /parenting packet\s+before parentage status/i],
  ["Property & Debt Division", /division|enforcement|disclosure|settlement|post-decree/i, /unrelated divorce packet/i],
  ["Protective Orders / Safety Terms", /safety|children|hearing|emergency|protective-order/i, /ordinary family packet as safety answer/i]
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function openAllPracticeCards(page) {
  await page.goto(`${baseUrl}/practice-areas/`, { waitUntil: "networkidle" });
  const reveal = page.locator("[data-service-reveal]").first();
  if (await reveal.isVisible().catch(() => false)) await reveal.click();
  await page.waitForFunction(() => Array.from(document.querySelectorAll("[data-service-card]")).every((card) => !card.hidden));
}

async function openPractice(page, title) {
  await page.evaluate((targetTitle) => {
    const card = Array.from(document.querySelectorAll("[data-service-card]")).find((item) => item.dataset.serviceTitle === targetTitle.toLowerCase());
    card?.scrollIntoView({ block: "center" });
    card?.querySelector("[data-service-detail-toggle]")?.click();
  }, title);
  await page.locator(".service-row-panel").waitFor({ state: "visible" });
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const outDir = path.join(process.cwd(), "reports", "hero-reveal-intelligence");
  fs.mkdirSync(outDir, { recursive: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await openAllPracticeCards(page);
    assert(await page.locator("[data-service-card]").count() === 50, "Practice Area count is not 50");
    for (let index = 0; index < 50; index += 1) {
      await openAllPracticeCards(page);
      const title = await page.evaluate((cardIndex) => {
        const card = Array.from(document.querySelectorAll("[data-service-card]"))[cardIndex];
        const titleText = card?.querySelector("h3")?.textContent?.trim() || "";
        card?.scrollIntoView({ block: "center" });
        card?.querySelector("[data-service-detail-toggle]")?.click();
        return titleText;
      }, index);
      await page.locator(".service-row-panel").waitFor({ state: "visible" });
      const text = await page.locator(".service-row-panel").innerText();
      assert(text.includes(title), `${title}: reveal heading does not carry selected issue`);
      assert(/Find the right forms|Ask for office review|Use calculator|Understand the steps/i.test(text), `${title}: useful reveal options missing`);
      assert(!/^View form$/im.test(text), `${title}: View form appears before prerequisites`);
      assert(!/Open matched forms|View matched forms/i.test(text), `${title}: matched forms appear before prerequisites`);
      assert(/You are|You need|You may|You have|An existing|Safety-sensitive/i.test(text), `${title}: issue-specific problem statement missing`);
    }

    await page.goto(`${baseUrl}/guides/`, { waitUntil: "networkidle" });
    const guideReveal = page.locator("[data-guide-reveal]").first();
    if (await guideReveal.isVisible().catch(() => false)) await guideReveal.click();
    await page.waitForFunction(() => Array.from(document.querySelectorAll("[data-guide-card]")).every((card) => !card.hidden));
    assert(await page.locator("[data-guide-card]").count() === 50, "DIY Guide count is not 50");
    for (let index = 0; index < 50; index += 1) {
      await page.goto(`${baseUrl}/guides/`, { waitUntil: "networkidle" });
      const revealAgain = page.locator("[data-guide-reveal]").first();
      if (await revealAgain.isVisible().catch(() => false)) await revealAgain.click();
      const title = await page.evaluate((cardIndex) => {
        const card = Array.from(document.querySelectorAll("[data-guide-card]"))[cardIndex];
        const titleText = card?.querySelector("h3")?.textContent?.trim() || "";
        card?.scrollIntoView({ block: "center" });
        card?.querySelector("[data-guide-open]")?.click();
        return titleText;
      }, index);
      await page.locator(".guide-row-panel").waitFor({ state: "visible" });
      const text = await page.locator(".guide-row-panel").innerText();
      assert(text.includes(title), `${title}: guide reveal heading does not carry selected issue`);
      assert(/Find forms|Use calculator|Understand the steps|Ask for office review/i.test(text), `${title}: guide-specific actions missing`);
      assert(!/^View form$/im.test(text), `${title}: guide View form appears before prerequisites`);
      assert(/You are|You need|You may|You have|An existing|Safety-sensitive/i.test(text), `${title}: guide problem statement missing`);
    }

    await openAllPracticeCards(page);
    for (const [title, expected, forbidden] of highRisk) {
      await openPractice(page, title);
      await page.locator('.service-row-panel [data-service-action="forms"]').first().click();
      const text = await page.locator('.service-row-panel [data-service-panel-section="forms"]').innerText();
      assert(expected.test(text), `${title}: expected high-risk qualifier missing`);
      assert(forbidden.test(text), `${title}: disallowed broad-packet warning missing`);
      assert(!/^View form$/im.test(text), `${title}: View form appears before high-risk qualifiers`);
    }

    await page.goto(`${baseUrl}/forms/`, { waitUntil: "networkidle" });
    const formsText = await page.locator("body").innerText();
    assert(/Choose issue|question|answer/i.test(formsText), "Forms direct path does not show question/readiness language");

    await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });
    const heroInfo = await page.evaluate(async () => {
      const videos = Array.from(document.querySelectorAll(".hero-video"));
      await Promise.all(videos.map((video) => video.readyState >= 2 ? Promise.resolve() : new Promise((resolve) => video.addEventListener("canplay", resolve, { once: true }))));
      return {
        count: videos.length,
        crossfade: videos.every((video) => video.dataset.videoLoop === "crossfade video loop"),
        duration: videos[0]?.duration || 0
      };
    });
    assert(heroInfo.count === 2 && heroInfo.crossfade && heroInfo.duration > 1, "Hero crossfade video loop is not active");

    for (const width of widths) {
      await page.setViewportSize({ width, height: width < 500 ? 844 : 1000 });
      await page.goto(`${baseUrl}/practice-areas/`, { waitUntil: "domcontentloaded" });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
      assert(!overflow, `Horizontal overflow at ${width}px`);
    }

    const raw = fs.readFileSync(path.join(process.cwd(), "index.html"), "utf8");
    assert(/Find the Right Arizona Family Law Starting Point/.test(raw), "Raw fallback lead-magnet heading missing");
    for (const label of ["Find forms", "Use calculator", "Read DIY guide", "Office review", "Browse Practice Areas", "Start Intake"]) {
      assert(raw.includes(label), `Raw fallback action missing: ${label}`);
    }

    await page.screenshot({ path: path.join(outDir, "hero-reveal-intelligence.png"), fullPage: true });
    console.log("HERO_REVEAL_INTELLIGENCE_PASS practice=50 guides=50 highRisk=10 responsive=12");
  } finally {
    await browser.close();
  }
})();
