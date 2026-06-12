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

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90) || "route";
}

function routeHintsForPacket(packetId) {
  if (packetId === "maricopa-divorce-new-with-children") {
    return {
      county: "Maricopa",
      issue: "divorce",
      posture: "New filing",
      children: "minor-children"
    };
  }

  if (packetId === "maricopa-divorce-new-no-children") {
    return {
      county: "Maricopa",
      issue: "divorce",
      posture: "New filing",
      children: "no-minor-children"
    };
  }

  if (packetId === "maricopa-consent-decree-agreement") {
    return {
      county: "Maricopa",
      issue: "divorce",
      posture: "Finalizing agreement",
      children: "any"
    };
  }

  if (packetId === "maricopa-parenting-parentage-support") {
    return {
      county: "Maricopa",
      issue: "paternity / parenting time / child support",
      posture: "New filing",
      children: "minor-children"
    };
  }

  return {
    county: "Maricopa",
    issue: "all",
    posture: "Any posture",
    children: "any"
  };
}

const publicActions = readJSON("data/form-pdf-public-actions.json");
const actions = publicActions.actions || [];
const packets = new Map();
const sameOriginPdfDeliveryEnabled = publicActions.summary?.same_origin_pdf_delivery_enabled === true ||
  publicActions.public_safety?.same_origin_pdf_delivery_enabled === true;

for (const action of actions) {
  const packetId = action.packet_id || "unknown-packet";
  if (!packets.has(packetId)) {
    const route = routeHintsForPacket(packetId);
    packets.set(packetId, {
      packet_id: packetId,
      packet_label: action.packet_label || "",
      page_label: action.page_label || "",
      route_key: `forms-tools-${slugify([route.county, route.issue, route.posture, route.children].filter(Boolean).join("-"))}`,
      route,
      public_safety: {
        safe_route_metadata_only: true,
        sensitive_public_collection_enabled: false,
        official_pdf_urls_only: false,
        approved_same_origin_pdf_delivery_enabled: sameOriginPdfDeliveryEnabled,
        public_pdf_view_download_enabled: sameOriginPdfDeliveryEnabled,
        cached_downloads_enabled: false
      },
      official_pdf_action_ids: [],
      languages: []
    });
  }

  const packet = packets.get(packetId);
  packet.official_pdf_action_ids.push(action.action_id);
  if (action.language && !packet.languages.includes(action.language)) {
    packet.languages.push(action.language);
  }
}

const output = {
  version: "1.0.0-pdf-route-index",
  built_at: new Date().toISOString(),
  source_manifest: "data/form-pdf-public-actions.json",
  public_safety: {
    contains_sensitive_user_data: false,
    safe_route_metadata_only: true,
    approved_same_origin_pdf_delivery_enabled: sameOriginPdfDeliveryEnabled,
    public_pdf_view_download_enabled: sameOriginPdfDeliveryEnabled,
    cached_downloads_enabled: false
  },
  summary: {
    route_packets: packets.size,
    official_pdf_actions: actions.length,
    public_pdf_actions_enabled: publicActions.summary?.public_pdf_actions_enabled === true,
    same_origin_pdf_delivery_enabled: sameOriginPdfDeliveryEnabled,
    public_pdf_view_download_enabled: sameOriginPdfDeliveryEnabled,
    direct_cached_downloads_enabled: false
  },
  packets: Array.from(packets.values()).sort((a, b) => a.packet_id.localeCompare(b.packet_id))
};

writeJSON("data/form-pdf-route-index.json", output);
console.log(`Built PDF route index: ${output.summary.route_packets} packet routes, ${output.summary.official_pdf_actions} official PDF actions.`);
