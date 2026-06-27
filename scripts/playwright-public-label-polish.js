const { chromium } = require("playwright");

const baseUrl = process.env.MFLG_TEST_BASE_URL || "http://127.0.0.1:8787";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 900 } });

    await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
    const home = await page.evaluate(() => {
      const visible = (el) => !!(el && (el.offsetWidth || el.offsetHeight || el.getClientRects().length)) && getComputedStyle(el).visibility !== "hidden";
      return {
        headings: Array.from(document.querySelectorAll("h1,h2,h3,.eyebrow")).filter(visible).map((el) => el.textContent.trim().replace(/\s+/g, " ")),
        text: document.body.innerText.replace(/\s+/g, " ").trim()
      };
    });
    const startHereCount = home.headings.filter((item) => item === "Start here").length;
    assert(startHereCount === 1, `Homepage should expose one Start here heading, got ${startHereCount}: ${home.headings.join(" / ")}`);
    assert(home.headings.includes("Pick a path"), "Homepage task-card eyebrow should be Pick a path");

    await page.goto(`${baseUrl}/practice-areas/`, { waitUntil: "networkidle" });
    const practice = await page.evaluate(() => {
      const text = document.body.innerText.replace(/\s+/g, " ").trim();
      return {
        text,
        previousNext: Array.from(document.querySelectorAll(".section-switcher-link")).map((link) => ({
          text: link.textContent.replace(/\s+/g, " ").trim(),
          label: link.getAttribute("aria-label") || ""
        })),
        note: document.querySelector("[data-service-note]")?.textContent?.trim().replace(/\s+/g, " ") || ""
      };
    });
    assert(!/PreviousHome|NextFees|NextForms/.test(practice.text), `Section navigator label is mashed: ${practice.text.match(/PreviousHome|NextFees|NextForms/)}`);
    assert(practice.previousNext.every((item) => /^(Previous|Next): /.test(item.label)), `Section navigator links need clear labels: ${JSON.stringify(practice.previousNext)}`);
    assert(!/attorney review or another professional/i.test(practice.note), `Practice note still uses old attorney-review wording: ${practice.note}`);
    assert(/different professional or closer review/i.test(practice.note), `Practice note missing public replacement: ${practice.note}`);

    await page.goto(`${baseUrl}/forms/`, { waitUntil: "networkidle" });
    const forms = await page.evaluate(() => {
      const text = document.body.innerText.replace(/\s+/g, " ").trim();
      const visible = (el) => !!(el && (el.offsetWidth || el.offsetHeight || el.getClientRects().length)) && getComputedStyle(el).visibility !== "hidden";
      return {
        text,
        lanes: Array.from(document.querySelectorAll("[data-smart-lane]")).filter(visible).map((link) => link.textContent.replace(/\s+/g, " ").trim())
      };
    });
    const forbidden = /Find forms Open form finder|Calculator Use a calculator|DIY guide Read a DIY guide|Help me choose Check deadline path|Guided Intake Start Guided Intake|Find forms Find forms|Help me choose Help me choose/;
    assert(!forbidden.test(forms.text), `Forms entry lane still has redundant label/title copy: ${forms.text.match(forbidden)}`);
    assert(forms.lanes.includes("Forms Open form finder"), `Forms lane label should be category-only: ${forms.lanes.join(" / ")}`);
    assert(forms.lanes.includes("Numbers Use calculator"), `Calculator lane label should be category-only: ${forms.lanes.join(" / ")}`);
    assert(forms.lanes.includes("Deadline Check deadline path"), `Deadline lane label should be category-only: ${forms.lanes.join(" / ")}`);
    assert(forms.lanes.includes("Office review Start Guided Intake"), `Intake lane label should be category-only: ${forms.lanes.join(" / ")}`);
  } finally {
    await browser.close();
  }
  console.log("PUBLIC_LABEL_POLISH_PASS");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
