#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const builtAt = new Date().toISOString();
const allowedDecisions = new Set(["pending", "approve_official_pdf", "packet_page_only", "reject"]);

function readJSON(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function writeJSON(relativePath, value) {
  fs.writeFileSync(path.join(root, relativePath), `${JSON.stringify(value, null, 2)}\n`);
}

function missingText(record, field) {
  return typeof record[field] !== "string" || !record[field].trim();
}

const reviewQueue = readJSON("data/form-pdf-review-queue.json");
const decisionsFile = readJSON("data/form-pdf-review-decisions.json");
const publicActions = readJSON("data/form-pdf-public-actions.json");
const reviewItems = reviewQueue.review_items || [];
const decisions = decisionsFile.decisions || [];
const reviewItemById = new Map(reviewItems.map((item) => [item.pdf_review_id, item]));

const blocked = [];
const promotionReady = [];
const explicitPending = [];
const packetPageOnly = [];
const rejected = [];
const unknown = [];
const duplicateIds = new Set();
const seen = new Set();

for (const decision of decisions) {
  if (!decision || typeof decision !== "object" || !decision.pdf_review_id) {
    blocked.push({
      pdf_review_id: decision?.pdf_review_id || "unknown",
      decision: decision?.decision || "unknown",
      reasons: ["decision record is malformed"]
    });
    continue;
  }

  if (seen.has(decision.pdf_review_id)) duplicateIds.add(decision.pdf_review_id);
  seen.add(decision.pdf_review_id);

  const item = reviewItemById.get(decision.pdf_review_id);
  if (!item) {
    unknown.push(decision.pdf_review_id);
    blocked.push({
      pdf_review_id: decision.pdf_review_id,
      decision: decision.decision || "unknown",
      reasons: ["unknown pdf_review_id"]
    });
    continue;
  }

  if (!allowedDecisions.has(decision.decision)) {
    blocked.push({
      pdf_review_id: decision.pdf_review_id,
      decision: decision.decision || "unknown",
      reasons: ["unsupported decision"]
    });
    continue;
  }

  if (decision.decision === "pending") {
    explicitPending.push(decision.pdf_review_id);
    continue;
  }

  if (decision.decision === "packet_page_only") {
    packetPageOnly.push(decision.pdf_review_id);
    continue;
  }

  if (decision.decision === "reject") {
    rejected.push(decision.pdf_review_id);
    continue;
  }

  if (decision.decision === "approve_official_pdf") {
    const reasons = [];
    if (item.source_status !== "pdf_source_ok") reasons.push(`source_status is ${item.source_status}`);
    if (missingText(decision, "reviewer")) reasons.push("reviewer missing");
    if (missingText(decision, "reviewed_at")) reasons.push("reviewed_at missing");
    else if (Number.isNaN(Date.parse(decision.reviewed_at))) reasons.push("reviewed_at is not ISO-compatible");
    if (missingText(decision, "public_display_label")) reasons.push("public_display_label missing");
    if (missingText(decision, "form_purpose")) reasons.push("form_purpose missing");
    if (missingText(decision, "reason")) reasons.push("reason missing");
    if (item.direct_cached_download_enabled) reasons.push("cached download flag is enabled");

    if (reasons.length) {
      blocked.push({
        pdf_review_id: decision.pdf_review_id,
        decision: decision.decision,
        reasons
      });
    } else {
      promotionReady.push({
        pdf_review_id: decision.pdf_review_id,
        file_name: item.file_name,
        language: item.language,
        packet_id: item.packet_id,
        public_display_label: decision.public_display_label,
        form_purpose: decision.form_purpose,
        official_pdf_url: item.pdf_url
      });
    }
  }
}

for (const duplicateId of duplicateIds) {
  blocked.push({
    pdf_review_id: duplicateId,
    decision: "duplicate",
    reasons: ["duplicate decision records"]
  });
}

const decidedNonPending = decisions.filter((decision) => decision && decision.decision && decision.decision !== "pending").length;
const pendingByDefault = reviewItems.length - decidedNonPending;

const output = {
  version: "1.1.0-pdf-promotion-audit",
  built_at: builtAt,
  source_files: [
    "data/form-pdf-review-queue.json",
    "data/form-pdf-review-decisions.json",
    "data/form-pdf-public-actions.json"
  ],
  public_safety: {
    dry_run_only: true,
    public_pdf_actions_enabled: publicActions.summary?.public_pdf_actions_enabled === true,
    direct_cached_downloads_enabled: false,
    sensitive_public_collection_enabled: false,
    audit_does_not_promote_actions: true
  },
  summary: {
    total_review_items: reviewItems.length,
    explicit_decisions: decisions.length,
    promotion_ready: promotionReady.length,
    blocked_promotions: blocked.length,
    packet_page_only: packetPageOnly.length,
    rejected: rejected.length,
    explicit_pending: explicitPending.length,
    pending_by_default: pendingByDefault,
    public_manifest_actions: (publicActions.actions || []).length,
    public_pdf_actions_enabled: publicActions.summary?.public_pdf_actions_enabled === true,
    direct_cached_downloads_enabled: false
  },
  promotion_ready: promotionReady,
  blocked,
  packet_page_only: packetPageOnly,
  rejected,
  explicit_pending: explicitPending,
  unknown_review_ids: unknown,
  next_steps: [
    "Keep public PDF actions disabled until review decisions are intentional and validated.",
    "Resolve blocked approvals before rebuilding public PDF actions.",
    "Run scripts/validate-form-pdf-review-decisions.js before every promotion build.",
    "Run scripts/build-form-pdf-public-actions.js only after the audit output matches the intended promotion result."
  ]
};

writeJSON("data/form-pdf-promotion-audit.json", output);
console.log(`Built PDF promotion audit: ${output.summary.promotion_ready} promotion-ready, ${output.summary.blocked_promotions} blocked, ${output.summary.pending_by_default} pending by default.`);
