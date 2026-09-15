/**
 * Restaura Google Fonts y Font Awesome CDN (revierte migrate-public-offline.js)
 * Ejecutar: node scripts/migrate-restore-cdn.js
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const FA_CDN =
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css";
const WORK_SANS_FULL =
  "https://fonts.googleapis.com/css2?family=Work+Sans:wght@400;500;600;700&display=swap";

const replacements = [
  ['href="vendor/fonts/work-sans.css" rel="stylesheet"', `href="${WORK_SANS_FULL}" rel="stylesheet"`],
  ['rel="stylesheet" href="vendor/fonts/work-sans.css"', `rel="stylesheet" href="${WORK_SANS_FULL}"`],
  ['href="vendor/fontawesome/css/all.min.css" rel="stylesheet"', `href="${FA_CDN}" rel="stylesheet"`],
  ['rel="stylesheet" href="vendor/fontawesome/css/all.min.css"', `rel="stylesheet" href="${FA_CDN}"`],
];

function walk(dir, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    if (name === "node_modules" || name === ".git") continue;
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, acc);
    else if (name.endsWith(".html")) acc.push(full);
  }
  return acc;
}

let changed = 0;
for (const file of walk(root)) {
  let text = fs.readFileSync(file, "utf8");
  let updated = text;
  for (const [from, to] of replacements) {
    updated = updated.split(from).join(to);
  }
  if (updated !== text) {
    fs.writeFileSync(file, updated, "utf8");
    changed++;
  }
}

console.log(`Listo: ${changed} HTML restaurados a CDN (Google Fonts + Font Awesome).`);
