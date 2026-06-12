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

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

function publicDisplayLabel(item) {
  const pageLabel = item.page_label || item.packet_label || "Official court PDF";
  const language = item.language ? ` (${item.language})` : "";
  return `${pageLabel} - Official court PDF${language}`;
}

const publicNameByFile = {
  "dv-lsprocess.pdf": {
    name: "Before You File: Divorce or Legal Separation Process",
    stage: "Start here",
    description: "Court instructions for the divorce or legal-separation packet."
  },
  "dv-lsprocesssp.pdf": {
    name: "Before You File: Divorce or Legal Separation Process",
    stage: "Start here",
    description: "Court instructions for the divorce or legal-separation packet."
  },
  "pt-ldmprocess.pdf": {
    name: "Before You File: Paternity, Parenting Time, and Child Support Process",
    stage: "Start here",
    description: "Court instructions for the paternity, legal decision-making, parenting-time, and child-support packet."
  },
  "pt-ldmprocesssp.pdf": {
    name: "Before You File: Paternity, Parenting Time, and Child Support Process",
    stage: "Start here",
    description: "Court instructions for the paternity, legal decision-making, parenting-time, and child-support packet."
  },
  "drds10fz.pdf": {
    name: "Family Department Sensitive Data Cover Sheet",
    stage: "File with court",
    description: "Required confidential information cover sheet used in Arizona family-court filings."
  },
  "drds10fsz.pdf": {
    name: "Family Department Sensitive Data Cover Sheet",
    stage: "File with court",
    description: "Required confidential information cover sheet used in Arizona family-court filings."
  },
  "drmcr10fz.pdf": {
    name: "Petition for Divorce or Legal Separation",
    stage: "File with court",
    description: "Main starting form for divorce or legal separation."
  },
  "drmcr10fsz.pdf": {
    name: "Petition for Divorce or Legal Separation",
    stage: "File with court",
    description: "Main starting form for divorce or legal separation."
  },
  "drpr10fz.pdf": {
    name: "Petition to Establish Paternity, Legal Decision-Making, Parenting Time, and Child Support",
    stage: "File with court",
    description: "Main starting form for paternity, parenting, and child-support establishment."
  },
  "drpr10fsz.pdf": {
    name: "Petition to Establish Paternity, Legal Decision-Making, Parenting Time, and Child Support",
    stage: "File with court",
    description: "Main starting form for paternity, parenting, and child-support establishment."
  },
  "drtp4.pdf": {
    name: "Parenting Plan",
    stage: "Children",
    description: "Parenting-time and legal decision-making plan for cases involving minor children."
  },
  "drtp4s.pdf": {
    name: "Parenting Plan",
    stage: "Children",
    description: "Parenting-time and legal decision-making plan for cases involving minor children."
  },
  "drtp42fz.pdf": {
    name: "Parenting Time / Legal Decision-Making Order Form",
    stage: "Children",
    description: "Court order form connected to parenting time and legal decision-making."
  },
  "drtp42fsz.pdf": {
    name: "Parenting Time / Legal Decision-Making Order Form",
    stage: "Children",
    description: "Court order form connected to parenting time and legal decision-making."
  },
  "drdsc30pz.pdf": {
    name: "Summary Consent Decree Packet Instructions",
    stage: "Agreement",
    description: "Instructions for using the summary consent decree process when both parties agree."
  },
  "drdsc30psz.pdf": {
    name: "Summary Consent Decree Packet Instructions",
    stage: "Agreement",
    description: "Instructions for using the summary consent decree process when both parties agree."
  },
  "drdsc30p-f.pdf": {
    name: "Summary Consent Decree Forms Packet",
    stage: "Agreement",
    description: "Forms used to ask the court to approve a full divorce or legal-separation agreement."
  },
  "drdsc30p-fs.pdf": {
    name: "Summary Consent Decree Forms Packet",
    stage: "Agreement",
    description: "Forms used to ask the court to approve a full divorce or legal-separation agreement."
  },
  "drdsc31fz.pdf": {
    name: "Consent Decree for Divorce or Legal Separation",
    stage: "Final orders",
    description: "Final decree form for agreed divorce or legal separation."
  },
  "drdsc31fsz.pdf": {
    name: "Consent Decree for Divorce or Legal Separation",
    stage: "Final orders",
    description: "Final decree form for agreed divorce or legal separation."
  },
  "drsd10fz.pdf": {
    name: "Property, Debt, and Agreement Terms Form",
    stage: "Agreement",
    description: "Form used to organize settlement terms, property, debts, and agreement details."
  },
  "drsd10fsz.pdf": {
    name: "Property, Debt, and Agreement Terms Form",
    stage: "Agreement",
    description: "Form used to organize settlement terms, property, debts, and agreement details."
  },
  "dr70fz.pdf": {
    name: "Notice / Order Form for Final Divorce Paperwork",
    stage: "Final orders",
    description: "Official court PDF included in the summary consent decree packet."
  },
  "dr70fsz.pdf": {
    name: "Notice / Order Form for Final Divorce Paperwork",
    stage: "Final orders",
    description: "Official court PDF included in the summary consent decree packet."
  }
};

function publicFormMeta(item) {
  const fileName = String(item.file_name || "").toLowerCase();
  const meta = publicNameByFile[fileName] || {
    name: item.page_label || item.packet_label || "Official court form",
    stage: "Court form",
    description: "Official court PDF from the reviewed packet."
  };
  return {
    public_name: meta.name,
    public_stage: meta.stage,
    public_description: meta.description,
    public_language_label: item.language || "Court form",
    public_file_code: item.file_name || ""
  };
}

const reviewQueue = readJSON("data/form-pdf-review-queue.json");
const decisionsFile = readJSON("data/form-pdf-review-decisions.json");
const reviewItems = reviewQueue.review_items || [];
const decisions = decisionsFile.decisions || [];
const reviewItemsById = new Map(reviewItems.map((item) => [item.pdf_review_id, item]));

if (decisionsFile.version !== "0.8.0-pdf-promotion-control") {
  fail("PDF review decisions file has an unexpected version.");
}

const decisionById = new Map();
for (const decision of decisions) {
  if (!decision || typeof decision !== "object") fail("Decision records must be objects.");
  if (!decision.pdf_review_id) fail("Decision record missing pdf_review_id.");
  if (decisionById.has(decision.pdf_review_id)) fail(`Duplicate decision for ${decision.pdf_review_id}.`);
  if (!reviewItemsById.has(decision.pdf_review_id)) fail(`Decision references unknown pdf_review_id ${decision.pdf_review_id}.`);
  if (!allowedDecisions.has(decision.decision)) fail(`Unsupported decision ${decision.decision} for ${decision.pdf_review_id}.`);
  decisionById.set(decision.pdf_review_id, decision);
}

const actions = [];
const summary = {
  total_review_items: reviewItems.length,
  explicit_decisions: decisions.length,
  approved_official_pdf_actions: 0,
  packet_page_only: 0,
  rejected: 0,
  pending: 0,
  public_pdf_actions_enabled: false,
  direct_cached_downloads_enabled: false
};

const blockedApprovals = [];

for (const item of reviewItems) {
  const decision = decisionById.get(item.pdf_review_id);
  const decisionValue = decision?.decision || "pending";

  if (decisionValue === "pending") {
    summary.pending += 1;
    continue;
  }

  if (decisionValue === "packet_page_only") {
    summary.packet_page_only += 1;
    continue;
  }

  if (decisionValue === "reject") {
    summary.rejected += 1;
    continue;
  }

  if (decisionValue === "approve_official_pdf") {
    const approvalErrors = [];
    if (item.source_status !== "pdf_source_ok") approvalErrors.push("source_status is not pdf_source_ok");
    if (!decision.reviewer) approvalErrors.push("reviewer is required");
    if (!decision.reviewed_at) approvalErrors.push("reviewed_at is required");
    if (item.direct_cached_download_enabled) approvalErrors.push("cached download flag must remain false");

    if (approvalErrors.length) {
      blockedApprovals.push({
        pdf_review_id: item.pdf_review_id,
        errors: approvalErrors
      });
      continue;
    }

    summary.approved_official_pdf_actions += 1;
    const publicMeta = publicFormMeta(item);
    const actionId = `official-pdf-${item.pdf_review_id}`;
    actions.push({
      action_id: actionId,
      pdf_review_id: item.pdf_review_id,
      action_type: "official_pdf",
      label: decision.public_display_label || item.pdf_label || item.file_name,
      display_label: `${publicMeta.public_name}${item.language ? ` (${item.language})` : ""}`,
      public_name: publicMeta.public_name,
      public_stage: publicMeta.public_stage,
      public_description: publicMeta.public_description,
      public_language_label: publicMeta.public_language_label,
      public_file_code: publicMeta.public_file_code,
      source_label: item.pdf_label || decision.public_display_label || item.file_name,
      packet_id: item.packet_id,
      packet_label: item.packet_label,
      page_label: item.page_label,
      language: item.language,
      file_name: item.file_name,
      form_purpose: decision.form_purpose || "",
      official_pdf_url: item.pdf_url,
      site_pdf_view_url: `/api/official-pdf/${encodeURIComponent(actionId)}`,
      site_pdf_download_url: `/api/official-pdf/${encodeURIComponent(actionId)}?download=1`,
      same_origin_pdf_delivery_enabled: true,
      direct_cached_download_enabled: false,
      reviewer: decision.reviewer,
      reviewed_at: decision.reviewed_at,
      reason: decision.reason || ""
    });
  }
}

if (blockedApprovals.length) {
  fail(`Blocked ${blockedApprovals.length} PDF approval(s): ${JSON.stringify(blockedApprovals)}`);
}

summary.public_pdf_actions_enabled = actions.length > 0;
summary.same_origin_pdf_delivery_enabled = true;

const output = {
  version: "0.8.0-pdf-promotion-control",
  built_at: builtAt,
  public_safety: {
    public_pdf_actions_enabled: summary.public_pdf_actions_enabled,
    same_origin_pdf_delivery_enabled: true,
    direct_cached_downloads_enabled: false,
    sensitive_public_collection_enabled: false,
    no_decision_means_no_public_action: true
  },
  promotion_policy: {
    source_of_truth: "data/form-pdf-review-decisions.json",
    default_status: "pending",
    action_url_policy: "approved same-origin PDF viewer/download URLs, with official court source fallback",
    same_origin_delivery_policy: "approved action IDs only through /api/official-pdf/{action_id}",
    cached_download_policy: "disabled"
  },
  summary,
  actions
};

writeJSON("data/form-pdf-public-actions.json", output);
console.log(`Built public PDF action manifest: ${summary.approved_official_pdf_actions} approved official PDF actions, ${summary.pending} pending, cached downloads disabled.`);
