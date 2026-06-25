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

function decisionFor(item, decisionsById) {
  const decision = decisionsById.get(item.pdf_review_id);
  return decision?.decision || "pending";
}

const reviewQueue = readJSON("data/form-pdf-review-queue.json");
const decisionsFile = readJSON("data/form-pdf-review-decisions.json");
const publicActions = readJSON("data/form-pdf-public-actions.json");
const reviewItems = reviewQueue.review_items || [];
const decisions = decisionsFile.decisions || [];
const decisionsById = new Map(decisions.map((decision) => [decision.pdf_review_id, decision]));
const approvedIds = new Set((publicActions.actions || []).map((action) => action.pdf_review_id));

const packetGroups = new Map();
for (const item of reviewItems) {
  const decision = decisionFor(item, decisionsById);
  if (!packetGroups.has(item.packet_id)) {
    packetGroups.set(item.packet_id, {
      packet_id: item.packet_id,
      packet_label: item.packet_label,
      page_label: item.page_label,
      page_url: item.page_url,
      summary: {
        total: 0,
        pending: 0,
        approved_official_pdf_actions: 0,
        packet_page_only: 0,
        rejected: 0,
        english: 0,
        spanish: 0,
        unknown_language: 0
      },
      review_items: []
    });
  }

  const group = packetGroups.get(item.packet_id);
  group.summary.total += 1;
  if (decision === "approve_official_pdf" && approvedIds.has(item.pdf_review_id)) group.summary.approved_official_pdf_actions += 1;
  else if (decision === "packet_page_only") group.summary.packet_page_only += 1;
  else if (decision === "reject") group.summary.rejected += 1;
  else group.summary.pending += 1;

  if (item.language === "English") group.summary.english += 1;
  else if (item.language === "Spanish") group.summary.spanish += 1;
  else group.summary.unknown_language += 1;

  group.review_items.push({
    pdf_review_id: item.pdf_review_id,
    file_name: item.file_name,
    display_label_candidate: item.pdf_label || item.file_name,
    language: item.language,
    source_status: item.source_status,
    current_decision: decision,
    public_action_enabled: approvedIds.has(item.pdf_review_id),
    official_pdf_url: item.pdf_url,
    official_packet_page_url: item.page_url,
    monitor: item.monitor,
    reviewer_fields: {
      reviewer: "",
      reviewed_at: "",
      decision: "pending",
      public_display_label: "",
      form_purpose: "",
      reason: ""
    },
    checklist: [
      "Open the official packet page and confirm the PDF belongs to this packet and filing posture.",
      "Open the official PDF and confirm title, language, and form purpose.",
      "Confirm the monitored URL, content type, content length, and SHA-256 hash are still appropriate for public reference.",
      "Choose approve_official_pdf only when the PDF can be safely named and linked as a standalone official PDF.",
      "Choose packet_page_only when the packet page is safer than a direct PDF link.",
      "Choose reject when the candidate is duplicated, mislabeled, obsolete, broken, or not useful for public routing."
    ]
  });
}

const groups = Array.from(packetGroups.values());
const output = {
  version: "0.9.0-pdf-review-workbench",
  built_at: builtAt,
  source_files: [
    "data/form-pdf-review-queue.json",
    "data/form-pdf-review-decisions.json",
    "data/form-pdf-public-actions.json"
  ],
  public_safety: {
    public_pdf_actions_enabled: publicActions.summary?.public_pdf_actions_enabled === true,
    direct_cached_downloads_enabled: false,
    sensitive_public_collection_enabled: false,
    review_workbench_contains_official_public_source_urls_only: true
  },
  decision_options: [
    {
      decision: "approve_official_pdf",
      effect: "Promotes an official court PDF URL into the public action manifest after required reviewer fields pass validation."
    },
    {
      decision: "packet_page_only",
      effect: "Keeps the public user on the official packet page instead of a direct PDF."
    },
    {
      decision: "reject",
      effect: "Suppresses the PDF candidate from future promotion consideration unless re-added."
    },
    {
      decision: "pending",
      effect: "No public PDF action. This is the default when no explicit decision exists."
    }
  ],
  summary: {
    packet_batches: groups.length,
    total_review_items: reviewItems.length,
    pending: groups.reduce((sum, group) => sum + group.summary.pending, 0),
    approved_official_pdf_actions: publicActions.summary?.approved_official_pdf_actions || 0,
    packet_page_only: groups.reduce((sum, group) => sum + group.summary.packet_page_only, 0),
    rejected: groups.reduce((sum, group) => sum + group.summary.rejected, 0),
    english: reviewItems.filter((item) => item.language === "English").length,
    spanish: reviewItems.filter((item) => item.language === "Spanish").length,
    unknown_language: reviewItems.filter((item) => item.language !== "English" && item.language !== "Spanish").length,
    public_pdf_actions_enabled: publicActions.summary?.public_pdf_actions_enabled === true,
    direct_cached_downloads_enabled: false
  },
  reviewer_workflow: [
    "Review one packet batch at a time.",
    "Make decisions in data/form-pdf-review-decisions.json using the exact pdf_review_id.",
    "Run scripts/build-form-pdf-public-actions.js to validate decisions and rebuild public actions.",
    "Run scripts/build-form-pdf-review-workbench.js to refresh the workbench summary.",
    "Run scripts/check-intake-release.sh before deployment."
  ],
  packet_batches: groups
};

writeJSON("data/form-pdf-review-workbench.json", output);
console.log(`Built PDF review workbench: ${output.summary.packet_batches} packet batches, ${output.summary.total_review_items} items, ${output.summary.pending} pending.`);
