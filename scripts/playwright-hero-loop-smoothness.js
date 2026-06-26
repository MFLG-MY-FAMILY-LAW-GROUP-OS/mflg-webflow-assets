const { chromium } = require("playwright");

const baseUrl = process.env.MFLG_TEST_BASE_URL || "http://127.0.0.1:4175";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".hero-video");

    const samples = [];
    const startedAt = Date.now();
    for (let i = 0; i < 115; i += 1) {
      samples.push(await page.evaluate((t0) => ({
        t: (Date.now() - t0) / 1000,
        videos: Array.from(document.querySelectorAll(".hero-video")).map((video) => ({
          layer: video.dataset.heroVideoLayer,
          active: video.classList.contains("is-active"),
          currentTime: video.currentTime,
          duration: video.duration,
          readyState: video.readyState,
          paused: video.paused,
          opacity: Number(getComputedStyle(video).opacity),
          transition: getComputedStyle(video).transitionProperty,
          videoLoop: video.dataset.videoLoop,
          loopGuard: video.dataset.loopGuard,
          nativeLoop: video.loop
        }))
      }), startedAt));
      await page.waitForTimeout(200);
    }

    const activeLayers = samples.map((sample) => sample.videos.find((video) => video.active)?.layer).filter(Boolean);
    const swaps = [];
    for (let i = 1; i < activeLayers.length; i += 1) {
      if (activeLayers[i] !== activeLayers[i - 1]) swaps.push({ sample: i, t: samples[i].t, from: activeLayers[i - 1], to: activeLayers[i], videos: samples[i].videos });
    }
    const blendSamples = samples.filter((sample) => sample.videos.some((video) => video.opacity > 0 && video.opacity < 1));
    const decodedMatchedSwap = swaps.some((swap) => {
      const next = swap.videos.find((video) => video.layer === swap.to);
      const previous = swap.videos.find((video) => video.layer === swap.from);
      return next &&
        previous &&
        next.currentTime >= 0 &&
        next.currentTime <= 0.3 &&
        next.readyState >= 2 &&
        previous.currentTime >= 16.85 &&
        previous.readyState >= 2;
    });

    const result = {
      swaps: swaps.length,
      blendSamples: blendSamples.length,
      decodedMatchedSwap,
      first: samples[0],
      swap: swaps[0] || null,
      final: samples[samples.length - 1]
    };

    assert(samples[0].videos.length === 2, "hero must use two video layers");
    assert(samples[0].videos.every((video) => video.videoLoop === "matched-cut video loop"), "hero must use the matched-cut loop mode");
    assert(samples[0].videos.every((video) => video.loopGuard === "true" && video.nativeLoop === false), "native video loop must stay disabled");
    assert(samples[0].videos.every((video) => video.transition === "none" || video.transition === "all"), "hero video opacity fade must stay disabled");
    assert(swaps.length >= 1, "hero video did not swap layers during the loop window");
    assert(decodedMatchedSwap, "next hero video layer was not decoded at the matched loop start");
    assert(blendSamples.length <= 1, "hero loop should not visibly fade between layers");

    console.log("HERO_LOOP_SMOOTHNESS_PASS");
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
