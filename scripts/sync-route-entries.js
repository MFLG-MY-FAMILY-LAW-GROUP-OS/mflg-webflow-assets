#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const routes = [
  "practice-areas",
  "fees",
  "guides",
  "tools",
  "forms",
  "calculators",
  "about",
  "faq",
  "contact",
  "start",
  "client",
  "staff",
  "privacy",
  "terms",
  "accessibility",
  "thank-you",
  "404"
];

const entry = fs.readFileSync(path.join(root, "index.html"), "utf8");

for (const route of routes) {
  const routeDir = path.join(root, route);
  fs.mkdirSync(routeDir, { recursive: true });
  fs.writeFileSync(path.join(routeDir, "index.html"), entry);
}

console.log(`Synced ${routes.length} static route entries from index.html.`);
