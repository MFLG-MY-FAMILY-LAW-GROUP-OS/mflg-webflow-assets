#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

function readJSON(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function writeJSON(relativePath, value) {
  fs.writeFileSync(path.join(root, relativePath), `${JSON.stringify(value, null, 2)}\n`);
}

function routeFor(item) {
  const label = `${item.packet_label || ""} ${item.candidate_label || ""}`.toLowerCase();

  if (item.packet_id === "maricopa-divorce-new-with-children") {
    return { county: "Maricopa", issue: "divorce", posture: "New filing", children: "minor-children" };
  }
  if (item.packet_id === "maricopa-divorce-new-no-children") {
    return { county: "Maricopa", issue: "divorce", posture: "New filing", children: "no-minor-children" };
  }
  if (item.packet_id === "maricopa-consent-decree-agreement") {
    return { county: "Maricopa", issue: "divorce", posture: "Finalizing agreement", children: "any" };
  }
  if (item.packet_id === "maricopa-parenting-parentage-support") {
    return { county: "Maricopa", issue: "paternity / parenting time / child support", posture: "New filing", children: "minor-children" };
  }
  if (item.packet_id === "maricopa-modification-existing-order") {
    return { county: "Maricopa", issue: "modification", posture: "Modify existing order", children: label.includes("child") || label.includes("parent") ? "minor-children" : "any" };
  }
  if (item.packet_id === "maricopa-enforcement-existing-order") {
    return { county: "Maricopa", issue: "enforcement", posture: "Enforce existing order", children: label.includes("parent") ? "minor-children" : "any" };
  }
  if (item.packet_id === "maricopa-disclosure-and-hearing-readiness") {
    return { county: "Maricopa", issue: "temporary orders / court readiness", posture: "Prepare for court", children: label.includes("child") || label.includes("parent") ? "minor-children" : "any" };
  }
  if (item.packet_id === "maricopa-name-address-update") {
    return { county: "Maricopa", issue: "name or address update", posture: "Update court record", children: "any" };
  }
  if (item.packet_id === "maricopa-foreign-support-order") {
    return { county: "Maricopa", issue: "foreign support order", posture: "Register or enforce out-of-state order", children: "any" };
  }
  if (item.packet_id === "maricopa-foreign-custody-order") {
    return { county: "Maricopa", issue: "foreign custody / UCCJEA order", posture: "Register out-of-state custody order", children: "minor-children" };
  }
  if (item.packet_id === "maricopa-foreign-order-hearing") {
    return { county: "Maricopa", issue: "foreign family-court order", posture: "Request hearing", children: "any" };
  }
  if (item.packet_id === "maricopa-income-withholding-order") {
    return { county: "Maricopa", issue: "income withholding / support", posture: "Request or update withholding", children: "any" };
  }
  if (item.packet_id === "maricopa-property-division-enforcement") {
    return { county: "Maricopa", issue: "property division enforcement", posture: "Enforce existing order", children: "any" };
  }
  if (item.packet_id === "maricopa-out-of-state-custody-enforcement") {
    return { county: "Maricopa", issue: "out-of-state custody enforcement", posture: "Enforce existing order", children: "minor-children" };
  }
  if (item.packet_id === "maricopa-post-decree-temporary-orders") {
    return { county: "Maricopa", issue: "post-decree temporary orders", posture: "Post-decree temporary relief", children: "minor-children" };
  }
  if (item.packet_id === "maricopa-protective-order-resources") {
    return { county: "Maricopa", issue: "protective order / safety", posture: "Safety planning", children: "any" };
  }
  return { county: "Maricopa", issue: "all", posture: "Any posture", children: "any" };
}

const reviewQueue = readJSON("data/form-review-queue.json");
const allowed = (reviewQueue.queue || []).filter((item) =>
  item.public_action_status === "open_official_page_allowed" &&
  item.source_status === "source_ok" &&
  item.candidate_url &&
  item.public_download_enabled === false &&
  item.direct_cached_download_enabled === false
);

const actions = allowed.map((item) => ({
  action_id: `official-packet-page-${item.review_id}`,
  review_id: item.review_id,
  action_type: "official_packet_page",
  label: item.candidate_label,
  packet_id: item.packet_id,
  packet_label: item.packet_label,
  official_packet_page_url: item.candidate_url,
  route: routeFor(item),
  public_safety: {
    safe_route_metadata_only: true,
    sensitive_public_collection_enabled: false,
    direct_cached_download_enabled: false,
    public_download_enabled: false
  }
}));

const output = {
  version: "1.0.0-public-packet-page-actions",
  built_at: new Date().toISOString(),
  source_review_queue: "data/form-review-queue.json",
  public_safety: {
    contains_sensitive_user_data: false,
    safe_route_metadata_only: true,
    public_downloads_enabled: false,
    direct_cached_downloads_enabled: false
  },
  summary: {
    official_packet_page_actions: actions.length,
    review_before_public_action: reviewQueue.summary?.review_before_public_action || 0,
    public_downloads_enabled: false,
    direct_cached_downloads_enabled: false
  },
  actions
};

writeJSON("data/form-packet-page-actions.json", output);
console.log(`Built public packet-page action manifest: ${actions.length} official packet-page actions, downloads disabled.`);
