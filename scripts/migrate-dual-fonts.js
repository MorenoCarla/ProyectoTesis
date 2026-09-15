/**
 * Agrega Google Fonts CDN + mantiene fuentes locales (WiFi + offline).
 * Ejecutar: node scripts/migrate-dual-fonts.js
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const WORK_SANS_CDN =
  '<link href="https://fonts.googleapis.com/css2?family=Work+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">';
const WORK_SANS_LOCAL =
  '<link rel="stylesheet" href="vendor/fonts/work-sans.css">';
const FA_CDN =
  '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">';
const FA_LOCAL =
  '<link rel="stylesheet" href="vendor/fontawesome/css/all.min.css">';

function walk(dir, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    if (name === "node_modules" || name === ".git") continue;
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full, acc);
    else if (name.endsWith(".html")) acc.push(full);
  }
  return acc;
}

function ensureAfterCharset(html, snippet) {
  if (html.includes(snippet)) return html;
  const charsetMatch = html.match(/<meta charset="[^"]*"\s*\/?>/i);
  if (charsetMatch) {
    const insertAt = charsetMatch.index + charsetMatch[0].length;
    return `${html.slice(0, insertAt)}\n  ${snippet}${html.slice(insertAt)}`;
  }
  return html.replace(/<head>/i, `<head>\n  ${snippet}`);
}

let changed = 0;
for (const file of walk(root)) {
  let html = fs.readFileSync(file, "utf8");
  const before = html;

  html = ensureAfterCharset(html, WORK_SANS_CDN);
  html = ensureAfterCharset(html, WORK_SANS_LOCAL);
  html = ensureAfterCharset(html, FA_CDN);
  html = ensureAfterCharset(html, FA_LOCAL);

  if (html !== before) {
    fs.writeFileSync(file, html, "utf8");
    changed++;
  }
}

console.log(`Listo: ${changed} HTML con fuentes CDN + locales.`);
