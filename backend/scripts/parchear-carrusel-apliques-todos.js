/**
 * Carrusel "Descubrí más apliques": 8 productos + Ver todos en TODAS las fichas Apliques.
 * Doble clic: parchear-carrusel-apliques.bat
 */
const fs = require("fs");
const path = require("path");
const { patchProductFichaHtml } = require("../middleware/ficha-html-swiper");
const { loadApliquesCatalog, MIN_SLIDES } = require("../services/apliques-carousel-html");

const ROOT = path.join(__dirname, "..", "..");

function main() {
  const catalog = loadApliquesCatalog(ROOT);
  if (catalog.length < MIN_SLIDES) {
    process.stderr.write("Catálogo apliques insuficiente: " + catalog.length + "\n");
    process.exit(1);
  }

  const files = fs.readdirSync(ROOT).filter((f) => f.endsWith(".html"));
  let updated = 0;
  let skipped = 0;

  for (const base of files) {
    const filePath = path.join(ROOT, base);
    const html = fs.readFileSync(filePath, "utf8");
    if (!html.includes('data-categoria="Apliques"') || !html.includes("otrosSwiper")) continue;

    const patched = patchProductFichaHtml(html, { staticRoot: ROOT, currentFile: base });
    if (patched === html) {
      skipped++;
      continue;
    }
    fs.writeFileSync(filePath, patched, "utf8");
    updated++;
  }

  process.stdout.write(
    "Listo. Fichas apliques actualizadas: " + updated + ", sin cambios: " + skipped + "\n"
  );
}

main();
