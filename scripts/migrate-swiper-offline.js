/**
 * Reemplaza Swiper CDN por archivos locales en vendor/swiper/
 * Ejecutar después de instalar-vendor-offline.ps1:
 *   node scripts/migrate-swiper-offline.js
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const replacements = [
  [
    "https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css",
    "vendor/swiper/swiper-bundle.min.css",
  ],
  [
    "https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js",
    "vendor/swiper/swiper-bundle.min.js",
  ],
];

function walk(dir, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    if (name === "node_modules" || name === ".git" || name === "vendor") continue;
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

console.log(`Listo: ${changed} archivo(s) HTML actualizados a Swiper local.`);
