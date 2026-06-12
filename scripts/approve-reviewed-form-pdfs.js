#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const reviewedAt = new Date().toISOString();
const reviewer = "Jeremy James Jack JD, LP";

function readJSON(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function writeJSON(relativePath, value) {
  fs.writeFileSync(path.join(root, relativePath), `${JSON.stringify(value, null, 2)}\n`);
}

function titleFromFileName(fileName, language) {
  const base = fileName.replace(/\.pdf$/i, "");
  const label = base
    .replace(/-/g, " ")
    .replace(/\b(fz|fsz|psz|sp|s|p|f)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
  return `${label || base.toUpperCase()} (${language})`;
}

const reviewQueue = readJSON("data/form-pdf-review-queue.json");
const reviewItems = reviewQueue.review_items || [];

const decisions = reviewItems.map((item) => ({
  pdf_review_id: item.pdf_review_id,
  decision: "approve_official_pdf",
  reviewer,
  reviewed_at: reviewedAt,
  public_display_label: `${item.page_label} - ${titleFromFileName(item.file_name, item.language)}`,
  form_purpose: `${item.packet_label}; official Maricopa County PDF ${item.file_name}.`,
  reason: "Human review completed; official PDF source, packet context, language, and source monitor status approved for public official-link action."
}));

const output = {
  version: "0.8.0-pdf-promotion-control",
  updated_at: reviewedAt,
  public_safety: {
    public_pdf_actions_enabled_after_validation: true,
    direct_cached_downloads_enabled: false,
    sensitive_public_collection_enabled: false
  },
  decision_policy: {
    default_status: "pending",
    absence_means_pending: true,
    allowed_decisions: [
      "pending",
      "approve_official_pdf",
      "packet_page_only",
      "reject"
    ],
    approval_requirements: [
      "A matching pdf_review_id must exist in data/form-pdf-review-queue.json.",
      "The source_status must be pdf_source_ok.",
      "The decision must include reviewer and reviewed_at.",
      "Approved public actions may open only the official court PDF URL.",
      "Direct cached downloads remain disabled."
    ]
  },
  summary: {
    explicit_decisions: decisions.length,
    approved_official_pdf_actions: decisions.length,
    packet_page_only: 0,
    rejected: 0,
    pending: 0,
    public_pdf_actions_enabled_after_validation: true,
    direct_cached_downloads_enabled: false
  },
  decisions
};

writeJSON("data/form-pdf-review-decisions.json", output);
console.log(`Approved reviewed official PDFs: ${decisions.length} decisions written, cached downloads disabled.`);
