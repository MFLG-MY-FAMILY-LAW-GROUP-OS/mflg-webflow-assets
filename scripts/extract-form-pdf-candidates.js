#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const root = path.resolve(__dirname, "..");
const extractedAt = new Date().toISOString();

function readJSON(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function writeJSON(relativePath, value) {
  fs.writeFileSync(path.join(root, relativePath), `${JSON.stringify(value, null, 2)}\n`);
}

function cleanText(value) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#xA0;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function fileNameFromUrl(url) {
  const pathname = new URL(url).pathname;
  return pathname.split("/").filter(Boolean).pop() || "official-form.pdf";
}

function languageFor(label, url) {
  const labelValue = label.toLowerCase();
  const fileBase = fileNameFromUrl(url).toLowerCase().replace(/\.pdf(?:\?.*)?$/, "");
  if (labelValue.includes("spanish") || labelValue.includes("descargar")) return "Spanish";
  if (labelValue.includes("english") || labelValue.includes("download")) return "English";
  if (/(sp|fsz|psz|s)$/.test(fileBase) && !fileBase.endsWith("process")) return "Spanish";
  if (fileNameFromUrl(url).toLowerCase().endsWith(".pdf")) return "English";
  return "Unknown";
}

async function fetchBuffer(url) {
  const response = await fetch(url, {
    redirect: "follow",
    headers: {
      "user-agent": "MY FAMILY LAW GROUP PLLC source monitor; public planning tools"
    }
  });
  const buffer = Buffer.from(await response.arrayBuffer());
  return { response, buffer };
}

async function main() {
  const reviewQueue = readJSON("data/form-review-queue.json");
  const allowedPages = (reviewQueue.queue || [])
    .filter((item) => item.public_action_status === "open_official_page_allowed")
    .map((item) => ({
      review_id: item.review_id,
      packet_id: item.packet_id,
      packet_label: item.packet_label,
      page_label: item.candidate_label,
      page_url: item.candidate_url
    }));

  const pdfCandidates = [];
  for (const page of allowedPages) {
    const { response, buffer } = await fetchBuffer(page.page_url);
    if (!response.ok) continue;
    const html = buffer.toString("utf8");
    const links = [...html.matchAll(/<a\b[^>]*href=["']([^"']+\.pdf(?:\?[^"']*)?)["'][^>]*>([\s\S]*?)<\/a>/gi)]
      .map((match) => {
        const pdfUrl = new URL(match[1], page.page_url).href;
        const label = cleanText(match[2]) || fileNameFromUrl(pdfUrl);
        return {
          review_id: page.review_id,
          packet_id: page.packet_id,
          packet_label: page.packet_label,
          page_label: page.page_label,
          page_url: page.page_url,
          pdf_label: label,
          pdf_url: pdfUrl,
          file_name: fileNameFromUrl(pdfUrl),
          language: languageFor(label, pdfUrl),
          review_status: "pdf_needs_human_review",
          public_pdf_action_enabled: false,
          direct_cached_download_enabled: false
        };
      });
    pdfCandidates.push(...links);
  }

  const unique = [];
  const seen = new Set();
  for (const item of pdfCandidates) {
    const key = `${item.packet_id}:${item.pdf_url}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
  }

  const monitored = [];
  for (const item of unique) {
    const startedAt = Date.now();
    try {
      const { response, buffer } = await fetchBuffer(item.pdf_url);
      monitored.push({
        ...item,
        checked_at: extractedAt,
        source_status: response.ok ? "pdf_source_ok" : "pdf_source_broken",
        http_status: response.status,
        final_url: response.url,
        content_type: response.headers.get("content-type"),
        content_length: buffer.length,
        last_modified: response.headers.get("last-modified"),
        etag: response.headers.get("etag"),
        sha256: crypto.createHash("sha256").update(buffer).digest("hex"),
        elapsed_ms: Date.now() - startedAt
      });
    } catch (error) {
      monitored.push({
        ...item,
        checked_at: extractedAt,
        source_status: "pdf_source_broken",
        http_status: null,
        error: error.message,
        elapsed_ms: Date.now() - startedAt
      });
    }
  }

  const candidateReport = {
    version: "0.6.0-pdf-candidates",
    extracted_at: extractedAt,
    public_safety: {
      public_pdf_actions_enabled: false,
      direct_cached_downloads_enabled: false,
      sensitive_public_collection_enabled: false
    },
    summary: {
      packet_pages_checked: allowedPages.length,
      total_pdf_candidates: unique.length,
      public_pdf_actions_enabled: false
    },
    candidates: unique
  };

  const monitorReport = {
    version: "0.6.0-pdf-monitoring",
    checked_at: extractedAt,
    public_safety: {
      public_pdf_actions_enabled: false,
      direct_cached_downloads_enabled: false,
      promote_only_after_human_review: true
    },
    summary: {
      total_pdf_candidates: monitored.length,
      pdf_source_ok: monitored.filter((item) => item.source_status === "pdf_source_ok").length,
      pdf_source_broken: monitored.filter((item) => item.source_status === "pdf_source_broken").length,
      public_pdf_actions_enabled: false
    },
    results: monitored
  };

  writeJSON("data/form-pdf-candidates.json", candidateReport);
  writeJSON("data/form-pdf-monitoring-report.json", monitorReport);

  console.log(`Extracted ${unique.length} official PDF candidates from ${allowedPages.length} packet pages; ${monitorReport.summary.pdf_source_ok} ok, ${monitorReport.summary.pdf_source_broken} broken.`);
  if (monitorReport.summary.pdf_source_broken) {
    process.exitCode = 2;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
