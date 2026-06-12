#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const sourceUrl = "https://superiorcourt.maricopa.gov/llrc/family-court-forms/";
const checkedAt = new Date().toISOString();

const packetMatchers = [
  { packet_id: "maricopa-divorce-new-with-children", patterns: [/Divorce with Minor Children/i] },
  { packet_id: "maricopa-divorce-new-no-children", patterns: [/Divorce with No Minor Children/i] },
  { packet_id: "maricopa-consent-decree-agreement", patterns: [/Summary Consent Decree/i] },
  { packet_id: "maricopa-parenting-parentage-support", patterns: [/Establish Paternity and Legal Decision-Making/i, /Establish Legal Decision-Making/i, /Establish Child Support/i] },
  { packet_id: "maricopa-modification-existing-order", patterns: [/Modify Legal Decision-Making/i, /Modify Parenting Time/i, /Modify Support/i] },
  { packet_id: "maricopa-enforcement-existing-order", patterns: [/Enforce a Support Order/i, /Enforce Parenting Time Order/i, /Enforce Property Division Order/i] },
  { packet_id: "maricopa-disclosure-and-hearing-readiness", patterns: [/Temporary Orders/i, /How to Calculate Child Support/i] },
  { packet_id: "maricopa-name-address-update", patterns: [/Update Name or Address with the Court/i] },
  { packet_id: "maricopa-foreign-support-order", patterns: [/Register a Foreign .*Family Support Order/i] },
  { packet_id: "maricopa-foreign-custody-order", patterns: [/Register a Foreign .*Custody/i, /Out of State.*Custody/i, /Legal Decision Making.*Visitation/i] },
  { packet_id: "maricopa-foreign-order-hearing", patterns: [/Request a Hearing on a Registered Foreign/i] },
  { packet_id: "maricopa-income-withholding-order", patterns: [/Change an Income Withholding Order/i, /Stop an Income Withholding Order/i, /Request an Income Withholding Order/i] },
  { packet_id: "maricopa-property-division-enforcement", patterns: [/Enforce Property Division Order/i] },
  { packet_id: "maricopa-out-of-state-custody-enforcement", patterns: [/Enforce Out-of-State Physical Custody Order/i] },
  { packet_id: "maricopa-post-decree-temporary-orders", patterns: [/Temporary Orders .*Post-Decree/i] },
  { packet_id: "maricopa-protective-order-resources", patterns: [/Protective Orders/i, /Orders of Protection/i] }
];

function absoluteUrl(href) {
  return new URL(href, sourceUrl).href;
}

function cleanText(value) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#xA0;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function main() {
  const response = await fetch(sourceUrl, {
    redirect: "follow",
    headers: {
      "user-agent": "MY FAMILY LAW GROUP PLLC source monitor; public planning tools"
    }
  });
  if (!response.ok) {
    throw new Error(`Maricopa source returned ${response.status}`);
  }

  const html = await response.text();
  const links = [...html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)]
    .map((match) => ({ href: absoluteUrl(match[1]), text: cleanText(match[2]) }))
    .filter((link) => link.href.includes("superiorcourt.maricopa.gov/llrc/"));

  const candidates = [];
  for (const matcher of packetMatchers) {
    for (const link of links) {
      if (!matcher.patterns.some((pattern) => pattern.test(link.text) || pattern.test(link.href))) continue;
      candidates.push({
        packet_id: matcher.packet_id,
        candidate_label: link.text,
        candidate_url: link.href,
        source_page_url: sourceUrl,
        review_status: "candidate_needs_human_review"
      });
    }
  }

  const deduped = [];
  const seen = new Set();
  for (const item of candidates) {
    const key = `${item.packet_id}:${item.candidate_url}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(item);
  }

  const report = {
    version: "0.4.0-maricopa-candidate-extraction",
    extracted_at: checkedAt,
    source_page_url: sourceUrl,
    summary: {
      total_candidates: deduped.length,
      packet_groups_with_candidates: new Set(deduped.map((item) => item.packet_id)).size,
      public_downloads_enabled: false
    },
    candidates: deduped
  };

  fs.writeFileSync(
    path.join(root, "data/maricopa-form-link-candidates.json"),
    `${JSON.stringify(report, null, 2)}\n`
  );

  console.log(`Extracted ${report.summary.total_candidates} Maricopa candidate packet links across ${report.summary.packet_groups_with_candidates} packet groups.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
