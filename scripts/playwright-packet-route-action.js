const { chromium } = require("playwright");

const baseUrl = process.env.MFLG_TEST_BASE_URL || "http://127.0.0.1:8787";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const fixtureHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Packet Route Action Fixture</title>
  </head>
  <body>
    <header data-header>
      <a class="brand" href="/">MFLG</a>
      <button type="button" data-nav-toggle aria-expanded="false">Menu</button>
      <nav data-nav><a href="/tools">Forms & Calculators</a></nav>
    </header>
    <section data-form-route-actions></section>
    <section data-official-pdf-actions></section>
    <main data-page-root></main>
    <script src="/js/mflg-public-site.js"></script>
  </body>
</html>`;

async function newFixturePage(browser, publicAnswers = {}) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.route(`${baseUrl}/packet-route-action-fixture/`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/html; charset=utf-8",
      body: fixtureHtml
    });
  });
  await page.addInitScript((answers) => {
    if (window.top !== window) return;
    sessionStorage.clear();
    if (answers) sessionStorage.setItem("mflgPublicAnswers", JSON.stringify(answers));
  }, publicAnswers);
  await page.goto(`${baseUrl}/packet-route-action-fixture/`, { waitUntil: "networkidle" });
  await page.locator("[data-route-action-pdf-focus]").first().waitFor({ state: "attached", timeout: 15000 });
  await page.waitForTimeout(100);
  return page;
}

async function clickFirstPdfFocus(page, targetPacket = "maricopa-divorce-new-with-children") {
  const packetId = await page.evaluate((packetId) => {
    const link = document.querySelector(`[data-route-action-pdf-focus="${packetId}"]`) || document.querySelector("[data-route-action-pdf-focus]");
    const card = link?.closest("details");
    if (card) {
      card.hidden = false;
      card.open = true;
    }
    link?.click();
    return link?.getAttribute("data-route-action-pdf-focus") || "";
  }, targetPacket);
  await page.waitForTimeout(500);
  return page.evaluate((fallbackPacketId) => window.MFLGLatestFormsRoute?.pdfPacket || fallbackPacketId || "", packetId);
}

async function readState(page) {
  return page.evaluate(() => ({
    publicAnswers: JSON.parse(sessionStorage.getItem("mflgPublicAnswers") || "{}"),
    formsRoute: JSON.parse(sessionStorage.getItem("mflgFormsRouteContext") || "{}"),
    latestRoute: window.MFLGLatestFormsRoute || {},
    sameSitePdfLinks: Array.from(document.querySelectorAll(".official-pdf-source"))
      .filter((item) => !!(item.offsetWidth || item.offsetHeight || item.getClientRects().length))
      .map((item) => item.getAttribute("href") || ""),
    externalPdfHrefs: Array.from(document.querySelectorAll(".official-pdf-source, [data-official-pdf-download], [data-forms-packet-view], [data-forms-packet-download]"))
      .map((item) => item.getAttribute("href") || item.dataset.sitePdfViewUrl || "")
      .filter((href) => /^https?:\/\//i.test(href)),
    previewVisible: Boolean(document.querySelector("[data-official-pdf-preview]")),
    intakeLinks: Array.from(document.querySelectorAll("[data-official-pdf-item-intake], [data-route-action-card-intake], [data-route-action-intake]"))
      .filter((item) => !!(item.offsetWidth || item.offsetHeight || item.getClientRects().length))
      .map((item) => ({
        text: item.textContent.trim(),
        primary: item.classList.contains("primary"),
        href: item.getAttribute("href") || ""
      }))
	  }));
}

async function runPacketScenario(browser, publicAnswers, targetPacket = "maricopa-consent-decree-agreement") {
  const page = await newFixturePage(browser, publicAnswers);
  const selectedPacket = await clickFirstPdfFocus(page, targetPacket);
  const state = await readState(page);
  await page.close();
  return { selectedPacket, state };
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    let result = await runPacketScenario(browser, {
      county: "Pima",
      issue: "parenting",
      posture: "Existing order",
      children: "minor-children",
      selectedPacket: "pima-notice-of-intent-to-relocate",
      sourcePathway: "confirmed-test",
      confirmedFields: { county: true, issue: true, posture: true, children: true, selectedPacket: true },
      fieldSources: { county: "seed", issue: "seed", posture: "seed", children: "seed", selectedPacket: "seed" }
    }, "maricopa-consent-decree-agreement");
    let { selectedPacket, state } = result;
    assert(selectedPacket, "route-action fixture did not expose a packet focus action");
    assert(state.publicAnswers.county === "Pima", "packet action overwrote confirmed canonical county");
    assert(state.publicAnswers.issue === "parenting", "packet action overwrote confirmed canonical issue");
    assert(state.publicAnswers.posture === "Existing order", "packet action overwrote confirmed canonical posture");
    assert(state.publicAnswers.children === "minor-children", "packet action overwrote confirmed canonical children");
    assert(state.publicAnswers.selectedPacket === selectedPacket, "explicit packet action did not confirm selected packet");
    assert(state.publicAnswers.packetSourceCounty === "Maricopa", `packet source county not preserved separately, got ${state.publicAnswers.packetSourceCounty || ""}`);
    assert(state.publicAnswers.confirmedFields?.selectedPacket === true, "explicit packet action did not record packet provenance");
    assert(state.publicAnswers.confirmedFields?.county === true, "packet metadata downgraded confirmed county provenance");
    assert(state.latestRoute.pdfPacket === selectedPacket, `packet action did not update latest route with focused packet: selected=${selectedPacket} stored=${state.formsRoute.pdfPacket || ""} latest=${state.latestRoute.pdfPacket || ""}`);
    assert(state.sameSitePdfLinks.length > 0, "packet action did not leave same-site PDF links visible");
    assert(state.sameSitePdfLinks.every((href) => href.startsWith("/api/official-pdf/")), `non same-site PDF link rendered: ${state.sameSitePdfLinks.join(", ")}`);
    assert(state.externalPdfHrefs.length === 0, `external public PDF hrefs rendered: ${state.externalPdfHrefs.join(", ")}`);
    assert(state.previewVisible, "optional PDF preview action missing");
    assert(state.intakeLinks.length > 0, "secondary Intake links missing");

    result = await runPacketScenario(browser, {}, "maricopa-consent-decree-agreement");
    state = result.state;
    assert(state.latestRoute.county !== "Maricopa", "packet action manufactured Maricopa without confirmed county");
    assert(state.publicAnswers.county !== "Maricopa", "packet action manufactured canonical Maricopa without confirmed county");
    assert(state.publicAnswers.packetSourceCounty === "Maricopa", "packet action did not preserve Maricopa as packet source metadata");
    assert(state.publicAnswers.confirmedFields?.selectedPacket === true, "packet action did not confirm packet when county missing");
    assert(!state.publicAnswers.confirmedFields?.county, "packet source county became a confirmed user county");
    assert(state.latestRoute.posture !== "New filing", "packet action manufactured New filing without confirmed posture");
    assert(state.latestRoute.issue !== "all", "packet action manufactured issue all as route answer");
    assert(state.latestRoute.sourcePathway === "packet-metadata", "packet action did not mark packet metadata source");
    assert(state.latestRoute.children !== "any" || state.latestRoute.sourcePathway === "packet-metadata", "packet action manufactured children any without packet metadata source");
    assert(state.sameSitePdfLinks.every((href) => href.startsWith("/api/official-pdf/")), "same-site PDF protection failed after unconfirmed packet action");
    assert(state.externalPdfHrefs.length === 0, `external public PDF hrefs rendered after unconfirmed packet action: ${state.externalPdfHrefs.join(", ")}`);

    result = await runPacketScenario(browser, {
      county: "Maricopa",
      issue: "divorce",
      posture: "Finalizing agreement",
      children: "any",
      confirmedFields: { county: true, issue: true, posture: true, children: true },
      fieldSources: { county: "seed", issue: "seed", posture: "seed", children: "seed" }
    }, "maricopa-consent-decree-agreement");
    state = result.state;
    assert(state.publicAnswers.county === "Maricopa", "confirmed Maricopa county was not preserved");
    assert(state.publicAnswers.confirmedFields?.county === true, "confirmed Maricopa provenance was not preserved");

    result = await runPacketScenario(browser, {
      county: "Not sure",
      explicitUnknownFields: { county: true },
      confirmedFields: { county: true },
      fieldSources: { county: "forms-router" }
    }, "maricopa-consent-decree-agreement");
    state = result.state;
    assert(state.publicAnswers.county === "Not sure", "explicit unknown county was replaced by packet metadata");
    assert(state.publicAnswers.explicitUnknownFields?.county === true, "explicit unknown provenance was lost");

    result = await runPacketScenario(browser, {
      county: "",
      resetFields: { county: true },
      fieldSources: { county: "forms-router-reset" }
    }, "maricopa-consent-decree-agreement");
    state = result.state;
    assert(state.publicAnswers.county !== "Maricopa", "packet source rehydrated reset county");
    assert(state.publicAnswers.resetFields?.county === true, "packet source cleared reset tombstone");
  } finally {
    await browser.close();
  }
  console.log("PACKET_ROUTE_ACTION_PASS");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
