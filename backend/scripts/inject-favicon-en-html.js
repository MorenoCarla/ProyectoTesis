/**
 * Añade favicon en <head> de todos los .html en la raíz del sitio (sin tocar los que ya lo tienen completo).
 */
const fs = require("fs");
const path = require("path");
const { patchHtmlFavicon } = require("../lib/patch-html-favicon");

const siteRoot = path.join(__dirname, "..", "..");
let updated = 0;
let skipped = 0;

for (const name of fs.readdirSync(siteRoot)) {
  if (!name.endsWith(".html")) continue;
  const filePath = path.join(siteRoot, name);
  const html = fs.readFileSync(filePath, "utf8");
  const next = patchHtmlFavicon(html);
  if (next === html) {
    skipped++;
    continue;
  }
  fs.writeFileSync(filePath, next, "utf8");
  updated++;
}

console.log(`Favicon: ${updated} actualizados, ${skipped} sin cambios.`);
