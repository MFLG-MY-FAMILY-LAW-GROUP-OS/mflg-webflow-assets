const { chromium } = require("playwright");

const baseUrl = process.env.MFLG_TEST_BASE_URL || "http://127.0.0.1:8787";
const routes = [
  "/",
  "/practice-areas/",
  "/fees/",
  "/guides/",
  "/tools/",
  "/forms/",
  "/calculators/",
  "/about/",
  "/faq/",
  "/contact/",
  "/start/",
  "/privacy/",
  "/terms/",
  "/accessibility/",
  "/client/",
  "/staff/"
];
const viewports = [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "wide", width: 1920, height: 1080 },
  { name: "tablet", width: 820, height: 1180 },
  { name: "mobile", width: 390, height: 844 }
];
const requiredNavLabels = [
  "Practice Areas",
  "Fees",
  "DIY Guides",
  "Forms & Calculators",
  "About",
  "FAQ",
  "Contact",
  "Login",
  "Call 888-870-6354",
  "Start Intake"
];
const blockedText = [
  "packet URLs pending review",
  "packet groups mapped",
  "review queue",
  "candidate packet",
  "PDF candidates found",
  "review-only",
  `Guided intake ${"handoff"}`,
  "CRM OS pending",
  "Client Portal / CRM OS",
  "Staff Access / CRM OS"
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const failures = [];
  try {
    for (const viewport of viewports) {
      const page = await browser.newPage({ viewport });
      for (const route of routes) {
        try {
          await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
          const state = await page.evaluate(({ requiredNavLabels, blockedText, route }) => {
            const main = document.querySelector("#main");
            const header = document.querySelector("[data-header]");
            const nav = document.querySelector("[data-nav]");
            const navText = nav?.textContent || "";
            const bodyText = document.body.innerText || "";
            const anchors = Array.from(document.querySelectorAll("a[href]")).map((link) => ({
              text: (link.textContent || "").trim(),
              href: link.getAttribute("href") || ""
            }));
            const badAnchors = anchors.filter((link) => {
              const href = link.href.trim();
              if (!href || href === "#") return true;
              if (/^(tel:|mailto:|\/|#)/i.test(href)) return false;
              return /^https?:\/\//i.test(href);
            });
            const publicExternalAnchors = badAnchors.filter((link) => /^https?:\/\//i.test(link.href));
            const requiredMissing = requiredNavLabels.filter((label) => !navText.includes(label));
            const blockedFound = blockedText.filter((phrase) => bodyText.toLowerCase().includes(phrase.toLowerCase()));
            const buttons = Array.from(document.querySelectorAll("button, a.button, .nav-cta, .card-link")).map((item) => {
              const rect = item.getBoundingClientRect();
              return {
                text: (item.textContent || "").trim(),
                width: rect.width,
                height: rect.height
              };
            });
            const tooSmallTapTargets = buttons.filter((item) => item.text && (item.width < 36 || item.height < 32));
            return {
              route,
              title: document.title,
              mainTextLength: (main?.innerText || "").trim().length,
              headerHeight: header?.getBoundingClientRect().height || 0,
              navText: navText.trim(),
              requiredMissing,
              blockedFound,
              fakeLinks: badAnchors.filter((link) => link.href.trim() === "#" || !link.href.trim()),
              publicExternalAnchors,
              overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
              horizontalScrollWidth: document.documentElement.scrollWidth,
              viewportWidth: document.documentElement.clientWidth,
              tooSmallTapTargets: tooSmallTapTargets.slice(0, 8),
              hasStartIntake: anchors.some((link) => link.href === "/start" || link.href.startsWith("/start")),
              hasMainHeading: Boolean(main?.querySelector("h1, h2"))
            };
          }, { requiredNavLabels, blockedText, route });

          assert(state.mainTextLength > 100, `${viewport.name} ${route}: main content looks empty`);
          assert(state.hasMainHeading, `${viewport.name} ${route}: missing main heading`);
          assert(state.requiredMissing.length === 0, `${viewport.name} ${route}: nav missing ${state.requiredMissing.join(", ")}`);
          assert(state.fakeLinks.length === 0, `${viewport.name} ${route}: fake links found ${JSON.stringify(state.fakeLinks)}`);
          assert(state.publicExternalAnchors.length === 0, `${viewport.name} ${route}: public external anchors found ${JSON.stringify(state.publicExternalAnchors)}`);
          assert(state.blockedFound.length === 0, `${viewport.name} ${route}: blocked public text found ${state.blockedFound.join(", ")}`);
          assert(!state.overflow, `${viewport.name} ${route}: horizontal overflow ${state.horizontalScrollWidth}/${state.viewportWidth}`);
          assert(state.hasStartIntake || route === "/staff/", `${viewport.name} ${route}: missing Start Intake path`);
          if (viewport.name === "mobile") {
            await page.click("[data-nav-toggle]");
            const mobileNavOpen = await page.evaluate(() => ({
              expanded: document.querySelector("[data-nav-toggle]")?.getAttribute("aria-expanded"),
              navVisible: getComputedStyle(document.querySelector("[data-nav]")).display !== "none"
            }));
            assert(mobileNavOpen.expanded === "true", `${viewport.name} ${route}: menu did not expand`);
            assert(mobileNavOpen.navVisible, `${viewport.name} ${route}: menu not visible after expand`);
          }
        } catch (error) {
          failures.push(error.message);
        }
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }

  if (failures.length) {
    console.error("PUBLIC_COMPLETION_AUDIT_FAILED");
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }
  console.log("PUBLIC_COMPLETION_AUDIT_PASS");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
