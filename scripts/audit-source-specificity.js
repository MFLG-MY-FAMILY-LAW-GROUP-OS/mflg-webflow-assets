const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const readJSON = (file) => JSON.parse(fs.readFileSync(path.join(ROOT, file), "utf8"));
const writeJSON = (file, value) => {
  fs.mkdirSync(path.dirname(path.join(ROOT, file)), { recursive: true });
  fs.writeFileSync(path.join(ROOT, file), `${JSON.stringify(value, null, 2)}\n`);
};

const audit = readJSON("data/unique-route-coverage-audit.json");
const officialHostPatterns = [
  /\.azcourts\.gov$/i,
  /\.maricopa\.gov$/i,
  /superiorcourt\.maricopa\.gov$/i,
  /www\.sc\.pima\.gov$/i,
  /www\.pima\.gov$/i,
  /www\.yavapaiaz\.gov$/i,
  /courts\.yavapaiaz\.gov$/i,
  /www\.cochise\.az\.gov$/i
];

function officialUrl(url) {
  try {
    const host = new URL(url).hostname;
    return officialHostPatterns.some((pattern) => pattern.test(host));
  } catch (_) {
    return false;
  }
}

async function probe(url) {
  if (!url) return { status: 0, content_type: "", ok: false };
  try {
    let response = await fetch(url, { method: "HEAD", redirect: "follow" });
    if (response.status < 200 || response.status >= 400 || response.status === 405 || response.status === 403) {
      response = await fetch(url, { method: "GET", redirect: "follow" });
    }
    return {
      status: response.status,
      content_type: response.headers.get("content-type") || "",
      ok: response.status >= 200 && response.status < 400
    };
  } catch (error) {
    return { status: 0, content_type: "", ok: false, error: error.message };
  }
}

(async () => {
  const uniqueUrls = [...new Set(audit.records.map((record) => record.official_url).filter(Boolean))];
  const probes = [];
  for (const url of uniqueUrls) {
    const result = await probe(url);
    probes.push({
      url,
      official_host: officialUrl(url),
      ...result,
      last_verified_at: new Date().toISOString()
    });
  }

  const probeByUrl = new Map(probes.map((probe) => [probe.url, probe]));
  const records = audit.records.map((record) => {
    const probe = probeByUrl.get(record.official_url) || {};
    return {
      packet_id: record.packet_id,
      classification: record.classification,
      official_url: record.official_url,
      official_host: Boolean(probe.official_host),
      http_status: probe.status || 0,
      content_type: probe.content_type || "",
      source_is_issue_specific: record.classification !== "general-county-forms-index",
      source_is_county_specific: record.county !== "Statewide",
      source_is_statewide: record.county === "Statewide",
      direct_pdf_count: record.verified_pdf_count,
      packet_page_status: record.official_packet_pages > 0 ? "verified" : "not-applicable",
      confidence: record.result_confidence
    };
  });

  const failures = records.filter((record) => !record.official_host || record.http_status < 200 || record.http_status >= 400);
  const generalCoverage = audit.records.filter((record) => record.classification === "general-county-forms-index");

  const output = {
    version: "1.0.0-source-specificity",
    built_at: new Date().toISOString(),
    summary: {
      unique_urls: uniqueUrls.length,
      records: records.length,
      failures: failures.length,
      general_indexes_counted_as_coverage: generalCoverage.length
    },
    probes,
    records,
    failures
  };

  writeJSON("data/source-specificity-audit.json", output);

  if (failures.length) throw new Error(`Source specificity failures:\n${JSON.stringify(failures, null, 2)}`);
  if (generalCoverage.length) throw new Error("General county indexes were counted as route coverage");

  console.log("SOURCE_SPECIFICITY_AUDIT_PASS");
  console.log(JSON.stringify(output.summary, null, 2));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
