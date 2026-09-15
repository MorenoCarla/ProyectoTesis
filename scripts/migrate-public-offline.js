/**
 * Reemplaza Font Awesome y Google Fonts CDN por archivos locales.
 * Ejecutar: node scripts/migrate-public-offline.js
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");

const replacements = [
  [
    "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css",
    "vendor/fontawesome/css/all.min.css",
  ],
  [
    "https://fonts.googleapis.com/css2?family=Work+Sans:wght@400;500;600;700&display=swap",
    "vendor/fonts/work-sans.css",
  ],
  [
    "https://fonts.googleapis.com/css2?family=Work+Sans:wght@400;700&display=swap",
    "vendor/fonts/work-sans.css",
  ],
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

function dedupeFontAwesomeLinks(html) {
  const line = '<link rel="stylesheet" href="vendor/fontawesome/css/all.min.css">';
  const lines = html.split("\n");
  let seen = false;
  return lines
    .filter((lineText) => {
      const trimmed = lineText.trim();
      if (trimmed !== line && trimmed !== line.replace('rel="stylesheet"', "rel='stylesheet'")) {
        return true;
      }
      if (seen) return false;
      seen = true;
      return true;
    })
    .join("\n");
}

let changed = 0;
for (const file of walk(root)) {
  let text = fs.readFileSync(file, "utf8");
  let updated = text;
  for (const [from, to] of replacements) {
    updated = updated.split(from).join(to);
  }
  updated = dedupeFontAwesomeLinks(updated);
  if (updated !== text) {
    fs.writeFileSync(file, updated, "utf8");
    changed++;
  }
}

console.log(`Listo: ${changed} archivo(s) HTML actualizados a fuentes/iconos locales.`);
