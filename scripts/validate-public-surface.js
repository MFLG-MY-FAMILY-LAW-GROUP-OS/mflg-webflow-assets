#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const failures = [];

function readJSON(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function usableUrl(value) {
  return typeof value === "string" && value.trim() && value.trim() !== "#";
}

function fail(message) {
  failures.push(message);
}

function checkNoFakeHref(relativePath) {
  const text = fs.readFileSync(path.join(root, relativePath), "utf8");
  if (/(?:href=["']#["'])/.test(text)) {
    fail(`${relativePath} contains a fake href="#" link`);
  }
}

function checkPublicPdfActions() {
  const manifest = readJSON("data/form-pdf-public-actions.json");
  const actions = Array.isArray(manifest.actions) ? manifest.actions : [];
  actions.forEach((action, index) => {
    const viewUrl = action.site_pdf_view_url || action.official_pdf_url;
    const downloadUrl = action.site_pdf_download_url || action.site_pdf_view_url || action.official_pdf_url;
    if (!usableUrl(viewUrl)) fail(`form-pdf-public-actions[${index}] has no usable view URL`);
    if (!usableUrl(downloadUrl)) fail(`form-pdf-public-actions[${index}] has no usable download URL`);
    if (!usableUrl(action.official_pdf_url)) fail(`form-pdf-public-actions[${index}] has no official PDF URL`);
  });
}

function checkRouteStarts() {
  const manifest = readJSON("data/forms-tools-route-intake-map.json");
  const routes = Array.isArray(manifest.routes) ? manifest.routes : [];
  routes.forEach((route, index) => {
    const available = Number(route.official_packet_pages || 0) > 0 || Number(route.approved_pdfs || 0) > 0;
    if (available && !usableUrl(route.primary_official_packet_page_url)) {
      fail(`forms-tools-route-intake-map.routes[${index}] ${route.packet_id || ""} has no primary official URL`);
    }
  });
}

function checkPublicLanguage() {
  const publicJs = fs.readFileSync(path.join(root, "js/mflg-public-site.js"), "utf8");
  const blockedPublicPhrases = [
    "Reviewed route starts",
    "Use First Reviewed Route",
    "Start Intake From This Route",
    "PDF review pending",
    "No packet page action",
    "Review-only"
  ];
  blockedPublicPhrases.forEach((phrase) => {
    if (publicJs.includes(phrase)) fail(`public JS still contains admin-facing phrase: ${phrase}`);
  });
  ["legalTermDefinitions", "enhanceLegalTerms", "data-legal-definition"].forEach((marker) => {
    if (!publicJs.includes(marker)) fail(`legal glossary marker missing: ${marker}`);
  });
}

[
  "index.html",
  "tools/index.html",
  "forms/index.html",
  "calculators/index.html",
  "guides/index.html",
  "js/mflg-public-site.js"
].forEach(checkNoFakeHref);

checkPublicPdfActions();
checkRouteStarts();
checkPublicLanguage();

if (failures.length) {
  console.error("PUBLIC_SURFACE_VALIDATION_FAILED");
  failures.forEach((message) => console.error(`- ${message}`));
  process.exit(1);
}

console.log("PUBLIC_SURFACE_VALIDATION_PASS");
