/**
 * Quita scripts viejos duplicados y unifica ?v=10 en fichas de producto.
 * node backend/scripts/parchear-fichas-swiper-todas.js
 */
const fs = require("fs");
const path = require("path");
const { patchProductFichaHtml } = require("../middleware/ficha-html-swiper");

const root = path.join(__dirname, "..", "..");
const files = fs.readdirSync(root).filter((f) => f.endsWith(".html"));
let n = 0;

for (const file of files) {
  const p = path.join(root, file);
  const html = fs.readFileSync(p, "utf8");
  if (!html.includes("swiper-producto")) continue;
  const next = patchProductFichaHtml(html);
  if (next !== html) {
    fs.writeFileSync(p, next, "utf8");
    n++;
  }
}
process.stdout.write("Fichas actualizadas: " + n + "\n");
