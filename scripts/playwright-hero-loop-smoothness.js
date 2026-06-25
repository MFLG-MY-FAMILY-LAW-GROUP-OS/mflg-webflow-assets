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
    const decodedBlendSamples = blendSamples.filter((sample) => sample.videos.every((video) => video.readyState >= 2));
    const preRolledSwap = swaps.some((swap) => {
      const next = swap.videos.find((video) => video.layer === swap.to);
      return next && next.currentTime > 0.18 && next.readyState >= 2 && !next.paused;
    });

    const result = {
      swaps: swaps.length,
      blendSamples: blendSamples.length,
      decodedBlendSamples: decodedBlendSamples.length,
      preRolledSwap,
      first: samples[0],
      swap: swaps[0] || null,
      final: samples[samples.length - 1]
    };

    assert(samples[0].videos.length === 2, "hero must use two video layers");
    assert(samples[0].videos.every((video) => video.loopGuard === "true" && video.nativeLoop === false), "native video loop must stay disabled");
    assert(swaps.length >= 1, "hero video did not swap layers during the loop window");
    assert(preRolledSwap, "next hero video layer was not pre-rolled before crossfade");
    assert(blendSamples.length >= 5, "hero loop did not produce enough crossfade blend samples");
    assert(decodedBlendSamples.length >= 3, "hero loop blend did not stay decoded during crossfade");

    console.log("HERO_LOOP_SMOOTHNESS_PASS");
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
