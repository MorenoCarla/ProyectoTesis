/**
 * Restaura la grilla de apliques.html desde el backup TFI.
 * node backend/scripts/restore-apliques-grid.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");
const BACKUP = path.join(
  "c:",
  "Users",
  "Estudiante",
  "Desktop",
  "BACKUP_TFI_ITUARTE_28-08-2026",
  "ProyectoTesis",
  "apliques.html"
);
const TARGET = path.join(ROOT, "apliques.html");

const bak = fs.readFileSync(BACKUP, "utf8");
const cur = fs.readFileSync(TARGET, "utf8");
const gridMatch = bak.match(/(<section class="filas-imagenes cat-catalog-grid">[\s\S]*?<\/section>)/i);
if (!gridMatch) {
  process.stderr.write("No se encontró la grilla en el backup.\n");
  process.exit(1);
}
const out = cur.replace(
  /(<section class="filas-imagenes cat-catalog-grid">)[\s\S]*?(<\/section>)/i,
  gridMatch[1]
);
if (out === cur) {
  process.stderr.write("La grilla actual ya coincide o no se pudo reemplazar.\n");
  process.exit(1);
}
fs.writeFileSync(TARGET, out, "utf8");
process.stdout.write("OK: apliques.html restaurado desde backup.\n");
