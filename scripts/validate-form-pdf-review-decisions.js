#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const allowedDecisions = new Set(["pending", "approve_official_pdf", "packet_page_only", "reject"]);

function readJSON(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

function requireValue(record, field, errors) {
  if (typeof record[field] !== "string" || !record[field].trim()) {
    errors.push(`${field} is required`);
  }
}

function requireReviewedFields(record, errors) {
  requireValue(record, "reviewer", errors);
  requireValue(record, "reviewed_at", errors);
  requireValue(record, "reason", errors);
  if (record.reviewed_at && Number.isNaN(Date.parse(record.reviewed_at))) {
    errors.push("reviewed_at must be an ISO-compatible date string");
  }
}

const reviewQueue = readJSON("data/form-pdf-review-queue.json");
const decisionsFile = readJSON("data/form-pdf-review-decisions.json");
const reviewItems = reviewQueue.review_items || [];
const decisions = decisionsFile.decisions || [];
const reviewItemById = new Map(reviewItems.map((item) => [item.pdf_review_id, item]));
const seen = new Set();
const errors = [];

if (decisionsFile.version !== "0.8.0-pdf-promotion-control") {
  errors.push("data/form-pdf-review-decisions.json must remain version 0.8.0-pdf-promotion-control");
}

if (!Array.isArray(decisions)) {
  errors.push("decisions must be an array");
}

for (const record of decisions) {
  if (!record || typeof record !== "object") {
    errors.push("decision record must be an object");
    continue;
  }

  if (!record.pdf_review_id) {
    errors.push("decision record missing pdf_review_id");
    continue;
  }

  if (seen.has(record.pdf_review_id)) {
    errors.push(`${record.pdf_review_id}: duplicate decision`);
  }
  seen.add(record.pdf_review_id);

  const item = reviewItemById.get(record.pdf_review_id);
  if (!item) {
    errors.push(`${record.pdf_review_id}: unknown pdf_review_id`);
    continue;
  }

  if (!allowedDecisions.has(record.decision)) {
    errors.push(`${record.pdf_review_id}: unsupported decision "${record.decision}"`);
    continue;
  }

  if (record.decision === "approve_official_pdf") {
    requireReviewedFields(record, errors);
    requireValue(record, "public_display_label", errors);
    requireValue(record, "form_purpose", errors);
    if (item.source_status !== "pdf_source_ok") {
      errors.push(`${record.pdf_review_id}: cannot approve because source_status is ${item.source_status}`);
    }
    if (item.direct_cached_download_enabled) {
      errors.push(`${record.pdf_review_id}: cached downloads must remain disabled`);
    }
  }

  if (record.decision === "packet_page_only" || record.decision === "reject") {
    requireReviewedFields(record, errors);
  }
}

if (errors.length) {
  fail(`PDF review decisions failed validation:\n- ${errors.join("\n- ")}`);
}

const summary = {
  total_review_items: reviewItems.length,
  explicit_decisions: decisions.length,
  approved_official_pdf_actions: decisions.filter((record) => record.decision === "approve_official_pdf").length,
  packet_page_only: decisions.filter((record) => record.decision === "packet_page_only").length,
  rejected: decisions.filter((record) => record.decision === "reject").length,
  pending: reviewItems.length - decisions.filter((record) => record.decision !== "pending").length
};

console.log(`PDF review decisions validated: ${summary.explicit_decisions} explicit decisions, ${summary.pending} pending by default.`);
