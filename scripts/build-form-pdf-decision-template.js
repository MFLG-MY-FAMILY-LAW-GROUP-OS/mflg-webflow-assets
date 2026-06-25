#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const builtAt = new Date().toISOString();

function readJSON(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function writeJSON(relativePath, value) {
  fs.writeFileSync(path.join(root, relativePath), `${JSON.stringify(value, null, 2)}\n`);
}

const workbench = readJSON("data/form-pdf-review-workbench.json");
const packetBatches = workbench.packet_batches || [];

const templateBatches = packetBatches.map((batch) => ({
  packet_id: batch.packet_id,
  packet_label: batch.packet_label,
  page_label: batch.page_label,
  page_url: batch.page_url,
  review_items: (batch.review_items || []).map((item) => ({
    pdf_review_id: item.pdf_review_id,
    file_name: item.file_name,
    language: item.language,
    source_status: item.source_status,
    official_pdf_url: item.official_pdf_url,
    official_packet_page_url: item.official_packet_page_url,
    suggested_decision_record: {
      pdf_review_id: item.pdf_review_id,
      decision: "pending",
      reviewer: "",
      reviewed_at: "",
      public_display_label: "",
      form_purpose: "",
      reason: ""
    }
  }))
}));

const output = {
  version: "1.0.0-pdf-decision-template",
  built_at: builtAt,
  source_file: "data/form-pdf-review-workbench.json",
  target_file: "data/form-pdf-review-decisions.json",
  public_safety: {
    public_pdf_actions_enabled: false,
    direct_cached_downloads_enabled: false,
    sensitive_public_collection_enabled: false,
    template_contains_official_public_source_urls_only: true
  },
  instructions: [
    "Review one packet batch at a time.",
    "Copy only completed suggested_decision_record objects into data/form-pdf-review-decisions.json decisions[].",
    "Keep decision as pending when no decision is ready; pending records are optional because absence means pending.",
    "Use approve_official_pdf only after confirming the PDF is safe to name and link as a standalone official court PDF.",
    "Use packet_page_only when the official packet page is safer than a standalone PDF link.",
    "Use reject for duplicates, unclear labels, obsolete files, wrong packet posture, or files that should not be public actions.",
    "Run scripts/validate-form-pdf-review-decisions.js before rebuilding public PDF actions."
  ],
  required_fields_by_decision: {
    approve_official_pdf: [
      "pdf_review_id",
      "decision",
      "reviewer",
      "reviewed_at",
      "public_display_label",
      "form_purpose",
      "reason"
    ],
    packet_page_only: [
      "pdf_review_id",
      "decision",
      "reviewer",
      "reviewed_at",
      "reason"
    ],
    reject: [
      "pdf_review_id",
      "decision",
      "reviewer",
      "reviewed_at",
      "reason"
    ],
    pending: [
      "pdf_review_id",
      "decision"
    ]
  },
  summary: {
    packet_batches: templateBatches.length,
    suggested_decision_records: templateBatches.reduce((sum, batch) => sum + batch.review_items.length, 0),
    public_pdf_actions_enabled: false,
    direct_cached_downloads_enabled: false
  },
  packet_batches: templateBatches
};

writeJSON("data/form-pdf-decision-template.json", output);
console.log(`Built PDF decision template: ${output.summary.packet_batches} packet batches, ${output.summary.suggested_decision_records} suggested decision records.`);
